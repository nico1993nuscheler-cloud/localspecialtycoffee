import Link from "next/link";
import type { PlaceWithRefs } from "@/lib/types";
import { LANDING_FEATURES } from "@/lib/landing-features";

/**
 * Internal-linking rail shown on a city page that points to all the
 * programmatic landing pages (work-friendly / single-origin / etc.) which
 * actually have matches in that city.
 *
 * Pure server component — both because the data is static and because the
 * links are crucial for SEO crawler discovery of /cities/[slug]/[feature].
 */
export function CityFeatureLinks({
  citySlug,
  cityName,
  places,
}: {
  citySlug: string;
  cityName: string;
  places: PlaceWithRefs[];
}) {
  const items = LANDING_FEATURES.map((f) => ({
    ...f,
    count: places.filter((p) => (p as unknown as Record<string, boolean>)[f.boolean]).length,
  })).filter((f) => f.count > 0);

  if (items.length === 0) return null;

  return (
    <section className="py-14 bg-blush/30">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Browse {cityName} by feature
        </h2>
        <p className="text-muted mb-6">
          Curated subsets for specific moods — work-friendly, single-origin, outdoor seating and more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((f) => (
            <Link
              key={f.slug}
              href={`/cities/${citySlug}/${f.slug}`}
              className="group flex items-center justify-between bg-white border border-blush hover:border-coral rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span>
                <span className="font-semibold block">{f.label}</span>
                <span className="text-xs text-muted">in {cityName}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-coral">
                {f.count} <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
