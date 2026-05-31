import type { MetadataRoute } from "next";
import { getAllCities, getAllPlaces, getAllCategories, getPlacesInCity } from "@/lib/data";
import { LANDING_FEATURES, MIN_INDEXABLE_LANDING_PLACES } from "@/lib/landing-features";

const BASE = "https://www.localspecialtycoffee.com";

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
  const [allCities, allPlaces, allCategories] = await Promise.all([
    getAllCities(),
    getAllPlaces(),
    getAllCategories(),
  ]);
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}`, lastModified: DEPLOY_TIME, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/cities`, lastModified: DEPLOY_TIME, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/contact`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/faqs`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms-conditions`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/submissions`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/imprint`, lastModified: DEPLOY_TIME, changeFrequency: "yearly", priority: 0.1 },
  ];

  const cityUrls: MetadataRoute.Sitemap = allCities.map((c) => ({
    url: `${BASE}/cities/${c.slug}`,
    lastModified: toDate(c.updated_at ?? c.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

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

  // Programmatic landing pages: only emit combos with ≥ MIN_PLACES_PER_LANDING
  // matching places. Thin programmatic pages were a primary Helpful-Content
  // demotion vector in the 2025 updates — better to noindex by omission than
  // dilute crawl budget.
  const landingUrls: MetadataRoute.Sitemap = [];
  for (const c of allCities) {
    const places = await getPlacesInCity(c.webflow_id);
    for (const f of LANDING_FEATURES) {
      const matching = places.filter(
        (p) => (p as unknown as Record<string, boolean>)[f.boolean],
      );
      if (matching.length >= MIN_INDEXABLE_LANDING_PLACES) {
        const newest = matching
          .map((p) => toDate(p.updated_at ?? p.created_at).getTime())
          .reduce((max, t) => (t > max ? t : max), 0);
        landingUrls.push({
          url: `${BASE}/cities/${c.slug}/${f.slug}`,
          lastModified: newest > 0 ? new Date(newest) : DEPLOY_TIME,
          changeFrequency: "monthly",
          priority: 0.65,
        });
      }
    }
  }

  return [...staticPages, ...cityUrls, ...categoryUrls, ...placeUrls, ...landingUrls];
}
