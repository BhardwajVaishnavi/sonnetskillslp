import { LandingPage } from "@/components/landing-page";

/*
 * The India page, at / and (via the rewrite in next.config.ts) at
 * /50-ai-agents. The whole page lives in components/landing-page.tsx so the
 * global variant at /global/50-ai-agents can render the same page in its own
 * market — one sales page, two price lists, zero duplication.
 */
export default function Home() {
  return <LandingPage market="IN" />;
}
