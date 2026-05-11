import type { MetadataRoute } from "next";
import { getAllCities, getAllPlaces, getAllCategories } from "@/lib/data";

const BASE = "https://www.localspecialtycoffee.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${BASE}`, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE}/cities`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE}/contact`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/faqs`, changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${BASE}/terms-conditions`, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${BASE}/submissions`, changeFrequency: "yearly" as const, priority: 0.4 },
  ];

  const cityUrls = getAllCities().map((c) => ({
    url: `${BASE}/cities/${c.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const placeUrls = getAllPlaces().map((p) => ({
    url: `${BASE}/specialty-coffee-place/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const categoryUrls = getAllCategories().map((c) => ({
    url: `${BASE}/categories/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...cityUrls, ...categoryUrls, ...placeUrls];
}
