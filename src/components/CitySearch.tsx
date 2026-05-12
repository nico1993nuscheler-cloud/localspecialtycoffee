"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BRAND } from "@/lib/brand";
import type { City } from "@/lib/types";

export function CitySearch({ cities }: { cities: Pick<City, "slug" | "name">[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return cities.slice(0, 9);
    return cities.filter((c) => c.name.toLowerCase().includes(t)).slice(0, 12);
  }, [q, cities]);

  return (
    <div id="city-search" className="bg-white rounded-3xl border border-blush shadow-sm p-2 md:p-3 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-blush">
        <Image src={BRAND.searchLoupe} alt="" width={20} height={20} unoptimized className="opacity-60" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for City or Region"
          className="flex-1 bg-transparent outline-none placeholder:text-muted text-lg"
          aria-label="Search cities"
        />
      </div>
      <ul className="max-h-80 overflow-y-auto py-2">
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-muted text-sm">
            No cities match &quot;{q}&quot;. <Link href="/cities" className="text-coral underline">Browse all cities</Link>
          </li>
        )}
        {filtered.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/cities/${c.slug}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-blush transition-colors"
            >
              <Image src={BRAND.highlightArrow} alt="" width={16} height={16} unoptimized />
              <span className="font-medium">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
