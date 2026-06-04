"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/lib/geo-points";

// Client-only shim: MapLibre touches window/WebGL and must not SSR. Keeping the
// dynamic({ ssr:false }) call in a "use client" module lets server pages embed
// the map without pulling MapLibre (~200KB) into their initial bundle.
const CityMap = dynamic(() => import("./CityMap").then((m) => m.CityMap), {
  ssr: false,
  loading: () => (
    <div className="h-[440px] w-full animate-pulse rounded-3xl border border-blush bg-blush/40" />
  ),
});

export function CityMapLazy(props: {
  points: MapPoint[];
  focusBounds?: [number, number, number, number] | null;
  className?: string;
}) {
  return <CityMap {...props} />;
}
