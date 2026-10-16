import type { NextConfig } from "next";

/*
 * Two domains, never mixed: lp.sonnetskills.com is India (₹, Cashfree) and
 * only India; ip.sonnetskills.com is international ($, Dodo) and only that.
 * This is one site on both, so the host decides: on ip. the root and
 * /50-ai-agents are the dollar page, and on lp. any /global address goes to
 * ip. — query string and UTMs included — instead of showing dollars there.
 */
const IP_HOST = [{ type: "host" as const, value: "ip.sonnetskills.com" }];
const LP_HOST = [{ type: "host" as const, value: "lp.sonnetskills.com" }];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/global", has: LP_HOST, destination: "https://ip.sonnetskills.com/", permanent: false },
      { source: "/global/:path*", has: LP_HOST, destination: "https://ip.sonnetskills.com/", permanent: false },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: IP_HOST, destination: "/global/50-ai-agents" },
        { source: "/50-ai-agents", has: IP_HOST, destination: "/global/50-ai-agents" },
      ],
      // The platform links here as lp.sonnetskills.com/50-ai-agents.
      afterFiles: [{ source: "/50-ai-agents", destination: "/" }],
      fallback: [],
    };
  },
};

export default nextConfig;
