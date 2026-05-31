import Link from "next/link";
import Image from "next/image";
import type { City } from "@/lib/types";

// Priority slugs — these are the "almost-on-page-1" cities the GSC export
// (May 31, 2026) flagged as highest-ROI lift candidates. Weighting them
// here pushes link equity from every sibling city page toward them.
const PRIORITY_SLUGS = new Set<string>([
  "coffee-rio-de-janeiro",
  "best-coffee-seoul",
  "best-coffee-sao-paulo",
]);

// Same-continent siblings rank above other continents because related-city
// blocks compound best when geographically relevant (a Rio reader is more
// likely to also explore São Paulo than Stockholm). Continent grouping
// comes from src/lib/geography.ts.
import { getCityGeo } from "@/lib/geography";

type CityLite = Pick<City, "slug" | "name" | "thumbnail_v3_url">;

export function RelatedCitiesBlock({
  currentSlug,
  allCities,
  countByCity,
  max = 8,
}: {
  currentSlug: string;
  allCities: CityLite[];
  countByCity: Record<string, number>;
  max?: number;
}) {
  const here = getCityGeo(currentSlug);

  const candidates = allCities
    .filter((c) => c.slug !== currentSlug)
    .map((c) => {
      const g = getCityGeo(c.slug);
      const isPriority = PRIORITY_SLUGS.has(c.slug);
      const sameContinent = g.continent === here.continent;
      // Sort key: priority first, then same continent, then placeholder
      // count descending so well-stocked cities sit ahead of empty stubs.
      const score =
        (isPriority ? 1_000_000 : 0) +
        (sameContinent ? 100_000 : 0) +
        (countByCity[c.slug] ?? 0);
      return { city: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ city }) => city);

  if (candidates.length === 0) return null;

  return (
    <section className="py-12 border-t border-blush/60">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-1">More specialty coffee cities</h2>
        <p className="text-muted mb-6">Keep exploring — every city, hand-picked.</p>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {candidates.map((c) => {
            const count = countByCity[c.slug] ?? 0;
            return (
              <li key={c.slug}>
                <Link
                  href={`/cities/${c.slug}`}
                  className="group flex items-center gap-3 rounded-xl p-2 hover:bg-blush/40 transition-colors"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-blush flex-shrink-0">
                    {c.thumbnail_v3_url && (
                      <Image
                        src={c.thumbnail_v3_url}
                        alt={c.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm group-hover:text-coral leading-tight truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted leading-tight mt-0.5">
                      {count > 0 ? `${count} spots` : "Coming soon"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
