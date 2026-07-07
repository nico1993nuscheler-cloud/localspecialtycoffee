import type { MetadataRoute } from "next";
import { getAllCities, getAllPlaces, getAllCategories, getPlacesInCity } from "@/lib/data";
import { LANDING_FEATURES, MIN_INDEXABLE_LANDING_PLACES } from "@/lib/landing-features";
import { SITE_URL as BASE } from "@/lib/config";

// Build/deploy timestamp — used as lastmod for static pages that have no
// per-row date in the DB. Captured at module evaluation, so it bumps every
// time we deploy.
const DEPLOY_TIME = new Date();

function toDate(value: string | null | undefined): Date {
  if (!value) return DEPLOY_TIME;
  const d = new Date(value);
  return isNaN(d.getTime()) ? DEPLOY_TIME : d;
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}`, lastModified: DEPLOY_TIME, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/cities`, lastModified: DEPLOY_TIME, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: DEPLOY_TIME, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/faqs`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms-conditions`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/submissions`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/map`, lastModified: DEPLOY_TIME, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/world-of-coffee-brussels`, lastModified: DEPLOY_TIME, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/imprint`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.1 },
  ];

  // BUILD RESILIENCE: withDbRetry rides out a cold/paused Supabase. If the DB
  // is still unreachable after retries, emit a static-only sitemap rather than
  // aborting the build; revalidate (1h) refills the dynamic URLs once the DB is
  // back. A briefly static-only sitemap is far better than a failed deploy.
  let allCities: Awaited<ReturnType<typeof getAllCities>> = [];
  let allPlaces: Awaited<ReturnType<typeof getAllPlaces>> = [];
  let allCategories: Awaited<ReturnType<typeof getAllCategories>> = [];
  try {
    [allCities, allPlaces, allCategories] = await Promise.all([
      getAllCities(),
      getAllPlaces(),
      getAllCategories(),
    ]);
  } catch (err) {
    console.error(
      "[sitemap] Supabase unreachable after retries; emitting static-only sitemap. Error:",
      err,
    );
    return staticPages;
  }

  // Fetch places per city ONCE — used for both the city lastmod bump below
  // and the programmatic landing-page emission further down. Hoisting avoids
  // double-querying Supabase for every city.
  const placesByCity = new Map<string, Awaited<ReturnType<typeof getPlacesInCity>>>();
  await Promise.all(
    allCities.map(async (c) => {
      placesByCity.set(c.webflow_id, await getPlacesInCity(c.webflow_id));
    }),
  );

  function newestPlaceDate(places: Awaited<ReturnType<typeof getPlacesInCity>>): number {
    return places
      .map((p) => toDate(p.updated_at ?? p.created_at).getTime())
      .reduce((max, t) => (t > max ? t : max), 0);
  }

  const cityUrls: MetadataRoute.Sitemap = allCities.map((c) => {
    // A new cafe joining a city's shortlist counts as a city-page update —
    // otherwise Google sees no lastmod change and won't recrawl for weeks.
    const cityDate = toDate(c.updated_at ?? c.created_at).getTime();
    const placeDate = newestPlaceDate(placesByCity.get(c.webflow_id) ?? []);
    const newest = Math.max(cityDate, placeDate);
    return {
      url: `${BASE}/cities/${c.slug}`,
      lastModified: newest > 0 ? new Date(newest) : DEPLOY_TIME,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  const placeUrls: MetadataRoute.Sitemap = allPlaces.map((p) => ({
    url: `${BASE}/specialty-coffee-place/${p.slug}`,
    lastModified: toDate(p.updated_at ?? p.created_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryUrls: MetadataRoute.Sitemap = allCategories.map((c) => ({
    url: `${BASE}/categories/${c.slug}`,
    lastModified: DEPLOY_TIME,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Per-city shareable map pages (/map/[slug]).
  const mapUrls: MetadataRoute.Sitemap = allCities.map((c) => ({
    url: `${BASE}/map/${c.slug}`,
    lastModified: DEPLOY_TIME,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // Programmatic landing pages: only emit combos with ≥ MIN_PLACES_PER_LANDING
  // matching places. Thin programmatic pages were a primary Helpful-Content
  // demotion vector in the 2025 updates — better to noindex by omission than
  // dilute crawl budget.
  const landingUrls: MetadataRoute.Sitemap = [];
  for (const c of allCities) {
    const places = placesByCity.get(c.webflow_id) ?? [];
    for (const f of LANDING_FEATURES) {
      const matching = places.filter(
        (p) => (p as unknown as Record<string, boolean>)[f.boolean],
      );
      if (matching.length >= MIN_INDEXABLE_LANDING_PLACES) {
        const newest = newestPlaceDate(matching);
        landingUrls.push({
          url: `${BASE}/cities/${c.slug}/${f.slug}`,
          lastModified: newest > 0 ? new Date(newest) : DEPLOY_TIME,
          changeFrequency: "monthly",
          priority: 0.65,
        });
      }
    }
  }

  return [...staticPages, ...cityUrls, ...categoryUrls, ...placeUrls, ...landingUrls, ...mapUrls];
}
