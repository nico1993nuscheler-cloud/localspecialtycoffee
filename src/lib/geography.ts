// Continent + country lookup by city slug. Hand-curated for the current 35
// live cities. When a new city goes live, append a row here and the
// /cities filters will start grouping it automatically.

export type Continent =
  | "Europe"
  | "North America"
  | "South America"
  | "Asia"
  | "Oceania"
  | "Africa";

export type GeoMeta = { continent: Continent; country: string };

const META: Record<string, GeoMeta> = {
  // Europe
  "specialty-coffee-dublin": { continent: "Europe", country: "Ireland" },
  "best-coffee-in-amsterdam": { continent: "Europe", country: "Netherlands" },
  "best-coffee-in-barcelona": { continent: "Europe", country: "Spain" },
  "best-coffee-in-brussels": { continent: "Europe", country: "Belgium" },
  "best-coffee-copenhagen": { continent: "Europe", country: "Denmark" },
  "best-coffee-in-lisbon": { continent: "Europe", country: "Portugal" },
  "best-coffee-in-madrid": { continent: "Europe", country: "Spain" },
  "best-coffee-in-oslo": { continent: "Europe", country: "Norway" },
  "best-coffee-in-stockholm": { continent: "Europe", country: "Sweden" },
  "best-coffee-manchester": { continent: "Europe", country: "United Kingdom" },
  "best-coffee-shops-in-london": { continent: "Europe", country: "United Kingdom" },
  "best-coffee-shops-in-paris-france": { continent: "Europe", country: "France" },
  "best-coffee-shops-in-prague": { continent: "Europe", country: "Czechia" },
  "coffee-shops-glasgow": { continent: "Europe", country: "United Kingdom" },
  "coffee-shops-leeds": { continent: "Europe", country: "United Kingdom" },
  "specialty-coffee-berlin": { continent: "Europe", country: "Germany" },
  "specialty-coffee-helsinki": { continent: "Europe", country: "Finland" },
  "specialty-coffee-porto": { continent: "Europe", country: "Portugal" },
  "specialty-coffee-shop-munich": { continent: "Europe", country: "Germany" },
  "specialty-coffee-vienna": { continent: "Europe", country: "Austria" },
  "specialty-coffee-zurich": { continent: "Europe", country: "Switzerland" },

  // North America
  "best-coffee-in-austin": { continent: "North America", country: "United States" },
  "best-coffee-in-chicago": { continent: "North America", country: "United States" },
  "best-coffee-in-seattle": { continent: "North America", country: "United States" },
  "best-coffee-shops-in-new-york": { continent: "North America", country: "United States" },
  "best-coffee-shops-in-toronto": { continent: "North America", country: "Canada" },
  "best-coffee-shops-san-diego": { continent: "North America", country: "United States" },
  "best-specialty-coffee-los-angeles": { continent: "North America", country: "United States" },
  "coffee-shops-ottawa": { continent: "North America", country: "Canada" },
  "good-coffee-shops-in-vancouver": { continent: "North America", country: "Canada" },
  "portland-coffee-roasters": { continent: "North America", country: "United States" },
  "specialty-coffee-mexico-city-mexico": { continent: "North America", country: "Mexico" },

  // South America
  "specialty-coffee-bogota-colombia": { continent: "South America", country: "Colombia" },
  "specialty-coffee-buenos-aires-argentina": { continent: "South America", country: "Argentina" },
  "best-coffee-sao-paulo": { continent: "South America", country: "Brazil" },
  "coffee-rio-de-janeiro": { continent: "South America", country: "Brazil" },

  // Asia
  "specialty-coffee-hong-kong": { continent: "Asia", country: "Hong Kong" },
  "specialty-coffee-taipei-taiwan": { continent: "Asia", country: "Taiwan" },
  "specialty-coffee-dubai": { continent: "Asia", country: "United Arab Emirates" },
  "best-coffee-seoul": { continent: "Asia", country: "South Korea" },
  "coffee-shops-in-riyadh-9db9a": { continent: "Asia", country: "Saudi Arabia" },
  "specialty-coffee-bangkok": { continent: "Asia", country: "Thailand" },
  "specialty-coffee-singapore": { continent: "Asia", country: "Singapore" },
  "specialty-coffee-tokyo-japan": { continent: "Asia", country: "Japan" },

  // Oceania
  "best-cafes-in-christchurch": { continent: "Oceania", country: "New Zealand" },
  "best-coffee-in-auckland": { continent: "Oceania", country: "New Zealand" },
  "best-coffee-in-sydney": { continent: "Oceania", country: "Australia" },
  "good-coffee-melbourne": { continent: "Oceania", country: "Australia" },

  // Africa
  "best-coffee-shops-in-cape-town": { continent: "Africa", country: "South Africa" },
};

// Cities present on the Webflow API but currently unpublished (so they
// don't appear in the sitemap) — keep this here so when they're published
// later they auto-pick up the meta. Add freely.
const FUTURE_CITIES: Record<string, GeoMeta> = {
  // (none today)
};

export function getCityGeo(slug: string): GeoMeta {
  return META[slug] ?? FUTURE_CITIES[slug] ?? { continent: "Europe", country: "Unknown" };
}

const COUNTRY_FLAGS: Record<string, string> = {
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
