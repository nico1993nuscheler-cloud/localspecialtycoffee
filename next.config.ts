import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 (lsc-images bucket) — owned storage, primary source
      { protocol: "https", hostname: "pub-8b061befab9c49bda0632e3619d45c0f.r2.dev" },
      // Webflow CDN — kept as a safety-net allowlist for any lingering refs
      // until we've verified no requests hit it; can be removed later.
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
    ],
  },
};

export default nextConfig;
