"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { MapPoint } from "@/lib/geo-points";

// Client-only shim: MapLibre touches window/WebGL and must not SSR. Keeping the
// dynamic({ ssr:false }) call in a "use client" module lets server pages embed
// the map without pulling MapLibre (~270KB gz) into their initial bundle.
//
// We additionally gate the dynamic import behind an IntersectionObserver, so on
// a city page MapLibre only downloads once the visitor scrolls near the map —
// it never loads right after hydration for people who don't reach it.
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
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (show || !ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [show]);

  if (show) return <CityMap {...props} />;
  return (
    <div
      ref={ref}
      className={props.className ?? "h-[440px] w-full rounded-3xl border border-blush bg-blush/40"}
      aria-hidden
    />
  );
}
