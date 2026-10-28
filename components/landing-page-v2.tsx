"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Gift,
  LockKeyhole,
  MessageCircle,
  PhoneCall,
  Rocket,
  ZoomIn,
} from "lucide-react";
import { Footer } from "@/components/landing-page";
import { PANEL_URL, V2_OFFERS, V2_PRODUCT, inr, inr2, v2Cart, type V2OfferKey } from "@/lib/offer";
import { metaTrack } from "@/lib/pixel";

/* ------------------------------------------------------------------ content */

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

const AFTER_PAY = [
  [BookOpen, "Instant access in your library", "Read all five volumes online the moment you pay, with PDF downloads too."],
  [MessageCircle, "Delivered on WhatsApp and email", "Your order and your library link arrive on both, so you can't lose them."],
  [PhoneCall, "A free AI Audit call for your business", "We look at your business with you and point at the agent worth building first."],
  [Rocket, "A NEXPMX 15-day trial", "Start it whenever you're ready, not the day you buy."],
] as const;

const MEMBERSHIP_POINTS = [
  "Weekly AI briefings and practical workflows",
  "AI concepts broken down in plain language",
  "Tools worth trying, prompts and templates",
  "AI and Claude skills, updated as they change",
  "Playbooks and live sessions",
];

/* ---------------------------------------------------------------- behaviour */

type Fields = { name: string; email: string; phone: string };
type FieldErrors = Partial<Record<keyof Fields | "gstin" | "billingName", string>>;
type Step = 1 | 2 | 3;

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

/** POST JSON to the panel; never throws a raw TypeError at the page. */
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

/**
 * The v2 India sales page: "Build your first AI agent." — the ₹199 + GST
 * 500 AI Agents ebook, its order form, and a three-step checkout (bump,
 * membership, pay) that ends on Cashfree. The international page keeps the v1
 * component (components/landing-page.tsx) and never renders this one.
 */
export function LandingPageV2() {
  const [fields, setFields] = useState<Fields>({ name: "", email: "", phone: PHONE_PREFIX });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [chosen, setChosen] = useState<V2OfferKey[]>([]);
  const [gstOpen, setGstOpen] = useState(false);
  const [gstin, setGstin] = useState("");
  const [billingName, setBillingName] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [sticky, setSticky] = useState(false);

  const cart = v2Cart(chosen);
  const has = (k: V2OfferKey) => chosen.includes(k);
  const bumpRowRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const addedToCart = useRef(new Set<string>());

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

  const arrived = useRef(false);
  useEffect(() => {
    // React runs mount effects twice in development; an arrival is still one arrival.
    if (!arrived.current) {
      arrived.current = true;
      track("page_view");
      metaTrack("ViewContent", {
        content_type: "product",
        content_ids: [V2_PRODUCT.slug],
        content_name: V2_PRODUCT.name,
        value: V2_PRODUCT.amount,
        currency: "INR",
      });
      resume();
    }
    const s = () => setSticky(scrollY > 520 && !isOrderVisible());
    addEventListener("scroll", s, { passive: true });
    return () => removeEventListener("scroll", s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isOrderVisible() {
    const el = document.getElementById("order");
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  }

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
        openCheckout("cart_resume");
      }
    );
  }

  function openCheckout(source: string) {
    setStep(1);
    setPayError("");
    setOpen(true);
    track("checkout_popup_open", { source });
    metaTrack("InitiateCheckout", { content_type: "product", content_ids: [V2_PRODUCT.slug], value: V2_PRODUCT.amount, currency: "INR" });
  }

  function goToForm(source: string) {
    track(source);
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 450);
  }

  const setField = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFields((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
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
    openCheckout("order_form");
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
    setStep(3);
  }

  async function pay() {
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

  function editDetails() {
    setOpen(false);
    setTimeout(() => goToForm("checkout_edit_details"), 50);
  }

  /* ------------------------------------------------------------------ view */

  const price = `${inr(V2_PRODUCT.amount * 100)} + GST`;

  return (
    <main className="v2 overflow-hidden">
      <div className="announce">
        <span>{price}</span>
        <span aria-hidden>•</span>
        <span>Instant access</span>
        <span aria-hidden>•</span>
        <span>On WhatsApp &amp; email</span>
      </div>

      <header className="container flex h-16 items-center justify-between border-b border-black/10 sm:h-20">
        <a href="#top" className="text-lg font-black tracking-[-.04em] sm:text-xl">
          SONNET<span className="text-[#d71914]">SKILLS</span>
        </a>
        <button onClick={() => goToForm("header_cta_click")} className="btn-red header-cta">
          GET IT — {inr(V2_PRODUCT.amount * 100)}
        </button>
      </header>

      {/* Hero */}
      <section id="top" className="v2-hero">
        <div className="container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <span className="pill">
              <BookOpen className="h-3.5 w-3.5" /> 500 AI Agents · 5 volumes
            </span>
            <h1 className="display mt-5">
              Build your first <span className="text-[#d71914]">AI agent.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-black/70 sm:text-lg">
              500 ready-to-build AI agents for real businesses, each showing what it does, the time and money it saves,
              what it costs to build, and when your business is ready for it.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-[-.06em] sm:text-6xl">{inr(V2_PRODUCT.amount * 100)}</span>
                <span className="text-sm font-black uppercase tracking-widest text-black/55">+ GST</span>
              </div>
              <button onClick={() => goToForm("hero_cta_click")} className="btn-red inline-flex items-center justify-center gap-2">
                GET THE 500 AI AGENTS <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-black/55 sm:text-sm">
              <LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> Secure payment • Instant access • One-time
            </p>
          </div>
          <div className="v2-deck" aria-label="The five volumes of 500 AI Agents">
            {VOLUMES.map((v, i) => (
              <Image
                key={v.no}
                src={`/v2/cover-vol-${i + 1}.webp`}
                alt={`Volume ${v.no} · ${v.name} — ${v.title}`}
                width={600}
                height={424}
                sizes="(max-width: 1024px) 70vw, 380px"
                preload={i === VOLUMES.length - 1}
                className="v2-deck-card"
                style={{ "--i": i } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </section>

      {/* The product, as it is */}
      <section className="bg-[#f3f3f0] py-20">
        <div className="container">
          <p className="eyebrow mb-4 text-center">See inside</p>
          <h2 className="section-title mx-auto max-w-4xl text-center">Two real pages. Every agent gets them.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-black/65">
            Agent GRW-001, the Website Lead Capture Agent, exactly as it appears in Volume 01.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              ["/v2/sample-grw-001-p7.webp", "Page 1: what it does and how it works", "Website Lead Capture Agent, page 1: the problem, what it does, what it needs from you and how it works"],
              ["/v2/sample-grw-001-p8.webp", "Page 2: the numbers and the fit", "Website Lead Capture Agent, page 2: time saved, money saved, cost to build and when it's the right time"],
            ].map(([src, caption, alt]) => (
              <figure key={src} className="v2-sample">
                <a href={src} target="_blank" rel="noopener" className="block" aria-label={`${caption} — open full size`}>
                  <Image src={src} alt={alt} width={1684} height={1190} sizes="(max-width: 1024px) 100vw, 580px" className="block h-auto w-full" />
                  <span className="v2-zoom">
                    <ZoomIn className="h-3.5 w-3.5" /> Tap to zoom
                  </span>
                </a>
                <figcaption className="px-4 py-3 text-sm font-bold">{caption}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <p className="text-center text-sm font-black uppercase tracking-widest">For every one of the 500 agents</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {EVERY_AGENT.map((x) => (
                <li key={x} className="flex gap-2 text-sm font-bold leading-5 sm:text-base">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d71914]" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What it covers */}
      <section className="container py-20">
        <p className="eyebrow mb-4 text-center">What it covers</p>
        <h2 className="section-title mx-auto max-w-4xl text-center">5 volumes × 100 agents.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-black/65">
          Every part of a business, from winning customers to running the books, plus playbooks for ten industries.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {VOLUMES.map((v, i) => (
            <div key={v.no} className={`card overflow-hidden ${i === 4 ? "md:col-span-2 lg:col-span-2" : ""}`}>
              <div className="flex items-center gap-4 border-b border-black/10 p-4">
                <Image
                  src={`/v2/cover-vol-${i + 1}.webp`}
                  alt=""
                  width={600}
                  height={424}
                  sizes="96px"
                  className="w-24 shrink-0 rounded border border-black/10"
                />
                <div>
                  <p className="text-xs font-black tracking-widest text-[#d71914]">VOLUME {v.no} · 100 AGENTS</p>
                  <h3 className="text-2xl font-black leading-tight">{v.name}</h3>
                  <p className="text-sm font-bold text-black/60">{v.title}</p>
                </div>
              </div>
              <ul className={`grid gap-x-4 gap-y-1.5 p-4 text-sm text-black/70 ${i === 4 ? "sm:grid-cols-2" : ""}`}>
                {v.chapters.map((c) => (
                  <li key={c} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d71914]" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section className="bg-[#0b0b0b] py-20 text-white">
        <div className="container">
          <p className="eyebrow mb-4 text-center text-[#f24a43]!">Already happening</p>
          <h2 className="section-title mx-auto max-w-4xl text-center">Big companies already run agents like these.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROOF.map((p) => (
              <figure key={p.company} className="rounded-2xl border border-white/15 p-6">
                <figcaption className="text-lg font-black">{p.company}</figcaption>
                <blockquote className="mt-2 leading-relaxed text-white/75">{p.text}</blockquote>
                <p className="mt-3 text-xs text-white/45">Source: {p.source}</p>
              </figure>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-white/55">
            Public reports of similar AI use. They do not use these specific agents.
          </p>
        </div>
      </section>

      {/* After you pay */}
      <section className="container py-20">
        <p className="eyebrow mb-4 text-center">What happens after you pay</p>
        <h2 className="section-title mx-auto max-w-4xl text-center">You start reading in a minute.</h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {AFTER_PAY.map(([Icon, t, d]) => (
            <div key={t} className="card flex gap-4 p-5">
              <Icon className="mt-0.5 h-7 w-7 shrink-0 text-[#d71914]" />
              <div>
                <h3 className="text-lg font-black leading-snug">{t}</h3>
                <p className="mt-1 leading-relaxed text-black/65">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order */}
      <section id="order" className="bg-[#f3f3f0] py-20">
        <div className="container max-w-xl">
          <div className="card p-5 sm:p-8">
            <p className="eyebrow">500 AI Agents · 5 volumes</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-[-.06em] sm:text-6xl">{inr(V2_PRODUCT.amount * 100)}</span>
              <span className="text-lg font-black text-black/55">+ GST</span>
            </div>
            <p className="mt-1 text-sm text-black/55">One-time. Instant access, with PDF downloads.</p>
            <form onSubmit={submitForm} noValidate className="mt-6 space-y-4">
              <Field label="Full name" error={errors.name}>
                <Input
                  ref={nameRef}
                  name="name"
                  autoComplete="name"
                  value={fields.name}
                  onChange={setField("name")}
                  aria-invalid={!!errors.name}
                  className="mt-1.5 h-12 bg-white!"
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <Input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={fields.email}
                  onChange={setField("email")}
                  aria-invalid={!!errors.email}
                  className="mt-1.5 h-12 bg-white!"
                />
              </Field>
              <Field label="WhatsApp number" error={errors.phone}>
                <Input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={fields.phone}
                  onChange={setField("phone")}
                  aria-invalid={!!errors.phone}
                  className="mt-1.5 h-12 bg-white!"
                />
              </Field>
              <p className="text-sm text-black/60">We&apos;ll send your order and updates on WhatsApp and email.</p>
              <button type="submit" disabled={submitting} className="btn-red w-full text-base disabled:opacity-60">
                {submitting ? "ONE MOMENT…" : "Get the 500 AI Agents →"}
              </button>
              <p className="text-center text-xs text-black/50">
                <LockKeyhole className="mr-1 inline h-3 w-3" /> Secure checkout powered by Cashfree.
              </p>
            </form>
          </div>
        </div>
      </section>

      <Footer />

      {sticky && !open && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-black/15 bg-white p-3 shadow-2xl sm:hidden">
          <div className="pl-1 leading-tight">
            <strong className="text-2xl">{inr(V2_PRODUCT.amount * 100)}</strong>
            <p className="text-[11px] text-black/55">+ GST · Instant access</p>
          </div>
          <button className="btn-red min-h-12 shrink-0 px-5" onClick={() => goToForm("mobile_sticky_cta_click")}>
            GET THE 500 AGENTS
          </button>
        </div>
      )}

      {/* Checkout: bump → membership → pay */}
      <Dialog open={open} onOpenChange={(o) => { if (!paying) setOpen(o); }}>
        <DialogContent className="checkout-dialog v2-checkout max-h-[95vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <div className="glass-head border-b border-white/50 p-5 sm:p-6">
            <DialogHeader className="text-left">
              <p className="eyebrow">Step {step} of 3</p>
              <DialogTitle className="text-2xl font-black tracking-tight sm:text-3xl">
                {step === 1 ? "Your order" : step === 2 ? `Add the yearly membership for +${inr(V2_OFFERS.membership.amount * 100)}` : "Review and pay"}
              </DialogTitle>
              <DialogDescription>
                {step === 1
                  ? "One optional extra before you pay."
                  : step === 2
                    ? "One optional offer before you pay."
                    : "Prices are before GST; 18% GST is added below."}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex gap-1.5" aria-hidden>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-1.5 grow rounded-full ${n <= step ? "bg-[#d71914]" : "bg-black/10"}`} />
              ))}
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {step === 1 && (
              <>
                <div className="glass-tile flex items-center gap-3 p-3">
                  <Image src="/v2/cover-vol-1.webp" alt="" width={600} height={424} sizes="80px" className="w-20 shrink-0 rounded border border-black/10" />
                  <div className="grow">
                    <p className="font-black leading-tight">{V2_PRODUCT.name}</p>
                    <p className="mt-0.5 text-xs text-black/55">5 volumes · 500 agents · Instant access</p>
                  </div>
                  <p className="shrink-0 text-xl font-black">{inr(V2_PRODUCT.amount * 100)}</p>
                </div>

                <div ref={bumpRowRef} className={`addon ${has("bump") ? "addon-on" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/bundle-5-books.webp" alt="The Complete AI Implementation Kit for Founders — five ebooks" loading="lazy" className="addon-banner" />
                  <label className="flex cursor-pointer gap-3">
                    <Checkbox checked={has("bump")} onCheckedChange={(v) => toggleBump(v === true)} className="mt-1 size-5" />
                    <span className="grow">
                      <span className="block font-black leading-snug">
                        Add the ebook bundle + AI Foundations mini-course, +{inr(V2_OFFERS.bump.amount * 100)}.
                      </span>
                      <span className="mt-1 block text-sm text-black/65">
                        The current bundle, unchanged, plus the mini-course free.
                      </span>
                      <span className="mt-1 block text-xs text-black/45">{V2_OFFERS.bump.name} · 5 ebooks</span>
                    </span>
                  </label>
                </div>

                <button type="button" onClick={() => { track("checkout_step_1_done", { bump: has("bump") }); setStep(2); }} className="btn-red inline-flex w-full items-center justify-center gap-2">
                  CONTINUE <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/newsletter-ai-weekly-checkout.webp" alt="AI Weekly — a 12-month membership" loading="lazy" className="addon-banner" />
                <h3 className="text-xl font-black">12 Months of AI Advantage</h3>
                <ul className="space-y-1.5 text-sm text-black/75">
                  {MEMBERSHIP_POINTS.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#d71914]" />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="flex items-start gap-2 rounded-xl bg-[#d71914]/8 p-3 text-sm font-bold text-[#b91410]">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0" />
                  Take all three and get a 25-minute 1:1 call.
                </p>
                <div className="space-y-2.5">
                  <button type="button" onClick={() => membership("yes")} className="btn-red w-full">
                    Yes, add the membership
                  </button>
                  {!has("bump") && (
                    <button type="button" onClick={() => membership("both")} className="v2-btn-outline w-full">
                      Add both and get the 1:1 (+{inr((V2_OFFERS.bump.amount + V2_OFFERS.membership.amount) * 100)})
                    </button>
                  )}
                  <button type="button" onClick={() => membership("no")} className="w-full py-2 text-sm font-bold text-black/55 underline underline-offset-4">
                    No thanks
                  </button>
                </div>
                <BackLink onClick={() => setStep(1)} />
              </>
            )}

            {step === 3 && (
              <>
                <div className="glass-tile p-4 text-sm">
                  <Line label={V2_PRODUCT.name} value={inr(V2_PRODUCT.amount * 100)} strong />
                  {cart.keys.map((k) => (
                    <Line key={k} label={V2_OFFERS[k].short} value={inr(V2_OFFERS[k].amount * 100)} />
                  ))}
                  <div className="mt-3 border-t border-black/10 pt-3">
                    <Line label="Subtotal" value={inr2(cart.subtotalPaise)} muted />
                    <Line label="GST (18%)" value={inr2(cart.gstPaise)} muted />
                  </div>
                  <div className="mt-2 flex justify-between border-t border-black/10 pt-3 text-base font-black">
                    <span>Total</span>
                    <span data-testid="v2-total">{inr2(cart.totalPaise)}</span>
                  </div>
                </div>
                {has("bump") && has("membership") && (
                  <p className="flex items-start gap-2 text-xs font-bold text-[#b91410]">
                    <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Your free 25-minute 1:1 call is included.
                  </p>
                )}

                <p className="text-xs text-black/55">
                  Paying as <strong>{fields.name || "—"}</strong> · {fields.email || "—"} · {fields.phone}{" "}
                  <button type="button" onClick={editDetails} className="font-bold text-[#d71914] underline">
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
                          onChange={(e) => { setGstin(e.target.value.toUpperCase()); setErrors((x) => ({ ...x, gstin: undefined })); }}
                          maxLength={15}
                          autoCapitalize="characters"
                          placeholder="e.g. 27ABCDE1234F1Z5"
                          aria-invalid={!!errors.gstin}
                          className="glass-input mt-1.5 h-11 placeholder:text-black/35"
                        />
                      </Field>
                      <Field label="Business name" optional>
                        <Input
                          name="billingName"
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          autoComplete="organization"
                          className="glass-input mt-1.5 h-11"
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
                <button type="button" onClick={pay} disabled={paying} className="btn-red w-full disabled:opacity-60">
                  {paying ? "OPENING SECURE PAYMENT…" : `PAY ${inr2(cart.totalPaise)} SECURELY`}
                </button>
                <p className="text-center text-[11px] leading-relaxed text-black/50">
                  <LockKeyhole className="mr-1 inline h-3 w-3" /> Secure checkout powered by Cashfree. By paying you agree to the{" "}
                  <a href={`${PANEL_URL}/terms`} target="_blank" rel="noopener" className="underline">Terms</a>,{" "}
                  <a href={`${PANEL_URL}/privacy`} target="_blank" rel="noopener" className="underline">Privacy</a>,{" "}
                  <a href={`${PANEL_URL}/refund-policy`} target="_blank" rel="noopener" className="underline">Refund</a> and{" "}
                  <a href={`${PANEL_URL}/delivery-policy`} target="_blank" rel="noopener" className="underline">Digital Delivery</a> policies.
                </p>
                <BackLink onClick={() => setStep(2)} disabled={paying} />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
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

function Line({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`mt-1 flex justify-between gap-4 first:mt-0 ${muted ? "text-black/65" : ""} ${strong ? "font-bold" : ""}`}>
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
