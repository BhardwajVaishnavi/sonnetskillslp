import type { Metadata } from "next";
import { LandingPageV2 } from "@/components/landing-page-v2";

/*
 * The India page (lp.sonnetskills.com), at / and (via the rewrite in
 * next.config.ts) at /50-ai-agents: funnel v2, the ₹199 + GST 500 AI Agents.
 * The international page at ip.sonnetskills.com (/global/50-ai-agents) keeps
 * the v1 component, components/landing-page.tsx, and its dollar offer.
 */
export const metadata: Metadata = {
  title: "500 AI Agents for Real Businesses — Build your first AI agent | SonnetSkills",
  description:
    "500 ready-to-build AI agents for real businesses, each showing what it does, the time and money it saves, what it costs to build, and when your business is ready for it. ₹199 + GST.",
};

export default function Home() {
  return <LandingPageV2 />;
}
