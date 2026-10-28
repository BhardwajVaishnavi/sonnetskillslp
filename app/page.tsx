import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

/*
 * The India page (lp.sonnetskills.com), at / and (via the rewrite in
 * next.config.ts) at /50-ai-agents: funnel v2, the ₹199 + GST 500 AI Agents,
 * in the same design as the international page at ip.sonnetskills.com
 * (/global/50-ai-agents), which keeps the v1 playbook and its dollar offer.
 */
export const metadata: Metadata = {
  title: "500 AI Agents for Real Businesses — Build your first AI agent | SonnetSkills",
  description:
    "500 ready-to-build AI agents for real businesses, each showing what it does, the time and money it saves, what it costs to build, and when your business is ready for it. ₹199 + GST.",
};

export default function Home() {
  return <LandingPage market="IN" />;
}
