import Link from "next/link";
import Image from "next/image";
import {
  getAllCategories,
  getAllCities,
  getAllPlaces,
  getPlacesInCity,
  getPlaceBySlug,
} from "@/lib/data";
import type { PlaceWithRefs } from "@/lib/types";
import { HeroCollage } from "@/components/HeroCollage";
import { CitySearch } from "@/components/CitySearch";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";
import { TrendingShuffle } from "@/components/TrendingShuffle";

export default function HomePage() {
  const cities = getAllCities();
  const categories = getAllCategories();
  const totalPlaces = getAllPlaces().length;

  const featuredCities = [...cities]
    .map((c) => ({ ...c, _count: getPlacesInCity(c.webflow_id).length }))
    .sort((a, b) => b._count - a._count)
    .slice(0, 6);

  // Pool for the "Trending right now" shuffle — pick 2 places per top-15 city
  // (gives ~30 candidates of solid variety; client-side shuffle picks 6).
  const pool: PlaceWithRefs[] = featuredCities
    .concat(
      [...cities]
        .map((c) => ({ ...c, _count: getPlacesInCity(c.webflow_id).length }))
        .sort((a, b) => b._count - a._count)
        .slice(6, 15),
    )
    .flatMap((c) => {
      const cityPlaces = getAllPlaces().filter((p) => p.city_webflow_id === c.webflow_id);
      return cityPlaces
        .slice(0, 2)
        .map((p) => getPlaceBySlug(p.slug))
        .filter((p): p is PlaceWithRefs => !!p);
    });

  return (
    <>
      {/* Hero with collage */}
      <section className="bg-bg pt-10 pb-20 motion-safe:animate-fade-up">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-5">
              Find Specialty Coffee near you
            </h1>
            <p className="text-lg text-muted mb-7 max-w-md">
              Discover unique Specialty Coffee Shops, awarded Coffee Roasters,
              exclusive Beans, Micro Lots and Barista Courses in your area.
            </p>
            <Link
              href="#city-search"
              className="inline-flex items-center gap-2 rounded-full bg-coral text-white px-7 py-3.5 font-semibold hover:bg-coral-300 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg"
            >
              Find Specialty Coffee
              <span aria-hidden>→</span>
            </Link>
          </div>
          <HeroCollage />
        </div>
      </section>

      {/* City search */}
      <section className="bg-bg py-16 border-y border-blush">
        <div className="max-w-6xl mx-auto px-6 text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Search Coffee Roasters & Shops in your City
          </h2>
          <p className="text-muted">and discover the best Specialty Coffee in your area</p>
        </div>
        <div className="px-6">
          <CitySearch cities={cities.map((c) => ({ slug: c.slug, name: c.name }))} />
        </div>
      </section>

      {/* Featured cities */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Featured cities</h2>
            <Link href="/cities" className="text-sm font-medium text-coral hover:underline">
              See all {cities.length} cities →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {featuredCities.map((city) => (
              <Link
                key={city.webflow_id}
                href={`/cities/${city.slug}`}
                className="group rounded-2xl overflow-hidden bg-white border border-blush hover:border-coral hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[1080/680] bg-blush relative">
                  {city.thumbnail_v2_url && (
                    <Image
                      src={city.thumbnail_v2_url}
                      alt={`Specialty coffee in ${city.name}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-xl mb-1">{city.name}</h3>
                  {city.excerpt_short && (
                    <p className="text-sm text-muted line-clamp-2">{city.excerpt_short}</p>
                  )}
                  <p className="text-xs text-coral mt-3 font-semibold">{city._count} spots →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending right now (client-shuffled) */}
      {pool.length > 0 && (
        <section className="py-12 bg-blush/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Trending right now</h2>
              <p className="text-sm text-muted">A fresh handful of spots each visit. Refresh for more.</p>
            </div>
            <TrendingShuffle pool={pool} />
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">Browse by type</h2>
          <p className="text-center text-muted mb-12">
            {totalPlaces}+ curated spots across {cities.length} cities — pick your flavour.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.webflow_id}
                href={`/categories/${cat.slug}`}
                className="group bg-white rounded-3xl p-10 text-center border border-blush hover:border-coral hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {cat.icon_large_url && (
                  <Image
                    src={cat.icon_large_url}
                    alt={cat.name}
                    width={64}
                    height={60}
                    className="mx-auto mb-5 group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                )}
                <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                <p className="text-sm text-muted">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brewtiful Guide */}
      <BrewtifulGuide />
    </>
  );
}
