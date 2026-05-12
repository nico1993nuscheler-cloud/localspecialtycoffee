import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPlaces, getPlaceBySlug, getPlacesInCity } from "@/lib/data";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceCTAs } from "@/components/PlaceCTAs";
import { Gallery } from "@/components/Gallery";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPlaces().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPlaceBySlug(slug);
  if (!p) return {};
  const year = new Date().getFullYear();
  return {
    title: `${p.name} - ${p.city.name} (${year} Review)`,
    description: `${p.flavour_profile ?? p.excerpt_short ?? ""}. A true Specialty Coffee Gem in ${p.city.name}. Explore Now.`,
    alternates: { canonical: `/specialty-coffee-place/${p.slug}` },
    openGraph: {
      title: `${p.name} — ${p.city.name}`,
      description: p.flavour_profile ?? p.excerpt_short ?? undefined,
      images: p.featured_image_url ? [p.featured_image_url] : undefined,
    },
  };
}

const FEATURE_GROUPS: { label: string; items: { key: string; label: string }[] }[] = [
  {
    label: "Coffee quality & sourcing",
    items: [
      { key: "in_house_roasting", label: "In-house roasting" },
      { key: "ethical_sourcing", label: "Ethical / direct trade" },
      { key: "single_origin", label: "Single origin" },
      { key: "award_winning", label: "Award-winning" },
      { key: "micro_lots", label: "Micro-lots / seasonal" },
      { key: "experimental_styles", label: "Experimental / fermented" },
      { key: "certified_baristas", label: "Q-grader / certified baristas" },
    ],
  },
  {
    label: "Drinks",
    items: [
      { key: "hand_brews", label: "Hand-brews / pour over" },
      { key: "batch_brews", label: "Batch brews" },
      { key: "espresso_milk_drinks", label: "Espresso & milk drinks" },
      { key: "decaf_options", label: "Decaf options" },
      { key: "alt_milk", label: "Alt milk / vegan" },
      { key: "cold_brew", label: "Cold brew" },
    ],
  },
  {
    label: "Beans & retail",
    items: [
      { key: "retail_beans", label: "Retail beans (in-store)" },
      { key: "online_beans", label: "Buy beans online" },
      { key: "ships_internationally", label: "Ships internationally" },
      { key: "subscription", label: "Coffee subscription" },
    ],
  },
  {
    label: "Amenities",
    items: [
      { key: "work_friendly", label: "Work-friendly" },
      { key: "outdoor_seating", label: "Outdoor seating" },
      { key: "pet_friendly", label: "Pet friendly" },
      { key: "to_go", label: "To-go available" },
      { key: "byo_cup_loyalty", label: "BYO cup / loyalty" },
      { key: "offers_classes", label: "Coffee classes" },
      { key: "community_events", label: "Community events" },
      { key: "pastry_snacks", label: "Pastries / snacks" },
      { key: "lunch_brunch", label: "Lunch / brunch" },
    ],
  },
];

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPlaceBySlug(slug);
  if (!p) return notFound();

  const otherPlaces = getPlacesInCity(p.city_webflow_id)
    .filter((o) => o.webflow_id !== p.webflow_id)
    .slice(0, 3);

  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: p.name,
    image: p.featured_image_url,
    description: p.flavour_profile ?? p.excerpt_short,
    address: { "@type": "PostalAddress", streetAddress: p.address, addressLocality: p.city.name },
    url: p.website,
    telephone: p.phone,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.localspecialtycoffee.com/" },
      { "@type": "ListItem", position: 2, name: p.city.name, item: `https://www.localspecialtycoffee.com/cities/${p.city.slug}` },
      { "@type": "ListItem", position: 3, name: p.name, item: `https://www.localspecialtycoffee.com/specialty-coffee-place/${p.slug}` },
    ],
  };

  // Keyless Google Maps embed — works without the API-key referrer restriction
  // that prevented the Webflow key from rendering on non-www domains.
  const mapsQuery = encodeURIComponent(`${p.name} ${p.address ?? ""} ${p.city.name}`);
  const mapsEmbedSrc = `https://maps.google.com/maps?q=${mapsQuery}&output=embed&z=15`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-6 pt-6 text-sm text-muted">
        <Link href="/" className="hover:text-coral">Home</Link>
        {" / "}
        <Link href={`/cities/${p.city.slug}`} className="hover:text-coral">{p.city.name}</Link>
        {" / "}
        <span className="text-ink">{p.name}</span>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-6">
        <div className="aspect-[2512/996] bg-blush rounded-2xl overflow-hidden relative">
          {p.featured_image_url && (
            <Image
              src={p.featured_image_url}
              alt={p.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 80vw"
              className="object-cover"
            />
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-coral font-medium uppercase tracking-wider">{p.category.name}</p>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-1">{p.name}</h1>
              {p.rating && <p className="text-sm text-muted mt-2">★ {p.rating}</p>}
            </div>
            {p.is_featured && (
              <span className="bg-coral text-white text-xs font-bold uppercase px-3 py-1 rounded-full whitespace-nowrap">
                Featured
              </span>
            )}
          </div>

          {p.flavour_profile && (
            <p className="text-lg text-muted mb-6">{p.flavour_profile}</p>
          )}
          {p.about && (
            <div
              className="prose-seo text-ink"
              dangerouslySetInnerHTML={{ __html: p.about }}
            />
          )}

          {/* Features */}
          <div className="mt-10 space-y-6">
            {FEATURE_GROUPS.map((group) => {
              const active = group.items.filter((i) => (p as unknown as Record<string, boolean>)[i.key]);
              if (active.length === 0) return null;
              return (
                <div key={group.label}>
                  <h3 className="font-semibold mb-3">{group.label}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {active.map((i) => (
                      <li key={i.key} className="text-sm bg-blush rounded-full px-3 py-1">
                        {i.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Google Maps embed */}
          {p.address && (
            <div className="mt-12">
              <h3 className="font-semibold mb-3">Find {p.name}</h3>
              <div className="rounded-2xl overflow-hidden border border-blush">
                <iframe
                  src={mapsEmbedSrc}
                  width="100%"
                  height="400"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  style={{ border: 0 }}
                  title={`Map of ${p.name} in ${p.city.name}`}
                />
              </div>
              <p className="text-sm text-muted mt-2">{p.address}</p>
            </div>
          )}

          {/* Gallery (premium) */}
          {p.photo_gallery && p.photo_gallery.length > 0 && (
            <div className="mt-12">
              <h3 className="font-semibold mb-3">Gallery</h3>
              <Gallery urls={p.photo_gallery} label={p.name} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-2xl border border-blush p-6 space-y-3">
            <h3 className="font-semibold">Visit</h3>
            {p.address && <p className="text-sm text-muted">{p.address}</p>}
            {p.hours_weekday && (
              <p className="text-sm"><span className="font-medium">Mon–Fri:</span> {p.hours_weekday}</p>
            )}
            {p.hours_saturday && (
              <p className="text-sm"><span className="font-medium">Sat:</span> {p.hours_saturday}</p>
            )}
            {p.hours_sunday && (
              <p className="text-sm"><span className="font-medium">Sun:</span> {p.hours_sunday}</p>
            )}
            {p.phone && <p className="text-sm text-muted">{p.phone}</p>}
            {p.email && <p className="text-sm text-muted break-words">{p.email}</p>}
          </div>
          <div className="bg-white rounded-2xl border border-blush p-6">
            <PlaceCTAs place={p} />
          </div>
          <div className="bg-white rounded-2xl border border-blush p-6 text-sm">
            <p>
              In <Link href={`/cities/${p.city.slug}`} className="text-coral hover:underline font-medium">{p.city.name}</Link>{" "}
              · <Link href={`/categories/${p.category.slug}`} className="text-coral hover:underline font-medium">{p.category.name}</Link>
            </p>
          </div>
        </aside>
      </section>

      {/* Brewtiful Guide */}
      <div className="py-10">
        <BrewtifulGuide />
      </div>

      {/* Other places in city */}
      {otherPlaces.length > 0 && (
        <section className="py-14">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">
                Other coffee places in {p.city.name}
              </h2>
              <Link
                href={`/cities/${p.city.slug}`}
                className="text-sm font-medium text-coral hover:underline"
              >
                See all spots in {p.city.name} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPlaces.map((o) => (
                <PlaceCard key={o.webflow_id} place={o} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
