import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Webflow CDN — assets remain here during v1 (no asset migration yet)
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
      { protocol: "https", hostname: "uploads-ssl.webflow.com" },
      { protocol: "https", hostname: "assets-global.website-files.com" },
    ],
  },
};

export default nextConfig;
