import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // R2 already serves every content image at the exact render size
    // (filename pattern `..._WxH.jpeg`), so /_next/image is dead weight
    // and the failure surface for intermittent broken-image bugs under load.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "pub-8b061befab9c49bda0632e3619d45c0f.r2.dev" },
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
    ],
  },
};

export default nextConfig;
