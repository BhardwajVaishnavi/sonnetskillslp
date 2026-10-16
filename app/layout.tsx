import type { Metadata } from "next";
import { META_PIXEL_ID, META_PIXEL_ID_GLOBAL } from "@/lib/pixel";

/** Microsoft Clarity project for both landing pages. */
const CLARITY_ID = (process.env.NEXT_PUBLIC_CLARITY_ID || "yymwhrqefv").trim();
import "./globals.css";

export const metadata: Metadata = {
  title: "50 AI Agents for Real Businesses | SonnetSkills",
  description: "A practical playbook of 50 AI agents for founders, business owners and operators. Instant digital access for ₹9.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Tracking runs only on the real domains (lp., ip., www.sonnetskills.com): Vercel opens
            every new deployment address to screenshot it, and those visits are not visitors.
            Meta Pixel base code, between the header tags, exactly as Meta gives it — with one
            change: ip.sonnetskills.com starts the international pixel and only that one;
            lp.sonnetskills.com starts India's and only that one. One static page serves both
            domains, so the domain decides. (/global counts too, for local testing only:
            on lp. it redirects to ip. before this runs.) */}
        <script
          id="meta-pixel"
          dangerouslySetInnerHTML={{
            __html: `if(/(^|\\.)sonnetskills\\.com$/.test(location.hostname)){
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
var g=location.hostname.indexOf('ip.')===0||location.pathname.indexOf('/global')===0;
fbq('init', g ? '${META_PIXEL_ID_GLOBAL}' : '${META_PIXEL_ID}');
fbq('track', 'PageView');
}`,
          }}
        />
        {/* Microsoft Clarity, as Clarity gives it: heatmaps and session recordings for both
            landing pages (lp. and ip.) in one project; filter by domain inside Clarity.
            Form fields are masked by Clarity's default settings. */}
        <script
          id="ms-clarity"
          dangerouslySetInnerHTML={{
            __html: `if(/(^|\\.)sonnetskills\\.com$/.test(location.hostname))(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_ID}");`,
          }}
        />
      </head>
      <body className="antialiased">
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
