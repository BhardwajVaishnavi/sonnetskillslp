"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Gift,
  LockKeyhole,
  Settings2,
  Star,
  UserRound,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";
import { Book3D } from "@/components/book-3d";
import { TiltFrame } from "@/components/tilt-frame";
import {
  ADDONS,
  MARKETS,
  PANEL_URL,
  PRODUCT,
  V2_OFFERS,
  V2_PRODUCT,
  inr,
  inr2,
  v2Cart,
  type AddonKey,
  type Market,
  type V2OfferKey,
} from "@/lib/offer";
import { metaTrack } from "@/lib/pixel";

const categories = [
  ["SALES & REVENUE", 8],
  ["MARKETING & GROWTH", 8],
  ["CUSTOMER EXPERIENCE", 6],
  ["OPERATIONS", 8],
  ["FINANCE", 4],
  ["HR", 4],
  ["RESEARCH", 4],
  ["MANAGEMENT & BUSINESS MEMORY", 8],
] as const;
const agents = [
  ["Lead Qualification Agent", "Prioritises incoming leads based on fit, intent and business rules."],
  ["Sales Follow-Up Agent", "Ensures valuable prospects don’t disappear because somebody forgot to follow up."],
  ["Performance Marketing Analyst", "Reviews campaign data and surfaces patterns, anomalies and opportunities."],
  ["Project Risk Agent", "Identifies potential delays, blockers and delivery risks before they grow."],
  ["Payment Follow-Up Agent", "Supports systematic invoice reminders and collections workflows."],
  ["Competitor Intelligence Agent", "Tracks relevant competitor activity and organises useful insights."],
  ["Founder Briefing Agent", "Turns operational information into a structured founder briefing."],
  ["Business Memory Agent", "Retains context across clients, projects, decisions and teams."],
] as const;
const breakdown = [
  "The business problem",
  "What the agent does",
  "Where it fits",
  "What humans control",
  "What to measure",
  "Risks to watch",
  "Where to start",
];
const audience = [
  [Building2, "Founders", "You know AI matters, but not which workflow deserves your team’s time first."],
  [Briefcase, "Business owners", "You want AI to improve revenue, cost or speed — not to become another tool subscription."],
  [Settings2, "Operators", "You run the day-to-day and can see where follow-ups, reviews and reporting slip."],
  [Zap, "Consultants & agencies", "Clients ask what AI can do for them. You need a clear, structured answer."],
  [UserRound, "Professionals", "You want to understand where AI actually fits inside real business workflows."],
] as const;
const notFor = [
  "You want a coding tutorial that builds all 50 agents for you",
  "You’re looking for another list of tools or copy-paste prompts",
  "You expect results without testing anything in your own business",
  "You want a physical book — this is a digital playbook",
];
// Real, attributable customer reviews only. The section stays hidden while empty.
const testimonials: { quote: string; name: string }[] = [];

/**
 * The moments on this page that are worth a Meta event. PageView is fired by
 * the base code in the layout; Purchase belongs to the platform, which owns
 * the order — firing it here as well would double-count every sale.
 */
const META_EVENT: Record<string, string> = {
  checkout_popup_open: "InitiateCheckout",
  checkout_form_submitted: "AddPaymentInfo",
};

const loadCelebration = () => import("@/lib/celebrate");
async function celebrateCheckoutOpen() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    if ((await loadCelebration()).celebrate()) return;
  } catch {}
  // No WebGL (or the chunk failed to load): fall back to 2D confetti.
  const { default: confetti } = await import("canvas-confetti");
  confetti({ disableForReducedMotion: true, particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 50 });
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-4 text-center">{children}</p>;
}

function Cta({ source, onClick, children }: { source: string; onClick: (s: string) => void; children: React.ReactNode }) {
  return (
    <button onClick={() => onClick(source)} className="btn-red inline-flex items-center justify-center gap-2">
      {children} <ArrowRight className="h-4 w-4" />
    </button>
  );
}

/**
 * The sales page, one design for both markets.
 *
 * India (lp.sonnetskills.com) is funnel v2: the ₹199 + GST 500 AI Agents and
 * its bump → membership → pay checkout, drawn in this page's design
 * (IndiaPage, below). GLOBAL is the $5 playbook through Dodo (MarketPage).
 */
export function LandingPage({ market = "IN" }: { market?: Market }) {
  return market === "IN" ? <IndiaPage /> : <MarketPage market={market} />;
}

/**
 * The v1 playbook page, in a market's own money.
 *
 * GLOBAL renders it in flat dollars with no GST arithmetic anywhere — Dodo is
 * the Merchant of Record and computes any local tax on its own checkout — and
 * hands payment to Dodo's hosted page. (MARKETS.IN still describes the old ₹9
 * India offer, but India now renders IndiaPage instead.) Every amount shown
 * here is display: the panel recomputes the charge server-side from its own
 * offer table and this page refuses to open payment if the two disagree.
 */
function MarketPage({ market }: { market: Market }) {
  const cfg = MARKETS[market];
  const money = cfg.money;
  const base = cfg.product.amount;
  /** An add-on's copy, with this market's amount, note and bonus laid over it. */
  const addon = (k: AddonKey) => ({ ...ADDONS[k], ...cfg.addons[k] });

  const comparison = [
    ["Starting point", "Tool lists", "Business problems first"],
    ["What’s inside", "Prompt collections", "50 practical use cases"],
    ["Approach", "Generic AI hacks", "AI + code + human judgment"],
    ["Context", "Quickly outdated", "Real implementation context"],
    ["Evidence", "Claims presented as equal", "250+ research points, weighted by source quality"],
    ["Price", "Varies", `${money(base)}${cfg.taxSuffix}, one-time`],
  ] as const;
  const steps = [
    ["Get instant access", `Pay ${money(base)} once. Your digital playbook is available right after payment is confirmed.`],
    ["Shortlist three", "Scan all 50 ideas and pick the 3 that match the problems your business has today."],
    ["Test one workflow", "Choose the one with the clearest revenue, cost, speed or risk impact — and start there."],
  ] as const;
  const faqs = [
    ["Is this a physical book?", "No. This is a digital playbook. Access is delivered digitally after successful payment."],
    ["Who is this for?", "Founders, business owners, operators, consultants, agencies and professionals who want practical ideas for applying AI inside real business workflows."],
    ["Do I need technical knowledge?", "No. The playbook helps you understand opportunities first. Some implementations may later require no-code tools, software development or technical support."],
    ["Does this teach me how to build all 50 agents?", "No. The goal is not to build all 50. It helps you identify which workflows are worth exploring first."],
    ["How will I receive it?", cfg.phone === "in"
      ? "After successful payment, digital access instructions will be shown and/or sent to the email or mobile number provided at checkout."
      : "After successful payment, digital access instructions will be shown and/or sent to the email provided at checkout."],
    [`Is ${money(base)} a subscription?`, cfg.faqSubscription],
    ["What are the add-ons at checkout?", `Two optional extras: a ${ADDONS.bundle.name} for ${money(cfg.addons.bundle.amount)}, and the ${ADDONS.newsletter.name} for ${money(cfg.addons.newsletter.amount)}. Both are one-time payments. The ${money(base)} playbook is complete on its own.`],
  ] as const;

  const [open, setOpen] = useState(false),
    [sticky, setSticky] = useState(false),
    [started, setStarted] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [addons, setAddons] = useState<AddonKey[]>([]),
    [expanded, setExpanded] = useState<AddonKey | null>(null);
  const total = addons.reduce<number>((sum, k) => sum + cfg.addons[k].amount, base),
    payable = cfg.payable(addons);

  function track(name: string, detail: Record<string, unknown> = {}) {
    window.dispatchEvent(new CustomEvent("sonnetskills:analytics", { detail: { name, market, ...detail } }));
    (window as typeof window & { dataLayer?: unknown[] }).dataLayer?.push({ event: name, market, ...detail });
    const meta = META_EVENT[name];
    if (meta) {
      const value = typeof detail.value === "number" ? detail.value : undefined;
      metaTrack(meta, {
        content_type: "product",
        content_ids: [PRODUCT.slug, ...(Array.isArray(detail.addons) ? (detail.addons as AddonKey[]).map((k) => ADDONS[k].slug) : [])],
        ...(value === undefined ? {} : { value, currency: cfg.currency }),
      });
    }
  }
  useEffect(() => {
    // Warm the three.js chunk once the page is idle so the first burst is instant.
    const warm = () => loadCelebration().catch(() => {});
    const idle = "requestIdleCallback" in window ? requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 2500);
    return () => ("cancelIdleCallback" in window ? cancelIdleCallback(idle as number) : clearTimeout(idle));
  }, []);
  useEffect(() => {
    // Runs after the dialog has rendered, so the canvas can slot in behind the card.
    if (open) void celebrateCheckoutOpen();
  }, [open]);
  const arrived = useRef(false);
  useEffect(() => {
    // React runs mount effects twice in development; an arrival is still one arrival.
    if (!arrived.current) {
      arrived.current = true;
      track("page_view");
      // The landing page is the product page, so arriving on it is a ViewContent.
      metaTrack("ViewContent", {
        content_type: "product",
        content_ids: [PRODUCT.slug],
        content_name: PRODUCT.name,
        value: base,
        currency: cfg.currency,
      });
    }
    const s = () => setSticky(scrollY > 620);
    addEventListener("scroll", s);
    return () => removeEventListener("scroll", s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const checkout = (source: string, preselect?: AddonKey) => {
    track(source);
    track("checkout_popup_open", { source, preselect });
    if (preselect) setAddons((cur) => (cur.includes(preselect) ? cur : [...cur, preselect]));
    setOpen(true);
  };
  const bonusRefs = useRef<Partial<Record<AddonKey, HTMLParagraphElement | null>>>({});
  const toggleAddon = (k: AddonKey) => {
    const adding = !addons.includes(k);
    track("checkout_addon_toggle", { addon: k, selected: adding });
    setAddons((cur) => (cur.includes(k) ? cur.filter((a) => a !== k) : [...cur, k]));
    // Only on the way in, and only when there is something to celebrate:
    // a popper for un-ticking would be mocking them.
    if (adding && addon(k).bonus) {
      import("@/lib/popper").then(({ popBonus }) => popBonus(bonusRefs.current[k] ?? null));
    }
  };
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    let redirecting = false;
    const f = new FormData(e.currentTarget);
    try {
      const p = new URLSearchParams(location.search),
        // The SonnetSkills platform (sonnetskills.com) owns orders, accounts and emails.
        res = await fetch(`${PANEL_URL}/api/checkout`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            product: PRODUCT.slug,
            addons: addons.map((k) => ADDONS[k].slug),
            name: f.get("name"),
            email: f.get("email"),
            phone: f.get("phone"),
            // The market is intent, not authority: the panel resolves it to
            // its own price list and provider, and this page refuses to open
            // payment unless the server's amount matches the one shown.
            ...(market === "IN" ? {} : { market }),
            marketingConsent: false,
            attribution: {
              utm_source: p.get("utm_source"),
              utm_medium: p.get("utm_medium"),
              utm_campaign: p.get("utm_campaign"),
              utm_content: p.get("utm_content"),
              utm_term: p.get("utm_term"),
              fbclid: p.get("fbclid"),
              gclid: p.get("gclid"),
              campaign_id: p.get("campaign_id"),
              adset_id: p.get("adset_id"),
              ad_id: p.get("ad_id"),
              creative_id: p.get("creative_id"),
              landing_variant: market === "IN" ? null : "global-v1",
              referrer: document.referrer,
              landing: location.origin + location.pathname,
            },
          }),
        }),
        data = (await res.json().catch(() => ({}))) as {
          error?: string;
          amount?: number;
          provider?: "cashfree" | "dodo";
          checkoutUrl?: string;
          paymentSessionId?: string;
          mode?: "sandbox" | "production";
        };
      if (!res.ok) throw new Error(data.error || "Something went wrong while creating your payment session. Please try again.");
      // Only open payment for exactly the total shown in this popup.
      if (data.amount !== payable)
        throw new Error("The price has changed. Please refresh the page and try again.");
      track("checkout_form_submitted", { value: payable, addons });
      if (data.provider === "dodo") {
        // Dodo's checkout is a hosted page; the browser just goes there.
        if (!data.checkoutUrl)
          throw new Error("Something went wrong while creating your payment session. Please try again.");
        track("dodo_checkout_open", { value: payable, addons });
        // Leaving the page at once cancels the pixel's AddPaymentInfo request;
        // a moment's grace lets it go. Cashfree's path already waits for its SDK.
        await new Promise((resolve) => setTimeout(resolve, 400));
        location.assign(data.checkoutUrl);
        redirecting = true;
        return;
      }
      if (!data.paymentSessionId)
        throw new Error(data.error || "Something went wrong while creating your payment session. Please try again.");
      // The order is saved; hand over to Cashfree's hosted checkout for it.
      const cashfree = await load({ mode: data.mode ?? "sandbox" }).catch(() => null);
      if (!cashfree)
        throw new Error("Your details are saved, but the payment page couldn’t load. Please check your connection and try again.");
      track("cashfree_checkout_open", { value: payable, addons });
      const result = await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
      if (result?.error)
        throw new Error(result.error.message || "Your details are saved, but the payment page couldn’t open. Please try again.");
      redirecting = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while creating your payment session. Please try again.");
    } finally {
      if (!redirecting) setLoading(false);
    }
  }

  return (
    <main className="overflow-hidden">
      {/* Announcement bar */}
      <div className="announce">
        <span>{cfg.priceLine}</span>
        <span aria-hidden>•</span>
        <span>Instant digital access</span>
        <span aria-hidden>•</span>
        <span>No subscription</span>
      </div>

      <header className="container flex h-16 items-center justify-between border-b border-black/10 sm:h-20">
        <a href="#top" className="text-lg font-black tracking-[-.04em] sm:text-xl">
          SONNET<span className="text-[#d71914]">SKILLS</span>
        </a>
        <button onClick={() => checkout("header_cta_click")} className="btn-red header-cta">
          GET THE PLAYBOOK — {money(base)}
        </button>
      </header>

      {/* Hero: copy on the left, the book is showcased on the right of the banner */}
      <section id="top" className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-banner.webp"
          alt="50 AI Agents for Real Businesses hardcover on a marble stand"
          width={1536}
          height={1024}
          fetchPriority="high"
          className="hero-bg"
        />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill">
              <BookOpen className="h-3.5 w-3.5" /> Digital playbook · Instant access
            </span>
            <h1 className="display mt-6">
              <span className="text-[#d71914]">50 AI Agents</span>
              <br />
              for Real Businesses
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-black/70 sm:text-lg">
              Choose the right AI workflow to build first—across sales, marketing, operations, finance and management.
            </p>
            <p className="mt-4 text-sm font-bold">
              50 use cases <b className="text-[#d71914]">•</b> 8 business functions{" "}
              <b className="text-[#d71914]">•</b> Practical frameworks
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-[-.06em] sm:text-6xl">{money(base)}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-black/50">
                  {cfg.taxRate ? "+ 18% GST · One-time" : "One-time · No subscription"}
                </span>
              </div>
              <Cta source="hero_cta_click" onClick={checkout}>GET THE PLAYBOOK FOR {money(base)}</Cta>
            </div>
            <p className="mt-3 text-xs text-black/55 sm:text-sm">
              <LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> Secure payment • Instant access • No subscription
            </p>
            <div className="social-proof">
              {cfg.proofPhotos.length > 0 && (
                <div className="avatar-stack">
                  {cfg.proofPhotos.map((src) => (
                    <Image key={src} src={src} width={42} height={42} alt="SonnetSkills customer" className="avatar" />
                  ))}
                </div>
              )}
              <div>
                <p>
                  <strong>11,000+</strong> business owners &amp; professionals downloaded
                </p>
                <div className="rating">
                  <span className="stars" aria-label="4.8 out of 5 stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                  <strong>4.8/5 rating</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product showcase + info strip */}
      <section className="bg-[#f3f3f0] py-20">
        <div className="container">
          <Eyebrow>Inside the playbook</Eyebrow>
          <h2 className="section-title mx-auto max-w-4xl text-center">
            50 practical AI opportunities. Across your entire business.
          </h2>
          <div className="mt-12">
            <div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {categories.map(([c, n]) => (
                  <div key={c} className="card p-4 sm:p-5">
                    <div className="text-3xl font-black text-[#d71914]">{n}</div>
                    <div className="mt-2 text-[11px] font-black leading-4 sm:text-xs">{c}</div>
                  </div>
                ))}
              </div>
              <p className="mt-10 text-sm font-black uppercase tracking-widest">Every agent is broken down into</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {breakdown.map((x) => (
                  <p className="flex gap-2 text-xs font-bold leading-4 sm:text-sm" key={x}>
                    <Check className="h-4 w-4 shrink-0 text-[#d71914]" />
                    {x}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="info-strip mt-12">
            <div><span>📘</span><strong>Digital playbook</strong></div>
            <div><span>⚡</span><strong>Instant access after payment</strong></div>
            <div><span>🔒</span><strong>{cfg.priceLine}</strong></div>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="container py-20">
          <Eyebrow>What readers are saying</Eyebrow>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.quote} className="card p-6">
                <div className="stars mb-3 flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className="h-4 w-4 fill-current" />)}</div>
                <blockquote className="leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-sm font-bold text-black/60">— {t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* The reality */}
      <section className="bg-[#0b0b0b] py-24 text-white">
        <div className="container max-w-4xl text-center">
          <Eyebrow>The gap</Eyebrow>
          <h2 className="section-title">Most businesses are using AI at the surface level.</h2>
          <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
            <div className="rounded-2xl border border-white/15 p-6">
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/50">What most people do</p>
              <div className="space-y-2 text-xl text-white/45 line-through">
                <p>“Write me a caption.”</p>
                <p>“Draft this email.”</p>
                <p>“Give me 10 ideas.”</p>
                <p>“Summarise this.”</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#f24a43]/60 bg-[#f24a43]/10 p-6">
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-[#f24a43]">What AI can actually do</p>
              <div className="space-y-2 text-xl font-bold">
                {["Qualify leads.", "Research accounts.", "Track project risks.", "Process documents.", "Review expenses.", "Research competitors."].map((x) => (
                  <p key={x}>{x}</p>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-12 text-2xl font-bold">
            The opportunity isn’t more AI tools.{" "}
            <span className="text-[#f24a43]">It’s knowing where AI actually fits inside your business.</span>
          </p>
        </div>
      </section>

      {/* The method */}
      <section className="container py-24 text-center">
        <Eyebrow>A better starting point</Eyebrow>
        <h2 className="section-title">You do NOT need 50 AI agents.</h2>
        <p className="mt-5 text-2xl font-bold sm:text-3xl">You probably need one or two.</p>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-black/65">
          This playbook helps you find workflows where AI can improve revenue, cost, speed, risk, customer experience or
          team productivity.
        </p>
        <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-2">
          {[
            ["03", "The AI system", "What you build — last, not first.", "w-[62%]"],
            ["02", "The workflow", "Where it fits and what humans control.", "w-[81%]"],
            ["01", "The business problem", "Why it matters to revenue, cost, speed or risk.", "w-full"],
          ].map(([n, t, d, w], i) => (
            <div key={n} className={`${w} rounded-xl px-5 py-4 text-left ${i === 2 ? "bg-[#d71914] text-white" : "border border-black/15 bg-white"}`}>
              <span className="text-xs font-black opacity-60">{n}</span>
              <p className="font-black">{t}</p>
              <p className={`text-sm ${i === 2 ? "text-white/80" : "text-black/60"}`}>{d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xl border-l-4 border-[#d71914] pl-5 text-left text-2xl font-black">
          Find the right problem first.
          <br />
          Then choose the right AI system.
        </p>
      </section>

      {/* A few of the 50 */}
      <section className="bg-[#f3f3f0] py-24">
        <div className="container">
          <Eyebrow>A few of the 50</Eyebrow>
          <h2 className="section-title text-center">Built around actual workflows.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {agents.map(([t, d], i) => (
              <article key={t} className="card p-6">
                <div className="mb-3 text-xs font-black text-[#d71914]">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="text-xl font-black">{t}</h3>
                <p className="mt-2 leading-relaxed text-black/65">{d}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Cta source="midpage_cta_click" onClick={checkout}>SEE ALL 50 AI AGENTS — {money(base)}</Cta>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="container py-24">
        <Eyebrow>How this compares</Eyebrow>
        <h2 className="section-title text-center">Not another list of AI tools.</h2>
        <div className="mt-12 overflow-x-auto">
          <table className="compare">
            <thead>
              <tr>
                <th />
                <th>Most AI ebooks</th>
                <th className="ours">50 AI Agents for Real Businesses</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(([row, them, us]) => (
                <tr key={row}>
                  <td className="font-bold">{row}</td>
                  <td className="text-black/55">
                    <X className="mr-1 inline h-4 w-4" />
                    {them}
                  </td>
                  <td className="ours font-bold">
                    <Check className="mr-1 inline h-4 w-4 text-[#d71914]" />
                    {us}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#0b0b0b] py-24 text-white">
        <div className="container">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="section-title text-center">Simple. No confusion.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <div key={t} className="rounded-2xl border border-white/15 p-7">
                <div className="text-4xl font-black text-[#f24a43]">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-4 text-xl font-black">{t}</h3>
                <p className="mt-2 leading-relaxed text-white/65">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="container py-24">
        <Eyebrow>Who it’s for</Eyebrow>
        <h2 className="section-title text-center">Is this playbook for you?</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {audience.map(([Icon, t, d]) => (
            <div key={t} className="card p-6">
              <Icon className="h-7 w-7 text-[#d71914]" />
              <h3 className="mt-4 text-xl font-black">{t}</h3>
              <p className="mt-2 leading-relaxed text-black/65">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Cta source="audience_cta_click" onClick={checkout}>THIS IS FOR ME — GET IT FOR {money(base)}</Cta>
        </div>
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-black/15 p-7">
          <h3 className="text-2xl font-black">This is NOT for you if…</h3>
          <ul className="mt-5 space-y-3">
            {notFor.map((x) => (
              <li key={x} className="flex gap-3 text-black/70">
                <X className="mt-0.5 h-5 w-5 shrink-0 text-[#d71914]" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Value stack */}
      <section className="bg-[#f3f3f0] py-24">
        <div className="container max-w-3xl">
          <Eyebrow>Value stack</Eyebrow>
          <h2 className="section-title text-center">Everything you get for {money(base)}{cfg.taxSuffix}</h2>
          <div className="card mt-12 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-widest text-black/50">The playbook</p>
            <ul className="mt-4 space-y-4">
              {[
                ["50 AI agent use cases", "Across 8 business functions, from sales to business memory."],
                ["A 7-part breakdown for every agent", "Problem, what it does, where it fits, human control, metrics, risks, where to start."],
                ["Business-problem-first framework", "Find the right problem first. Then choose the right AI system."],
                ["Research-backed evidence", "250+ research points, weighted by source quality."],
                ["Instant digital access", "Delivered right after payment is confirmed."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#d71914]" />
                  <span>
                    <strong>{t}</strong> <span className="text-black/60">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs font-black uppercase tracking-widest text-black/50">Optional add-ons at checkout</p>
            <ul className="mt-4 space-y-4">
              {(Object.keys(ADDONS) as AddonKey[]).map((k) => (
                <li key={k} className="flex gap-3">
                  <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#d71914]" />
                  <span>
                    <strong>
                      {ADDONS[k].name} — {money(cfg.addons[k].amount)}
                    </strong>{" "}
                    <span className="text-black/60">{ADDONS[k].summary}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-black/10 pt-8 text-center">
              <div className="text-5xl font-black tracking-[-.06em]">{money(base)}</div>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-black/50">
                {cfg.taxRate ? "+ 18% GST · One-time payment" : "One-time payment · No subscription"}
              </p>
              <div className="mt-5">
                <Cta source="value_stack_cta_click" onClick={checkout}>GET THE PLAYBOOK — {money(base)}</Cta>
              </div>
            </div>
          </div>
        </div>

        <div className="container mt-20 max-w-5xl">
          <Eyebrow>Complete your kit</Eyebrow>
          <h2 className="section-title text-center">
            {cfg.taxRate ? "Go further for less than a coffee." : "Go further, in the same checkout."}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-black/65">
            {cfg.taxRate
              ? `Two optional add-ons you can tick at checkout, each + 18% GST. The ${money(base)} playbook is complete on its own.`
              : `Two optional add-ons you can tick at checkout — one payment covers everything. The ${money(base)} playbook is complete on its own.`}
          </p>
          <div className="mt-12 space-y-6">
            {(Object.keys(ADDONS) as AddonKey[]).map((k) => {
              const a = addon(k);
              return (
                <article key={k} className="addon-showcase card overflow-hidden">
                  <TiltFrame className="addon-showcase-media" max={4}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.image} alt={a.imageAlt} loading="lazy" decoding="async" className="block w-full" />
                  </TiltFrame>
                  <div className="p-6 sm:p-8">
                    <p className="eyebrow">
                      {a.label}
                      {"recommended" in a && <span className="addon-pick">Recommended</span>}
                    </p>
                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-2xl font-black leading-tight sm:text-3xl">{a.name}</h3>
                      <p className="text-3xl font-black text-[#d71914]">
                        {money(a.amount)}
                        {cfg.taxRate > 0 && (
                          <span className="ml-1 align-middle text-xs font-bold uppercase tracking-wider text-black/45">+ 18% GST</span>
                        )}
                      </p>
                    </div>
                    <p className="mt-3 text-black/65">{a.summary}</p>
                    <ul className="mt-5 space-y-2.5">
                      {a.points.map((pt) => (
                        <li key={pt} className="flex gap-2.5 text-sm leading-snug sm:text-base">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d71914]" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 text-xs font-bold uppercase tracking-wider text-black/45">{a.note}</p>
                    <button
                      onClick={() => checkout(`addon_showcase_${k}_click`, k)}
                      className="btn-red mt-6 inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                    >
                      GET THE PLAYBOOK + ADD THIS — {money(base + a.amount)}{cfg.taxSuffix} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="container py-24 text-center">
        <Eyebrow>Credibility</Eyebrow>
        <div className="text-[clamp(6rem,16vw,11rem)] font-black leading-none tracking-[-.09em] text-[#d71914]">
          250<span className="text-5xl">+</span>
        </div>
        <p className="font-black tracking-widest">RESEARCH POINTS REVIEWED</p>
        <h2 className="section-title mt-10">Built from research, not AI hype.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-black/65">
          Developed using implementation examples, platform documentation, institutional research and real-world business
          cases. Evidence is weighted by source quality—not presented as if every claim carries equal weight.
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-[#f3f3f0] py-24">
        <div className="container max-w-3xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="section-title text-center">Questions? Answers.</h2>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map(([q, a], i) => (
              <AccordionItem value={String(i)} key={q}>
                <AccordionTrigger className="py-5 text-left text-lg font-black">{q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-base leading-relaxed text-black/65">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta bg-[#0b0b0b] py-20 text-white">
        <div className="container grid items-center gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="mb-5 text-xs font-black uppercase tracking-[.16em] text-[#f24a43]">Start with the right workflow</p>
            <h2 className="final-title">
              You don’t need another AI tool.
              <br />
              <span className="text-[#f24a43]">You need to know what to build.</span>
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <strong className="text-5xl sm:text-6xl">{money(base)}</strong>
              <Cta source="final_cta_click" onClick={checkout}>GET 50 AI AGENTS FOR {money(base)}</Cta>
            </div>
            <p className="mt-4 text-sm text-white/55">{cfg.priceLine} • Instant digital access • No subscription</p>
          </div>
          <Book3D className="final-book-3d cursor-grab" sizes="320px" />
        </div>
      </section>

      <Footer />

      {sticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-black/15 bg-white p-3 shadow-2xl sm:hidden">
          <div className="pl-1 leading-tight">
            <strong className="text-2xl">{money(base)}</strong>
            <p className="text-[11px] text-black/55">
              {cfg.taxRate ? "+ 18% GST · Instant digital access" : "One-time · Instant digital access"}
            </p>
          </div>
          <button className="btn-red min-h-12 shrink-0 px-5" onClick={() => checkout("mobile_sticky_cta_click")}>
            GET THE PLAYBOOK
          </button>
        </div>
      )}

      {/* Checkout */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="checkout-dialog max-h-[95vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <div className="glass-head border-b border-white/50 p-6">
            <DialogHeader>
              <p className="eyebrow">Get the playbook</p>
              <DialogTitle className="text-3xl font-black tracking-tight">You’re one step away.</DialogTitle>
              <DialogDescription>Enter your details to continue to secure payment.</DialogDescription>
            </DialogHeader>
            <div className="glass-tile mt-5 flex items-center gap-4 p-3">
              <Book3D className="h-32 w-24 cursor-grab sm:h-36 sm:w-28" />
              <div className="grow">
                <p className="font-black leading-tight">{PRODUCT.name}</p>
                <p className="mt-1 text-xs text-black/55">
                  Digital playbook · Instant access · One-time{cfg.taxRate ? " · + 18% GST" : ""}
                </p>
              </div>
              <p className="text-3xl font-black text-[#d71914]">{money(base)}</p>
            </div>
          </div>
          <form
            onSubmit={submit}
            onFocus={() => {
              if (!started) {
                setStarted(true);
                track("checkout_form_started");
              }
            }}
            className="space-y-4 p-6"
          >
            <label className="block text-sm font-bold">
              Full Name
              <Input required name="name" autoComplete="name" className="glass-input mt-2 h-12" />
            </label>
            <label className="block text-sm font-bold">
              Email Address
              <Input required name="email" type="email" autoComplete="email" className="glass-input mt-2 h-12" />
            </label>
            {cfg.phone === "in" ? (
              <label className="block text-sm font-bold">
                Mobile Number
                <div className="mt-2 flex">
                  <span className="flex h-12 items-center border border-r-0 border-input glass-input px-3">+91</span>
                  <Input
                    required
                    name="phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="glass-input h-12 rounded-l-none"
                  />
                </div>
              </label>
            ) : (
              <label className="block text-sm font-bold">
                Phone / WhatsApp <span className="font-normal text-black/50">(optional)</span>
                <Input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 000 1234 — include your country code"
                  /* Browsers compile pattern with the v flag, where ( ) and -
                     must be escaped inside [ ]; unescaped, the whole pattern is
                     rejected and the field goes unchecked. Anchoring is implicit. */
                  pattern="\+?[0-9 .\(\)\-]{8,20}"
                  className="glass-input mt-2 h-12"
                />
              </label>
            )}

            <div className="space-y-3 pt-2">
              <p className="text-xs font-black uppercase tracking-widest text-black/50">Optional add-ons</p>
              {(Object.keys(ADDONS) as AddonKey[]).map((k) => {
                const a = addon(k),
                  on = addons.includes(k);
                return (
                  <div key={k} className={`addon ${on ? "addon-on" : ""}`}>
                    {/* The artwork carries the offer — the books, the bonus, the
                        price. At fifty-two pixels square it carried a corner of
                        one book, which is not a picture of anything. It runs the
                        width of the row now, at the ratio it was drawn in. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.checkoutImage} alt={a.imageAlt} loading="lazy" className="addon-banner" />
                    <label className="flex cursor-pointer gap-3">
                      <Checkbox checked={on} onCheckedChange={() => toggleAddon(k)} className="mt-1 size-5" />
                      <span className="grow">
                        <span className="block text-[11px] font-black uppercase tracking-widest text-[#d71914]">
                          {a.label}
                          {"recommended" in a && <span className="addon-pick">Recommended</span>}
                        </span>
                        <span className="block font-black leading-snug">{a.name}</span>
                        <span className="mt-1 line-clamp-2 block text-sm text-black/60">{a.summary}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xl font-black">{money(a.amount)}</span>
                        {cfg.taxRate > 0 && <span className="text-[11px] text-black/50">+ 18% GST</span>}
                      </span>
                    </label>
                    {/* The unlock is the reason to tick the box, so it has to be
                        readable before the box is ticked. Ticked, the same line
                        turns from an offer into a confirmation. */}
                    {a.bonus && (
                      <p
                        ref={(el) => {
                          bonusRefs.current[k] = el;
                        }}
                        className={`mt-2 ml-8 flex items-start gap-2 text-xs font-bold leading-relaxed ${
                          on ? "bonus-live text-[#d71914]" : "text-black/45"
                        }`}
                      >
                        <span aria-hidden="true">🎁</span>
                        <span>
                          <span className="uppercase tracking-widest">
                            {on ? "Bonus unlocked" : "Add this and you also unlock"}
                          </span>
                          <span className={`block font-semibold ${on ? "text-black/70" : "text-black/55"}`}>
                            {a.bonus}
                          </span>
                        </span>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === k ? null : k)}
                      className="mt-2 ml-8 inline-flex items-center gap-1 text-xs font-bold text-[#d71914]"
                      aria-expanded={expanded === k}
                    >
                      What’s included <ChevronDown className={`h-3.5 w-3.5 transition ${expanded === k ? "rotate-180" : ""}`} />
                    </button>
                    {expanded === k && (
                      <div className="addon-details mt-3 ml-8">
                        {/* Opening "What's included" is a different question from
                            the one the banner answers, so an add-on may answer it
                            with its own artwork — and a market may answer it with
                            its own, because the artwork sells a market's promise. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.detailsImage ?? a.checkoutImage}
                          alt={a.detailsAlt ?? a.imageAlt}
                          className="mb-3 w-full rounded-xl"
                        />
                        <ul className="space-y-1.5 text-sm text-black/70">
                          {a.points.map((pt) => (
                            <li key={pt} className="flex gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d71914]" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-black/45">{a.note}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="text-xs italic text-black/50">
                {cfg.taxRate
                  ? `Add-ons are optional. The ${money(base)} playbook is complete on its own. All prices are before GST; 18% is added below.`
                  : `Add-ons are optional. The ${money(base)} playbook is complete on its own. Prices are in US dollars; any local sales tax is shown by our payment partner before you pay.`}
              </p>
            </div>

            <div className="glass-tile p-4 text-sm">
              <div className="flex justify-between">
                <span>{PRODUCT.name}</span>
                <span>{money(base)}</span>
              </div>
              {addons.map((k) => (
                <div key={k} className="mt-1 flex justify-between text-black/70">
                  <span>{ADDONS[k].name}</span>
                  <span>{money(cfg.addons[k].amount)}</span>
                </div>
              ))}
              {cfg.taxRate > 0 ? (
                <>
                  <div className="mt-3 flex justify-between border-t border-black/10 pt-3 text-black/70">
                    <span>Subtotal</span>
                    <span>{money(total)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-black/70">
                    <span>GST (18%)</span>
                    <span>₹{(payable - total).toFixed(2)}</span>
                  </div>
                </>
              ) : null}
              <div className="mt-2 flex justify-between border-t border-black/10 pt-3 text-base font-black">
                <span>Total payable</span>
                <span>{cfg.taxRate ? cfg.money2(payable) : money(payable)}</span>
              </div>
            </div>

            <label className="flex gap-3 text-sm leading-5">
              <Checkbox required name="terms" className="mt-0.5" />
              <span>
                I agree to the{" "}
                <a href={`${PANEL_URL}/terms`} target="_blank" rel="noopener" className="underline">Terms & Conditions</a>,{" "}
                <a href={`${PANEL_URL}/privacy`} target="_blank" rel="noopener" className="underline">Privacy Policy</a>,{" "}
                <a href={`${PANEL_URL}/refund-policy`} target="_blank" rel="noopener" className="underline">Refund Policy</a> and{" "}
                <a href={`${PANEL_URL}/delivery-policy`} target="_blank" rel="noopener" className="underline">Digital Delivery Policy</a>.
              </span>
            </label>
            {error && (
              <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </p>
            )}
            <button disabled={loading} className="btn-red w-full disabled:opacity-60">
              {loading ? "OPENING SECURE PAYMENT…" : `PAY ${cfg.taxRate ? cfg.money2(payable) : money(payable)} SECURELY`}
            </button>
            <p className="text-center text-xs text-black/50">
              <LockKeyhole className="mr-1 inline h-3 w-3" /> {cfg.trustLine}
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* ======================================================================= India
 *
 * lp.sonnetskills.com: funnel v2 — the ₹199 + GST 500 AI Agents — in the
 * design above. Same sections, classes and popup; v2's offer and checkout:
 * details (saved as a lead) → bump → yearly membership → review and pay on
 * Cashfree, with GST as its own line and an optional GSTIN.
 */

/** The five volumes; chapter names as in the panel's api/_data/agents.json. */
const VOLUMES = [
  {
    no: "01", name: "Grow", title: "Sales & Marketing",
    chapters: ["Lead capture & qualification", "Follow-up & nurture", "Sales operations & CRM", "Content & social media", "Ads, SEO & growth analytics", "Dealer, partner & B2B sales"],
  },
  {
    no: "02", name: "Serve", title: "Customer Experience",
    chapters: ["Support & helpdesk", "Bookings & appointments", "Onboarding & account care", "Reviews & reputation", "Retention & loyalty", "After-sales & field service"],
  },
  {
    no: "03", name: "Run", title: "Operations & Supply Chain",
    chapters: ["Inventory & warehouse", "Purchasing & vendors", "Production & quality", "Logistics & dispatch", "Projects & task tracking", "SOPs & documents"],
  },
  {
    no: "04", name: "Manage", title: "Money, People & Control",
    chapters: ["Accounts & bookkeeping", "Invoicing & collections", "GST, tax & legal", "Hiring & onboarding", "Payroll, attendance & HR", "Owner's dashboard & decisions"],
  },
  {
    no: "05", name: "Specialise", title: "Industry Playbooks",
    chapters: ["Healthcare & clinics", "Pharma & distribution", "Manufacturing", "Retail & D2C", "Real estate", "Education & coaching", "Hospitality & food", "Logistics & transport", "CA, legal & consulting", "Agencies & media"],
  },
] as const;
const CHAPTERS = VOLUMES.reduce((n, v) => n + v.chapters.length, 0);

/**
 * Proof, copied verbatim from agents.json (`agents[].who[]` entries that carry a
 * source). They are public reports of similar AI use — the page says so right
 * under them — never claims that these companies use these agents.
 */
const PROOF = [
  {
    company: "IndiaMART · India",
    text: "Upgraded a manual call centre that handled almost 80,000 calls a day to an AI voice call centre handling 100,000 a day, including buyer intent checks.",
    source: "MediaNama, 22 Jul 2026",
  },
  {
    company: "Air India · India",
    text: "Its AI.g assistant, linked to its reservation system, handles about 30,000 questions a day on bookings, flight status and baggage; 97% of sessions fully automated.",
    source: "Microsoft customer story, 15 Nov 2024",
  },
  {
    company: "Flipkart · India",
    text: "Runs high-value returns like phones through X-ray scans; AI checks the image against the original item to catch fake returns without opening the seal.",
    source: "Flipkart Stories, 25 Sep 2024",
  },
  {
    company: "Larsen & Toubro · India",
    text: "Uses AI to optimise machinery and workforce planning; Microsoft reports planning time fell from two weeks to ten minutes.",
    source: "Microsoft AI First Movers, accessed Oct 2026",
  },
  {
    company: "Zomato · India",
    text: "Built an Azure OpenAI Copilot for its city operations team, which earlier had to write new queries for data; it can now get any data within 10 seconds.",
    source: "Microsoft India, AI First Movers",
  },
  {
    company: "Apollo Hospitals · India",
    text: "Its Clinician Copilot on Azure OpenAI summarises medical records and adds voice-to-text; Apollo says clinicians reclaim up to 20% of time lost to data gathering.",
    source: "Microsoft India story (FY26), accessed Oct 2026",
  },
] as const;

const EVERY_AGENT = [
  "What it does and how it works, step by step",
  "The time and money it saves, in rupees",
  "What it costs to build and to run",
  "When your business is ready for it",
  "What it needs from you, and what it connects to",
  "Who is already doing something similar",
];

const SAMPLES = [
  ["/v2/sample-grw-001-p7.webp", "Page 1: what it does and how it works", "Website Lead Capture Agent, page 1: the problem, what it does, what it needs from you and how it works"],
  ["/v2/sample-grw-001-p8.webp", "Page 2: the numbers and the fit", "Website Lead Capture Agent, page 2: time saved, money saved, cost to build and when it's the right time"],
] as const;

const AFTER_PAY = [
  ["Instant access in your library", "Read all five volumes online the moment you pay, with PDF downloads too."],
  ["Delivered on WhatsApp and email", "Your order and your library link arrive on both, so you can’t lose them."],
  ["A free AI Audit call", "We look at your business with you and point at the agent worth building first."],
  ["A NEXPMX 15-day trial", "Start it whenever you’re ready, not the day you buy."],
] as const;

const MEMBERSHIP_POINTS = [
  "Weekly AI briefings and practical workflows",
  "AI concepts broken down in plain language",
  "Tools worth trying, prompts and templates",
  "AI and Claude skills, updated as they change",
  "Playbooks and live sessions",
];

const IN_NOT_FOR = [
  "You want a coding tutorial that builds all 500 agents for you",
  "You’re looking for another list of tools or copy-paste prompts",
  "You expect results without testing anything in your own business",
  "You want a physical book — these are digital volumes",
];

/** The two checkout extras, as the "Complete your kit" cards show them. */
const IN_KIT = {
  bump: {
    label: "5-book bundle + mini-course",
    name: "Ebook bundle + AI Foundations mini-course",
    summary: "The current bundle, unchanged, plus the mini-course free.",
    image: ADDONS.bundle.image,
    imageAlt: ADDONS.bundle.imageAlt,
    points: [...ADDONS.bundle.points, "AI Foundations mini-course — free with the bundle"],
    note: `One-time ${inr(V2_OFFERS.bump.amount * 100)} + 18% GST · Delivered digitally with your order · No subscription`,
  },
  membership: {
    label: "Membership · 12 months",
    name: V2_OFFERS.membership.name,
    summary: "12 months of AI advantage: we filter the noise and show you how to use what matters.",
    image: ADDONS.newsletter.image,
    imageAlt: ADDONS.newsletter.imageAlt,
    points: MEMBERSHIP_POINTS,
    note: `One-time ${inr(V2_OFFERS.membership.amount * 100)} + 18% GST · 12 months of access · No auto-renewal`,
    bonus: "Take all three and get a 25-minute 1:1 call.",
  },
} as const;

type Fields = { name: string; email: string; phone: string };
type FieldErrors = Partial<Record<keyof Fields | "gstin" | "billingName", string>>;
/** details → bump → membership → pay */
type Step = 1 | 2 | 3 | 4;

const PHONE_PREFIX = "+91 ";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const NETWORK_ERROR = "We couldn't reach our payment server. Please check your connection and try again.";
const GENERIC_ERROR = "Something went wrong while creating your payment session. Please try again.";

function validate(f: Fields): FieldErrors {
  const e: FieldErrors = {};
  if (f.name.trim().replace(/\s+/g, " ").length < 2) e.name = "Enter your full name.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address.";
  const raw = f.phone.trim();
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+91") || !raw.startsWith("+")) {
    const local = raw.startsWith("+91") ? digits.slice(2) : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
    if (!local) e.phone = "Enter your WhatsApp number.";
    else if (!/^[6-9][0-9]{9}$/.test(local)) e.phone = "Enter a 10-digit Indian mobile number.";
  } else if (digits.length < 8 || digits.length > 15) e.phone = "Enter a valid WhatsApp number with its country code.";
  return e;
}

function attribution() {
  const p = new URLSearchParams(location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_content: p.get("utm_content"),
    utm_term: p.get("utm_term"),
    fbclid: p.get("fbclid"),
    gclid: p.get("gclid"),
    campaign_id: p.get("campaign_id"),
    adset_id: p.get("adset_id"),
    ad_id: p.get("ad_id"),
    creative_id: p.get("creative_id"),
    landing_variant: "in-v2",
    referrer: document.referrer,
    landing: location.origin + location.pathname,
  };
}

/** Talk to the panel; never throws a raw TypeError at the page. */
async function panel<T>(path: string, body?: unknown) {
  let res: Response;
  try {
    res = await fetch(`${PANEL_URL}${path}`, body === undefined
      ? { method: "GET" }
      : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return { ok: false as const, status: 0, data: { error: NETWORK_ERROR } as T & { error?: string; field?: string } };
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; field?: string };
  return { ok: res.ok, status: res.status, data };
}

const contentIds = (keys: readonly V2OfferKey[]) => [V2_PRODUCT.slug, ...keys.map((k) => V2_OFFERS[k].slug)];

/** The five volume covers, fanned like a hand of cards; volume 01 in front. */
function CoverFan({ className = "", sizes, preload }: { className?: string; sizes: string; preload?: boolean }) {
  return (
    <div className={`cover-fan ${className}`} role="img" aria-label="The five volumes of 500 AI Agents for Real Businesses">
      {VOLUMES.map((v, i) => (
        <Image
          key={v.no}
          src={`/v2/cover-vol-${i + 1}.webp`}
          alt=""
          width={600}
          height={424}
          sizes={sizes}
          preload={preload && i === 0}
          className="cover-fan-card"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      {optional && <span className="font-normal text-black/50"> (optional)</span>}
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-sm font-bold text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`mt-1 flex justify-between gap-4 first:mt-0 ${muted ? "text-black/70" : ""}`}>
      <span>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}

function BackLink({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1 text-xs font-bold text-black/50 disabled:opacity-40">
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </button>
  );
}

function IndiaPage() {
  const price = inr(V2_PRODUCT.amount * 100);
  const both = inr((V2_OFFERS.bump.amount + V2_OFFERS.membership.amount) * 100);

  const comparison = [
    ["Starting point", "Tool lists", "Business problems first"],
    ["What’s inside", "Prompt collections", "500 ready-to-build AI agents"],
    ["Approach", "Generic AI hacks", "What it does and how it works, step by step"],
    ["The numbers", "Vague promises", "Time and money saved, cost to build and run"],
    ["Timing", "Build everything now", "When your business is ready for it"],
    ["Evidence", "Claims presented as equal", "Public examples of similar AI use, with sources"],
    ["Price", "Varies", `${price} + 18% GST, one-time`],
  ] as const;
  const faqs = [
    ["Is this a physical book?", "No. The 500 AI Agents are five digital volumes. You read them online in your library the moment you pay, with PDF downloads too."],
    ["Who is this for?", "Founders, business owners, operators, consultants, agencies and professionals who want practical ideas for applying AI inside real business workflows."],
    ["Do I need technical knowledge?", "No. Every agent explains what it does, how it works and what it needs from you in plain language. Building some of them may later need no-code tools, a developer or technical support."],
    ["Does this build all 500 agents for me?", "No. The goal is not to build all 500. It helps you find the one worth building first, and shows what it costs and when your business is ready for it."],
    ["How will I receive it?", "Instantly, in your library, with PDF downloads. Your order and your library link are also sent on WhatsApp and email."],
    [`Is ${price} a subscription?`, `No. ${price} is a one-time payment. 18% GST is added at checkout, so ${inr2(v2Cart([]).totalPaise)} is what actually leaves your account — you see the full breakdown before you pay.`],
    ["What are the add-ons at checkout?", `Two optional extras: the ebook bundle + AI Foundations mini-course for ${inr(V2_OFFERS.bump.amount * 100)}, and the AI Weekly yearly membership for ${inr(V2_OFFERS.membership.amount * 100)}, each + 18% GST and one-time. Take all three and you also get a 25-minute 1:1 call. The ${price} volumes are complete on their own.`],
    ["What else comes with my order?", "A free AI Audit call for your business, and a NEXPMX 15-day trial that you start whenever you’re ready."],
    ["Can I get a GST invoice?", "Yes. Add your GSTIN and business name at checkout, under “Need a GST invoice?”."],
  ] as const;

  const [fields, setFields] = useState<Fields>({ name: "", email: "", phone: PHONE_PREFIX });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [chosen, setChosen] = useState<V2OfferKey[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [gstOpen, setGstOpen] = useState(false);
  const [gstin, setGstin] = useState("");
  const [billingName, setBillingName] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [sticky, setSticky] = useState(false);
  const [started, setStarted] = useState(false);

  const cart = v2Cart(chosen);
  const has = (k: V2OfferKey) => chosen.includes(k);
  const bumpRowRef = useRef<HTMLDivElement | null>(null);
  const addedToCart = useRef(new Set<string>());
  const checkoutStarted = useRef(false);

  function track(name: string, detail: Record<string, unknown> = {}) {
    window.dispatchEvent(new CustomEvent("sonnetskills:analytics", { detail: { name, market: "IN", variant: "v2", ...detail } }));
    (window as typeof window & { dataLayer?: unknown[] }).dataLayer?.push({ event: name, market: "IN", variant: "v2", ...detail });
  }

  /** Meta AddToCart, once per offer per visit: going back and forth is not a second sale. */
  function addToCart(what: "bump" | "membership" | "both", value: number, keys: V2OfferKey[]) {
    track("checkout_offer_accepted", { offer: what, value });
    if (addedToCart.current.has(what)) return;
    addedToCart.current.add(what);
    metaTrack("AddToCart", {
      content_type: "product",
      content_ids: keys.map((k) => V2_OFFERS[k].slug),
      content_name: what === "both" ? `${V2_OFFERS.bump.name} + ${V2_OFFERS.membership.name}` : V2_OFFERS[what].name,
      value,
      currency: "INR",
    });
  }

  /** InitiateCheckout: the details are in and the offer steps begin. */
  function initiateCheckout(source: string) {
    track("checkout_initiated", { source });
    checkoutStarted.current = true;
    metaTrack("InitiateCheckout", { content_type: "product", content_ids: [V2_PRODUCT.slug], value: V2_PRODUCT.amount, currency: "INR" });
  }

  useEffect(() => {
    // Warm the three.js chunk once the page is idle so the first burst is instant.
    const warm = () => loadCelebration().catch(() => {});
    const idle = "requestIdleCallback" in window ? requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 2500);
    return () => ("cancelIdleCallback" in window ? cancelIdleCallback(idle as number) : clearTimeout(idle));
  }, []);
  useEffect(() => {
    // Runs after the dialog has rendered, so the canvas can slot in behind the card.
    if (open) void celebrateCheckoutOpen();
  }, [open]);
  useEffect(() => {
    // Each step starts at its top, not wherever the last one was scrolled to.
    document.querySelector(".checkout-dialog")?.scrollTo({ top: 0 });
  }, [step]);
  /** A reminder email's link back to the same cart: ?cart=<24 hex>. */
  function resume() {
    const token = new URLSearchParams(location.search).get("cart");
    if (!token || !/^[0-9a-f]{24}$/.test(token)) return;
    void panel<{ name?: string; email?: string; phone?: string; product?: string; addons?: string[] }>(`/api/checkout/lead/${token}`).then(
      ({ ok, data }) => {
        if (!ok) return; // expired or unreachable: the page is still the page
        setFields({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone ? (data.phone.startsWith("+91") ? `+91 ${data.phone.slice(3)}` : data.phone) : PHONE_PREFIX,
        });
        const addons = Array.isArray(data.addons) ? data.addons : [];
        setChosen((Object.keys(V2_OFFERS) as V2OfferKey[]).filter((k) => addons.includes(V2_OFFERS[k].slug)));
        setLead(token);
        track("cart_resumed");
        setStep(2);
        setPayError("");
        setOpen(true);
        track("checkout_popup_open", { source: "cart_resume" });
        initiateCheckout("cart_resume");
      }
    );
  }

  const arrived = useRef(false);
  useEffect(() => {
    // React runs mount effects twice in development; an arrival is still one arrival.
    if (!arrived.current) {
      arrived.current = true;
      track("page_view");
      // The landing page is the product page, so arriving on it is a ViewContent.
      metaTrack("ViewContent", {
        content_type: "product",
        content_ids: [V2_PRODUCT.slug],
        content_name: V2_PRODUCT.name,
        value: V2_PRODUCT.amount,
        currency: "INR",
      });
      resume();
    }
    const s = () => setSticky(scrollY > 620);
    addEventListener("scroll", s, { passive: true });
    return () => removeEventListener("scroll", s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Every CTA opens the popup; somebody whose details are already in goes straight to the offer. */
  function checkout(source: string, preselect?: V2OfferKey) {
    track(source);
    track("checkout_popup_open", { source, preselect });
    if (preselect) setChosen((c) => (c.includes(preselect) ? c : [...c, preselect]));
    setStep(lead ? 2 : 1);
    setPayError("");
    setOpen(true);
  }

  const setField = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFields((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function submitDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length) {
      track("order_form_invalid", { fields: Object.keys(found) });
      return;
    }
    setSubmitting(true);
    const { ok, data } = await panel<{ lead?: string }>("/api/checkout/lead", {
      product: V2_PRODUCT.slug,
      name: fields.name.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      attribution: attribution(),
      market: "IN",
    });
    setSubmitting(false);
    if (!ok && data.field && ["name", "email", "phone"].includes(data.field)) {
      setErrors({ [data.field]: data.error || "Please check this field." });
      return;
    }
    if (ok && data.lead) {
      setLead(data.lead);
      track("lead_saved");
      metaTrack("Lead", { content_type: "product", content_ids: [V2_PRODUCT.slug], value: V2_PRODUCT.amount, currency: "INR" });
    }
    // A lead that couldn't be saved (offline, rate-limited) never stops a buyer:
    // the order itself is saved at payment.
    if (!checkoutStarted.current) initiateCheckout("order_form");
    setStep(2);
  }

  function toggleBump(on: boolean) {
    setChosen((c) => (on ? [...new Set([...c, "bump" as const])] : c.filter((k) => k !== "bump")));
    track("checkout_bump_toggle", { selected: on });
    if (on) {
      addToCart("bump", V2_OFFERS.bump.amount, ["bump"]);
      import("@/lib/popper").then(({ popBonus }) => popBonus(bumpRowRef.current));
    }
  }

  function membership(choice: "yes" | "both" | "no") {
    if (choice === "no") {
      setChosen((c) => c.filter((k) => k !== "membership"));
      track("checkout_membership_declined");
    } else if (choice === "yes") {
      setChosen((c) => [...new Set([...c, "membership" as const])]);
      addToCart("membership", V2_OFFERS.membership.amount, ["membership"]);
    } else {
      setChosen(["bump", "membership"]);
      addToCart("both", V2_OFFERS.bump.amount + V2_OFFERS.membership.amount, ["bump", "membership"]);
    }
    setStep(4);
  }

  async function pay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPayError("");
    setErrors((x) => ({ ...x, gstin: undefined }));
    const cleanGstin = gstin.trim().toUpperCase();
    if (cleanGstin && !GSTIN_RE.test(cleanGstin)) {
      setGstOpen(true);
      setErrors((x) => ({ ...x, gstin: "That GSTIN doesn't look right. It's 15 characters, like 27ABCDE1234F1Z5." }));
      return;
    }
    setPaying(true);
    let redirecting = false;
    try {
      const { ok, status, data } = await panel<{
        orderId?: string;
        paymentSessionId?: string;
        amount?: number;
        mode?: "sandbox" | "production";
      }>("/api/checkout", {
        product: V2_PRODUCT.slug,
        addons: cart.addons,
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        attribution: attribution(),
        market: "IN",
        gstin: cleanGstin || null,
        billingName: cleanGstin ? billingName.trim() || null : null,
      });
      if (!ok) {
        if (status === 400 && data.field === "gstin") {
          setGstOpen(true);
          setErrors((x) => ({ ...x, gstin: data.error || "Please check your GSTIN." }));
          return;
        }
        if (data.field && ["name", "email", "phone"].includes(data.field))
          setErrors((x) => ({ ...x, [data.field as string]: data.error }));
        throw new Error(data.error || GENERIC_ERROR);
      }
      // Only open payment for exactly the total shown here.
      if (typeof data.amount !== "number" || Math.round(data.amount * 100) !== cart.totalPaise)
        throw new Error("The price has changed. Please refresh the page and try again.");
      if (!data.paymentSessionId) throw new Error(GENERIC_ERROR);
      track("checkout_form_submitted", { value: cart.totalPaise / 100, addons: cart.addons, lead });
      metaTrack("AddPaymentInfo", {
        content_type: "product",
        content_ids: contentIds(cart.keys),
        value: cart.totalPaise / 100,
        currency: "INR",
      });
      // The order is saved; hand over to Cashfree's hosted checkout for it.
      const cashfree = await load({ mode: data.mode ?? "sandbox" }).catch(() => null);
      if (!cashfree)
        throw new Error("Your details are saved, but the payment page couldn’t load. Please check your connection and try again.");
      track("cashfree_checkout_open", { value: cart.totalPaise / 100, addons: cart.addons });
      const result = await cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
      if (result?.error)
        throw new Error(result.error.message || "Your details are saved, but the payment page couldn’t open. Please try again.");
      redirecting = true;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : GENERIC_ERROR);
    } finally {
      if (!redirecting) setPaying(false);
    }
  }

  const heads: Record<Step, [string, React.ReactNode, string]> = {
    1: ["Get the 500 AI Agents", "You’re almost there.", "Enter your details to continue to secure payment."],
    2: ["Step 2 of 4 · Your order", "Your order", "One optional extra before you pay."],
    3: [
      "Step 3 of 4 · One more offer",
      <>
        Add the yearly membership for <span className="whitespace-nowrap">+{inr(V2_OFFERS.membership.amount * 100)}</span>
      </>,
      "One optional offer before you pay.",
    ],
    4: ["Step 4 of 4 · Payment", "Review and pay", "Prices are before GST; 18% GST is added below."],
  };
  const [headEyebrow, headTitle, headText] = heads[step];

  return (
    <main className="overflow-hidden">
      {/* Announcement bar */}
      <div className="announce">
        <span>{price} + GST</span>
        <span aria-hidden>•</span>
        <span>Instant access</span>
        <span aria-hidden>•</span>
        <span>On WhatsApp &amp; email</span>
      </div>

      <header className="container flex h-16 items-center justify-between border-b border-black/10 sm:h-20">
        <a href="#top" className="text-lg font-black tracking-[-.04em] sm:text-xl">
          SONNET<span className="text-[#d71914]">SKILLS</span>
        </a>
        <button onClick={() => checkout("header_cta_click")} className="btn-red header-cta">
          GET THE 500 AGENTS — {price}
        </button>
      </header>

      {/* Hero: copy on the left, the five volumes fanned out on the right */}
      <section id="top" className="hero hero-volumes">
        <CoverFan className="hero-covers" preload sizes="(max-width: 1023px) 70vw, 420px" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill">
              <BookOpen className="h-3.5 w-3.5" /> 5 digital volumes · Instant access
            </span>
            <h1 className="display display-long mt-6">
              <span className="text-[#d71914]">Build your first AI&nbsp;agent.</span>
              <br />
              500 AI Agents for Real Businesses
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-black/70 sm:text-lg">
              500 ready-to-build AI agents for real businesses, each showing what it does, the time and money it saves,
              what it costs to build, and when your business is ready for it.
            </p>
            <p className="mt-4 text-sm font-bold">
              500 agents <b className="text-[#d71914]">•</b> 5 volumes <b className="text-[#d71914]">•</b> {CHAPTERS} chapters
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-[-.06em] sm:text-6xl">{price}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-black/50">+ GST · One-time</span>
              </div>
              <Cta source="hero_cta_click" onClick={checkout}>GET THE 500 AI AGENTS</Cta>
            </div>
            <p className="mt-3 text-xs text-black/55 sm:text-sm">
              <LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> Secure payment • Instant access • One-time
            </p>
            <div className="social-proof">
              <div className="avatar-stack">
                {MARKETS.IN.proofPhotos.map((src) => (
                  <Image key={src} src={src} width={42} height={42} alt="SonnetSkills customer" className="avatar" />
                ))}
              </div>
              <div>
                <p>
                  <strong>Business owners &amp; professionals</strong> already learn with SonnetSkills
                </p>
                <div className="rating">
                  <strong>Free AI Audit call included</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product showcase + info strip */}
      <section className="bg-[#f3f3f0] py-20">
        <div className="container">
          <Eyebrow>Inside the 500 AI Agents</Eyebrow>
          <h2 className="section-title mx-auto max-w-4xl text-center">
            500 ready-to-build AI agents. Across your entire business.
          </h2>
          <div className="mt-12">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {VOLUMES.map((v, i) => (
                <div key={v.no} className={`card p-4 sm:p-5 ${i === 4 ? "col-span-2 lg:col-span-1" : ""}`}>
                  <div className="text-3xl font-black text-[#d71914]">100</div>
                  <div className="mt-2 text-[11px] font-black leading-4 sm:text-xs">
                    VOLUME {v.no} · {v.name.toUpperCase()}
                    <span className="block font-bold text-black/55">{v.title.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-10 text-sm font-black uppercase tracking-widest">Every agent shows you</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {EVERY_AGENT.map((x) => (
                <p className="flex gap-2 text-xs font-bold leading-4 sm:text-sm" key={x}>
                  <Check className="h-4 w-4 shrink-0 text-[#d71914]" />
                  {x}
                </p>
              ))}
            </div>
          </div>
          <div className="info-strip mt-12">
            <div><span>📘</span><strong>5 digital volumes + PDF downloads</strong></div>
            <div><span>⚡</span><strong>Instant access after payment</strong></div>
            <div><span>🔒</span><strong>{price} + 18% GST, one-time</strong></div>
          </div>
        </div>
      </section>

      {/* The reality */}
      <section className="bg-[#0b0b0b] py-24 text-white">
        <div className="container max-w-4xl text-center">
          <Eyebrow>The gap</Eyebrow>
          <h2 className="section-title">Most businesses are using AI at the surface level.</h2>
          <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
            <div className="rounded-2xl border border-white/15 p-6">
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/50">What most people do</p>
              <div className="space-y-2 text-xl text-white/45 line-through">
                <p>“Write me a caption.”</p>
                <p>“Draft this email.”</p>
                <p>“Give me 10 ideas.”</p>
                <p>“Summarise this.”</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#f24a43]/60 bg-[#f24a43]/10 p-6">
              <p className="mb-4 text-xs font-black uppercase tracking-widest text-[#f24a43]">What AI agents can actually do</p>
              <div className="space-y-2 text-xl font-bold">
                {["Capture and qualify leads.", "Answer customers.", "Track stock and dispatch.", "Chase invoices.", "Process documents.", "Brief the owner."].map((x) => (
                  <p key={x}>{x}</p>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-12 text-2xl font-bold">
            The opportunity isn’t more AI tools.{" "}
            <span className="text-[#f24a43]">It’s knowing which agent to build first.</span>
          </p>
        </div>
      </section>

      {/* The method */}
      <section className="container py-24 text-center">
        <Eyebrow>A better starting point</Eyebrow>
        <h2 className="section-title">You do NOT need 500 AI agents.</h2>
        <p className="mt-5 text-2xl font-bold sm:text-3xl">You need the right first one.</p>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-black/65">
          Every agent shows the time and money it saves, what it costs to build, and when your business is ready for it —
          so you can pick the one worth building now.
        </p>
        <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-2">
          {[
            ["03", "The AI agent", "What you build — last, not first.", "w-[62%]"],
            ["02", "The workflow", "Where it fits and what it needs from you.", "w-[81%]"],
            ["01", "The business problem", "Why it matters to revenue, cost, speed or risk.", "w-full"],
          ].map(([n, t, d, w], i) => (
            <div key={n} className={`${w} rounded-xl px-5 py-4 text-left ${i === 2 ? "bg-[#d71914] text-white" : "border border-black/15 bg-white"}`}>
              <span className="text-xs font-black opacity-60">{n}</span>
              <p className="font-black">{t}</p>
              <p className={`text-sm ${i === 2 ? "text-white/80" : "text-black/60"}`}>{d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xl border-l-4 border-[#d71914] pl-5 text-left text-2xl font-black">
          Find the right problem first.
          <br />
          Then build the right AI agent.
        </p>
      </section>

      {/* See inside: two real pages */}
      <section className="bg-[#f3f3f0] py-24">
        <div className="container">
          <Eyebrow>See inside</Eyebrow>
          <h2 className="section-title text-center">Two real pages. Every agent gets them.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-black/65">
            Agent GRW-001, the Website Lead Capture Agent, exactly as it appears in Volume&nbsp;01.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {SAMPLES.map(([src, caption, alt]) => (
              <figure key={src} className="card sample-page overflow-hidden">
                <a href={src} target="_blank" rel="noopener" className="relative block" aria-label={`${caption} — open full size`}>
                  <Image src={src} alt={alt} width={1684} height={1190} sizes="(max-width: 768px) 100vw, 580px" className="block h-auto w-full" />
                  <span className="zoom-badge">
                    <ZoomIn className="h-3.5 w-3.5" /> Tap to zoom
                  </span>
                </a>
                <figcaption className="border-t border-black/10 px-5 py-4 text-sm font-black">{caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Cta source="midpage_cta_click" onClick={checkout}>SEE ALL 500 AI AGENTS — {price}</Cta>
          </div>
        </div>
      </section>

      {/* What it covers: five volumes and their chapters */}
      <section className="container py-24">
        <Eyebrow>What it covers</Eyebrow>
        <h2 className="section-title text-center">5 volumes × 100 agents.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-black/65">
          Every part of a business, from winning customers to running the books, plus playbooks for ten industries.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {VOLUMES.map((v, i) => (
            <article key={v.no} className={`card p-6 ${i === 4 ? "md:col-span-2" : ""}`}>
              <div className="mb-3 text-xs font-black text-[#d71914]">VOLUME {v.no} · 100 AGENTS</div>
              <h3 className="text-xl font-black">
                {v.name} <span className="text-black/45">— {v.title}</span>
              </h3>
              <ul className={`mt-3 grid gap-x-6 gap-y-1.5 text-black/65 ${i === 4 ? "sm:grid-cols-2" : ""}`}>
                {v.chapters.map((c) => (
                  <li key={c} className="flex gap-2 leading-relaxed">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#d71914]" />
                    {c}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section className="bg-[#0b0b0b] py-24 text-white">
        <div className="container">
          <Eyebrow>Already happening</Eyebrow>
          <h2 className="section-title mx-auto max-w-4xl text-center">Big companies already run agents like these.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROOF.map((p) => (
              <figure key={p.company} className="rounded-2xl border border-white/15 p-7">
                <figcaption className="text-xl font-black">{p.company}</figcaption>
                <blockquote className="mt-2 leading-relaxed text-white/65">{p.text}</blockquote>
                <p className="mt-3 text-xs text-white/45">Source: {p.source}</p>
              </figure>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-white/55">
            Public reports of similar AI use. They do not use these specific agents.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="container py-24">
        <Eyebrow>How this compares</Eyebrow>
        <h2 className="section-title text-center">Not another list of AI tools.</h2>
        <div className="mt-12 overflow-x-auto">
          <table className="compare">
            <thead>
              <tr>
                <th />
                <th>Most AI ebooks</th>
                <th className="ours">500 AI Agents for Real Businesses</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(([row, them, us]) => (
                <tr key={row}>
                  <td className="font-bold">{row}</td>
                  <td className="text-black/55">
                    <X className="mr-1 inline h-4 w-4" />
                    {them}
                  </td>
                  <td className="ours font-bold">
                    <Check className="mr-1 inline h-4 w-4 text-[#d71914]" />
                    {us}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* What happens after you pay */}
      <section className="bg-[#0b0b0b] py-24 text-white">
        <div className="container">
          <Eyebrow>What happens after you pay</Eyebrow>
          <h2 className="section-title text-center">You start reading in a minute.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {AFTER_PAY.map(([t, d], i) => (
              <div key={t} className="rounded-2xl border border-white/15 p-7">
                <div className="text-4xl font-black text-[#f24a43]">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-4 text-xl font-black">{t}</h3>
                <p className="mt-2 leading-relaxed text-white/65">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="container py-24">
        <Eyebrow>Who it’s for</Eyebrow>
        <h2 className="section-title text-center">Is this for you?</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {audience.map(([Icon, t, d]) => (
            <div key={t} className="card p-6">
              <Icon className="h-7 w-7 text-[#d71914]" />
              <h3 className="mt-4 text-xl font-black">{t}</h3>
              <p className="mt-2 leading-relaxed text-black/65">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Cta source="audience_cta_click" onClick={checkout}>THIS IS FOR ME — GET IT FOR {price}</Cta>
        </div>
        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-black/15 p-7">
          <h3 className="text-2xl font-black">This is NOT for you if…</h3>
          <ul className="mt-5 space-y-3">
            {IN_NOT_FOR.map((x) => (
              <li key={x} className="flex gap-3 text-black/70">
                <X className="mt-0.5 h-5 w-5 shrink-0 text-[#d71914]" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Value stack */}
      <section className="bg-[#f3f3f0] py-24">
        <div className="container max-w-3xl">
          <Eyebrow>Value stack</Eyebrow>
          <h2 className="section-title text-center">Everything you get for {price} + 18% GST</h2>
          <div className="card mt-12 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-widest text-black/50">The 500 AI Agents</p>
            <ul className="mt-4 space-y-4">
              {[
                ["500 ready-to-build AI agents", `Across 5 volumes and ${CHAPTERS} chapters, from winning customers to running the books.`],
                ["Two pages for every agent", "What it does and how it works, what it saves, what it costs, and when you’re ready for it."],
                ["Playbooks for ten industries", "Volume 05 covers clinics, retail, manufacturing, real estate, hospitality and more."],
                ["Instant access, with PDF downloads", "Read online the moment you pay; your order also arrives on WhatsApp and email."],
                ["A free AI Audit call", "We look at your business with you and point at the agent worth building first."],
                ["A NEXPMX 15-day trial", "Start it whenever you’re ready, not the day you buy."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#d71914]" />
                  <span>
                    <strong>{t}</strong> <span className="text-black/60">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs font-black uppercase tracking-widest text-black/50">Optional add-ons at checkout</p>
            <ul className="mt-4 space-y-4">
              {(["bump", "membership"] as const).map((k) => (
                <li key={k} className="flex gap-3">
                  <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#d71914]" />
                  <span>
                    <strong>
                      {IN_KIT[k].name} — {inr(V2_OFFERS[k].amount * 100)}
                    </strong>{" "}
                    <span className="text-black/60">{k === "bump" ? IN_KIT.bump.summary : `${IN_KIT.membership.summary} ${IN_KIT.membership.bonus}`}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-black/10 pt-8 text-center">
              <div className="text-5xl font-black tracking-[-.06em]">{price}</div>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-black/50">+ 18% GST · One-time payment</p>
              <div className="mt-5">
                <Cta source="value_stack_cta_click" onClick={checkout}>GET THE 500 AI AGENTS — {price}</Cta>
              </div>
            </div>
          </div>
        </div>

        <div className="container mt-20 max-w-5xl">
          <Eyebrow>Complete your kit</Eyebrow>
          <h2 className="section-title text-center">Go further, in the same checkout.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-black/65">
            Two optional extras offered at checkout, each + 18% GST. The {price} volumes are complete on their own.
          </p>
          <div className="mt-12 space-y-6">
            {(["bump", "membership"] as const).map((k) => {
              const a = IN_KIT[k];
              return (
                <article key={k} className="addon-showcase card overflow-hidden">
                  <TiltFrame className="addon-showcase-media" max={4}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.image} alt={a.imageAlt} loading="lazy" decoding="async" className="block w-full" />
                  </TiltFrame>
                  <div className="p-6 sm:p-8">
                    <p className="eyebrow">{a.label}</p>
                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-2xl font-black leading-tight sm:text-3xl">{a.name}</h3>
                      <p className="text-3xl font-black text-[#d71914]">
                        {inr(V2_OFFERS[k].amount * 100)}
                        <span className="ml-1 align-middle text-xs font-bold uppercase tracking-wider text-black/45">+ 18% GST</span>
                      </p>
                    </div>
                    <p className="mt-3 text-black/65">{a.summary}</p>
                    <ul className="mt-5 space-y-2.5">
                      {a.points.map((pt) => (
                        <li key={pt} className="flex gap-2.5 text-sm leading-snug sm:text-base">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d71914]" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    {"bonus" in a && (
                      <p className="mt-5 flex items-start gap-2 text-sm font-bold text-[#d71914]">
                        <span aria-hidden="true">🎁</span>
                        {a.bonus}
                      </p>
                    )}
                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-black/45">{a.note}</p>
                    <button
                      onClick={() => checkout(`addon_showcase_${k}_click`, k)}
                      className="btn-red mt-6 inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                    >
                      GET THE 500 AGENTS + ADD THIS — {inr((V2_PRODUCT.amount + V2_OFFERS[k].amount) * 100)} + 18% GST{" "}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credibility */}
      <section className="container py-24 text-center">
        <Eyebrow>Built for real businesses</Eyebrow>
        <div className="text-[clamp(6rem,16vw,11rem)] font-black leading-none tracking-[-.09em] text-[#d71914]">500</div>
        <p className="font-black tracking-widest">AGENTS · 5 VOLUMES · {CHAPTERS} CHAPTERS</p>
        <h2 className="section-title mt-10">Built for real businesses, not AI hype.</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-black/65">
          Every agent starts from a business problem and ends with the numbers: the time and money it saves, what it costs
          to build and run, and when your business is ready for it — with public examples of companies already doing
          something similar.
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-[#f3f3f0] py-24">
        <div className="container max-w-3xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="section-title text-center">Questions? Answers.</h2>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map(([q, a], i) => (
              <AccordionItem value={String(i)} key={q}>
                <AccordionTrigger className="py-5 text-left text-lg font-black">{q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-base leading-relaxed text-black/65">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta bg-[#0b0b0b] py-20 text-white">
        <div className="container grid items-center gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="mb-5 text-xs font-black uppercase tracking-[.16em] text-[#f24a43]">Start with the right agent</p>
            <h2 className="final-title">
              You don’t need another AI tool.
              <br />
              <span className="text-[#f24a43]">You need to know what to build.</span>
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <strong className="text-5xl sm:text-6xl">{price}</strong>
              <Cta source="final_cta_click" onClick={checkout}>GET THE 500 AI AGENTS</Cta>
            </div>
            <p className="mt-4 text-sm text-white/55">{price} + 18% GST, one-time • Instant access • On WhatsApp &amp; email</p>
          </div>
          <CoverFan className="final-covers" sizes="260px" />
        </div>
      </section>

      <Footer />

      {sticky && !open && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-black/15 bg-white p-3 shadow-2xl sm:hidden">
          <div className="pl-1 leading-tight">
            <strong className="text-2xl">{price}</strong>
            <p className="text-[11px] text-black/55">+ GST · Instant access</p>
          </div>
          <button className="btn-red min-h-12 shrink-0 px-5" onClick={() => checkout("mobile_sticky_cta_click")}>
            GET THE 500 AGENTS
          </button>
        </div>
      )}

      {/* Checkout: details → bump → membership → pay */}
      <Dialog open={open} onOpenChange={(o) => { if (!paying) setOpen(o); }}>
        <DialogContent className="checkout-dialog max-h-[95vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <div className="glass-head border-b border-white/50 p-6">
            <DialogHeader>
              <p className="eyebrow">{headEyebrow}</p>
              <DialogTitle className={`${step === 3 ? "text-2xl sm:text-3xl" : "text-3xl"} font-black tracking-tight`}>{headTitle}</DialogTitle>
              <DialogDescription>{headText}</DialogDescription>
            </DialogHeader>
            {step <= 2 && (
              <div className="glass-tile mt-5 flex items-center gap-3 p-3 text-left sm:gap-4">
                <CoverFan className="checkout-covers" sizes="120px" />
                <div className="grow">
                  <p className="text-sm font-black leading-tight sm:text-base">{V2_PRODUCT.name}</p>
                  <p className="mt-1 text-xs text-black/55">5 volumes · Instant access · + 18% GST</p>
                </div>
                <p className="text-2xl font-black text-[#d71914] sm:text-3xl">{price}</p>
              </div>
            )}
          </div>

          {step === 1 && (
            <form
              onSubmit={submitDetails}
              noValidate
              onFocus={() => {
                if (!started) {
                  setStarted(true);
                  track("checkout_form_started");
                }
              }}
              className="space-y-4 p-6"
            >
              <Field label="Full Name" error={errors.name}>
                <Input name="name" autoComplete="name" value={fields.name} onChange={setField("name")} aria-invalid={!!errors.name} className="glass-input mt-2 h-12" />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <Input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={fields.email}
                  onChange={setField("email")}
                  aria-invalid={!!errors.email}
                  className="glass-input mt-2 h-12"
                />
              </Field>
              <Field label="WhatsApp Number" error={errors.phone}>
                <Input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={fields.phone}
                  onChange={setField("phone")}
                  aria-invalid={!!errors.phone}
                  className="glass-input mt-2 h-12"
                />
              </Field>
              <p className="text-sm text-black/60">We’ll send your order and updates on WhatsApp and email.</p>
              <button disabled={submitting} className="btn-red inline-flex w-full items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? "ONE MOMENT…" : <>CONTINUE <ArrowRight className="h-4 w-4" /></>}
              </button>
              <p className="text-center text-xs text-black/50">
                <LockKeyhole className="mr-1 inline h-3 w-3" /> Secure checkout powered by Cashfree.
              </p>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                track("checkout_step_bump_done", { bump: has("bump") });
                setStep(3);
              }}
              className="space-y-4 p-6"
            >
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-black/50">Optional add-on</p>
                <div ref={bumpRowRef} className={`addon ${has("bump") ? "addon-on" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ADDONS.bundle.checkoutImage} alt={ADDONS.bundle.imageAlt} loading="lazy" className="addon-banner" />
                  <label className="flex cursor-pointer gap-3">
                    <Checkbox checked={has("bump")} onCheckedChange={(v) => toggleBump(v === true)} className="mt-1 size-5" />
                    <span className="grow">
                      <span className="block text-[11px] font-black uppercase tracking-widest text-[#d71914]">{IN_KIT.bump.label}</span>
                      <span className="block font-black leading-snug">
                        Add the ebook bundle + AI Foundations mini-course, +{inr(V2_OFFERS.bump.amount * 100)}
                      </span>
                      <span className="mt-1 block text-sm text-black/60">The current bundle, unchanged, plus the mini-course free.</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setExpanded((x) => !x)}
                    className="mt-2 ml-8 inline-flex items-center gap-1 text-xs font-bold text-[#d71914]"
                    aria-expanded={expanded}
                  >
                    What’s included <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && (
                    <div className="addon-details mt-3 ml-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ADDONS.bundle.detailsImage} alt={ADDONS.bundle.detailsAlt} className="mb-3 w-full rounded-xl" />
                      <ul className="space-y-1.5 text-sm text-black/70">
                        {IN_KIT.bump.points.map((pt) => (
                          <li key={pt} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d71914]" />
                            {pt}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-black/45">{IN_KIT.bump.note}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs italic text-black/50">
                  Optional. The {price} volumes are complete on their own. All prices are before GST; 18% is added at payment.
                </p>
              </div>
              <button className="btn-red inline-flex w-full items-center justify-center gap-2">
                CONTINUE <ArrowRight className="h-4 w-4" />
              </button>
              <BackLink onClick={() => setStep(1)} />
            </form>
          )}

          {step === 3 && (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 p-6">
              <div className={`addon ${has("membership") ? "addon-on" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ADDONS.newsletter.checkoutImage} alt={ADDONS.newsletter.imageAlt} loading="lazy" className="addon-banner" />
                <span className="block text-[11px] font-black uppercase tracking-widest text-[#d71914]">{IN_KIT.membership.label}</span>
                <span className="block text-xl font-black leading-snug">{V2_OFFERS.membership.name}</span>
                <ul className="mt-3 space-y-1.5 text-sm text-black/70">
                  {MEMBERSHIP_POINTS.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d71914]" />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 flex items-start gap-2 text-xs font-bold leading-relaxed text-[#d71914]">
                  <span aria-hidden="true">🎁</span>
                  <span>
                    <span className="uppercase tracking-widest">Bonus</span>
                    <span className="block font-semibold text-black/70">Take all three and get a 25-minute 1:1 call.</span>
                  </span>
                </p>
              </div>
              <div className="space-y-2.5">
                <button type="button" onClick={() => membership("yes")} className="btn-red w-full">
                  Yes, add the membership
                </button>
                {!has("bump") && (
                  <button type="button" onClick={() => membership("both")} className="btn-outline-red w-full">
                    Add both and get the 1:1 (+{both})
                  </button>
                )}
                <button type="button" onClick={() => membership("no")} className="w-full py-2 text-sm font-bold text-black/55 underline underline-offset-4">
                  No thanks
                </button>
              </div>
              <BackLink onClick={() => setStep(2)} />
            </form>
          )}

          {step === 4 && (
            <form onSubmit={pay} noValidate className="space-y-4 p-6">
              <div className="glass-tile p-4 text-sm">
                <Line label={V2_PRODUCT.name} value={inr(V2_PRODUCT.amount * 100)} />
                {cart.keys.map((k) => (
                  <Line key={k} label={V2_OFFERS[k].short} value={inr(V2_OFFERS[k].amount * 100)} muted />
                ))}
                <div className="mt-3 border-t border-black/10 pt-3">
                  <Line label="Subtotal" value={inr2(cart.subtotalPaise)} muted />
                  <Line label="GST (18%)" value={inr2(cart.gstPaise)} muted />
                </div>
                <div className="mt-2 flex justify-between border-t border-black/10 pt-3 text-base font-black">
                  <span>Total payable</span>
                  <span data-testid="in-total">{inr2(cart.totalPaise)}</span>
                </div>
              </div>
              {has("bump") && has("membership") && (
                <p className="flex items-start gap-2 text-xs font-bold text-[#d71914]">
                  <span aria-hidden="true">🎁</span> Your free 25-minute 1:1 call is included.
                </p>
              )}

              <p className="text-xs text-black/55">
                Paying as <strong>{fields.name || "—"}</strong> · {fields.email || "—"} · {fields.phone}{" "}
                <button type="button" onClick={() => setStep(1)} className="font-bold text-[#d71914] underline">
                  Edit
                </button>
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => setGstOpen((o) => !o)}
                  aria-expanded={gstOpen}
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#d71914]"
                >
                  Need a GST invoice? Add your GSTIN
                  <ChevronDown className={`h-4 w-4 transition ${gstOpen ? "rotate-180" : ""}`} />
                </button>
                {gstOpen && (
                  <div className="mt-3 space-y-3">
                    <Field label="GSTIN" optional error={errors.gstin}>
                      <Input
                        name="gstin"
                        value={gstin}
                        onChange={(e) => {
                          setGstin(e.target.value.toUpperCase());
                          setErrors((x) => ({ ...x, gstin: undefined }));
                        }}
                        maxLength={15}
                        autoCapitalize="characters"
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        aria-invalid={!!errors.gstin}
                        className="glass-input mt-2 h-12 placeholder:text-black/35"
                      />
                    </Field>
                    <Field label="Business Name" optional>
                      <Input
                        name="billingName"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        autoComplete="organization"
                        className="glass-input mt-2 h-12"
                      />
                    </Field>
                  </div>
                )}
              </div>

              {payError && (
                <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-red-700">
                  {payError}
                </p>
              )}
              <button disabled={paying} className="btn-red w-full disabled:opacity-60">
                {paying ? "OPENING SECURE PAYMENT…" : `PAY ${inr2(cart.totalPaise)} SECURELY`}
              </button>
              <p className="text-center text-xs text-black/50">
                <LockKeyhole className="mr-1 inline h-3 w-3" /> Secure checkout powered by Cashfree. By paying you agree to the{" "}
                <a href={`${PANEL_URL}/terms`} target="_blank" rel="noopener" className="underline">Terms</a>,{" "}
                <a href={`${PANEL_URL}/privacy`} target="_blank" rel="noopener" className="underline">Privacy</a>,{" "}
                <a href={`${PANEL_URL}/refund-policy`} target="_blank" rel="noopener" className="underline">Refund</a> and{" "}
                <a href={`${PANEL_URL}/delivery-policy`} target="_blank" rel="noopener" className="underline">Digital Delivery</a> policies.
              </p>
              <BackLink onClick={() => setStep(3)} disabled={paying} />
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export function Footer() {
  return (
    <footer className="rule bg-white py-12">
      <div className="container grid gap-8 md:grid-cols-2">
        <div>
          <div className="text-xl font-black">
            SONNET<span className="text-[#d71914]">SKILLS</span>
          </div>
          <p className="mt-3 text-sm text-black/60">SonnetSkills is a brand of Taucap Private Limited.</p>
          <a className="mt-2 block text-sm underline" href="mailto:support@sonnetskills.com">
            support@sonnetskills.com
          </a>
        </div>
        <nav className="flex flex-wrap content-start gap-x-6 gap-y-3 text-sm font-bold md:justify-end">
          {[
            ["About", "/about"],
            ["Contact", "/contact"],
            ["Terms & Conditions", "/terms"],
            ["Privacy Policy", "/privacy"],
            ["Refund & Cancellation", "/refund-policy"],
            ["Digital Delivery", "/delivery-policy"],
          ].map(([l, h]) => (
            // Legal and company pages live on the main site.
            <a key={h} href={`${PANEL_URL}${h}`}>
              {l}
            </a>
          ))}
        </nav>
      </div>
      <div className="container mt-10 border-t border-black/15 pt-5 text-xs text-black/50">
        © 2026 Taucap Private Limited. All rights reserved.
      </div>
    </footer>
  );
}
