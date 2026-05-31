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

      // The four URLs GSC reports as "Nicht gefunden (404)" as of May 31, 2026
      // — three explicit cafe/legacy redirects below, plus the brewbuddy
      // subdomain handled separately (see comment at end). Per the Wayback
      // diff, the migration preserved URL structure almost perfectly; these
      // are the only leftovers actively bleeding crawl budget.

      // Seven Miles (Sydney roaster) — retired from shortlist. Smart fallback
      // in /specialty-coffee-place/[slug]/page.tsx can't catch this one
      // because the slug ends with --roastery, not a city stem.
      {
        source: "/specialty-coffee-place/seven-miles-coffee-roasters--office---roastery",
        destination: "/cities/best-coffee-in-sydney",
        permanent: true,
      },
      // Cafeletka — Czech cafe (cafeletka.cz). Slug has `.cz` instead of a
      // city stem, so smart fallback misses it. Was a Prague listing.
      {
        source: "/specialty-coffee-place/cafeletka.cz",
        destination: "/cities/best-coffee-shops-in-prague",
        permanent: true,
      },
      // Webflow legacy: /deletion-basket/* was Webflow's trash-can namespace
      // for soft-deleted pages. Send any residual hits to the homepage.
      {
        source: "/deletion-basket/:path*",
        destination: "/",
        permanent: true,
      },
      // NOTE: brewbuddy.localspecialtycoffee.com (the fourth 404 in GSC)
      // is a separate subdomain Vercel doesn't route from this Next.js app,
      // so a redirect here would never fire. Fix is to add a wildcard
      // redirect at the DNS / Vercel-domains layer (point the subdomain at
      // the apex with a 301), or remove it from Vercel/Cloudflare entirely
      // so Google stops trying to crawl it.
    ];
  },
};

export default nextConfig;
