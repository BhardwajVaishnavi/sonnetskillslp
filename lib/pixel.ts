/**
 * Meta Pixel.
 *
 * The base code is injected once in app/layout.tsx; this module is how the page
 * sends events to it. The purchase itself happens on the SonnetSkills platform
 * (sonnetskills.com), which fires Purchase from its own pixel and again from
 * Meta's Conversions API with the order id as the event id — so nothing here
 * should ever fire Purchase, or it would be counted twice.
 *
 * The tag loads after the page is interactive, so it is normal for the first
 * events (ViewContent, an early CTA click) to be raised before `fbq` exists.
 * They wait here until it does rather than being dropped.
 */
export const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "1602092924784468").trim();

/** Meta's own event names; anything else is sent as a custom event. */
const STANDARD = new Set([
  "AddPaymentInfo", "AddToCart", "AddToWishlist", "CompleteRegistration", "Contact", "CustomizeProduct",
  "Donate", "FindLocation", "InitiateCheckout", "Lead", "PageView", "Purchase", "Schedule", "Search",
  "StartTrial", "SubmitApplication", "Subscribe", "ViewContent",
]);

type Fbq = ((method: string, name: string, params?: Record<string, unknown>) => void) | undefined;
type Event = [string, Record<string, unknown>];

const waiting: Event[] = [];
const WAIT_MS = 300;
const GIVE_UP_AFTER = 30; // ~9s, then the pixel is blocked or missing and never coming
let attempts = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

const pixel = (): Fbq => (typeof window === "undefined" ? undefined : (window as typeof window & { fbq?: Fbq }).fbq);

function send(fbq: NonNullable<Fbq>, [name, params]: Event) {
  try {
    fbq(STANDARD.has(name) ? "track" : "trackCustom", name, params);
  } catch {
    // An ad blocker took the pixel away; that is not an error worth surfacing.
  }
}

function flush() {
  timer = null;
  const fbq = pixel();
  if (typeof fbq === "function") {
    while (waiting.length) send(fbq, waiting.shift() as Event);
    return;
  }
  if (++attempts >= GIVE_UP_AFTER) {
    waiting.length = 0;
    return;
  }
  timer = setTimeout(flush, WAIT_MS);
}

/** Never throws and never blocks: a blocked pixel must not break checkout. */
export function metaTrack(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const fbq = pixel();
  if (typeof fbq === "function") return send(fbq, [name, params]);
  waiting.push([name, params]);
  if (!timer) timer = setTimeout(flush, WAIT_MS);
}
