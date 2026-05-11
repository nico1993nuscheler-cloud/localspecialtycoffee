import Image from "next/image";
import Link from "next/link";
import { getAllCities, getAllCategories, getAllPlaces, getPlacesInCity } from "@/lib/data";
import { NewsletterForm } from "@/components/NewsletterForm";

export default function HomePage() {
  const cities = getAllCities();
  const categories = getAllCategories();
  const totalPlaces = getAllPlaces().length;

  // Show top 6 cities (with most places) as featured
  const featuredCities = [...cities]
    .map((c) => ({ ...c, _count: getPlacesInCity(c.webflow_id).length }))
    .sort((a, b) => b._count - a._count)
    .slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="bg-bg pt-12 pb-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Find dangerously good specialty coffee, anywhere.
            </h1>
            <p className="text-lg text-muted mb-6">
              A curated guide to {totalPlaces}+ specialty coffee shops, roasters
              and brew bars across {cities.length} cities worldwide. Escape mediocre brews.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/cities"
                className="rounded-full bg-coral text-white px-6 py-3 font-medium hover:bg-coral-300 transition-colors text-center"
              >
                Browse all cities
              </Link>
              <Link
                href="/categories/specialty-coffee-shops"
                className="rounded-full border border-ink px-6 py-3 font-medium hover:bg-blush transition-colors text-center"
              >
                Browse all shops
              </Link>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden bg-blush aspect-[4/3] relative">
            {featuredCities[0]?.featured_image_url && (
              <Image
                src={featuredCities[0].featured_image_url}
                alt={`Specialty coffee in ${featuredCities[0].name}`}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </section>

      {/* Featured cities */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured cities</h2>
            <Link href="/cities" className="text-sm font-medium text-coral hover:underline">
              See all {cities.length} cities →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {featuredCities.map((city) => (
              <Link
                key={city.webflow_id}
                href={`/cities/${city.slug}`}
                className="group rounded-2xl overflow-hidden bg-white border border-blush hover:border-coral transition-all"
              >
                <div className="aspect-[4/3] bg-blush relative">
                  {city.thumbnail_v2_url && (
                    <Image
                      src={city.thumbnail_v2_url}
                      alt={`Specialty coffee in ${city.name}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{city.name}</h3>
                  <p className="text-sm text-muted line-clamp-2">{city.excerpt_short}</p>
                  <p className="text-xs text-coral mt-2 font-medium">{city._count} spots →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-blush/40">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Browse by type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.webflow_id}
                href={`/categories/${cat.slug}`}
                className="group bg-white rounded-2xl p-8 text-center border border-blush hover:border-coral transition-all"
              >
                {cat.icon_large_url && (
                  <Image
                    src={cat.icon_large_url}
                    alt={cat.name}
                    width={52}
                    height={48}
                    className="mx-auto mb-4"
                    unoptimized
                  />
                )}
                <h3 className="text-xl font-semibold mb-2">{cat.name}</h3>
                <p className="text-sm text-muted line-clamp-3">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Lead-magnet CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-3">Get the Brew-tiful Guide</h2>
          <p className="text-muted mb-6">
            Our free Google Maps Specialty Coffee Guide — every great spot we&apos;ve
            curated, plotted on one map. Sent to your inbox instantly.
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterForm tier="lead_magnet" />
          </div>
        </div>
      </section>
    </>
  );
}
