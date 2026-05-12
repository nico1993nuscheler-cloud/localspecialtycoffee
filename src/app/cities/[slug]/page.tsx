import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getAllCities, getCityBySlug, getPlacesInCity } from "@/lib/data";
import { PlaceFilters } from "@/components/PlaceFilters";
import { Gallery } from "@/components/Gallery";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};
  return {
    title: `TOP 10 - ${city.h1 ?? city.name} (${new Date().getFullYear()})`,
    description: city.meta_description ?? `Discover the best specialty coffee in ${city.name}.`,
    alternates: { canonical: `/cities/${city.slug}` },
    openGraph: {
      title: `${city.h1 ?? city.name}`,
      description: city.meta_description ?? undefined,
      images: city.featured_image_url ? [city.featured_image_url] : undefined,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return notFound();
  const places = getPlacesInCity(city.webflow_id);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best specialty coffee in ${city.name}`,
    itemListElement: places.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.localspecialtycoffee.com/specialty-coffee-place/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      {/* Hero */}
      <section className="relative">
        <div className="relative aspect-[2880/1100] md:aspect-[2880/900] bg-blush">
          {city.featured_image_url && (
            <Image
              src={city.featured_image_url}
              alt={`Specialty coffee in ${city.name}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-6xl mx-auto px-6 pb-10 md:pb-14 text-white">
              <h1 className="text-3xl md:text-6xl font-bold drop-shadow-lg leading-tight">
                {city.h1 ?? city.name}
              </h1>
              {city.summary && (
                <p className="mt-3 text-lg md:text-xl max-w-2xl drop-shadow">{city.summary}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2-column: SEO text left, gallery right */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1.5fr_1fr] gap-12 items-start">
          <div>
            {city.seo_h2 && <h2 className="text-2xl md:text-3xl font-bold mb-5">{city.seo_h2}</h2>}
            {city.seo_paragraph && (
              <div
                className="prose-seo text-muted text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: city.seo_paragraph }}
              />
            )}
          </div>
          {city.photo_gallery && city.photo_gallery.length > 0 && (
            <aside className="lg:sticky lg:top-24">
              <h3 className="text-lg font-semibold mb-3">{city.name} in pictures</h3>
              <Gallery urls={city.photo_gallery} label={city.name} />
            </aside>
          )}
        </div>
      </section>

      {/* Place list with filters */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            {places.length} specialty coffee spots in {city.name}
          </h2>
          <PlaceFilters places={places} mode="city" categories={getAllCategories()} />
        </div>
      </section>

      {/* Brewtiful Guide CTA */}
      <div className="py-14">
        <BrewtifulGuide />
      </div>
    </>
  );
}
