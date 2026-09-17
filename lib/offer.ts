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
    thumbFocus: "50% 35%",
    imageAlt: "The Complete AI Implementation Kit for Founders — five SonnetSkills books",
    points: [
      "Book 1 · The AI Opportunity Finder — find the 10 highest-value AI opportunities inside your business",
      "Book 2 · 100 AI Workflows You Can Copy — automations for sales, marketing, operations, finance & CX",
      "Book 3 · 250 Ready-to-Use Prompts — plus a context library for business",
      "Book 4 · Build Your First AI Employee — a 30-day blueprint from idea to production",
      "Book 5 · The Founder AI Operating System — run your business with AI, automation & business memory",
    ],
    note: "One-time ₹49 · Delivered digitally with your playbook · No subscription",
  },
  newsletter: {
    slug: "ai-business-newsletter",
    label: "Newsletter · 3 months",
    name: "AI Weekly — 3-Month Subscription",
    amount: 99,
    summary: "The one newsletter that keeps you ahead. Ideas, tools, trends and opportunities — every week.",
    image: "/newsletter-ai-weekly.webp",
    // Landscape artwork used only inside the checkout popup.
    checkoutImage: "/newsletter-ai-weekly-checkout.webp",
    thumbFocus: "22% 30%",
    imageAlt: "AI Weekly newsletter by SonnetSkills",
    points: [
      "Key AI news — what actually matters",
      "Tools worth trying — with real use cases",
      "Practical workflows you can implement",
      "Founder insights — from builders",
      "Opportunities early — so you stay ahead",
    ],
    note: "One-time ₹99 · Weekly for 3 months · No auto-renewal",
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
