"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { City } from "@/lib/types";
import { ALL_CONTINENTS, getCityGeo, type Continent } from "@/lib/geography";

type CityWithCount = City & { _count: number };

export function FeaturedCitiesGrid({ cities }: { cities: CityWithCount[] }) {
  const [continent, setContinent] = useState<Continent | "all">("all");

  // Which continents actually have cities in our data — keep the rail tight
  const availableContinents = useMemo(() => {
    const set = new Set<Continent>();
    for (const c of cities) set.add(getCityGeo(c.slug).continent);
    return ALL_CONTINENTS.filter((c) => set.has(c));
  }, [cities]);

  // Top 6 by place count within the chosen continent (or globally)
  const visible = useMemo(() => {
    const pool = continent === "all"
      ? cities
      : cities.filter((c) => getCityGeo(c.slug).continent === continent);
    return [...pool].sort((a, b) => b._count - a._count).slice(0, 6);
  }, [cities, continent]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-8" role="tablist" aria-label="Filter featured cities by continent">
        <button
          type="button"
          onClick={() => setContinent("all")}
          className={chipClass(continent === "all")}
          aria-pressed={continent === "all"}
        >
          All
        </button>
        {availableContinents.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setContinent(continent === c ? "all" : c)}
            className={chipClass(continent === c)}
            aria-pressed={continent === c}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center text-muted py-12">
          No cities in {continent} yet — but we&apos;re adding new ones constantly.{" "}
          <Link href="/cities" className="text-coral underline">Browse all cities</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {visible.map((city) => (
            <Link
              key={city.webflow_id}
              href={`/cities/${city.slug}`}
              className="group rounded-2xl overflow-hidden bg-white border border-blush hover:border-coral hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[1080/680] bg-blush relative">
                {city.thumbnail_v2_url && (
                  <Image
                    src={city.thumbnail_v2_url}
                    alt={`Specialty coffee in ${city.name}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-xl mb-1">{city.name}</h3>
                {city.excerpt_short && (
                  <p className="text-sm text-muted line-clamp-2">{city.excerpt_short}</p>
                )}
                <p className="text-xs text-coral mt-3 font-semibold">{city._count} spots →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function chipClass(active: boolean) {
  const base = "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors";
  return active
    ? `${base} bg-coral text-white border-coral`
    : `${base} bg-white text-ink border-blush hover:border-coral`;
}
