import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCities, getCityBySlug, getPlacesInCity } from "@/lib/data";
import { placesToMapPoints } from "@/lib/geo-points";
import { ShareableMap } from "@/components/ShareableMap";
import type { PlaceWithRefs } from "@/lib/types";

export const dynamicParams = true;
export const revalidate = 86400;

const SITE = "https://www.localspecialtycoffee.com";

export async function generateStaticParams() {
  return (await getAllCities()).map((c) => ({ slug: c.slug }));
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// Category mix, e.g. "8 specialty coffee shops, 2 coffee roasters and 1 barista
// course" — unique per city, so the map page isn't a thin echo of the guide.
function categoryMix(places: PlaceWithRefs[]): string {
  const byCat = new Map<string, number>();
  for (const p of places) {
    const name = p.category?.name ?? "Specialty Coffee Shop";
    byCat.set(name, (byCat.get(name) ?? 0) + 1);
  }
  const parts = [...byCat.entries()].map(([name, n]) => `${n} ${name.toLowerCase()}${n === 1 ? "" : "s"}`);
  return listJoin(parts);
}

function seoBodyFor(cityName: string, places: PlaceWithRefs[]): string {
  const mix = categoryMix(places);
  const names = places.slice(0, 3).map((p) => p.name);
  const standouts = names.length ? ` Standout stops include ${listJoin(names)}.` : "";
  return `${cityName}'s specialty coffee scene, mapped: ${places.length} spots${mix ? ` — ${mix} —` : ""} plotted across the city. Tap any pin for opening hours, the flavour profile and one-tap directions; open the whole crawl as a walking route in Google Maps; or save the pins to your own Google Map for the trip.${standouts}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  const count = (await getPlacesInCity(city.webflow_id)).length;
  const title = `${city.name} Coffee Map — ${count} Specialty Spots, Mapped`;
  const description = `Interactive map of ${count} specialty coffee shops & roasters in ${city.name}: pins with directions, a walking-crawl route, and a Google Map you can save for your trip.`;
  return {
    title,
    description,
    alternates: { canonical: `/map/${city.slug}` },
    openGraph: {
      title,
      description,
      images: city.featured_image_url ? [city.featured_image_url] : undefined,
    },
  };
}

export default async function CityMapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return notFound();
  const places = await getPlacesInCity(city.webflow_id);
  const points = placesToMapPoints(places);

  // Distinct map/navigation intent (vs the editorial guide), with its own
  // ItemList + breadcrumb so it can earn its own ranking instead of competing
  // thin with /cities/[slug].
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Specialty coffee spots on the ${city.name} map`,
    numberOfItems: places.length,
    itemListElement: places.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/specialty-coffee-place/${p.slug}`,
      name: p.name,
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: `${city.name} guide`, item: `${SITE}/cities/${city.slug}` },
      { "@type": "ListItem", position: 3, name: `${city.name} coffee map`, item: `${SITE}/map/${city.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ShareableMap
        points={points}
        slug={city.slug}
        title={`${city.name} Specialty Coffee Map`}
        subtitle={`All ${places.length} specialty spots we've hand-picked in ${city.name}, on one live map. Open the walking route in Google Maps, or save the pins for your trip.`}
        seoBody={seoBodyFor(city.name, places)}
        fullGuideHref={`/cities/${city.slug}`}
      />
    </>
  );
}
