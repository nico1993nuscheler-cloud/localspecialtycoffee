import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// City geo-name aliases → canonical city slug.
//
// The live city slugs are SEO phrases ("best-coffee-in-amsterdam"), but the
// Webflow era + external backlinks + crawler URL-guessing all hit the bare
// geographic name ("/cities/amsterdam", "/cities/munich"). Since the city
// route is `dynamicParams = false`, those now return an instant 404. Mapping
// each plausible bare/variant name to its real slug with a 301 recovers the
// link equity instead of dropping it.
//
// Keyed by the CURRENT canonical slug so it stays self-documenting; the array
// is every alias that should 301 to it. Only list aliases that are
// unambiguous for this site (one city per name). Country/qualifier-stripped
// and accented variants are included because GSC shows both forms get crawled.
// ---------------------------------------------------------------------------
const CITY_ALIASES: Record<string, string[]> = {
  "best-cafes-in-christchurch": ["christchurch"],
  "best-coffee-copenhagen": ["copenhagen", "kobenhavn"],
  "best-coffee-in-amsterdam": ["amsterdam"],
  "best-coffee-in-auckland": ["auckland"],
  "best-coffee-in-austin": ["austin"],
  "best-coffee-in-barcelona": ["barcelona"],
  "best-coffee-in-boston": ["boston"],
  "best-coffee-in-brussels": ["brussels", "bruxelles"],
  "best-coffee-in-chicago": ["chicago"],
  "best-coffee-in-lisbon": ["lisbon", "lisboa"],
  "best-coffee-in-madrid": ["madrid"],
  "best-coffee-in-oslo": ["oslo"],
  "best-coffee-in-seattle": ["seattle"],
  "best-coffee-in-stockholm": ["stockholm"],
  "best-coffee-in-sydney": ["sydney"],
  "best-coffee-manchester": ["manchester"],
  "best-coffee-sao-paulo": ["sao-paulo", "saopaulo"],
  "best-coffee-seoul": ["seoul"],
  "best-coffee-shops-in-cape-town": ["cape-town", "capetown"],
  "best-coffee-shops-in-london": ["london"],
  "best-coffee-shops-in-new-york": ["new-york", "new-york-city", "nyc"],
  "best-coffee-shops-in-paris-france": ["paris"],
  "best-coffee-shops-in-prague": ["prague", "praha"],
  "best-coffee-shops-in-toronto": ["toronto"],
  "best-coffee-shops-san-diego": ["san-diego"],
  "best-specialty-coffee-los-angeles": ["los-angeles", "la"],
  "coffee-rio-de-janeiro": ["rio-de-janeiro", "rio"],
  "coffee-shops-glasgow": ["glasgow"],
  "coffee-shops-in-riyadh-9db9a": ["riyadh"],
  "coffee-shops-leeds": ["leeds"],
  "coffee-shops-ottawa": ["ottawa"],
  "good-coffee-melbourne": ["melbourne"],
  "good-coffee-shops-in-vancouver": ["vancouver"],
  "portland-coffee-roasters": ["portland"],
  "specialty-coffee-bali": ["bali"],
  "specialty-coffee-bangkok": ["bangkok"],
  "specialty-coffee-berlin": ["berlin"],
  "specialty-coffee-bogota-colombia": ["bogota"],
  "specialty-coffee-buenos-aires-argentina": ["buenos-aires"],
  "specialty-coffee-dubai": ["dubai"],
  "specialty-coffee-dublin": ["dublin"],
  "specialty-coffee-edinburgh": ["edinburgh"],
  "specialty-coffee-helsinki": ["helsinki"],
  "specialty-coffee-hong-kong": ["hong-kong", "hongkong"],
  "specialty-coffee-istanbul": ["istanbul"],
  "specialty-coffee-kyoto-japan": ["kyoto"],
  "specialty-coffee-medellin-colombia": ["medellin"],
  "specialty-coffee-mexico-city-mexico": ["mexico-city", "cdmx"],
  "specialty-coffee-milan-italy": ["milan", "milano"],
  "specialty-coffee-mumbai": ["mumbai"],
  "specialty-coffee-porto": ["porto"],
  "specialty-coffee-shop-munich": ["munich", "muenchen"],
  "specialty-coffee-singapore": ["singapore"],
  "specialty-coffee-taipei-taiwan": ["taipei"],
  "specialty-coffee-tel-aviv-israel": ["tel-aviv", "telaviv"],
  "specialty-coffee-tokyo-japan": ["tokyo"],
  "specialty-coffee-vienna": ["vienna", "wien"],
  "specialty-coffee-warsaw": ["warsaw", "warszawa"],
  "specialty-coffee-zurich": ["zurich", "zuerich"],
};

// Flatten the alias map into Next.js redirect rules. Each alias 301s from
// /cities/<alias> to the canonical /cities/<slug>.
const cityAliasRedirects = Object.entries(CITY_ALIASES).flatMap(([slug, aliases]) =>
  aliases.map((alias) => ({
    source: `/cities/${alias}`,
    destination: `/cities/${slug}`,
    permanent: true,
  })),
);

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
      // Bare/variant city geo-names → canonical city slug (see CITY_ALIASES
      // above). Covers "/cities/amsterdam", "/cities/munich", "/cities/nyc"
      // etc. — the forms crawlers and old backlinks probe but that the SEO
      // slugs ("best-coffee-in-amsterdam") don't match. 301 instead of 404.
      ...cityAliasRedirects,

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
