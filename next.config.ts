import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The platform links here as lp.sonnetskills.com/50-ai-agents.
  async rewrites() {
    return [{ source: "/50-ai-agents", destination: "/" }];
  },
};

export default nextConfig;
