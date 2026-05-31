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
import { FeaturedCitiesGrid } from "@/components/FeaturedCitiesGrid";

export const revalidate = 2592000;

const CATEGORY_TAGLINES: Record<string, string> = {
  "specialty-coffee-shops": "Hand-picked cafés near you",
  "coffee-roasters": "Roasters worth seeking out",
  "barista-course": "Courses with top baristas",
};

export default async function HomePage() {
  const [cities, categories, allPlaces] = await Promise.all([
    getAllCities(),
    getAllCategories(),
    getAllPlaces(),
  ]);
  const citiesWithCountsArr = await Promise.all(
    cities.map(async (c) => ({
      ...c,
      _count: (await getPlacesInCity(c.webflow_id)).length,
    })),
  );

  // Trending pool: up to 3 places per city across all cities.
  const pool: PlaceWithRefs[] = (
    await Promise.all(
      citiesWithCountsArr.flatMap((c) =>
        allPlaces
          .filter((p) => p.city_webflow_id === c.webflow_id)
          .slice(0, 3)
          .map((p) => getPlaceBySlug(p.slug)),
      ),
    )
  ).filter((p): p is PlaceWithRefs => !!p);

  const citiesWithCounts = citiesWithCountsArr;

  // Homepage ItemList — give Google an explicit list of the featured cities
  // so the homepage can earn richer SERP treatment (sitelinks, list cards)
  // and so crawl-prioritization picks up new cities faster.
  const homepageItemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured specialty coffee cities",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: citiesWithCounts.length,
    itemListElement: citiesWithCounts.slice(0, 30).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.localspecialtycoffee.com/cities/${c.slug}`,
      name: c.h1 ?? c.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageItemListLd) }}
      />

      {/* Hero with collage */}
      <section className="bg-bg pt-10 pb-20 motion-safe:animate-fade-up">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-5">
              Find the best Specialty Coffee near you
            </h1>
            <p className="text-lg text-muted mb-7 max-w-md">
              Hand-picked cafés, roasters, and barista courses — wherever you are.
            </p>
            <Link
              href="#city-search"
              className="inline-flex items-center gap-2 rounded-full bg-coral-bright text-ink px-7 py-3.5 font-bold hover:bg-coral hover:text-white hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg"
            >
              Find the best Coffee
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
            The best Specialty Coffee in your city
          </h2>
          <p className="text-muted">Pick a city and start exploring.</p>
        </div>
        <div className="px-6">
          <CitySearch cities={cities.map((c) => ({ slug: c.slug, name: c.name }))} />
        </div>
      </section>

      {/* Trending right now — with category chips + reshuffle */}
      {pool.length > 0 && (
        <section className="py-12 bg-blush/30">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">The best, right now</h2>
              <p className="text-sm text-muted">A fresh handful of top spots each visit. Filter by type or reshuffle.</p>
            </div>
            <TrendingShuffle pool={pool} categories={categories} />
          </div>
        </section>
      )}

      {/* Featured cities — with continent filter chips */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
            <h2 className="text-3xl md:text-4xl font-bold">Featured cities</h2>
            <Link href="/cities" className="text-sm font-medium text-coral hover:underline">
              See all {cities.length} cities →
            </Link>
          </div>
          <FeaturedCitiesGrid cities={citiesWithCounts} />
        </div>
      </section>

      {/* Brewtiful Guide */}
      <BrewtifulGuide />

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">Browse by type</h2>
          <p className="text-center text-muted mb-10 md:mb-12">
            Find the best specialty coffee near you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((cat) => {
              const tagline = CATEGORY_TAGLINES[cat.slug] ?? cat.description;
              return (
                <Link
                  key={cat.webflow_id}
                  href={`/categories/${cat.slug}`}
                  className="group flex flex-col items-center text-center bg-white rounded-3xl p-6 md:p-10 border border-blush hover:border-coral hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  {cat.icon_large_url && (
                    <Image
                      src={cat.icon_large_url}
                      alt={cat.name}
                      width={64}
                      height={60}
                      className="mb-4 md:mb-5"
                      unoptimized
                    />
                  )}
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{cat.name}</h3>
                  <p className="text-coral text-sm md:text-base font-medium">{tagline}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm text-muted group-hover:text-coral transition-colors">
                    Browse <span aria-hidden>→</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
