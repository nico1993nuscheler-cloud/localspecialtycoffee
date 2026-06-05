import Image from "next/image";
import Link from "next/link";

/**
 * Clean discovery card (design "C"). One per city — used on the homepage
 * "Featured cities" section and the /cities index. Two distinct CTAs:
 *   - "Open the map" → the city's live map (/map/[slug])
 *   - "Read the guide" → the written city guide (/cities/[slug])
 * so the card can't be a single wrapping <Link>. Pure presentational; safe to
 * render inside the client filter grids.
 */
export function CityDiscoveryCard({
  slug,
  name,
  count,
  imageUrl,
  excerpt,
}: {
  slug: string;
  name: string;
  count: number;
  imageUrl?: string | null;
  excerpt?: string | null;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-blush bg-white transition-all hover:border-coral hover:shadow-md">
      <Link href={`/map/${slug}`} className="relative block aspect-[16/10] bg-blush" aria-label={`Open the ${name} coffee map`}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={`Specialty coffee in ${name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm backdrop-blur-sm">
          {count} spots · mapped
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug">
          Find the best Specialty Coffee places in {name}
        </h3>
        {excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{excerpt}</p>}

        <div className="mt-4 flex flex-wrap gap-2 pt-1">
          <Link
            href={`/map/${slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-coral-bright px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-coral hover:text-white"
          >
            Open the map <span aria-hidden>→</span>
          </Link>
          <Link
            href={`/cities/${slug}`}
            className="inline-flex items-center rounded-full border-2 border-ink px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
          >
            Read the guide
          </Link>
        </div>
      </div>
    </div>
  );
}
