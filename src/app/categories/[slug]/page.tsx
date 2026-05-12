import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getCategoryBySlug, getPlacesInCategory } from "@/lib/data";
import { PlaceCard } from "@/components/PlaceCard";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return {};
  return {
    title: `Local ${cat.name}s in your city`,
    description: cat.description ?? `Browse the best ${cat.name.toLowerCase()}s curated by Local Specialty Coffee.`,
    alternates: { canonical: `/categories/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return notFound();
  const places = getPlacesInCategory(cat.webflow_id);

  return (
    <>
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-5 mb-6">
            {cat.icon_large_url && (
              <Image src={cat.icon_large_url} alt={cat.name} width={64} height={60} unoptimized />
            )}
            <h1 className="text-4xl md:text-5xl font-bold">{cat.name}s</h1>
          </div>
          {cat.description && (
            <p className="text-lg text-muted mb-12 max-w-2xl">{cat.description}</p>
          )}

          <h2 className="text-xl font-semibold mb-6">{places.length} {cat.name.toLowerCase()}s worldwide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((p) => (
              <PlaceCard key={p.webflow_id} place={p} showCity />
            ))}
          </div>
        </div>
      </section>

      <div className="py-10">
        <BrewtifulGuide />
      </div>
    </>
  );
}
