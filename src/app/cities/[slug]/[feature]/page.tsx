import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCities,
  getCityBySlug,
  getPlacesInCity,
} from "@/lib/data";
import { LANDING_FEATURES, FEATURE_BY_SLUG } from "@/lib/landing-features";
import { PlaceCard } from "@/components/PlaceCard";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { slug: string; feature: string }[] = [];
  for (const c of getAllCities()) {
    for (const f of LANDING_FEATURES) {
      // Only generate combos that have ≥1 matching place — keeps thin pages
      // out of the index and the sitemap.
      const matches = getPlacesInCity(c.webflow_id).filter(
        (p) => (p as unknown as Record<string, boolean>)[f.boolean],
      );
      if (matches.length >= 1) {
        params.push({ slug: c.slug, feature: f.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; feature: string }>;
}): Promise<Metadata> {
  const { slug, feature } = await params;
  const city = getCityBySlug(slug);
  const f = FEATURE_BY_SLUG[feature];
  if (!city || !f) return {};

  const year = new Date().getFullYear();
  return {
    title: `Best ${f.metaTitleWord} Coffee Shops in ${city.name} (${year})`,
    description: `${f.intro} Curated picks across ${city.name}.`,
    alternates: { canonical: `/cities/${city.slug}/${f.slug}` },
    openGraph: {
      title: `${f.metaTitleWord} coffee shops in ${city.name}`,
      description: f.intro,
      images: city.featured_image_url ? [city.featured_image_url] : undefined,
    },
  };
}

export default async function CityFeaturePage({
  params,
}: {
  params: Promise<{ slug: string; feature: string }>;
}) {
  const { slug, feature } = await params;
  const city = getCityBySlug(slug);
  const f = FEATURE_BY_SLUG[feature];
  if (!city || !f) return notFound();

  const allInCity = getPlacesInCity(city.webflow_id);
  const matches = allInCity.filter(
    (p) => (p as unknown as Record<string, boolean>)[f.boolean],
  );
  if (matches.length === 0) return notFound();

  // Other features in this city that have matches → cross-link rail.
  const otherFeatures = LANDING_FEATURES.filter((x) => x.slug !== f.slug)
    .map((x) => ({
      ...x,
      count: allInCity.filter(
        (p) => (p as unknown as Record<string, boolean>)[x.boolean],
      ).length,
    }))
    .filter((x) => x.count > 0)
    .slice(0, 6);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${f.metaTitleWord} coffee shops in ${city.name}`,
    itemListElement: matches.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.localspecialtycoffee.com/specialty-coffee-place/${p.slug}`,
      name: p.name,
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.localspecialtycoffee.com/" },
      { "@type": "ListItem", position: 2, name: "Cities", item: "https://www.localspecialtycoffee.com/cities" },
      { "@type": "ListItem", position: 3, name: city.name, item: `https://www.localspecialtycoffee.com/cities/${city.slug}` },
      { "@type": "ListItem", position: 4, name: f.label, item: `https://www.localspecialtycoffee.com/cities/${city.slug}/${f.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Hero */}
      <section className="relative">
        <div className="relative aspect-[2880/1100] md:aspect-[2880/720] bg-blush">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-6xl mx-auto px-6 pb-10 md:pb-12 text-white">
              <nav className="text-sm text-white/80 mb-3">
                <Link href={`/cities/${city.slug}`} className="hover:text-coral-bright">
                  ← Back to {city.name}
                </Link>
              </nav>
              <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg leading-tight">
                Best {f.metaTitleWord} Coffee Shops in {city.name}
              </h1>
              <p className="mt-2 text-white/85 text-sm md:text-base">{f.searchHint}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-10">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-lg text-muted leading-relaxed">{f.intro}</p>
          <p className="mt-3 text-sm text-muted">
            <span className="font-bold text-ink">{matches.length}</span> of{" "}
            <Link href={`/cities/${city.slug}`} className="text-coral hover:underline">
              {allInCity.length} curated spots in {city.name}
            </Link>{" "}
            match.
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((p) => (
              <PlaceCard key={p.webflow_id} place={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Cross-link to other features in this city */}
      {otherFeatures.length > 0 && (
        <section className="py-14">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Other ways to slice {city.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherFeatures.map((x) => (
                <Link
                  key={x.slug}
                  href={`/cities/${city.slug}/${x.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-blush bg-white hover:border-coral hover:-translate-y-0.5 transition-all px-4 py-2 text-sm font-medium"
                >
                  {x.label}
                  <span className="text-xs text-coral font-semibold">{x.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="py-6">
        <BrewtifulGuide />
      </div>
    </>
  );
}
