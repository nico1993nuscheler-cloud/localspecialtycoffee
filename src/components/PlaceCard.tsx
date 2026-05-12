import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import type { PlaceWithRefs } from "@/lib/types";

export function PlaceCard({ place, showCity = false }: { place: PlaceWithRefs; showCity?: boolean }) {
  const icon = BRAND.categoryIcons[place.category.slug];
  return (
    <Link
      href={`/specialty-coffee-place/${place.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-blush hover:border-coral transition-all"
    >
      <div className="relative aspect-[1216/800] bg-blush">
        {place.thumbnail_v3_url || place.featured_image_url ? (
          <Image
            src={place.thumbnail_v3_url ?? place.featured_image_url ?? ""}
            alt={`${place.name} — ${place.category.name.toLowerCase()} in ${place.city.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : null}

        {/* Category pill */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
          {icon && (
            <Image src={icon} alt="" width={18} height={18} unoptimized className="w-4 h-4" />
          )}
          <span className="text-xs font-semibold text-ink">{place.category.name}</span>
        </div>

        {place.is_featured && (
          <span className="absolute top-4 right-4 bg-coral text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-lg leading-snug">{place.name}</h3>
        {showCity && (
          <p className="flex items-center gap-1 text-sm text-coral">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a8 8 0 00-8 8c0 5.4 7 12 7.3 12.3a1 1 0 001.4 0C13 22 20 15.4 20 10a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
            {place.city.name}
          </p>
        )}
        {place.flavour_profile && (
          <p className="flex items-start gap-2 text-sm text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f36756" className="mt-0.5 shrink-0"><path d="M12 21s-7-4.5-7-11a5 5 0 0110-1 5 5 0 0110 1c0 6.5-7 11-7 11h-6z" transform="translate(-3 0)"/></svg>
            <span className="line-clamp-2">{place.flavour_profile}</span>
          </p>
        )}
        <div className="mt-auto pt-2">
          <span className="inline-flex items-center justify-center border border-ink rounded-full px-4 py-1.5 text-sm font-medium group-hover:bg-ink group-hover:text-white transition-colors">
            See more
          </span>
        </div>
      </div>
    </Link>
  );
}
