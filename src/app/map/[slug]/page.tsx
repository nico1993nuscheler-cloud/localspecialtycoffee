import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCities, getCityBySlug, getPlacesInCity } from "@/lib/data";
import { placesToMapPoints } from "@/lib/geo-points";
import { ShareableMap } from "@/components/ShareableMap";

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateStaticParams() {
  return (await getAllCities()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  return {
    title: `${city.name} Specialty Coffee Map — Every Spot in One Place`,
    description: `Every specialty café and roaster we've curated in ${city.name}, on one live map. Open it in Google Maps or save it for your trip.`,
    alternates: { canonical: `/map/${city.slug}` },
  };
}

export default async function CityMapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return notFound();
  const points = placesToMapPoints(await getPlacesInCity(city.webflow_id));

  return (
    <ShareableMap
      points={points}
      slug={city.slug}
      title={`${city.name} Specialty Coffee Map`}
      subtitle={`All ${points.length} specialty spots we've hand-picked in ${city.name}, on one live map. Open the walking route in Google Maps, or save the pins for your trip.`}
      fullGuideHref={`/cities/${city.slug}`}
    />
  );
}
