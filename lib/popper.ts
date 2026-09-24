// A party popper for a bonus being unlocked.
//
// Deliberately not the full-screen burst that greets the checkout popup: that
// one announces "you're buying something", and firing it again every time a
// checkbox moves would cheapen both. This is small, aimed, and over in a
// second — it goes off *at the row you just ticked*, so the eye is pulled to
// the line that just appeared rather than to the middle of the screen.
//
// canvas-confetti is already a dependency (it is the 2D fallback for the big
// celebration), so this costs nothing extra to load.

const RED = ["#d71914", "#f24a43", "#b91410", "#f2a436", "#ffffff"];

/**
 * Fire two small cones from the left and right of `anchor`, angled inwards.
 *
 * Silent no-op when the element isn't on screen, when the viewer has asked for
 * reduced motion, or when the confetti chunk fails to load — a decoration that
 * throws is worse than no decoration.
 */
export async function popBonus(anchor: HTMLElement | null) {
  if (!anchor || typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const box = anchor.getBoundingClientRect();
  if (!box.width || !box.height) return;

  // canvas-confetti works in fractions of the viewport, not pixels.
  const y = (box.top + box.height / 2) / window.innerHeight;
  const left = box.left / window.innerWidth;
  const right = box.right / window.innerWidth;
  if (y < 0 || y > 1) return; // scrolled out of view: nothing to point at

  try {
    const { default: confetti } = await import("canvas-confetti");
    const shared = {
      disableForReducedMotion: true,
      particleCount: 26,
      startVelocity: 22,
      spread: 55,
      gravity: 0.9,
      scalar: 0.75,
      ticks: 90,
      colors: RED,
      // Above the dialog (z-50) so the pieces are not clipped by the card.
      zIndex: 70,
    };
    confetti({ ...shared, angle: 60, origin: { x: Math.max(0, left), y } });
    confetti({ ...shared, angle: 120, origin: { x: Math.min(1, right), y } });
  } catch {
    /* no confetti chunk, no popper; the bonus line still says what it says */
  }
}
