import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCategories,
  getAllCities,
  getCityBySlug,
  getPlacesInCity,
} from "@/lib/data";
import { PlaceFilters } from "@/components/PlaceFilters";
import { Gallery } from "@/components/Gallery";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";
import { CityFeatureLinks } from "@/components/CityFeatureLinks";

export const dynamicParams = true;
export const revalidate = 2592000;

export async function generateStaticParams() {
  return (await getAllCities()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  // Count is the real, current shortlist size — the old "TOP 10" prefix
  // was misleading when most cities actually ship 13-15 cafés. Mismatched
  // titles cost CTR and trust signals.
  const places = await getPlacesInCity(city.webflow_id);
  const year = new Date().getFullYear();
  const baseTitle = city.h1 ?? city.name;
  const title =
    places.length > 0
      ? `Top ${places.length} - ${baseTitle} (${year})`
      : `${baseTitle} (${year})`;
  return {
    title,
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
  const city = await getCityBySlug(slug);
  if (!city) return notFound();
  const [places, allCategories] = await Promise.all([
    getPlacesInCity(city.webflow_id),
    getAllCategories(),
  ]);

  // CollectionPage wraps the city listing with topical signal: the page is
  // ABOUT the city's coffee scene, not just a list. mainEntity links to the
  // ItemList — this is the canonical Google pattern for "best X in Y" pages.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best specialty coffee in ${city.name}`,
    numberOfItems: places.length,
    itemListElement: places.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.localspecialtycoffee.com/specialty-coffee-place/${p.slug}`,
      name: p.name,
    })),
  };

  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `https://www.localspecialtycoffee.com/cities/${city.slug}#collection`,
    url: `https://www.localspecialtycoffee.com/cities/${city.slug}`,
    name: city.h1 ?? `Specialty Coffee in ${city.name}`,
    description: city.summary ?? `Curated guide to specialty coffee in ${city.name}.`,
    inLanguage: "en",
    about: { "@type": "City", name: city.name },
    mainEntity: itemListLd,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.localspecialtycoffee.com/" },
      { "@type": "ListItem", position: 2, name: "Cities", item: "https://www.localspecialtycoffee.com/cities" },
      { "@type": "ListItem", position: 3, name: city.name, item: `https://www.localspecialtycoffee.com/cities/${city.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Hero */}
      <section className="relative">
        <div className="relative aspect-square sm:aspect-[2880/1400] md:aspect-[2880/900] bg-blush">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15 md:from-black/65 md:via-black/25 md:to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full max-w-6xl mx-auto px-6 pb-8 md:pb-14 text-white">
              <h1 className="text-[26px] leading-[1.15] md:text-6xl md:leading-tight font-bold drop-shadow-lg">
                {city.h1 ?? city.name}
              </h1>
              {city.summary && (
                <p className="mt-3 text-base md:text-xl max-w-2xl drop-shadow leading-snug">{city.summary}</p>
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
          <PlaceFilters places={places} mode="city" categories={allCategories} />
        </div>
      </section>

      {/* Programmatic-landing internal links — keep crawlers discovering
       *  /cities/[slug]/[feature] from the city hub. */}
      <CityFeatureLinks citySlug={city.slug} cityName={city.name} places={places} />

      {/* Brewtiful Guide CTA */}
      <div className="py-14">
        <BrewtifulGuide />
      </div>
    </>
  );
}
