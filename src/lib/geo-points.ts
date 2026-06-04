// Pure helpers to turn LSC places into map points + GeoJSON for MapLibre. No
// React, no MapLibre imports here so this stays cheap to import anywhere.

import type { PlaceWithRefs } from "./types";

// Lightweight shape the maps + popups consume. Small enough to send all ~760
// of them to the client for the global "roam" overlay.
export type MapPoint = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  citySlug: string;
  cityName: string;
  categorySlug: string;
  categoryName: string;
  flavour: string | null;
  img: string | null;
};

export type PlaceFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: { slug: string; categorySlug: string };
  }>;
};

export function placeToMapPoint(p: PlaceWithRefs): MapPoint {
  return {
    slug: p.slug,
    name: p.name,
    lat: p.latitude as number,
    lng: p.longitude as number,
    citySlug: p.city.slug,
    cityName: p.city.name,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    flavour: p.flavour_profile,
    img: p.thumbnail_v3_url ?? p.featured_image_url ?? null,
  };
}

export function hasCoords(p: PlaceWithRefs): boolean {
  return p.latitude != null && p.longitude != null;
}

/** PlaceWithRefs[] → MapPoint[], dropping any without coordinates. */
export function placesToMapPoints(places: PlaceWithRefs[]): MapPoint[] {
  return places.filter(hasCoords).map(placeToMapPoint);
}

export function toFeatureCollection(points: MapPoint[]): PlaceFeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { slug: p.slug, categorySlug: p.categorySlug },
    })),
  };
}

/** [west, south, east, north] bounds over points, or null if none. */
export function boundsOf(points: MapPoint[]): [number, number, number, number] | null {
  if (!points.length) return null;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const p of points) {
    if (p.lng < w) w = p.lng;
    if (p.lng > e) e = p.lng;
    if (p.lat < s) s = p.lat;
    if (p.lat > n) n = p.lat;
  }
  return [w, s, e, n];
}
