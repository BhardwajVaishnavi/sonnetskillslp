/**
 * Which country this visitor is browsing from, by Vercel's own IP lookup.
 *
 * The pages themselves are static and served from the CDN, so they never see
 * a request header; this one dynamic endpoint is how the page asks. It powers
 * a SUGGESTION only — "you seem to be outside India; there's a $5 page" —
 * never a redirect: ads deliberately send each country to its own URL, and a
 * silent geo-redirect would rewrite campaigns, misfire on VPNs and travellers,
 * and make two experiments look like one.
 *
 * Empty country means "don't know" (local dev, a proxy that strips headers),
 * and the page shows nothing rather than guessing.
 */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const country = (request.headers.get("x-vercel-ip-country") || "").toUpperCase();
  return Response.json(
    { country: /^[A-Z]{2}$/.test(country) ? country : "" },
    // Private: the answer is about this visitor, not cacheable for the next one.
    { headers: { "cache-control": "private, max-age=3600" } },
  );
}
