"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { City } from "@/lib/types";
import type { GlobeCity } from "./Globe";
import { CitySearch } from "./CitySearch";
import { CityMapOverlay } from "./CityMapOverlay";

// cobe touches WebGL — client-only, lazy. IntersectionObserver defers mounting
// until the section scrolls into view so the globe never weighs on initial JS.
const Globe = dynamic(() => import("./Globe").then((m) => m.Globe), {
  ssr: false,
  loading: () => <div className="mx-auto aspect-square w-full max-w-[560px]" />,
});

type Props = {
  cities: GlobeCity[];
  citiesForSearch: Pick<City, "slug" | "name">[];
};

export function GlobeSection({ cities, citiesForSearch }: Props) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mounted || !sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [mounted]);

  return (
    <section id="explore" className="scroll-mt-24 bg-bg py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold md:text-4xl">Explore Specialty Coffee around the World</h2>
          <p className="text-muted">
            Spin the globe and tap a city to map its specialty scene.
          </p>
        </div>

        <div ref={sentinelRef} className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="order-1">
            {mounted ? (
              <Globe cities={cities} active={!selected} onSelectCity={setSelected} />
            ) : (
              <div className="mx-auto aspect-square w-full max-w-[560px]" />
            )}
          </div>

          <div className="order-2">
            <p className="mb-3 text-sm font-medium text-muted">
              Or jump straight to a city:
            </p>
            <CitySearch cities={citiesForSearch} onSelect={(slug) => setSelected(slug)} />
          </div>
        </div>
      </div>

      {selected && <CityMapOverlay slug={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
