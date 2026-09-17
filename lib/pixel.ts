/**
 * Meta Pixel.
 *
 * The base code is injected once in app/layout.tsx; this module is how the page
 * sends events to it. The purchase itself happens on the SonnetSkills platform
 * (sonnetskills.com), which fires Purchase from its own pixel and again from
 * Meta's Conversions API with the order id as the event id — so nothing here
 * should ever fire Purchase, or it would be counted twice.
 */
export const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "1602092924784468").trim();

/** Meta's own event names; anything else is sent as a custom event. */
const STANDARD = new Set([
  "AddPaymentInfo", "AddToCart", "AddToWishlist", "CompleteRegistration", "Contact", "CustomizeProduct",
  "Donate", "FindLocation", "InitiateCheckout", "Lead", "PageView", "Purchase", "Schedule", "Search",
  "StartTrial", "SubmitApplication", "Subscribe", "ViewContent",
]);

type Fbq = ((method: string, name: string, params?: Record<string, unknown>) => void) | undefined;

/** Never throws and never blocks: a blocked pixel must not break checkout. */
export function metaTrack(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const fbq = (window as typeof window & { fbq?: Fbq }).fbq;
  if (typeof fbq !== "function") return;
  try {
    fbq(STANDARD.has(name) ? "track" : "trackCustom", name, params);
  } catch {
    // An ad blocker took the pixel away; that is not an error worth surfacing.
  }
}
