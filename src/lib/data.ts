// Data layer for LSC. Reads from Supabase at build time + during ISR
// revalidation, caches each table separately to fit inside Next.js
// unstable_cache's 2 MB-per-entry limit.
//
// revalidate is 30 days on purpose: invalidation happens via deploys
// (every CMS injection ends in a push) and on-demand `revalidateTag("lsc-data")`
// hits to /api/revalidate from scripts/inject-city.mjs. Do NOT lower this
// timer — short windows generated 1.7M ISR Writes/cycle (~$7) when the
// data was effectively static between deploys.
//
// Two-tier loading:
//   - getAllPlaces() / getPlacesInCity() / etc. return LIGHT rows (no
//     full HTML `about` / `seo_paragraph`) — enough for list / card views
//   - getPlaceBySlug() fetches one full row with all fields — for the
//     cafe profile page
//   - getCityBySlug() fetches one full city row — for the city hero +
//     SEO paragraph
//
// All cache entries below 1 MB so we never trip the 2 MB cap.

import "server-only";
import { unstable_cache } from "next/cache";
import { supabase } from "./supabase";
import type { Category, City, Place, PlaceWithRefs } from "./types";
import {
  PREVIEW_ENABLED,
  PREVIEW_CITY_SLUG,
  PREVIEW_CITY_WEBFLOW_ID,
  getPreviewCity,
  getPreviewPlaces,
} from "./preview-singapore";

// Slim variants: keep the same TS shapes as City / Place but with heavy
// HTML fields nulled out. List-view components don't read them; the city
// detail and cafe detail pages fetch full rows separately by slug.
type CityLight = City;
type PlaceLight = Place;

const loadCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data, error } = await supabase.from("lsc_categories").select("*");
    if (error) throw error;
    return data as Category[];
  },
  ["lsc-categories"],
  { revalidate: 2592000, tags: ["lsc-data"] },
);

const loadCities = unstable_cache(
  async (): Promise<CityLight[]> => {
    const { data, error } = await supabase
      .from("lsc_cities")
      .select(
        "webflow_id,slug,name,h1,meta_description,summary,excerpt_short,excerpt_long,seo_h2,thumbnail_v1_url,thumbnail_v2_url,thumbnail_v3_url,featured_image_url,photo_gallery,google_maps_url,created_at",
      );
    if (error) throw error;
    return (data as Array<Record<string, unknown>>).map(
      (r) =>
        ({
          ...r,
          seo_paragraph: null,
          // updated_at column added separately via migration — read it if
          // present, otherwise fall back to created_at so sitemap lastmod
          // still has a real per-row value.
          updated_at: (r as Record<string, unknown>).updated_at ?? r.created_at ?? null,
        }) as unknown as CityLight,
    );
  },
  ["lsc-cities-light"],
  { revalidate: 2592000, tags: ["lsc-data"] },
);

// Resolve city_id (uuid) → webflow_id once, cached. Tiny.
const loadCityIdMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from("lsc_cities").select("id,webflow_id");
    if (error) throw error;
    return Object.fromEntries(data.map((r) => [r.id, r.webflow_id]));
  },
  ["lsc-city-id-map"],
  { revalidate: 2592000, tags: ["lsc-data"] },
);
const loadCategoryIdMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from("lsc_categories").select("id,webflow_id");
    if (error) throw error;
    return Object.fromEntries(data.map((r) => [r.id, r.webflow_id]));
  },
  ["lsc-category-id-map"],
  { revalidate: 2592000, tags: ["lsc-data"] },
);

const loadPlacesLight = unstable_cache(
  async (): Promise<PlaceLight[]> => {
    // Explicit projection — exclude `about` and `summary` to keep total
    // payload under 1 MB. Single round-trip, no pagination needed for 547.
    const { data, error } = await supabase
      .from("lsc_coffee_places")
      .select(
        "webflow_id,slug,name,city_id,category_id,excerpt_short,excerpt_long,flavour_profile,button_text,rating,address,hours_weekday,hours_saturday,hours_sunday,thumbnail_v1_url,thumbnail_v2_url,thumbnail_v3_url,featured_image_url,photo_gallery,website,instagram,booking_link,phone,email,is_featured,in_house_roasting,ethical_sourcing,single_origin,award_winning,micro_lots,experimental_styles,hand_brews,batch_brews,espresso_milk_drinks,decaf_options,alt_milk,cold_brew,offers_classes,retail_beans,online_beans,pastry_snacks,lunch_brunch,work_friendly,outdoor_seating,pet_friendly,certified_baristas,ships_internationally,subscription,to_go,byo_cup_loyalty,community_events,created_at",
      );
    if (error) throw error;

    const [cityMap, catMap] = await Promise.all([loadCityIdMap(), loadCategoryIdMap()]);
    return (data as Array<Record<string, unknown>>).map((p) => {
      const { city_id, category_id, ...rest } = p;
      return {
        ...rest,
        about: null,
        summary: null,
        // updated_at falls back to created_at if migration not yet applied
        updated_at: (p as Record<string, unknown>).updated_at ?? p.created_at ?? null,
        city_webflow_id: cityMap[city_id as string] ?? "",
        category_webflow_id: catMap[category_id as string] ?? "",
      } as unknown as PlaceLight;
    });
  },
  ["lsc-places-light"],
  { revalidate: 2592000, tags: ["lsc-data"] },
);

// ── Public API ──

export async function getAllCategories(): Promise<Category[]> {
  return loadCategories();
}

export async function getAllCities(): Promise<CityLight[]> {
  const cities = await loadCities();
  const merged = PREVIEW_ENABLED ? [...cities, getPreviewCity()] : cities;
  return [...merged].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllPlaces(): Promise<PlaceLight[]> {
  const places = await loadPlacesLight();
  return PREVIEW_ENABLED ? [...places, ...getPreviewPlaces()] : places;
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const all = await loadCategories();
  return all.find((c) => c.slug === slug);
}

/** Full city row including seo_paragraph (used on city detail page). */
export async function getCityBySlug(slug: string): Promise<City | undefined> {
  if (PREVIEW_ENABLED && slug === PREVIEW_CITY_SLUG) return getPreviewCity();
  const { data, error } = await supabase
    .from("lsc_cities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return data as City;
}

/** Full place row including `about` HTML (used on cafe detail page). */
export async function getPlaceBySlug(slug: string): Promise<PlaceWithRefs | undefined> {
  if (PREVIEW_ENABLED) {
    const previewPlace = getPreviewPlaces().find((p) => p.slug === slug);
    if (previewPlace) {
      const cats = await loadCategories();
      const category = cats.find((c) => c.webflow_id === previewPlace.category_webflow_id);
      if (category) return { ...previewPlace, city: getPreviewCity(), category };
    }
  }
  const { data, error } = await supabase
    .from("lsc_coffee_places")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const [cityMap, catMap, cities, cats] = await Promise.all([
    loadCityIdMap(),
    loadCategoryIdMap(),
    loadCities(),
    loadCategories(),
  ]);
  const cityWebflowId = cityMap[data.city_id] ?? "";
  const catWebflowId = catMap[data.category_id] ?? "";
  const city = cities.find((c) => c.webflow_id === cityWebflowId);
  const category = cats.find((c) => c.webflow_id === catWebflowId);
  if (!city || !category) return undefined;
  const { city_id: _ci, category_id: _ca, ...rest } = data;
  return {
    ...(rest as Place),
    city_webflow_id: cityWebflowId,
    category_webflow_id: catWebflowId,
    // city here is the full City row (with seo_paragraph) — components that
    // only need the light city fields work either way.
    city: city as unknown as City,
    category,
  };
}

export async function getPlacesInCity(cityWebflowId: string): Promise<PlaceWithRefs[]> {
  const [livePlaces, cities, categories] = await Promise.all([
    loadPlacesLight(),
    loadCities(),
    loadCategories(),
  ]);
  const allCities = PREVIEW_ENABLED ? [...cities, getPreviewCity()] : cities;
  const places = PREVIEW_ENABLED ? [...livePlaces, ...getPreviewPlaces()] : livePlaces;
  return places
    .filter((p) => p.city_webflow_id === cityWebflowId)
    .map((p) => {
      const city = allCities.find((c) => c.webflow_id === p.city_webflow_id);
      const category = categories.find((c) => c.webflow_id === p.category_webflow_id);
      if (!city || !category) return null;
      return { ...(p as unknown as Place), city: city as unknown as City, category };
    })
    .filter((p): p is PlaceWithRefs => p !== null)
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export async function getPlacesInCategory(categoryWebflowId: string): Promise<PlaceWithRefs[]> {
  const [livePlaces, cities, categories] = await Promise.all([
    loadPlacesLight(),
    loadCities(),
    loadCategories(),
  ]);
  const allCities = PREVIEW_ENABLED ? [...cities, getPreviewCity()] : cities;
  const places = PREVIEW_ENABLED ? [...livePlaces, ...getPreviewPlaces()] : livePlaces;
  return places
    .filter((p) => p.category_webflow_id === categoryWebflowId)
    .map((p) => {
      const city = allCities.find((c) => c.webflow_id === p.city_webflow_id);
      const category = categories.find((c) => c.webflow_id === p.category_webflow_id);
      if (!city || !category) return null;
      return { ...(p as unknown as Place), city: city as unknown as City, category };
    })
    .filter((p): p is PlaceWithRefs => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function countPlacesInCity(cityWebflowId: string): Promise<number> {
  const livePlaces = await loadPlacesLight();
  const places = PREVIEW_ENABLED ? [...livePlaces, ...getPreviewPlaces()] : livePlaces;
  return places.filter((p) => p.city_webflow_id === cityWebflowId).length;
}
