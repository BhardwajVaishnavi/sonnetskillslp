import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const W = 1.6,
  H = W * (881 / 512), // matches /book-cover.jpg
  D = 0.34;

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Page edges: cream paper with fine lines running along the long edge.
function pagesTexture(linesAlongU: boolean) {
  return canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = "#f4f1e8";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(120,110,90,.18)";
    for (let i = 0; i < 256; i += 3) {
      ctx.beginPath();
      if (linesAlongU) {
        ctx.moveTo(0, i + 0.5);
        ctx.lineTo(256, i + 0.5);
      } else {
        ctx.moveTo(i + 0.5, 0);
        ctx.lineTo(i + 0.5, 256);
      }
      ctx.stroke();
    }
  });
}

function spineTexture() {
  return canvasTexture(96, 768, (ctx) => {
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, 96, 768);
    ctx.fillStyle = "#d71914";
    ctx.fillRect(0, 610, 96, 90);
    ctx.save();
    ctx.translate(48, 60);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 40px Arial, Helvetica, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("50 AI AGENTS", 0, 0);
    ctx.restore();
  });
}

function backTexture() {
  return canvasTexture(256, 440, (ctx) => {
    ctx.fillStyle = "#f7f7f5";
    ctx.fillRect(0, 0, 256, 440);
    ctx.fillStyle = "#d71914";
    ctx.fillRect(28, 360, 60, 6);
    ctx.fillStyle = "#0b0b0b";
    ctx.font = "900 20px Arial, Helvetica, sans-serif";
    ctx.fillText("SONNETSKILLS", 28, 395);
  });
}

export type BookHandle = { dispose: () => void; setActive: (on: boolean) => void };
const noop: BookHandle = { dispose: () => {}, setActive: () => {} };

export function mountBook(host: HTMLElement, onReady: () => void): BookHandle {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
  canvas.setAttribute("aria-hidden", "true");

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return noop;
  }
  host.appendChild(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6.1);

  const loader = new THREE.TextureLoader();
  const cover = loader.load("/book-cover.jpg", () => {
    render();
    onReady();
  });
  cover.colorSpace = THREE.SRGBColorSpace;
  cover.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const textures = [cover, pagesTexture(false), pagesTexture(true), spineTexture(), backTexture()];
  const [, pagesSide, pagesTop, spine, back] = textures;
  // Laminated cover: a clear coat gives the glossy, glassy highlight.
  const gloss = { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 };
  const paper = new THREE.MeshStandardMaterial({ map: pagesSide, roughness: 0.9 });
  const paperTop = new THREE.MeshStandardMaterial({ map: pagesTop, roughness: 0.9 });
  const materials = [
    paper, // +x: page edge
    new THREE.MeshPhysicalMaterial({ map: spine, ...gloss }), // -x: spine
    paperTop, // +y
    paperTop, // -y
    new THREE.MeshPhysicalMaterial({ map: cover, ...gloss }), // +z: front
    new THREE.MeshPhysicalMaterial({ map: back, ...gloss }), // -z: back
  ];
  const geometry = new THREE.BoxGeometry(W, H, D);
  const book = new THREE.Mesh(geometry, materials);
  scene.add(book);

  const base = -0.55;
  const pointer = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  const onLeave = () => {
    pointer.x = 0;
    pointer.y = 0;
  };
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onLeave);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(() => {
    resize();
    render();
  });
  observer.observe(host);
  resize();

  function render() {
    renderer.render(scene, camera);
  }

  let start = -1;
  let frame = 0;
  let active = true;
  let tiltX = 0,
    tiltY = 0;
  const tick = (now: number) => {
    if (start < 0) start = now;
    const t = (now - start) / 1000;
    // Entry: one and a quarter turns that ease out onto the resting angle.
    const intro = Math.min(t / 1.3, 1);
    const ease = 1 - Math.pow(1 - intro, 3);
    const spin = (1 - ease) * -Math.PI * 2.5;
    tiltX += (pointer.y * 0.25 - tiltX) * 0.08;
    tiltY += (pointer.x * 0.5 - tiltY) * 0.08;
    book.rotation.y = base + spin + Math.sin(t * 0.9) * 0.22 * ease + tiltY;
    book.rotation.x = -0.06 + Math.sin(t * 0.7) * 0.04 + tiltX;
    book.position.y = Math.sin(t * 1.3) * 0.06;
    book.scale.setScalar(0.85 + 0.15 * ease);
    render();
    if (active) frame = requestAnimationFrame(tick);
  };
  if (reduced) {
    book.rotation.set(-0.06, base, 0);
  } else {
    frame = requestAnimationFrame(tick);
  }

  const dispose = () => {
    active = false;
    cancelAnimationFrame(frame);
    observer.disconnect();
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerleave", onLeave);
    geometry.dispose();
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    envMap.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  const setActive = (on: boolean) => {
    if (reduced || on === active) return;
    active = on;
    cancelAnimationFrame(frame);
    if (on) frame = requestAnimationFrame(tick);
  };
  return { dispose, setActive };
}
