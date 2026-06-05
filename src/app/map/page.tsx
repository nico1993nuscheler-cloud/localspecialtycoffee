import type { Metadata } from "next";
import { getAllMapPoints } from "@/lib/data";
import { ShareableMap } from "@/components/ShareableMap";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const points = await getAllMapPoints();
  return {
    title: "The Specialty Coffee Map — Every Spot in One Place",
    description: `Every specialty café and roaster we've curated worldwide (${points.length} and counting), on one live map. Open it in Google Maps or save it for your next trip.`,
    alternates: { canonical: "/map" },
  };
}

export default async function GlobalMapPage() {
  const points = await getAllMapPoints();
  return (
    <ShareableMap
      points={points}
      slug="all"
      title="The Local Specialty Coffee Map"
      subtitle={`Every spot we've curated — ${points.length} specialty cafés and roasters across ${new Set(points.map((p) => p.citySlug)).size} cities, on one live map. It updates itself as we add places, so the link never goes stale.`}
    />
  );
}
