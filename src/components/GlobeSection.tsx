"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { City } from "@/lib/types";
import type { GlobeCity } from "./Globe";
import { CitySearch } from "./CitySearch";

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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Selecting a city (globe pin or search) always opens that city's full guide —
  // the written report at /cities/[slug] is the primary destination, not the map.
  const goToCity = (slug: string) => router.push(`/cities/${slug}`);

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
            Spin the globe and tap a city to open its specialty coffee guide.
          </p>
        </div>

        <div ref={sentinelRef} className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="order-1">
            {mounted ? (
              <Globe cities={cities} onSelectCity={goToCity} />
            ) : (
              <div className="mx-auto aspect-square w-full max-w-[560px]" />
            )}
          </div>

          <div className="order-2">
            <p className="mb-3 text-sm font-medium text-muted">
              Or jump straight to a city:
            </p>
            {/* No onSelect → CitySearch renders real <a> links to /cities/[slug]
                (the guide), which is also better for SEO crawlability. */}
            <CitySearch cities={citiesForSearch} />
          </div>
        </div>
      </div>
    </section>
  );
}
