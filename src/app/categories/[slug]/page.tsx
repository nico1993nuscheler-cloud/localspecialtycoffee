import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCategories,
  getAllCities,
  getCategoryBySlug,
  getPlacesInCategory,
  safeStaticParams,
} from "@/lib/data";
import { PlaceFilters } from "@/components/PlaceFilters";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";

export const dynamicParams = true;
export const revalidate = 2592000;

export async function generateStaticParams() {
  // dynamicParams = true — empty fallback on a DB outage is covered by ISR.
  return safeStaticParams(
    async () => (await getAllCategories()).map((c) => ({ slug: c.slug })),
    "categories/[slug]",
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // BUILD RESILIENCE: withDbRetry already retries a transient DB error; if
  // it's STILL failing after all retries, don't let one flaky category abort
  // the whole build — degrade to no metadata for this page instead.
  const cat = await getCategoryBySlug(slug).catch(() => undefined);
  if (!cat) return {};
  return {
    title: `Local ${cat.name}s in your city`,
    description: cat.description ?? `Browse the best ${cat.name.toLowerCase()}s curated by Local Specialty Coffee.`,
    alternates: { canonical: `/categories/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // BUILD RESILIENCE: this route is individually pre-rendered for every
  // category slug. dynamicParams = true (above) covers a slug missing from
  // generateStaticParams entirely; this covers a slug that WAS included but
  // whose own render failed after withDbRetry's retries — treat it as "not
  // found" instead of aborting the whole build. Self-heals on next deploy
  // or on-demand revalidate.
  const cat = await getCategoryBySlug(slug).catch(() => undefined);
  if (!cat) return notFound();
  let places, allCities;
  try {
    [places, allCities] = await Promise.all([
      getPlacesInCategory(cat.webflow_id),
      getAllCities(),
    ]);
  } catch (err) {
    console.error(`[categories/${slug}] Supabase unreachable after retries; serving 404 for this build. Error:`, err);
    return notFound();
  }
  // Only show cities that actually have a place in this category in the dropdown.
  const citiesWithPlaces = allCities.filter((c) =>
    places.some((p) => p.city.slug === c.slug),
  );

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.localspecialtycoffee.com/" },
      { "@type": "ListItem", position: 2, name: `${cat.name}s`, item: `https://www.localspecialtycoffee.com/categories/${cat.slug}` },
    ],
  };

  // CollectionPage + ItemList of every place in the category — gives Google
  // a machine-readable listing of all ~100+ cafes/roasters/courses tagged
  // here. Without this the page is a giant hub with zero structured signal.
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.name}s worldwide`,
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
    "@id": `https://www.localspecialtycoffee.com/categories/${cat.slug}#collection`,
    url: `https://www.localspecialtycoffee.com/categories/${cat.slug}`,
    name: `Local ${cat.name}s in your city`,
    description: cat.description ?? `Browse the best ${cat.name.toLowerCase()}s curated by Local Specialty Coffee.`,
    inLanguage: "en",
    mainEntity: itemListLd,
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
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-5 mb-6">
            {cat.icon_large_url && (
              <Image src={cat.icon_large_url} alt={cat.name} width={64} height={60} unoptimized />
            )}
            <h1 className="text-4xl md:text-5xl font-bold">{cat.name}s</h1>
          </div>
          {cat.description && (
            <p className="text-lg text-muted mb-10 max-w-2xl">{cat.description}</p>
          )}

          <h2 className="text-xl font-semibold mb-6">
            {places.length} {cat.name.toLowerCase()}s worldwide
          </h2>
          <PlaceFilters
            places={places}
            mode="category"
            cities={citiesWithPlaces}
            showCityOnCard
          />
        </div>
      </section>

      <div className="py-10">
        <BrewtifulGuide />
      </div>
    </>
  );
}
