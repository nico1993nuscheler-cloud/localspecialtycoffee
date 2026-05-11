import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategories, getCategoryBySlug, getPlacesInCategory } from "@/lib/data";

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
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-6">
          {cat.icon_large_url && (
            <Image src={cat.icon_large_url} alt={cat.name} width={52} height={48} unoptimized />
          )}
          <h1 className="text-4xl font-bold">{cat.name}s</h1>
        </div>
        {cat.description && (
          <p className="text-lg text-muted mb-10 max-w-2xl">{cat.description}</p>
        )}

        <h2 className="text-xl font-semibold mb-4">{places.length} {cat.name.toLowerCase()}s worldwide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((p) => (
            <Link
              key={p.webflow_id}
              href={`/specialty-coffee-place/${p.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-blush hover:border-coral transition-all"
            >
              <div className="aspect-square bg-blush relative">
                {p.thumbnail_v1_url && (
                  <Image
                    src={p.thumbnail_v1_url}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-sm text-muted line-clamp-1 mt-1">{p.flavour_profile}</p>
                <p className="text-xs text-coral mt-2 font-medium">{p.city.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
