import type { NextConfig } from "next";

/*
 * ip.sonnetskills.com is this same site on a second domain, opening straight
 * on the global page. Host-matched and checked before files, so on ip. the
 * root and /50-ai-agents are the dollar page, and on lp. nothing changes.
 * lp.sonnetskills.com/global/50-ai-agents keeps working for ads that use it.
 */
const IP_HOST = [{ type: "host" as const, value: "ip.sonnetskills.com" }];

const nextConfig: NextConfig = {
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
