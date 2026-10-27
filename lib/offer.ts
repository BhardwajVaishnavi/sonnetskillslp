// What these pages show. Orders, prices and access are owned by the SonnetSkills
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
    amount: 129,
    summary: "5 books. A more capable you — from finding AI opportunities to running your business on them.",
    image: "/bundle-5-books.webp",
    checkoutImage: "/bundle-5-books.webp",
    thumbFocus: "50% 78%",
    imageAlt: "Five e-books, a more capable you — the SonnetSkills AI Implementation Kit",
    /* The banner sells the five books; opening "What's included" is where the
       mini-course that comes with them gets its own say. */
    detailsImage: "/mini-course-ai-foundations.webp",
    detailsAlt: "AI Foundations Mini-Course — five modules of practical AI for real businesses",
    points: [
      "Book 1 · The AI Opportunity Finder — find the 10 highest-value AI opportunities inside your business",
      "Book 2 · 100 AI Workflows You Can Copy — automations for sales, marketing, operations, finance & CX",
      "Book 3 · 250 Ready-to-Use Prompts — plus a context library for business",
      "Book 4 · Build Your First AI Employee — a 10-day blueprint from idea to production",
      "Book 5 · The Founder AI Operating System — run your business with AI, automation & business memory",
    ],
    note: "One-time ₹129 · Delivered digitally with your ebook · No subscription",
    /* What taking this unlocks beyond the books themselves. Shown on the card
       as the reason to tick it, and again as a confirmation once ticked. */
    bonus: "The AI Foundations mini-course — the short course that makes the rest make sense.",
  },
  newsletter: {
    slug: "ai-business-newsletter",
    label: "Membership · 12 months",
    name: "AI Weekly — Yearly Membership",
    amount: 699,
    summary: "One membership, 12 months of AI advantage. Updates, workflows, tools, skills, resources, live sessions and the private community — we filter the noise and show you how to use what matters.",
    image: "/newsletter-ai-weekly.webp",
    // Landscape artwork used only inside the checkout popup.
    checkoutImage: "/newsletter-ai-weekly-checkout.webp",
    thumbFocus: "68% 40%",
    imageAlt: "AI Weekly — a 12-month membership: weekly briefings, workflows, tools, skills, live sessions and the private WhatsApp community",
    /* "What's included" opens on the bonus rather than the newsletter, because
       the consultation is the thing somebody is deciding about at that point. */
    detailsImage: "/consultation-25-min.webp",
    detailsAlt: "Your free 25-minute AI Consultation — a 1:1 call with Ayush",
    /* Marks this the one to take. Presence is the whole signal — the same way
       `bonus` works — so only the add-on that carries it shows the badge, and
       there is no way to quietly recommend both. */
    recommended: true,
    points: [
      "52 AI Weekly briefings — the updates, launches and shifts that matter, without the noise",
      "52 practical workflows — for sales, marketing, operations, productivity and more",
      "52 AI concepts made simple — agents, automation, models, MCP, RAG and whatever comes next",
      "Tools worth trying — what deserves your attention, and what you can safely ignore",
      "Prompts, templates and ready-to-use resources you can put to work immediately",
      "Claude Skills and new AI skills — updated as new capabilities emerge",
      "Exclusive playbooks and deep dives on the tools, trends and use cases that matter",
      "Live AI sessions and workshops — ask questions and see implementation in action",
      "Private WhatsApp community — founders, professionals and operators applying AI",
      "12 months of continuous updates — as AI changes, your membership changes with it",
    ],
    note: "One-time ₹699 · 12 months of access · Includes the private WhatsApp community · No auto-renewal",
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

/* ----------------------------------------------------------------- markets */

/**
 * The same page, sold in two markets.
 *
 * India is everything above, untouched: rupees, 18% GST named at checkout,
 * Cashfree. GLOBAL is the dollar offer through Dodo Payments, which is the
 * Merchant of Record internationally — any local sales tax is its to compute
 * on its own checkout page, so this page quotes flat dollars and never
 * invents a tax line. The panel recomputes every amount server-side from its
 * own offer table; a market here is display and intent, never authority.
 *
 * Ads send global traffic to /global/50-ai-agents deliberately. There is no
 * geo-detection: a deterministic URL is what makes pricing predictable and
 * experiments attributable.
 */
export type Market = "IN" | "GLOBAL";

type AddonMarketCopy = {
  amount: number;
  note: string;
  bonus: string;
  detailsImage?: string;
  detailsAlt?: string;
};

export type MarketConfig = {
  market: Market;
  currency: "INR" | "USD";
  /** "₹9" · "$5" — whole amounts only; fractions use money2. */
  money: (amount: number) => string;
  money2: (amount: number) => string;
  product: { amount: number };
  addons: Record<AddonKey, AddonMarketCopy>;
  /** 0.18 adds the GST block everywhere it appears; 0 removes it entirely. */
  taxRate: number;
  /** Rides after a price: " + 18% GST" or "". */
  taxSuffix: string;
  /** The one-line reassurance under prices. */
  priceLine: string;
  payable: (addons: AddonKey[]) => number;
  trustLine: string;
  /** "in" renders the fixed +91 field; "intl" an optional international one. */
  phone: "in" | "intl";
  faqSubscription: string;
  /**
   * Photos beside "11,000+ … downloaded". Real customers of this market only,
   * photographed with their permission: the page labels them "SonnetSkills
   * customer", so a stock or generated face here is a fake endorsement. Empty
   * shows the line without faces.
   */
  proofPhotos: string[];
};

const inMoney = (n: number) => `₹${n}`;
const usMoney = (n: number) => `$${n}`;

export const MARKETS: Record<Market, MarketConfig> = {
  /* The v1 ₹9 India page. No route renders it any more — India is the v2 page
     (V2_* below) — but the shared component still types every market. */
  IN: {
    market: "IN",
    currency: "INR",
    money: inMoney,
    money2: (n) => `₹${n.toFixed(2)}`,
    product: { amount: PRODUCT.amount },
    addons: {
      bundle: { amount: ADDONS.bundle.amount, note: ADDONS.bundle.note, bonus: ADDONS.bundle.bonus },
      newsletter: { amount: ADDONS.newsletter.amount, note: ADDONS.newsletter.note, bonus: ADDONS.newsletter.bonus },
    },
    taxRate: GST_RATE,
    taxSuffix: " + 18% GST",
    priceLine: "₹9 + 18% GST, one-time",
    payable: orderTotalWithGst,
    trustLine: "Secure checkout powered by Cashfree.",
    phone: "in",
    faqSubscription:
      "No. ₹9 is a one-time payment for this digital product. 18% GST is added at checkout, so ₹10.62 is what actually leaves your account — you see the full breakdown before you pay.",
    proofPhotos: ["/customer-1.png", "/customer-2.png", "/customer-3.png", "/customer-4.png", "/customer-5.png"],
  },
  GLOBAL: {
    market: "GLOBAL",
    currency: "USD",
    money: usMoney,
    money2: (n) => `$${n.toFixed(2)}`,
    product: { amount: 5 },
    addons: {
      bundle: {
        amount: 15,
        note: "One-time $15 · Delivered digitally with your playbook · No subscription",
        bonus: ADDONS.bundle.bonus,
      },
      newsletter: {
        amount: 45,
        note: "One-time $45 · 12 months of access · Includes the private community · No auto-renewal",
        /* The same 25-minute consultation as India. The panel unlocks it for
           global members too (CONSULTATION_MARKETS defaults to IN,GLOBAL) and
           shows the booking slots in the buyer's own time zone. Taking it out
           means changing both, never only one. */
        bonus: ADDONS.newsletter.bonus,
        detailsImage: ADDONS.newsletter.detailsImage,
        detailsAlt: ADDONS.newsletter.detailsAlt,
      },
    },
    taxRate: 0,
    taxSuffix: "",
    priceLine: "$5 one-time · No subscription",
    payable: (addons: AddonKey[]) =>
      addons.reduce<number>((sum, k) => sum + MARKETS.GLOBAL.addons[k].amount, 5),
    trustLine: "Secure international checkout — major cards, Apple Pay and Google Pay, powered by Dodo Payments.",
    phone: "intl",
    faqSubscription:
      "No. $5 is a one-time payment for this digital product. Prices are in US dollars; any local sales tax is calculated by our payment partner at checkout, and you see the final amount before you pay.",
    proofPhotos: [],
  },
};

/* ------------------------------------------------------------ funnel v2 (IN) */

/**
 * India's v2 offer: the ₹199 "500 AI Agents" ebook up front, the kit + mini-course
 * as the bump, and the yearly membership offered as its own step before payment.
 * Served by components/landing-page-v2.tsx at lp.sonnetskills.com. The GLOBAL
 * market above is untouched and still sells the v1 playbook through Dodo.
 *
 * Prices are before GST and must match Admin › Products (the panel seeds them as
 * 19900 / 12900 / 69900 paise). GST is computed on the whole cart exactly the way
 * the panel does — round(subtotal_paise × 18 / 100) — so the total shown here is
 * paisa for paisa what Cashfree charges, and the popup refuses to open payment
 * if the panel's amount disagrees.
 *
 *   A ebook only        ₹199  → ₹234.82
 *   B + bundle          ₹328  → ₹387.04
 *   C + membership      ₹898  → ₹1,059.64
 *   D all three       ₹1,027  → ₹1,211.86
 */
export const V2_PRODUCT = {
  slug: "500-ai-agents",
  name: "500 AI Agents for Real Businesses",
  short: "500 AI Agents",
  amount: 199,
} as const;

export const V2_OFFERS = {
  bump: {
    slug: "ai-business-bundle",
    name: "The Complete AI Implementation Kit for Founders",
    short: "Ebook bundle + AI Foundations mini-course",
    amount: 129,
  },
  membership: {
    slug: "ai-business-newsletter",
    name: "AI Weekly — Yearly Membership",
    short: "AI Weekly — Yearly Membership",
    amount: 699,
  },
} as const;

export type V2OfferKey = keyof typeof V2_OFFERS;

/** The order the panel expects add-on slugs in. */
export const V2_OFFER_ORDER: readonly V2OfferKey[] = ["bump", "membership"];

const GST_PERCENT = 18;

export function v2Cart(chosen: readonly V2OfferKey[]) {
  const keys = V2_OFFER_ORDER.filter((k) => chosen.includes(k));
  const subtotalPaise = (V2_PRODUCT.amount + keys.reduce<number>((n, k) => n + V2_OFFERS[k].amount, 0)) * 100;
  const gstPaise = Math.round((subtotalPaise * GST_PERCENT) / 100);
  return {
    keys,
    addons: keys.map((k) => V2_OFFERS[k].slug),
    subtotalPaise,
    gstPaise,
    totalPaise: subtotalPaise + gstPaise,
  };
}

/** "₹1,027" for whole rupees, "₹1,059.64" otherwise. */
export function inr(paise: number) {
  const whole = paise % 100 === 0;
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Always two decimals, for the GST line and totals: "₹35.82". */
export function inr2(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
