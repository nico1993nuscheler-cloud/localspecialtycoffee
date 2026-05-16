"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import type { City } from "@/lib/types";
import { getCityFlag, getCityGeo, type Continent } from "@/lib/geography";

type Item = {
  slug: string;
  name: string;
  country: string;
  continent: Continent;
  flag: string;
};

const MAX_SEARCH_RESULTS = 20;

export function CitySearch({ cities }: { cities: Pick<City, "slug" | "name">[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const items: Item[] = useMemo(
    () =>
      cities.map((c) => {
        const geo = getCityGeo(c.slug);
        return {
          slug: c.slug,
          name: c.name,
          country: geo.country,
          continent: geo.continent,
          flag: getCityFlag(c.slug),
        };
      }),
    [cities],
  );

  const { grouped, flat } = useMemo(() => {
    const t = q.trim().toLowerCase();

    if (!t) {
      const byContinent = new Map<Continent, Item[]>();
      for (const it of items) {
        if (!byContinent.has(it.continent)) byContinent.set(it.continent, []);
        byContinent.get(it.continent)!.push(it);
      }
      const groups = [...byContinent.keys()]
        .sort((a, b) => a.localeCompare(b))
        .map((c) => ({
          continent: c,
          items: byContinent
            .get(c)!
            .slice()
            .sort(
              (a, b) =>
                a.country.localeCompare(b.country) || a.name.localeCompare(b.name),
            ),
        }));
      const flatList = groups.flatMap((g) => g.items);
      return { grouped: groups, flat: flatList };
    }

    // Tier 0: name starts with query (best). Tier 1: name contains. Tier 2: country. Tier 3: continent.
    const tier = (it: Item): number => {
      const n = it.name.toLowerCase();
      if (n.startsWith(t)) return 0;
      if (n.includes(t)) return 1;
      if (it.country.toLowerCase().includes(t)) return 2;
      if (it.continent.toLowerCase().includes(t)) return 3;
      return -1;
    };

    const ranked = items
      .map((it) => ({ it, rank: tier(it) }))
      .filter((x) => x.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.it.name.localeCompare(b.it.name))
      .slice(0, MAX_SEARCH_RESULTS)
      .map((x) => x.it);

    return { grouped: null as null | { continent: Continent; items: Item[] }[], flat: ranked };
  }, [q, items]);

  const slugToIdx = useMemo(() => {
    const m = new Map<string, number>();
    flat.forEach((it, i) => m.set(it.slug, i));
    return m;
  }, [flat]);

  const safeActive = flat.length ? Math.min(activeIndex, flat.length - 1) : 0;

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${safeActive}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const item = flat[safeActive];
      if (item) {
        e.preventDefault();
        router.push(`/cities/${item.slug}`);
      }
    } else if (e.key === "Escape") {
      setQ("");
    }
  };

  const rowClass = (i: number) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
      i === safeActive ? "bg-blush" : "hover:bg-blush"
    }`;

  const renderRow = (it: Item, idx: number) => (
    <li key={it.slug}>
      <Link
        href={`/cities/${it.slug}`}
        data-row={idx}
        onMouseEnter={() => setActiveIndex(idx)}
        className={rowClass(idx)}
      >
        <span className="text-lg leading-none" aria-hidden>
          {it.flag}
        </span>
        <span className="font-medium">{it.name}</span>
        <span className="text-sm text-muted ml-auto">{it.country}</span>
      </Link>
    </li>
  );

  return (
    <div
      id="city-search"
      className="bg-white rounded-3xl border border-blush shadow-sm p-2 md:p-3 max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-blush">
        <Image
          src={BRAND.searchLoupe}
          alt=""
          width={20}
          height={20}
          unoptimized
          className="opacity-60"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search for city, country, or region"
          className="flex-1 bg-transparent outline-none placeholder:text-muted text-lg"
          aria-label="Search cities, countries, or regions"
          aria-autocomplete="list"
        />
      </div>

      <ul ref={listRef} className="max-h-[28rem] overflow-y-auto py-2" role="listbox">
        {flat.length === 0 ? (
          <li className="px-4 py-6 text-center text-muted text-sm">
            No cities match &quot;{q}&quot;.{" "}
            <Link href="/submissions" className="text-coral underline font-medium">
              Suggest one →
            </Link>
          </li>
        ) : grouped ? (
          grouped.map((g) => (
            <li key={g.continent}>
              <div className="sticky top-0 bg-white px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {g.continent}
              </div>
              <ul>{g.items.map((it) => renderRow(it, slugToIdx.get(it.slug) ?? 0))}</ul>
            </li>
          ))
        ) : (
          flat.map((it, idx) => renderRow(it, idx))
        )}
      </ul>
    </div>
  );
}
