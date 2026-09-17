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
} from "lucide-react";
import { Book3D } from "@/components/book-3d";
import { TiltFrame } from "@/components/tilt-frame";
import { ADDONS, PANEL_URL, PRODUCT, orderTotal, orderTotalWithGst, type AddonKey } from "@/lib/offer";
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
const comparison = [
  ["Starting point", "Tool lists", "Business problems first"],
  ["What’s inside", "Prompt collections", "50 practical use cases"],
  ["Approach", "Generic AI hacks", "AI + code + human judgment"],
  ["Context", "Quickly outdated", "Real implementation context"],
  ["Evidence", "Claims presented as equal", "250+ research points, weighted by source quality"],
  ["Price", "Varies", "₹9, one-time"],
] as const;
const steps = [
  ["Get instant access", "Pay ₹9 once. Your digital playbook is available right after payment is confirmed."],
  ["Shortlist three", "Scan all 50 ideas and pick the 3 that match the problems your business has today."],
  ["Test one workflow", "Choose the one with the clearest revenue, cost, speed or risk impact — and start there."],
] as const;
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
const faqs = [
  ["Is this a physical book?", "No. This is a digital playbook. Access is delivered digitally after successful payment."],
  ["Who is this for?", "Founders, business owners, operators, consultants, agencies and professionals who want practical ideas for applying AI inside real business workflows."],
  ["Do I need technical knowledge?", "No. The playbook helps you understand opportunities first. Some implementations may later require no-code tools, software development or technical support."],
  ["Does this teach me how to build all 50 agents?", "No. The goal is not to build all 50. It helps you identify which workflows are worth exploring first."],
  ["How will I receive it?", "After successful payment, digital access instructions will be shown and/or sent to the email or mobile number provided at checkout."],
  ["Is ₹9 a subscription?", "No. ₹9 is a one-time payment for this digital product."],
  ["What are the add-ons at checkout?", `Two optional extras: a ${ADDONS.bundle.name} for ₹${ADDONS.bundle.amount}, and the ${ADDONS.newsletter.name} for ₹${ADDONS.newsletter.amount}. Both are one-time payments. The ₹9 playbook is complete on its own.`],
] as const;
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

function track(name: string, detail: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent("sonnetskills:analytics", { detail: { name, ...detail } }));
  (window as typeof window & { dataLayer?: unknown[] }).dataLayer?.push({ event: name, ...detail });
  const meta = META_EVENT[name];
  if (meta) {
    const value = typeof detail.value === "number" ? detail.value : undefined;
    metaTrack(meta, {
      content_type: "product",
      content_ids: [PRODUCT.slug, ...(Array.isArray(detail.addons) ? (detail.addons as AddonKey[]).map((k) => ADDONS[k].slug) : [])],
      ...(value === undefined ? {} : { value, currency: "INR" }),
    });
  }
}
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

export default function Home() {
  const [open, setOpen] = useState(false),
    [sticky, setSticky] = useState(false),
    [started, setStarted] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [addons, setAddons] = useState<AddonKey[]>([]),
    [expanded, setExpanded] = useState<AddonKey | null>(null);
  const total = orderTotal(addons),
    payable = orderTotalWithGst(addons);
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
        value: PRODUCT.amount,
        currency: "INR",
      });
    }
    const s = () => setSticky(scrollY > 620);
    addEventListener("scroll", s);
    return () => removeEventListener("scroll", s);
  }, []);
  const checkout = (source: string, preselect?: AddonKey) => {
    track(source);
    track("checkout_popup_open", { source, preselect });
    if (preselect) setAddons((cur) => (cur.includes(preselect) ? cur : [...cur, preselect]));
    setOpen(true);
  };
  const toggleAddon = (k: AddonKey) => {
    track("checkout_addon_toggle", { addon: k, selected: !addons.includes(k) });
    setAddons((cur) => (cur.includes(k) ? cur.filter((a) => a !== k) : [...cur, k]));
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
            marketingConsent: f.get("marketing") === "on",
            attribution: {
              utm_source: p.get("utm_source"),
              utm_medium: p.get("utm_medium"),
              utm_campaign: p.get("utm_campaign"),
              utm_content: p.get("utm_content"),
              utm_term: p.get("utm_term"),
              fbclid: p.get("fbclid"),
              gclid: p.get("gclid"),
              referrer: document.referrer,
              landing: location.origin + location.pathname,
            },
          }),
        }),
        data = (await res.json().catch(() => ({}))) as {
          error?: string;
          amount?: number;
          paymentSessionId?: string;
          mode?: "sandbox" | "production";
        };
      if (!res.ok || !data.paymentSessionId)
        throw new Error(data.error || "Something went wrong while creating your payment session. Please try again.");
      // Only open payment for exactly the total shown in this popup.
      if (data.amount !== payable)
        throw new Error("The price has changed. Please refresh the page and try again.");
      // The order is saved; hand over to Cashfree's hosted checkout for it.
      track("checkout_form_submitted", { value: payable, addons });
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
        <span>₹9 one-time</span>
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
          GET THE PLAYBOOK — ₹9
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
                <span className="text-5xl font-black tracking-[-.06em] sm:text-6xl">₹9</span>
                <span className="text-xs font-bold uppercase tracking-widest text-black/50">One-time</span>
              </div>
              <Cta source="hero_cta_click" onClick={checkout}>GET THE PLAYBOOK FOR ₹9</Cta>
            </div>
            <p className="mt-3 text-xs text-black/55 sm:text-sm">
              <LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> Secure payment • Instant access • No subscription
            </p>
            <div className="social-proof">
              <div className="avatar-stack">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Image key={n} src={`/customer-${n}.png`} width={42} height={42} alt="SonnetSkills customer" className="avatar" />
                ))}
              </div>
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
            <div><span>🔒</span><strong>₹9 one-time · No subscription</strong></div>
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
            <Cta source="midpage_cta_click" onClick={checkout}>SEE ALL 50 AI AGENTS — ₹9</Cta>
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
          <Cta source="audience_cta_click" onClick={checkout}>THIS IS FOR ME — GET IT FOR ₹9</Cta>
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
          <h2 className="section-title text-center">Everything you get for ₹9</h2>
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
                      {ADDONS[k].name} — ₹{ADDONS[k].amount}
                    </strong>{" "}
                    <span className="text-black/60">{ADDONS[k].summary}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-black/10 pt-8 text-center">
              <div className="text-5xl font-black tracking-[-.06em]">₹9</div>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-black/50">One-time payment</p>
              <div className="mt-5">
                <Cta source="value_stack_cta_click" onClick={checkout}>GET THE PLAYBOOK — ₹9</Cta>
              </div>
            </div>
          </div>
        </div>

        <div className="container mt-20 max-w-5xl">
          <Eyebrow>Complete your kit</Eyebrow>
          <h2 className="section-title text-center">Go further for less than a coffee.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-black/65">
            Two optional add-ons you can tick at checkout. The ₹9 playbook is complete on its own.
          </p>
          <div className="mt-12 space-y-6">
            {(Object.keys(ADDONS) as AddonKey[]).map((k, i) => {
              const a = ADDONS[k];
              return (
                <article key={k} className={`addon-showcase card overflow-hidden ${i % 2 ? "is-side" : ""}`}>
                  <TiltFrame className="addon-showcase-media" max={4}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.image} alt={a.imageAlt} loading="lazy" decoding="async" className="block h-full w-full object-cover" />
                  </TiltFrame>
                  <div className="p-6 sm:p-8">
                    <p className="eyebrow">{a.label}</p>
                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-2xl font-black leading-tight sm:text-3xl">{a.name}</h3>
                      <p className="text-3xl font-black text-[#d71914]">₹{a.amount}</p>
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
                      GET THE PLAYBOOK + ADD THIS — ₹{PRODUCT.amount + a.amount} <ArrowRight className="h-4 w-4" />
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
              <strong className="text-5xl sm:text-6xl">₹9</strong>
              <Cta source="final_cta_click" onClick={checkout}>GET 50 AI AGENTS FOR ₹9</Cta>
            </div>
            <p className="mt-4 text-sm text-white/55">One-time payment • Instant digital access • No subscription</p>
          </div>
          <Book3D className="final-book-3d cursor-grab" sizes="320px" />
        </div>
      </section>

      <Footer />

      {sticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-black/15 bg-white p-3 shadow-2xl sm:hidden">
          <div className="pl-1 leading-tight">
            <strong className="text-2xl">₹9</strong>
            <p className="text-[11px] text-black/55">Instant digital access</p>
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
                <p className="mt-1 text-xs text-black/55">Digital playbook · Instant access · One-time</p>
              </div>
              <p className="text-3xl font-black text-[#d71914]">₹{PRODUCT.amount}</p>
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
            <label className="block text-sm font-bold">
              WhatsApp / Mobile Number
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

            <div className="space-y-3 pt-2">
              <p className="text-xs font-black uppercase tracking-widest text-black/50">Optional add-ons</p>
              {(Object.keys(ADDONS) as AddonKey[]).map((k) => {
                const a = ADDONS[k],
                  on = addons.includes(k);
                return (
                  <div key={k} className={`addon ${on ? "addon-on" : ""}`}>
                    <label className="flex cursor-pointer gap-3">
                      <Checkbox checked={on} onCheckedChange={() => toggleAddon(k)} className="mt-1 size-5" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.checkoutImage} alt="" loading="lazy" className="addon-thumb" style={{ objectPosition: a.thumbFocus }} />
                      <span className="grow">
                        <span className="block text-[11px] font-black uppercase tracking-widest text-[#d71914]">
                          {a.label}
                        </span>
                        <span className="block font-black leading-snug">{a.name}</span>
                        <span className="mt-1 line-clamp-2 block text-sm text-black/60">{a.summary}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xl font-black">₹{a.amount}</span>
                        <span className="text-[11px] text-black/50">add-on</span>
                      </span>
                    </label>
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.checkoutImage} alt={a.imageAlt} className="mb-3 w-full rounded-xl object-cover" />
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
                Add-ons are optional. The ₹9 playbook is complete on its own.
              </p>
            </div>

            <div className="glass-tile p-4 text-sm">
              <div className="flex justify-between">
                <span>{PRODUCT.name}</span>
                <span>₹{PRODUCT.amount}</span>
              </div>
              {addons.map((k) => (
                <div key={k} className="mt-1 flex justify-between text-black/70">
                  <span>{ADDONS[k].name}</span>
                  <span>₹{ADDONS[k].amount}</span>
                </div>
              ))}
              <div className="mt-3 flex justify-between border-t border-black/10 pt-3 text-black/70">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className="mt-1 flex justify-between text-black/70">
                <span>GST (18%)</span>
                <span>₹{(payable - total).toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-black/10 pt-3 text-base font-black">
                <span>Total payable</span>
                <span>₹{payable.toFixed(2)}</span>
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
            <label className="flex gap-3 text-sm leading-5 text-black/65">
              <Checkbox name="marketing" className="mt-0.5" />
              I’d like to receive useful AI, automation and SonnetSkills updates via email or WhatsApp.
            </label>
            {error && (
              <p role="alert" className="rounded bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </p>
            )}
            <button disabled={loading} className="btn-red w-full disabled:opacity-60">
              {loading ? "OPENING SECURE PAYMENT…" : `PAY ₹${payable.toFixed(2)} SECURELY`}
            </button>
            <p className="text-center text-xs text-black/50">
              <LockKeyhole className="mr-1 inline h-3 w-3" /> Secure checkout powered by Cashfree.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Footer() {
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
