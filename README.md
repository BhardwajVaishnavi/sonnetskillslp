# SonnetSkills — landing page (lp.sonnetskills.com)

The ₹9 "50 AI Agents for Real Businesses" landing page and its checkout popup.
A plain Next.js site, deployed on Vercel with the domain `lp.sonnetskills.com`
(also served at `/50-ai-agents`).

This site has no backend. Orders, payments, accounts, access and emails all live
in the SonnetSkills platform (`Sonnetskillspanel`, sonnetskills.com):

```
popup → POST {PANEL_URL}/api/checkout  → Cashfree checkout (opened with the returned session)
      → sonnetskills.com/access/50-ai-agents?order_id=…  (account set-up, library, emails)
```

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
npm run lint
```

## Settings

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_PANEL_URL` | The platform's URL. Default `https://sonnetskills.com`; locally `http://localhost:4173` |

The platform must list this site in its `LANDING_ORIGINS` (default
`https://lp.sonnetskills.com`; add `http://localhost:5173` locally).
Cashfree keys belong to the platform only; in Cashfree, whitelist both domains.

## Keeping it in step with the platform

`lib/offer.ts` holds what this page shows: the product and add-on slugs
(`50-ai-agents`, `ai-business-bundle`, `ai-business-newsletter`), names and
prices before GST. The platform recomputes every total and refuses add-ons that
aren't published, and the popup refuses to open payment if the platform's total
differs from the one shown. Change prices in Admin › Products and here together.
