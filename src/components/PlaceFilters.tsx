"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { PlaceCard } from "@/components/PlaceCard";
import type { Category, City, PlaceWithRefs } from "@/lib/types";

type FeatureKey =
  | "in_house_roasting"
  | "single_origin"
  | "hand_brews"
  | "cold_brew"
  | "alt_milk"
  | "work_friendly"
  | "outdoor_seating"
  | "pet_friendly"
  | "ships_internationally"
  | "subscription";

const FEATURES: { key: FeatureKey; label: string }[] = [
  { key: "in_house_roasting", label: "In-house roasting" },
  { key: "single_origin", label: "Single origin" },
  { key: "hand_brews", label: "Hand-brews" },
  { key: "cold_brew", label: "Cold brew" },
  { key: "alt_milk", label: "Alt milk" },
  { key: "work_friendly", label: "Work-friendly" },
  { key: "outdoor_seating", label: "Outdoor seating" },
  { key: "pet_friendly", label: "Pet friendly" },
  { key: "ships_internationally", label: "Ships beans worldwide" },
  { key: "subscription", label: "Coffee subscription" },
];

export function PlaceFilters({
  places,
  mode,
  categories,
  cities,
  showCityOnCard = false,
}: {
  places: PlaceWithRefs[];
  mode: "city" | "category";
  categories?: Category[];
  cities?: City[];
  showCityOnCard?: boolean;
}) {
  const [categorySlug, setCategorySlug] = useState<string | "all">("all");
  const [citySlug, setCitySlug] = useState<string | "all">("all");
  const [activeFeatures, setActiveFeatures] = useState<Set<FeatureKey>>(new Set());

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (mode === "city" && categorySlug !== "all" && p.category.slug !== categorySlug) return false;
      if (mode === "category" && citySlug !== "all" && p.city.slug !== citySlug) return false;
      for (const f of activeFeatures) {
        if (!(p as unknown as Record<string, boolean>)[f]) return false;
      }
      return true;
    });
  }, [places, mode, categorySlug, citySlug, activeFeatures]);

  const toggleFeature = (k: FeatureKey) => {
    setActiveFeatures((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const reset = () => {
    setCategorySlug("all");
    setCitySlug("all");
    setActiveFeatures(new Set());
  };

  const anyActive = categorySlug !== "all" || citySlug !== "all" || activeFeatures.size > 0;

  return (
    <>
      <div className="bg-white rounded-2xl border border-blush p-4 md:p-5 mb-8">
        {/* Primary filter row */}
        {mode === "city" && categories && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setCategorySlug("all")}
              className={chipClass(categorySlug === "all")}
              aria-pressed={categorySlug === "all"}
            >
              All categories
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategorySlug(categorySlug === c.slug ? "all" : c.slug)}
                className={chipClass(categorySlug === c.slug)}
                aria-pressed={categorySlug === c.slug}
              >
                {BRAND.categoryIcons[c.slug] && (
                  <Image
                    src={BRAND.categoryIcons[c.slug]}
                    alt=""
                    width={14}
                    height={14}
                    unoptimized
                    className="w-3.5 h-3.5"
                  />
                )}
                {c.name}
              </button>
            ))}
          </div>
        )}

        {mode === "category" && cities && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="text-sm font-semibold text-muted">Filter by city</label>
            <select
              value={citySlug}
              onChange={(e) => setCitySlug(e.target.value)}
              className="rounded-full border border-blush bg-white px-4 py-2 text-sm font-medium focus:outline-none focus:border-coral"
            >
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Feature chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted mr-1">Features:</span>
          {FEATURES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleFeature(f.key)}
              className={chipClass(activeFeatures.has(f.key), "sm")}
              aria-pressed={activeFeatures.has(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Result row */}
        <div className="mt-4 pt-4 border-t border-blush flex items-center justify-between text-sm">
          <p>
            <span className="font-bold text-ink">{filtered.length}</span>
            <span className="text-muted"> of {places.length} spots</span>
          </p>
          {anyActive && (
            <button
              type="button"
              onClick={reset}
              className="text-coral hover:underline font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-blush/40 rounded-2xl p-10 text-center">
          <p className="text-lg font-medium mb-2">No spots match your filters.</p>
          <button type="button" onClick={reset} className="text-coral hover:underline font-medium">
            Reset and try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <PlaceCard key={p.webflow_id} place={p} showCity={showCityOnCard} />
          ))}
        </div>
      )}
    </>
  );
}

function chipClass(active: boolean, size: "sm" | "md" = "md") {
  const base =
    size === "sm"
      ? "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      : "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors";
  return active
    ? `${base} bg-coral text-white border-coral`
    : `${base} bg-white text-ink border-blush hover:border-coral`;
}
