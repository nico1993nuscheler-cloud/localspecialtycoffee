import categoriesData from "../../data/categories.json";
import citiesData from "../../data/cities.json";
import placesData from "../../data/places.json";
import type { Category, City, Place, PlaceWithRefs } from "./types";

const categories = categoriesData as Category[];
const cities = citiesData as City[];
const places = placesData as Place[];

const cityByWebflowId = new Map(cities.map((c) => [c.webflow_id, c]));
const categoryByWebflowId = new Map(categories.map((c) => [c.webflow_id, c]));
const citiesBySlug = new Map(cities.map((c) => [c.slug, c]));
const placesBySlug = new Map(places.map((p) => [p.slug, p]));
const categoriesBySlug = new Map(categories.map((c) => [c.slug, c]));

export function getAllCategories(): Category[] {
  return categories;
}

export function getAllCities(): City[] {
  return [...cities].sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllPlaces(): Place[] {
  return places;
}

export function getCityBySlug(slug: string): City | undefined {
  return citiesBySlug.get(slug);
}

export function getPlaceBySlug(slug: string): PlaceWithRefs | undefined {
  const p = placesBySlug.get(slug);
  if (!p) return undefined;
  const city = cityByWebflowId.get(p.city_webflow_id);
  const category = categoryByWebflowId.get(p.category_webflow_id);
  if (!city || !category) return undefined;
  return { ...p, city, category };
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categoriesBySlug.get(slug);
}

export function getPlacesInCity(cityWebflowId: string): PlaceWithRefs[] {
  return places
    .filter((p) => p.city_webflow_id === cityWebflowId)
    .map((p) => {
      const city = cityByWebflowId.get(p.city_webflow_id);
      const category = categoryByWebflowId.get(p.category_webflow_id);
      if (!city || !category) return null;
      return { ...p, city, category };
    })
    .filter((p): p is PlaceWithRefs => p !== null)
    .sort((a, b) => {
      // Featured first, then alphabetical
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function getPlacesInCategory(categoryWebflowId: string): PlaceWithRefs[] {
  return places
    .filter((p) => p.category_webflow_id === categoryWebflowId)
    .map((p) => {
      const city = cityByWebflowId.get(p.city_webflow_id);
      const category = categoryByWebflowId.get(p.category_webflow_id);
      if (!city || !category) return null;
      return { ...p, city, category };
    })
    .filter((p): p is PlaceWithRefs => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function countPlacesInCity(cityWebflowId: string): number {
  return places.filter((p) => p.city_webflow_id === cityWebflowId).length;
}
