import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCities, getCityBySlug, getPlacesInCity } from "@/lib/data";

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
        <div className="aspect-[2880/1328] md:aspect-[2880/900] bg-blush relative">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-6xl mx-auto px-6 pb-8 md:pb-12 text-white">
              <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg">
                {city.h1 ?? city.name}
              </h1>
              {city.summary && (
                <p className="mt-3 text-lg md:text-xl max-w-2xl drop-shadow">
                  {city.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SEO paragraph */}
      {(city.seo_h2 || city.seo_paragraph) && (
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-6">
            {city.seo_h2 && <h2 className="text-2xl font-bold mb-4">{city.seo_h2}</h2>}
            {city.seo_paragraph && (
              <div
                className="prose-seo text-muted"
                dangerouslySetInnerHTML={{ __html: city.seo_paragraph }}
              />
            )}
          </div>
        </section>
      )}

      {/* Place list */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-6">
            {places.length} specialty coffee spots in {city.name}
          </h2>
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
                  {p.is_featured && (
                    <span className="absolute top-3 left-3 bg-coral text-white text-xs font-bold uppercase px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  {p.flavour_profile && (
                    <p className="text-sm text-muted line-clamp-2 mt-1">{p.flavour_profile}</p>
                  )}
                  <p className="text-xs text-coral mt-2 font-medium">
                    {p.category.name} · {p.rating || "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Photo gallery */}
      {city.photo_gallery && city.photo_gallery.length > 0 && (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-bold mb-6">{city.name} in pictures</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {city.photo_gallery.map((url, i) => (
                <div key={i} className="aspect-square bg-blush rounded-lg overflow-hidden relative">
                  <Image
                    src={url}
                    alt={`${city.name} ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
