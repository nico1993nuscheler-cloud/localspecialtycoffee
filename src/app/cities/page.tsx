import type { Metadata } from "next";
import { getAllCities, getPlacesInCity } from "@/lib/data";
import { CityFilters } from "@/components/CityFilters";

export const metadata: Metadata = {
  title: "Explore Coffee Cities Around the World",
  description:
    "Discover a curated list of cities renowned for their unique coffee scenes. Browse to explore local cafés, roasters, and coffee culture in each destination.",
  alternates: { canonical: "/cities" },
};

export default function CitiesPage() {
  const cities = getAllCities().map((c) => ({
    ...c,
    _count: getPlacesInCity(c.webflow_id).length,
  }));

  return (
    <section className="py-12">
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
