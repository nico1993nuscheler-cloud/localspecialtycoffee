import type { Metadata } from "next";
import { getAllCities, getAllMapPoints } from "@/lib/data";
import { ShareableMap } from "@/components/ShareableMap";
import { BRAND } from "@/lib/brand";

export const revalidate = 86400;

const SITE = "https://www.localspecialtycoffee.com";

export async function generateMetadata(): Promise<Metadata> {
  // withDbRetry covers a cold Supabase; on a persistent outage fall back to a
  // 0-count description so metadata collection doesn't abort the build.
  const points = await getAllMapPoints().catch(() => []);
  const title = "The Specialty Coffee Map — Every Spot in One Place";
  const description = `Every specialty café and roaster we've curated worldwide (${points.length} and counting), on one live map. Open it in Google Maps or save it for your next trip.`;
  return {
    title,
    description,
    alternates: { canonical: "/map" },
    openGraph: { title, description, images: [BRAND.brewtifulMapVisual] },
  };
}

export default async function GlobalMapPage() {
  // BUILD RESILIENCE: withDbRetry rides out a cold Supabase; on a persistent
  // outage degrade to an empty map rather than aborting the build. ISR refills
  // it once the DB is reachable.
  let points: Awaited<ReturnType<typeof getAllMapPoints>> = [];
  let cities: Awaited<ReturnType<typeof getAllCities>> = [];
  try {
    [points, cities] = await Promise.all([getAllMapPoints(), getAllCities()]);
  } catch (err) {
    console.error("[/map] Supabase unreachable after retries; rendering empty map. Error:", err);
  }
  const cityCount = new Set(points.map((p) => p.citySlug)).size;

  // ItemList of every covered city (linking to its map) — gives the global map
  // real machine-readable structure instead of a bare WebGL shell.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Specialty coffee cities on the map",
    numberOfItems: cities.length,
    itemListElement: cities.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/map/${c.slug}`,
      name: c.name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <ShareableMap
        points={points}
        slug="all"
        title="The Local Specialty Coffee Map"
        subtitle={`Every spot we've curated — ${points.length} specialty cafés and roasters across ${cityCount} cities, on one live map. It updates itself as we add places, so the link never goes stale.`}
        seoBody={`From Amsterdam to Tokyo, this is every specialty coffee shop and roaster we've hand-picked — ${points.length} spots across ${cityCount} cities, plotted on a single interactive map. Pan the globe, tap any pin for the café and directions, or save the whole map to take it with you. Looking for one city? Open its dedicated coffee map for a walking-route crawl.`}
      />
    </>
  );
}
