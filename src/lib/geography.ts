// Continent + country + map-center lookup by city slug. Hand-curated for the
// current 54 live cities. When a new city goes live, append a row here and the
// /cities filters + globe will start grouping/plotting it automatically.
//
// `lat`/`lng` are the EDITORIAL heart of each city's coffee scene (a recognizable
// central point), not a literal geographic centroid. They drive the homepage
// globe pins and the initial center of each city map (which then fits bounds to
// the actual cafe pins). Approximate is fine — keep them downtown.

export type Continent =
  | "Europe"
  | "North America"
  | "South America"
  | "Asia"
  | "Oceania"
  | "Africa";

export type GeoMeta = {
  continent: Continent;
  country: string;
  lat: number;
  lng: number;
};

const META: Record<string, GeoMeta> = {
  // Europe
  "specialty-coffee-warsaw": { continent: "Europe", country: "Poland", lat: 52.2297, lng: 21.0122 },
  "specialty-coffee-milan-italy": { continent: "Europe", country: "Italy", lat: 45.4642, lng: 9.19 },
  "specialty-coffee-dublin": { continent: "Europe", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  "best-coffee-in-amsterdam": { continent: "Europe", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  "best-coffee-in-barcelona": { continent: "Europe", country: "Spain", lat: 41.3851, lng: 2.1734 },
  "best-coffee-in-brussels": { continent: "Europe", country: "Belgium", lat: 50.8503, lng: 4.3517 },
  "best-coffee-copenhagen": { continent: "Europe", country: "Denmark", lat: 55.6761, lng: 12.5683 },
  "best-coffee-in-lisbon": { continent: "Europe", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  "best-coffee-in-madrid": { continent: "Europe", country: "Spain", lat: 40.4168, lng: -3.7038 },
  "best-coffee-in-oslo": { continent: "Europe", country: "Norway", lat: 59.9139, lng: 10.7522 },
  "best-coffee-in-stockholm": { continent: "Europe", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  "best-coffee-manchester": { continent: "Europe", country: "United Kingdom", lat: 53.4808, lng: -2.2426 },
  "best-coffee-shops-in-london": { continent: "Europe", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  "best-coffee-shops-in-paris-france": { continent: "Europe", country: "France", lat: 48.8566, lng: 2.3522 },
  "best-coffee-shops-in-prague": { continent: "Europe", country: "Czechia", lat: 50.0755, lng: 14.4378 },
  "coffee-shops-glasgow": { continent: "Europe", country: "United Kingdom", lat: 55.8642, lng: -4.2518 },
  "coffee-shops-leeds": { continent: "Europe", country: "United Kingdom", lat: 53.8008, lng: -1.5491 },
  "specialty-coffee-berlin": { continent: "Europe", country: "Germany", lat: 52.52, lng: 13.405 },
  "specialty-coffee-helsinki": { continent: "Europe", country: "Finland", lat: 60.1699, lng: 24.9384 },
  "specialty-coffee-porto": { continent: "Europe", country: "Portugal", lat: 41.1579, lng: -8.6291 },
  "specialty-coffee-shop-munich": { continent: "Europe", country: "Germany", lat: 48.1351, lng: 11.582 },
  "specialty-coffee-vienna": { continent: "Europe", country: "Austria", lat: 48.2082, lng: 16.3738 },
  "specialty-coffee-zurich": { continent: "Europe", country: "Switzerland", lat: 47.3769, lng: 8.5417 },

  // North America
  "best-coffee-in-austin": { continent: "North America", country: "United States", lat: 30.2672, lng: -97.7431 },
  "best-coffee-in-chicago": { continent: "North America", country: "United States", lat: 41.8781, lng: -87.6298 },
  "best-coffee-in-seattle": { continent: "North America", country: "United States", lat: 47.6062, lng: -122.3321 },
  "best-coffee-shops-in-new-york": { continent: "North America", country: "United States", lat: 40.7128, lng: -74.006 },
  "best-coffee-shops-in-toronto": { continent: "North America", country: "Canada", lat: 43.6532, lng: -79.3832 },
  "best-coffee-shops-san-diego": { continent: "North America", country: "United States", lat: 32.7157, lng: -117.1611 },
  "best-specialty-coffee-los-angeles": { continent: "North America", country: "United States", lat: 34.0522, lng: -118.2437 },
  "coffee-shops-ottawa": { continent: "North America", country: "Canada", lat: 45.4215, lng: -75.6972 },
  "good-coffee-shops-in-vancouver": { continent: "North America", country: "Canada", lat: 49.2827, lng: -123.1207 },
  "portland-coffee-roasters": { continent: "North America", country: "United States", lat: 45.5152, lng: -122.6784 },
  "specialty-coffee-mexico-city-mexico": { continent: "North America", country: "Mexico", lat: 19.4326, lng: -99.1332 },

  // South America
  "specialty-coffee-medellin-colombia": { continent: "South America", country: "Colombia", lat: 6.2476, lng: -75.5658 },
  "specialty-coffee-bogota-colombia": { continent: "South America", country: "Colombia", lat: 4.711, lng: -74.0721 },
  "specialty-coffee-buenos-aires-argentina": { continent: "South America", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  "best-coffee-sao-paulo": { continent: "South America", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  "coffee-rio-de-janeiro": { continent: "South America", country: "Brazil", lat: -22.9068, lng: -43.1729 },

  // Asia
  "specialty-coffee-mumbai": { continent: "Asia", country: "India", lat: 19.0596, lng: 72.8295 },
  "specialty-coffee-bali": { continent: "Asia", country: "Indonesia", lat: -8.6478, lng: 115.1385 },
  "specialty-coffee-tel-aviv-israel": { continent: "Asia", country: "Israel", lat: 32.0853, lng: 34.7818 },
  "specialty-coffee-kyoto-japan": { continent: "Asia", country: "Japan", lat: 35.0116, lng: 135.7681 },
  "specialty-coffee-hong-kong": { continent: "Asia", country: "Hong Kong", lat: 22.3193, lng: 114.1694 },
  "specialty-coffee-taipei-taiwan": { continent: "Asia", country: "Taiwan", lat: 25.033, lng: 121.5654 },
  "specialty-coffee-dubai": { continent: "Asia", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708 },
  "best-coffee-seoul": { continent: "Asia", country: "South Korea", lat: 37.5665, lng: 126.978 },
  "coffee-shops-in-riyadh-9db9a": { continent: "Asia", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  "specialty-coffee-bangkok": { continent: "Asia", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  "specialty-coffee-singapore": { continent: "Asia", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  "specialty-coffee-tokyo-japan": { continent: "Asia", country: "Japan", lat: 35.6762, lng: 139.6503 },

  // Oceania
  "best-cafes-in-christchurch": { continent: "Oceania", country: "New Zealand", lat: -43.5321, lng: 172.6362 },
  "best-coffee-in-auckland": { continent: "Oceania", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
  "best-coffee-in-sydney": { continent: "Oceania", country: "Australia", lat: -33.8688, lng: 151.2093 },
  "good-coffee-melbourne": { continent: "Oceania", country: "Australia", lat: -37.8136, lng: 144.9631 },

  // Africa
  "best-coffee-shops-in-cape-town": { continent: "Africa", country: "South Africa", lat: -33.9249, lng: 18.4241 },
};

// Cities present on the Webflow API but currently unpublished (so they
// don't appear in the sitemap) — keep this here so when they're published
// later they auto-pick up the meta. Add freely.
const FUTURE_CITIES: Record<string, GeoMeta> = {
  // (none today)
};

const FALLBACK_META: GeoMeta = { continent: "Europe", country: "Unknown", lat: 0, lng: 0 };

export function getCityGeo(slug: string): GeoMeta {
  return META[slug] ?? FUTURE_CITIES[slug] ?? FALLBACK_META;
}

/**
 * Map center for a city, or null if the slug has no curated coordinates.
 * Callers (globe, city map) should skip null entries rather than plot 0,0.
 */
export function getCityCenter(slug: string): { lat: number; lng: number } | null {
  const meta = META[slug] ?? FUTURE_CITIES[slug];
  if (!meta) return null;
  return { lat: meta.lat, lng: meta.lng };
}

export type CityCenter = {
  slug: string;
  continent: Continent;
  country: string;
  lat: number;
  lng: number;
};

/** All live cities with curated centers — for the homepage globe. */
export function getCityCenters(): CityCenter[] {
  return Object.entries(META).map(([slug, m]) => ({
    slug,
    continent: m.continent,
    country: m.country,
    lat: m.lat,
    lng: m.lng,
  }));
}

const COUNTRY_FLAGS: Record<string, string> = {
  "India": "🇮🇳",
  "Indonesia": "🇮🇩",
  "Poland": "🇵🇱",
  "Israel": "🇮🇱",
  "Italy": "🇮🇹",
  "Hong Kong": "🇭🇰",
  "Taiwan": "🇹🇼",
  "United Arab Emirates": "🇦🇪",
  "Ireland": "🇮🇪",
  "Colombia": "🇨🇴",
  "Argentina": "🇦🇷",
  "Netherlands": "🇳🇱",
  "Spain": "🇪🇸",
  "Belgium": "🇧🇪",
  "Denmark": "🇩🇰",
  "Portugal": "🇵🇹",
  "Norway": "🇳🇴",
  "Sweden": "🇸🇪",
  "United Kingdom": "🇬🇧",
  "France": "🇫🇷",
  "Austria": "🇦🇹",
  "Czechia": "🇨🇿",
  "Switzerland": "🇨🇭",
  "Singapore": "🇸🇬",
  "Thailand": "🇹🇭",
  "Finland": "🇫🇮",
  "Germany": "🇩🇪",
  "United States": "🇺🇸",
  "Canada": "🇨🇦",
  "Mexico": "🇲🇽",
  "Brazil": "🇧🇷",
  "Japan": "🇯🇵",
  "South Korea": "🇰🇷",
  "Saudi Arabia": "🇸🇦",
  "New Zealand": "🇳🇿",
  "Australia": "🇦🇺",
  "South Africa": "🇿🇦",
};

export function getCityFlag(slug: string): string {
  return COUNTRY_FLAGS[getCityGeo(slug).country] ?? "";
}

export const ALL_CONTINENTS: Continent[] = [
  "Europe",
  "North America",
  "South America",
  "Asia",
  "Oceania",
  "Africa",
];
