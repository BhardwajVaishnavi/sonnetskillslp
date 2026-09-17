import { notFound, permanentRedirect } from "next/navigation";
import { PANEL_URL } from "@/lib/offer";

// Legal and company pages live on the main site; keep old links here working.
const PAGES = new Set(["about", "contact", "terms", "privacy", "refund-policy", "delivery-policy"]);

export default async function MainSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!PAGES.has(slug)) notFound();
  permanentRedirect(`${PANEL_URL}/${slug}`);
}
