import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// 3D paper-confetti burst for the checkout popup. Loaded lazily so three.js
// never blocks the landing page. On wider screens the canvas sits between the
// dialog overlay and the card, so pieces fly out from behind it; on phones the
// card fills the screen, so the (click-through) canvas goes on top instead.
const PALETTE = ["#d71914", "#f24a43", "#b91410", "#0b0b0b", "#ffffff", "#f2a436"];
const GRAVITY = 16;

type Piece = {
  p: THREE.Vector3;
  v: THREE.Vector3;
  axis: THREE.Vector3;
  spin: number;
  angle: number;
  phase: number;
  delay: number;
  scale: number;
};

function mount(canvas: HTMLCanvasElement, onTop: boolean) {
  const overlay = document.querySelector('[data-slot="dialog-overlay"]');
  if (!onTop && overlay?.parentNode) overlay.parentNode.insertBefore(canvas, overlay.nextSibling);
  else document.body.appendChild(canvas);
}

export function celebrate() {
  const mobile = window.innerWidth < 640,
    duration = mobile ? 2 : 3.4;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: mobile ? "60" : "50",
  });

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return false;
  }
  mount(canvas, mobile);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 20;
  // A soft studio reflection so the clear-coated pieces glint like foil.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(4, 8, 10);
  scene.add(sun);

  // Visible world size at z = 0.
  const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const viewW = viewH * camera.aspect;

  const material = new THREE.MeshPhysicalMaterial({
    side: THREE.DoubleSide,
    roughness: 0.28,
    metalness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
  });
  const shapes = [
    new THREE.PlaneGeometry(0.34, 0.2), // paper squares
    new THREE.PlaneGeometry(0.1, 0.55), // ribbons
    new THREE.CircleGeometry(0.14, 12), // dots
  ];
  const perShape = mobile ? 42 : 110;
  const color = new THREE.Color();
  const groups = shapes.map((geo) => {
    const mesh = new THREE.InstancedMesh(geo, material, perShape);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const pieces: Piece[] = [];
    for (let i = 0; i < perShape; i++) {
      mesh.setColorAt(i, color.set(PALETTE[i % PALETTE.length]));
      const mode = i % 4;
      const p = new THREE.Vector3(),
        v = new THREE.Vector3();
      let delay = 0;
      if (mode === 0) {
        // Pop outward from behind the card, fast enough to clear its edges.
        const a = Math.random() * Math.PI * 2,
          sp = (mobile ? 10 : 18) + Math.random() * 14;
        p.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, -1);
        v.set(Math.cos(a) * sp * 1.3, Math.sin(a) * sp + 6, (Math.random() - 0.5) * 6);
      } else if (mode === 3) {
        // A soft shower drifting in from above the viewport.
        p.set((Math.random() - 0.5) * viewW, viewH / 2 + 0.5 + Math.random() * 3, (Math.random() - 0.5) * 4);
        v.set((Math.random() - 0.5) * 3, -1 - Math.random() * 2, 0);
        delay = 0.1 + Math.random() * (mobile ? 0.5 : 0.9);
      } else {
        // Cannons from the lower corners, arcing up and inward.
        const side = mode === 1 ? -1 : 1,
          a = THREE.MathUtils.degToRad(52 + Math.random() * 32),
          sp = (mobile ? 30 : 36) + Math.random() * 14;
        p.set((side * viewW) / 2, -viewH / 2 - 0.5, (Math.random() - 0.5) * 4);
        v.set(-side * Math.cos(a) * sp, Math.sin(a) * sp, (Math.random() - 0.5) * 5);
        delay = Math.random() * 0.15;
      }
      pieces.push({
        p,
        v,
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        spin: 6 + Math.random() * 10,
        angle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        delay,
        scale: 0.8 + Math.random() * 0.6,
      });
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    return { mesh, pieces };
  });

  const m = new THREE.Matrix4(),
    q = new THREE.Quaternion(),
    s = new THREE.Vector3();
  let last = performance.now(),
    elapsed = 0,
    frame = 0;

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  window.addEventListener("resize", onResize);

  const cleanup = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", onResize);
    shapes.forEach((g) => g.dispose());
    material.dispose();
    envMap.dispose();
    pmrem.dispose();
    groups.forEach(({ mesh }) => mesh.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    elapsed += dt;
    // Shrink everything away over the last 0.7s.
    const fade = Math.min(1, Math.max(0, (duration - elapsed) / 0.7));
    for (const { mesh, pieces } of groups) {
      pieces.forEach((pc, i) => {
        const t = elapsed - pc.delay;
        if (t > 0) {
          const drag = Math.exp(-2.1 * dt);
          pc.v.x *= drag;
          pc.v.z *= drag;
          pc.v.y = pc.v.y * drag - GRAVITY * dt;
          // Paper flutter: a sideways sway that grows as pieces slow down.
          pc.p.x += (pc.v.x + Math.sin(t * 5 + pc.phase) * 1.8) * dt;
          pc.p.y += Math.max(pc.v.y, -4.5) * dt;
          pc.p.z += pc.v.z * dt;
          pc.angle += pc.spin * dt;
        }
        q.setFromAxisAngle(pc.axis, pc.angle);
        s.setScalar(t > 0 ? pc.scale * fade : 0);
        mesh.setMatrixAt(i, m.compose(pc.p, q, s));
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    renderer.render(scene, camera);
    if (elapsed < duration) frame = requestAnimationFrame(tick);
    else cleanup();
  };
  frame = requestAnimationFrame(tick);
  return true;
}
