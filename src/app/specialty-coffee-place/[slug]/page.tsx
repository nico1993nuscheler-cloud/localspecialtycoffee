import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPlaces, getPlaceBySlug } from "@/lib/data";

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />

      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto px-6 pt-6 text-sm text-muted">
        <Link href="/" className="hover:text-coral">Home</Link>
        {" / "}
        <Link href={`/cities/${p.city.slug}`} className="hover:text-coral">
          {p.city.name}
        </Link>
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

      <section className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-coral font-medium">{p.category.name}</p>
              <h1 className="text-3xl md:text-4xl font-bold">{p.name}</h1>
              {p.rating && <p className="text-sm text-muted mt-1">★ {p.rating}</p>}
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
                      <li
                        key={i.key}
                        className="text-sm bg-blush rounded-full px-3 py-1"
                      >
                        {i.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Gallery (premium only) */}
          {p.photo_gallery && p.photo_gallery.length > 0 && (
            <div className="mt-10">
              <h3 className="font-semibold mb-3">Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {p.photo_gallery.map((url, i) => (
                  <div key={i} className="aspect-square bg-blush rounded-lg overflow-hidden relative">
                    <Image
                      src={url}
                      alt={`${p.name} ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl border border-blush p-6">
            <h3 className="font-semibold mb-3">Visit</h3>
            {p.address && <p className="text-sm text-muted mb-3">{p.address}</p>}
            {p.hours_weekday && (
              <p className="text-sm"><span className="font-medium">Mon–Fri:</span> {p.hours_weekday}</p>
            )}
            {p.hours_saturday && (
              <p className="text-sm"><span className="font-medium">Sat:</span> {p.hours_saturday}</p>
            )}
            {p.hours_sunday && (
              <p className="text-sm"><span className="font-medium">Sun:</span> {p.hours_sunday}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-blush p-6 space-y-2">
            {p.website && (
              <a href={p.website} target="_blank" rel="noopener noreferrer"
                className="block rounded-full bg-coral text-white text-center px-4 py-2 font-medium hover:bg-coral-300">
                {p.button_text || "Visit website"}
              </a>
            )}
            {p.booking_link && (
              <a href={p.booking_link} target="_blank" rel="noopener noreferrer"
                className="block rounded-full border border-ink text-center px-4 py-2 font-medium hover:bg-blush">
                Book / get tickets
              </a>
            )}
            {p.instagram && (
              <a href={p.instagram} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-coral text-center hover:underline">
                Instagram
              </a>
            )}
            {p.phone && <p className="text-sm text-muted">{p.phone}</p>}
            {p.email && <p className="text-sm text-muted">{p.email}</p>}
          </div>
          <div className="bg-white rounded-2xl border border-blush p-6">
            <p className="text-sm">
              In <Link href={`/cities/${p.city.slug}`} className="text-coral hover:underline">{p.city.name}</Link>{" "}
              · <Link href={`/categories/${p.category.slug}`} className="text-coral hover:underline">{p.category.name}</Link>
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
