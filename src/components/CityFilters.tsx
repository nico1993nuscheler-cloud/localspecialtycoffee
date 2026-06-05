"use client";

import { useMemo, useState } from "react";
import type { City } from "@/lib/types";
import { ALL_CONTINENTS, getCityGeo, type Continent } from "@/lib/geography";
import { CityDiscoveryCard } from "./CityDiscoveryCard";

type CityWithCount = City & { _count: number };

export function CityFilters({ cities }: { cities: CityWithCount[] }) {
  const [continent, setContinent] = useState<Continent | "all">("all");
  const [country, setCountry] = useState<string | "all">("all");
  const [q, setQ] = useState("");

  const countriesByContinent = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const c of cities) {
      const geo = getCityGeo(c.slug);
      (map[geo.continent] ||= new Set()).add(geo.country);
    }
    return map;
  }, [cities]);

  const availableCountries = useMemo(() => {
    if (continent === "all") {
      const all = new Set<string>();
      Object.values(countriesByContinent).forEach((set) => set.forEach((c) => all.add(c)));
      return [...all].sort();
    }
    return [...(countriesByContinent[continent] ?? [])].sort();
  }, [continent, countriesByContinent]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return cities.filter((c) => {
      const geo = getCityGeo(c.slug);
      if (continent !== "all" && geo.continent !== continent) return false;
      if (country !== "all" && geo.country !== country) return false;
      if (t && !c.name.toLowerCase().includes(t) && !geo.country.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [cities, continent, country, q]);

  const reset = () => {
    setContinent("all");
    setCountry("all");
    setQ("");
  };
  const anyActive = continent !== "all" || country !== "all" || q.trim() !== "";

  return (
    <>
      <div className="bg-white rounded-2xl border border-blush p-4 md:p-5 mb-8 grid gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 border border-blush rounded-full px-4 py-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted shrink-0">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by city or country"
            className="flex-1 bg-transparent outline-none placeholder:text-muted text-sm"
            aria-label="Search cities"
          />
        </div>

        {/* Continent tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted mr-1">Continent:</span>
          <button
            type="button"
            onClick={() => { setContinent("all"); setCountry("all"); }}
            className={chip(continent === "all")}
            aria-pressed={continent === "all"}
          >
            All
          </button>
          {ALL_CONTINENTS.map((c) =>
            countriesByContinent[c] ? (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setContinent(continent === c ? "all" : c);
                  setCountry("all");
                }}
                className={chip(continent === c)}
                aria-pressed={continent === c}
              >
                {c}
              </button>
            ) : null,
          )}
        </div>

        {/* Country dropdown */}
        {availableCountries.length > 1 && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs uppercase tracking-wider text-muted">Country:</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-full border border-blush bg-white px-4 py-2 text-sm font-medium focus:outline-none focus:border-coral"
            >
              <option value="all">All countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-2 border-t border-blush">
          <p>
            <span className="font-bold text-ink">{filtered.length}</span>
            <span className="text-muted"> of {cities.length} cities</span>
          </p>
          {anyActive && (
            <button type="button" onClick={reset} className="text-coral hover:underline font-medium">
              Reset filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-blush/40 rounded-2xl p-10 text-center">
          <p className="text-lg font-medium mb-2">No cities match those filters.</p>
          <button type="button" onClick={reset} className="text-coral hover:underline font-medium">
            Reset and try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((city) => (
            <CityDiscoveryCard
              key={city.webflow_id}
              slug={city.slug}
              name={city.name}
              count={city._count}
              imageUrl={city.thumbnail_v1_url}
              excerpt={city.excerpt_short}
            />
          ))}
        </div>
      )}
    </>
  );
}

function chip(active: boolean) {
  const base = "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors";
  return active
    ? `${base} bg-coral text-white border-coral`
    : `${base} bg-white text-ink border-blush hover:border-coral`;
}
