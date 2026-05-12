import type { MetadataRoute } from "next";
import { getAllCities, getAllPlaces, getAllCategories, getPlacesInCity } from "@/lib/data";
import { LANDING_FEATURES } from "@/lib/landing-features";

const BASE = "https://www.localspecialtycoffee.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allCities, allPlaces, allCategories] = await Promise.all([
    getAllCities(),
    getAllPlaces(),
    getAllCategories(),
  ]);
  const staticPages = [
    { url: `${BASE}`, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE}/cities`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE}/contact`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/faqs`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/terms-conditions`, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${BASE}/submissions`, changeFrequency: "yearly" as const, priority: 0.4 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${BASE}/imprint`, changeFrequency: "yearly" as const, priority: 0.1 },
  ];

  const cityUrls = allCities.map((c) => ({
    url: `${BASE}/cities/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const placeUrls = allPlaces.map((p) => ({
    url: `${BASE}/specialty-coffee-place/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const categoryUrls = allCategories.map((c) => ({
    url: `${BASE}/categories/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Programmatic landing pages: only emit combos with ≥1 matching place.
  const landingUrls: MetadataRoute.Sitemap = [];
  for (const c of allCities) {
    const places = await getPlacesInCity(c.webflow_id);
    for (const f of LANDING_FEATURES) {
      const count = places.filter(
        (p) => (p as unknown as Record<string, boolean>)[f.boolean],
      ).length;
      if (count >= 1) {
        landingUrls.push({
          url: `${BASE}/cities/${c.slug}/${f.slug}`,
          changeFrequency: "monthly",
          priority: 0.65,
        });
      }
    }
  }

  return [...staticPages, ...cityUrls, ...categoryUrls, ...placeUrls, ...landingUrls];
}
