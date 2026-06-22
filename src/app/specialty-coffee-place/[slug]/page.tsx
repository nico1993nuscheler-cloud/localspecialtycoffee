import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCities,
  getAllPlaces,
  getPlaceBySlug,
  getPlacesInCity,
  safeStaticParams,
} from "@/lib/data";
import { getCityGeo } from "@/lib/geography";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceCTAs } from "@/components/PlaceCTAs";
import { Gallery } from "@/components/Gallery";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";

export const dynamicParams = true;
export const revalidate = 2592000;

export async function generateStaticParams() {
  // dynamicParams = true — empty fallback on a DB outage is covered by ISR.
  return safeStaticParams(
    async () => (await getAllPlaces()).map((p) => ({ slug: p.slug })),
    "specialty-coffee-place/[slug]",
  );
}

// Normalize a city name (or any string) to the kebab-case stem cafe slugs use.
// "Buenos Aires" → "buenos-aires", "São Paulo" → "sao-paulo", "Zurich" → "zurich".
function normalizeStem(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// SEO filler tokens in city slugs. Stripping them leaves the geographic stem
// that cafe slugs actually end with: "best-coffee-in-austin" → "austin",
// "specialty-coffee-shop-munich" → "munich", "portland-coffee-roasters" →
// "portland". Trailing country qualifiers ("...-france", "...-japan") and the
// stray Webflow hash ("riyadh-9db9a") are stripped too.
const CITY_SLUG_FILLER = new Set([
  "best", "good", "coffee", "cafes", "cafe", "specialty", "shop", "shops",
  "roasters", "roaster", "in", "the", "of", "places", "place", "find", "guide",
  "and", "for",
]);
const COUNTRY_QUALIFIER = new Set([
  "france", "italy", "japan", "colombia", "argentina", "israel", "mexico", "taiwan",
]);

// Derive every plausible geo-stem for a city from its slug, e.g.
// "best-coffee-shops-in-new-york" → "new-york". Returns the longest run of
// non-filler tokens (the trailing geographic portion).
function citySlugStems(slug: string): string[] {
  let tokens = slug.toLowerCase().split("-")
    .filter((t) => !(t.length === 5 && /\d/.test(t))); // drop Webflow hash tokens like "9db9a"
  // Strip a trailing country qualifier ("...-mexico", "...-japan") but only at
  // the end, so "mexico-city-mexico" keeps the leading "mexico" of the city name.
  if (tokens.length > 1 && COUNTRY_QUALIFIER.has(tokens[tokens.length - 1])) {
    tokens = tokens.slice(0, -1);
  }
  const geo = tokens.filter((t) => !CITY_SLUG_FILLER.has(t));
  return geo.length > 0 ? [geo.join("-")] : [];
}

// When a cafe slug doesn't resolve (cafe was dropped from a city's shortlist
// or renamed), try to recover the city from the slug's suffix and redirect
// there with a 301 instead of dropping a 404. This preserves any organic
// equity flowing to the old URL. We match against stems derived from both the
// city NAME and the city SLUG: names like "Austin, TX" / "München" normalize
// to "austin-tx" / "munchen", which don't match the cafe suffix ("-austin",
// "-munich") — the slug-derived stem does.
async function redirectTargetForMissingPlace(slug: string): Promise<string | null> {
  const cities = await getAllCities();
  const byStem = cities
    .flatMap((c) => {
      const stems = new Set([normalizeStem(c.name), ...citySlugStems(c.slug)]);
      return [...stems]
        .filter((stem) => stem.length >= 4)
        .map((stem) => ({ stem, citySlug: c.slug }));
    })
    // Longest stem first so "buenos-aires" wins over "aires", "new-york" over "york".
    .sort((a, b) => b.stem.length - a.stem.length);
  const slugLower = slug.toLowerCase();
  for (const { stem, citySlug } of byStem) {
    if (slugLower.endsWith(`-${stem}`) || slugLower === stem) {
      return `/cities/${citySlug}`;
    }
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPlaceBySlug(slug);
  if (!p) return {};
  const year = new Date().getFullYear();
  // CTR rescue (May 31, 2026 GSC audit): cafe pages were ranking position
  // 5-10 on branded queries ("el pacho coffee roasters", "hideaway coffee
  // soho", etc.) but losing the click to the cafe's own site. CTR ~0.25-0.5%.
  // The old description ended with the generic "A true Specialty Coffee Gem"
  // filler — replace it with the cafe's actual differentiator (flavour
  // profile or excerpt) leading the snippet, and add a freshness/proof cue.
  const desc = p.flavour_profile?.trim() || p.excerpt_short?.trim() || `Specialty coffee in ${p.city.name}.`;
  return {
    title: `${p.name} - ${p.city.name} (${year} Review)`,
    description: `${desc} — our ${year} review of ${p.name} in ${p.city.name}, with hours, menu highlights and the local vibe.`,
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
  const p = await getPlaceBySlug(slug);
  if (!p) {
    const target = await redirectTargetForMissingPlace(slug);
    if (target) permanentRedirect(target);
    return notFound();
  }

  const otherPlaces = (await getPlacesInCity(p.city_webflow_id))
    .filter((o) => o.webflow_id !== p.webflow_id)
    .slice(0, 3);

  // Schema.org LocalBusiness enrichment — these fields are what Google's
  // local pack + map carousel actually use to render rich results. Without
  // addressCountry + aggregateRating cafes don't surface for "near me"
  // queries; with them they can pull star treatment in SERPs.
  const geo = getCityGeo(p.city.slug);
  const parsedRating = p.rating ? parseFloat(p.rating) : NaN;
  const aggregateRating = !Number.isNaN(parsedRating) && parsedRating > 0
    ? { "@type": "AggregateRating", ratingValue: parsedRating.toFixed(1), bestRating: "5", ratingCount: 1 }
    : undefined;

  // Build amenityFeature list from the boolean flags Supabase tracks. These
  // are exactly the same flags the Features panel renders on-page.
  const amenityMap: Record<string, string> = {
    in_house_roasting: "In-house roasting",
    single_origin: "Single origin",
    hand_brews: "Hand brews / pour over",
    espresso_milk_drinks: "Espresso & milk drinks",
    alt_milk: "Alt milk",
    cold_brew: "Cold brew",
    decaf_options: "Decaf options",
    outdoor_seating: "Outdoor seating",
    work_friendly: "Work-friendly",
    pet_friendly: "Pet friendly",
    pastry_snacks: "Pastries / snacks",
    lunch_brunch: "Lunch / brunch",
    offers_classes: "Barista classes",
  };
  const amenityFeature = Object.entries(amenityMap)
    .filter(([k]) => (p as unknown as Record<string, boolean>)[k])
    .map(([, label]) => ({ "@type": "LocationFeatureSpecification", name: label, value: true }));

  const localBusinessLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "@id": `https://www.localspecialtycoffee.com/specialty-coffee-place/${p.slug}#cafe`,
    name: p.name,
    image: p.featured_image_url,
    description: p.flavour_profile ?? p.excerpt_short,
    address: {
      "@type": "PostalAddress",
      streetAddress: p.address,
      addressLocality: p.city.name,
      addressCountry: geo.country,
    },
    url: p.website,
    telephone: p.phone,
    servesCuisine: "Specialty Coffee",
    priceRange: "$$",
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(amenityFeature.length > 0 ? { amenityFeature } : {}),
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
              alt={`${p.name} — ${p.category.name.toLowerCase()} in ${p.city.name}`}
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

      {/* Owner badge prompt — Phase 3 backlink push. Featured cafes get a
       * copy-pasteable embed badge they can drop into their own site,
       * generating a real <a href> back to this profile page. */}
      <section className="py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted">
          Are you the owner?{" "}
          <Link href={`/badge?slug=${p.slug}`} className="text-coral font-medium hover:underline">
            Get a badge for your site →
          </Link>
        </div>
      </section>

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
