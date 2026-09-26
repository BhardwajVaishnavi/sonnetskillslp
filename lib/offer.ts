// What this page shows. Orders, prices and access are owned by the SonnetSkills
// platform (sonnetskills.com), which recomputes every total from its own product
// data; `slug` values must match the products there. Keep these prices in step
// with Admin › Products.
export const PANEL_URL = (process.env.NEXT_PUBLIC_PANEL_URL || "https://sonnetskills.com").replace(/\/+$/, "");

export const PRODUCT = {
  slug: "50-ai-agents",
  name: "50 AI Agents for Real Businesses",
  amount: 9,
  currency: "INR",
} as const;

export const ADDONS = {
  bundle: {
    slug: "ai-business-bundle",
    label: "5-book bundle",
    name: "The Complete AI Implementation Kit for Founders",
    amount: 49,
    summary: "5 books. A more capable you — from finding AI opportunities to running your business on them.",
    image: "/bundle-5-books.webp",
    checkoutImage: "/bundle-5-books.webp",
    thumbFocus: "50% 78%",
    imageAlt: "The Complete AI Implementation Kit for Founders — five SonnetSkills books",
    points: [
      "Book 1 · The AI Opportunity Finder — find the 10 highest-value AI opportunities inside your business",
      "Book 2 · 100 AI Workflows You Can Copy — automations for sales, marketing, operations, finance & CX",
      "Book 3 · 250 Ready-to-Use Prompts — plus a context library for business",
      "Book 4 · Build Your First AI Employee — a 10-day blueprint from idea to production",
      "Book 5 · The Founder AI Operating System — run your business with AI, automation & business memory",
    ],
    note: "One-time ₹49 · Delivered digitally with your playbook · No subscription",
    /* What taking this unlocks beyond the books themselves. Shown on the card
       as the reason to tick it, and again as a confirmation once ticked. */
    bonus: "The AI Foundations mini-course — the short course that makes the rest make sense.",
  },
  newsletter: {
    slug: "ai-business-newsletter",
    label: "Newsletter · 180 days",
    name: "AI Weekly — 180-Day Subscription",
    amount: 99,
    summary: "The one newsletter that keeps you ahead. Ideas, tools, trends and opportunities — every week by email, plus the free WhatsApp community.",
    image: "/newsletter-ai-weekly.webp",
    // Landscape artwork used only inside the checkout popup.
    checkoutImage: "/newsletter-ai-weekly-checkout.webp",
    thumbFocus: "68% 40%",
    imageAlt: "AI Weekly — 180 days of the newsletter, plus the free WhatsApp community",
    /* "What's included" opens on the bonus rather than the newsletter, because
       the consultation is the thing somebody is deciding about at that point. */
    detailsImage: "/consultation-25-min.webp",
    detailsAlt: "Your free 25-minute AI Consultation — a 1:1 call with Ayush",
    /* Marks this the one to take. Presence is the whole signal — the same way
       `bonus` works — so only the add-on that carries it shows the badge, and
       there is no way to quietly recommend both. */
    recommended: true,
    points: [
      "Key AI news — what actually matters",
      "Tools worth trying — with real use cases",
      "Practical workflows you can implement",
      "Founder insights — from builders",
      "Opportunities early — so you stay ahead",
      "Free WhatsApp community — founders, professionals and operators applying AI",
    ],
    note: "One-time ₹99 · Delivered to your email every week for 180 days · Includes WhatsApp community access · No auto-renewal",
    /* What taking this unlocks beyond the thing itself. Shown only once ticked,
       because a bonus announced before you have earned it is just more copy. */
    bonus: "Your free 25-minute AI Consultation — a 1:1 call about your business, not a demo.",
  },
} as const;

export type AddonKey = keyof typeof ADDONS;

export function parseAddons(value: unknown): AddonKey[] {
  if (!Array.isArray(value)) return [];
  return (Object.keys(ADDONS) as AddonKey[]).filter((k) => value.includes(k));
}

export function orderTotal(addons: AddonKey[]) {
  return addons.reduce<number>((sum, k) => sum + ADDONS[k].amount, PRODUCT.amount);
}

export const GST_RATE = 0.18;

// What the buyer is charged on Cashfree: the pre-GST total plus 18% GST, in rupees.
export function orderTotalWithGst(addons: AddonKey[]) {
  return Math.round(orderTotal(addons) * (1 + GST_RATE) * 100) / 100;
}
