import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllCities, getPlacesInCity } from "@/lib/data";

export const metadata: Metadata = {
  title: "Explore Coffee Cities Around the World",
  description:
    "Discover a curated list of cities renowned for their unique coffee scenes. Browse to explore local cafés, roasters, and coffee culture in each destination.",
  alternates: { canonical: "/cities" },
};

export default function CitiesPage() {
  const cities = getAllCities();

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-3">All cities</h1>
        <p className="text-lg text-muted mb-10 max-w-2xl">
          From Amsterdam to Tokyo — {cities.length} cities where specialty coffee is
          taken seriously. Pick one and start exploring.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cities.map((city) => {
            const count = getPlacesInCity(city.webflow_id).length;
            return (
              <Link
                key={city.webflow_id}
                href={`/cities/${city.slug}`}
                className="group rounded-2xl overflow-hidden bg-white border border-blush hover:border-coral transition-all"
              >
                <div className="aspect-[568/680] bg-blush relative">
                  {city.thumbnail_v1_url && (
                    <Image
                      src={city.thumbnail_v1_url}
                      alt={`Specialty coffee in ${city.name}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-lg">{city.name}</h2>
                  <p className="text-xs text-coral font-medium mt-1">{count} spots</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
