// Helpers that turn LSC places into things Google Maps can open — without any
// manual pin-adding. Two outputs:
//
//   1. kmlForPoints()  → a KML document. Import once into Google My Maps
//      (Create new map → Import → this file) and every pin lands with name,
//      description and exact coordinates. Replaces hand-building a list.
//
//   2. googleMapsRouteUrl() → a native Google Maps directions deep link
//      (walking) through the spots. Opens in the user's Google Maps app, no
//      account needed. Capped at 10 stops (Google's waypoint limit).
//
// Note: Google has NO public API to create a native "Saved → List", so these
// are the two real ways to get LSC pins into Google Maps automatically.

import type { MapPoint } from "./geo-points";

function xmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
}

const SITE = "https://www.localspecialtycoffee.com";

export function kmlForPoints(points: MapPoint[], title: string): string {
  const placemarks = points
    .map((p) => {
      const desc = [
        p.categoryName,
        p.flavour ?? undefined,
        `${SITE}/specialty-coffee-place/${p.slug}`,
      ]
        .filter(Boolean)
        .join(" — ");
      return `    <Placemark>
      <name>${xmlEscape(p.name)}</name>
      <description>${xmlEscape(desc)}</description>
      <Point><coordinates>${p.lng},${p.lat},0</coordinates></Point>
    </Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${xmlEscape(title)}</name>
    <description>${xmlEscape(`Curated by ${SITE}`)}</description>
${placemarks}
  </Document>
</kml>`;
}

/**
 * Native Google Maps walking-route deep link through the points (in order).
 * Google caps consumer directions at 1 destination + 9 waypoints, so we take
 * the first 10 points; the page tells the user when more exist.
 */
export function googleMapsRouteUrl(points: MapPoint[]): string | null {
  const stops = points.slice(0, 10);
  if (stops.length === 0) return null;
  const coord = (p: MapPoint) => `${p.lat},${p.lng}`;
  const destination = encodeURIComponent(coord(stops[stops.length - 1]));
  const params = new URLSearchParams({ api: "1", travelmode: "walking" });
  if (stops.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${destination}`;
  }
  const waypoints = stops.slice(0, -1).map(coord).join("|");
  return `https://www.google.com/maps/dir/?${params.toString()}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}`;
}

export const MAPS_ROUTE_CAP = 10;
