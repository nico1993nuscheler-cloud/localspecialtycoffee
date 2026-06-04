"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { MapPoint } from "@/lib/geo-points";

// Compact preview card rendered inside a MapLibre popup (~260px). Mirrors
// PlaceCard's look (image, category pill, name, flavour, "See more").
export function MapPlacePopup({ point }: { point: MapPoint }) {
  const icon = BRAND.categoryIcons[point.categorySlug];
  return (
    <Link
      href={`/specialty-coffee-place/${point.slug}`}
      className="group block w-[230px] overflow-hidden rounded-2xl bg-white"
    >
      {/* Compact (~180px tall total) so the popup fits inside the map card even
       *  when the pin is near an edge — MapLibre auto-flips to the side with room. */}
      <div className="relative h-[92px] w-full bg-blush">
        {point.img && (
          <Image
            src={point.img}
            alt={`${point.name} — ${point.categoryName.toLowerCase()} in ${point.cityName}`}
            fill
            sizes="230px"
            className="object-cover"
            unoptimized
          />
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 shadow-sm">
          {icon && <Image src={icon} alt="" width={12} height={12} unoptimized className="h-3 w-3" />}
          <span className="text-[10px] font-semibold text-ink">{point.categoryName}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="text-sm font-bold leading-snug line-clamp-1">{point.name}</h3>
        {point.flavour && <p className="line-clamp-2 text-[11px] leading-snug text-muted">{point.flavour}</p>}
        <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full border border-ink px-2.5 py-0.5 text-[11px] font-medium transition-colors group-hover:bg-ink group-hover:text-white">
          See more <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
