"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CityMap } from "./CityMap";
import { getCityFlag } from "@/lib/geography";
import { boundsOf, type MapPoint } from "@/lib/geo-points";

// Fetch the full point set once and reuse across opens.
let cache: Promise<MapPoint[]> | null = null;
function loadPoints(): Promise<MapPoint[]> {
  if (!cache) {
    cache = fetch("/api/map-points")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((d) => d.points as MapPoint[])
      .catch((e) => {
        cache = null; // allow retry on next open
        throw e;
      });
  }
  return cache;
}

// Full-screen overlay opened when a city is picked on the globe. Shows a world
// map of EVERY city's cafés, opened zoomed to the chosen city — so you can zoom
// out and roam to other cities. The globe stays mounted underneath.
export function CityMapOverlay({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [points, setPoints] = useState<MapPoint[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    let cancelled = false;
    loadPoints()
      .then((p) => !cancelled && setPoints(p))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Esc to close + lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const cityPoints = useMemo(
    () => (points ?? []).filter((p) => p.citySlug === slug),
    [points, slug],
  );
  const cityName = cityPoints[0]?.cityName ?? "";
  const focusBounds = useMemo(() => boundsOf(cityPoints), [cityPoints]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 md:p-8 motion-safe:animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={cityName ? `Map of ${cityName}` : "City map"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-blush px-4 py-3 md:px-5 md:py-4">
          <h2 className="flex items-center gap-2 text-base font-bold md:text-xl">
            <span aria-hidden className="text-xl leading-none">{getCityFlag(slug)}</span>
            {cityName || "Loading…"}
          </h2>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href={`/cities/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-coral px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-coral-bright hover:text-ink hover:-translate-y-0.5 hover:shadow-md md:px-5"
            >
              <span className="hidden sm:inline">View full city guide</span>
              <span className="sm:hidden">City guide</span>
              <span aria-hidden>→</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close map"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blush text-ink hover:bg-blush"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="relative flex-1">
          {error ? (
            <div className="flex h-full items-center justify-center p-8 text-center text-muted">
              Couldn’t load the map.{" "}
              <Link href={`/cities/${slug}`} className="ml-1 text-coral underline">
                Open the city page →
              </Link>
            </div>
          ) : points === null ? (
            <div className="h-full w-full animate-pulse bg-blush/40" />
          ) : (
            <CityMap points={points} focusBounds={focusBounds} className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
