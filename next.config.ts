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
  async redirects() {
    return [
      // Force the apex (non-www) to the www canonical so Google sees one
      // version, not two. Canonical tags already declare www; this hardens
      // it with a 301 so link equity consolidates.
      {
        source: "/:path*",
        has: [{ type: "host", value: "localspecialtycoffee.com" }],
        destination: "https://www.localspecialtycoffee.com/:path*",
        permanent: true,
      },
      // Legacy Webflow blog never made it to the Next.js build. Send any
      // residual blog/post traffic to /cities rather than dropping 404s.
      { source: "/blog", destination: "/cities", permanent: true },
      { source: "/blog/:path*", destination: "/cities", permanent: true },
      { source: "/posts", destination: "/cities", permanent: true },
      { source: "/posts/:path*", destination: "/cities", permanent: true },
      // Add Webflow-era URL → current-slug mappings here as you find them
      // in GSC → Pages → "Not found (404)". Pattern:
      //   { source: "/old-webflow-slug", destination: "/cities/new-slug", permanent: true },
    ];
  },
};

export default nextConfig;
