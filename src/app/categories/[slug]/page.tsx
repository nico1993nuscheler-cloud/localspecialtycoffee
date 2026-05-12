import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getAllCities, getCategoryBySlug, getPlacesInCategory } from "@/lib/data";
import { PlaceFilters } from "@/components/PlaceFilters";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";

export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  return {
    title: `Local ${cat.name}s in your city`,
    description: cat.description ?? `Browse the best ${cat.name.toLowerCase()}s curated by Local Specialty Coffee.`,
    alternates: { canonical: `/categories/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return notFound();
  const [places, allCities] = await Promise.all([
    getPlacesInCategory(cat.webflow_id),
    getAllCities(),
  ]);
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

  return (
    <>
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
