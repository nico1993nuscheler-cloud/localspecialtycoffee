"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import { PlaceCard } from "@/components/PlaceCard";
import type { Category, PlaceWithRefs } from "@/lib/types";

/**
 * Trending block on the homepage. Picks a random subset of `pool` each
 * page load. With category chips, the user can scope the pool to one of
 * the three categories before reshuffling.
 *
 * Until a real is_featured / curation flag exists in the CMS, the random
 * picks rotate the homepage every visit (page load = new shuffle).
 */
export function TrendingShuffle({
  pool,
  categories,
  count = 6,
}: {
  pool: PlaceWithRefs[];
  categories: Category[];
  count?: number;
}) {
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [tick, setTick] = useState(0);

  const filtered = useMemo(
    () => activeCategory === "all"
      ? pool
      : pool.filter((p) => p.category.slug === activeCategory),
    [pool, activeCategory],
  );

  const [items, setItems] = useState<PlaceWithRefs[]>(() => filtered.slice(0, count));

  // Reshuffle when pool/category/tick change, but only on the client.
  useEffect(() => {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, count);
    setItems(shuffled);
  }, [filtered, count, tick]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8" role="tablist" aria-label="Filter trending places by category">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={chipClass(activeCategory === "all")}
          aria-pressed={activeCategory === "all"}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setActiveCategory(activeCategory === c.slug ? "all" : c.slug)}
            className={chipClass(activeCategory === c.slug)}
            aria-pressed={activeCategory === c.slug}
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
            {c.name}s
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-muted hover:text-coral px-3 py-1.5"
          aria-label="Reshuffle"
          title="Reshuffle"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M8 21H3v-5"/><path d="M3 21l7-7"/>
          </svg>
          Reshuffle
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-muted py-12">
          No spots in this category yet — coming soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <PlaceCard key={p.webflow_id} place={p} showCity />
          ))}
        </div>
      )}
    </>
  );
}

function chipClass(active: boolean) {
  const base = "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors";
  return active
    ? `${base} bg-coral text-white border-coral`
    : `${base} bg-white text-ink border-blush hover:border-coral`;
}
