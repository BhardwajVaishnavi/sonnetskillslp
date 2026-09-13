import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    resolveAlias: {
      "cloudflare:workers": "./db/vercel-env.ts",
    },
  },
};

export default nextConfig;
