import type { Metadata } from "next";
import { getAllCities, getPlacesInCity } from "@/lib/data";
import type { City } from "@/lib/types";
import { CityFilters } from "@/components/CityFilters";

export const metadata: Metadata = {
  title: "Explore Coffee Cities Around the World",
  description:
    "Discover a curated list of cities renowned for their unique coffee scenes. Browse to explore local cafés, roasters, and coffee culture in each destination.",
  alternates: { canonical: "/cities" },
};

export const revalidate = 2592000;

export default async function CitiesPage() {
  // BUILD RESILIENCE: withDbRetry rides out a cold/paused Supabase. If the DB
  // is still unreachable after retries, degrade to an empty list rather than
  // aborting the build; ISR refills this page once the DB is back.
  let cities: Array<City & { _count: number }> = [];
  try {
    const all = await getAllCities();
    cities = await Promise.all(
      all.map(async (c) => ({
        ...c,
        _count: (await getPlacesInCity(c.webflow_id)).length,
      })),
    );
  } catch (err) {
    console.error("[/cities] Supabase unreachable after retries; rendering empty list. Error:", err);
  }

  // CollectionPage + full ItemList of all cities. Previously this hub
  // shipped with zero structured data — Google had no machine-readable
  // signal that this is THE directory page for every city we cover.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Specialty coffee cities worldwide",
    numberOfItems: cities.length,
    itemListElement: cities.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.localspecialtycoffee.com/cities/${c.slug}`,
      name: c.name,
    })),
  };
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://www.localspecialtycoffee.com/cities#collection",
    url: "https://www.localspecialtycoffee.com/cities",
    name: "Explore Coffee Cities Around the World",
    description:
      "Discover a curated list of cities renowned for their unique coffee scenes.",
    inLanguage: "en",
    mainEntity: itemListLd,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.localspecialtycoffee.com/" },
      { "@type": "ListItem", position: 2, name: "Cities", item: "https://www.localspecialtycoffee.com/cities" },
    ],
  };

  return (
    <section className="py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">All cities</h1>
        <p className="text-lg text-muted mb-10 max-w-2xl">
          From Amsterdam to Tokyo — {cities.length} cities where specialty coffee
          is taken seriously. Filter by continent, country, or just start typing.
        </p>
        <CityFilters cities={cities} />
      </div>
    </section>
  );
}
