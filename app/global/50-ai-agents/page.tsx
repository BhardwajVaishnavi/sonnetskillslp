import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

/*
 * The international page. Ads send global traffic here deliberately — there
 * is no geo-redirect, because deterministic pricing and clean experiment
 * attribution both depend on the URL saying which offer was shown. $5 through
 * Dodo Payments; the panel owns every amount.
 *
 * A static segment, so it wins over app/[slug] (which would 404 it) by the
 * App Router's specificity rules.
 */
export const metadata: Metadata = {
  title: "50 AI Agents for Real Businesses — $5 Digital Playbook",
  description:
    "Choose the right AI workflow to build first — across sales, marketing, operations, finance and management. 50 practical use cases for $5, one-time.",
};

export default function GlobalPlaybookPage() {
  return <LandingPage market="GLOBAL" />;
}
