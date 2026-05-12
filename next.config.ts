import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob — owned storage, what the live site uses
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Webflow CDN — kept as a fallback so any orphaned references still load
      // until we're confident every URL has been migrated.
      { protocol: "https", hostname: "cdn.prod.website-files.com" },
    ],
  },
};

export default nextConfig;
