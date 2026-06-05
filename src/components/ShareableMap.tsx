import Link from "next/link";
import type { MapPoint } from "@/lib/geo-points";
import { googleMapsRouteUrl, MAPS_ROUTE_CAP } from "@/lib/maps-export";
import { CityMapLazy } from "@/components/CityMapLazy";
import { ShareButtons } from "@/components/ShareButtons";

const SITE = "https://www.localspecialtycoffee.com";

/**
 * The lead-magnet deliverable: a clean, near-full-screen, auto-generated map of
 * curated spots. Replaces a hand-built Google Maps list — it's always live, and
 * bridges into Google Maps two ways (a native walking-route deep link + a KML
 * you import once into Google My Maps).
 */
export function ShareableMap({
  points,
  title,
  subtitle,
  slug,
  fullGuideHref,
}: {
  points: MapPoint[];
  title: string;
  subtitle: string;
  /** identifies the KML endpoint + share campaign; "all" for the global map. */
  slug: string;
  fullGuideHref?: string;
}) {
  // A walking route only makes sense within a single city — across the global
  // map the first 10 points span continents (Dubai → Taipei → …), so a route
  // is meaningless there. Per-city: show it; global: browse + KML instead.
  const isCity = slug !== "all";
  const routeUrl = isCity ? googleMapsRouteUrl(points) : null;
  const overCap = isCity && points.length > MAPS_ROUTE_CAP;
  const pagePath = slug === "all" ? "/map" : `/map/${slug}`;

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col gap-3 mb-5">
          <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
          <p className="text-muted max-w-2xl">{subtitle}</p>
        </div>

        {/* Action bar — the two real bridges into Google Maps + share */}
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          {routeUrl && (
            <a
              href={routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-coral-bright text-ink font-bold px-5 py-2.5 hover:bg-coral hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 000-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 011-1h5V7.5l3.5 3.5z" />
              </svg>
              Open route in Google Maps
            </a>
          )}
          <a
            href={`/api/kml/${slug}`}
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink text-ink font-semibold px-5 py-2.5 hover:bg-ink hover:text-white transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Save to Google My Maps (.kml)
          </a>
        </div>
        {overCap && (
          <p className="text-xs text-muted mb-4 -mt-2">
            The Google Maps route shows the first {MAPS_ROUTE_CAP} stops (Google&apos;s limit) — the
            map below and the .kml include all {points.length}.
          </p>
        )}

        <CityMapLazy points={points} className="h-[72vh] min-h-[420px] w-full rounded-3xl border border-blush" />

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <ShareButtons
            url={`${SITE}${pagePath}`}
            title={`☕ ${title} — open the live coffee map:`}
            campaign={slug === "all" ? "map_all" : `map_${slug}`}
            label="Share this map"
          />
          {fullGuideHref && (
            <Link href={fullGuideHref} className="text-coral font-semibold hover:underline shrink-0">
              See the full written guide →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
