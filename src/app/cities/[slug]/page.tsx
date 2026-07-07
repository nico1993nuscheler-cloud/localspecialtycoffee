import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllCategories,
  getAllCities,
  getAllPlaces,
  getCityBySlug,
  getPlacesInCity,
  safeStaticParams,
} from "@/lib/data";
import { PlaceFilters } from "@/components/PlaceFilters";
import { RelatedCitiesBlock } from "@/components/RelatedCitiesBlock";
import { Gallery } from "@/components/Gallery";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";
import { CityFeatureLinks } from "@/components/CityFeatureLinks";
import { CityMapLazy } from "@/components/CityMapLazy";
import { ShareButtons } from "@/components/ShareButtons";
import { SubmitSpotPrompt } from "@/components/SubmitSpotPrompt";
import { placesToMapPoints } from "@/lib/geo-points";

const SITE = "https://www.localspecialtycoffee.com";

// CRITICAL SEO FIX (Jun 14, 2026): Changed from `true` to `false`.
// With `true`, unknown slugs triggered dynamic rendering → Footer N+1
// queries → Vercel function timeout → 500 errors. This caused 951 5XX
// errors in the Ahrefs audit. With `false`, unknown slugs return an
// instant 404 without invoking any server function.
// New cities still work because every CMS injection triggers a deploy
// (which re-runs generateStaticParams).
export const dynamicParams = false;
export const revalidate = 2592000;

export async function generateStaticParams() {
  // safeStaticParams: if Supabase is still unreachable after withDbRetry's
  // backoff, return [] so the build doesn't abort. dynamicParams stays false
  // (the Jun 14 N+1/500 fix), so the next deploy or scheduled rebuild re-runs
  // this against a healthy DB and restores all city pages.
  return safeStaticParams(
    async () => (await getAllCities()).map((c) => ({ slug: c.slug })),
    "cities/[slug]",
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  // Title-tag CTR optimization (May 31, 2026 GSC audit):
  // Old format: "Top 9 - <editorial H1> (2026)" → 70-90 chars, gets
  // truncated in SERPs, and leads with the editorial flair instead of the
  // search-intent phrase. GSC shows pages at position 7-50 with 0.1-0.4%
  // CTR — well below the 2-5% expected for those positions.
  // New format: "Best Specialty Coffee in <City> (<year>): <N> Top Spots"
  // → 50-60 chars, leads with the high-intent query, ends with a proof
  // point. The editorial H1 stays on the page (still in <h1>), it just
  // isn't the SERP title anymore.
  const places = await getPlacesInCity(city.webflow_id);
  const year = new Date().getFullYear();
  const title =
    places.length > 0
      ? `Best Specialty Coffee in ${city.name} (${year}): ${places.length} Top Spots`
      : `Best Specialty Coffee in ${city.name} (${year})`;
  // Meta-description fallback (when no hand-written city.meta_description
  // exists in Supabase) — give the SERP snippet something with specificity
  // + freshness signals instead of the generic "Discover the best…" line.
  const descFallback = places.length > 0
    ? `Hand-picked guide to specialty coffee in ${city.name} (${year}): ${places.length} cafés & roasters, mapped and reviewed by locals.`
    : `Hand-picked guide to specialty coffee in ${city.name}, mapped and reviewed by locals.`;
  return {
    title,
    description: city.meta_description ?? descFallback,
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
  const [places, allCategories, allCities, allPlaces] = await Promise.all([
    getPlacesInCity(city.webflow_id),
    getAllCategories(),
    getAllCities(),
    getAllPlaces(),
  ]);

  const cityMapPoints = placesToMapPoints(places);

  // Place counts per sibling city — used by the RelatedCitiesBlock at the
  // bottom of the page. Built from a single getAllPlaces() instead of N
  // getPlacesInCity() calls (one per sibling) to keep cold renders cheap.
  // city_webflow_id → count, then map by city slug.
  const countByCityWebflowId = new Map<string, number>();
  for (const p of allPlaces) {
    countByCityWebflowId.set(
      p.city_webflow_id,
      (countByCityWebflowId.get(p.city_webflow_id) ?? 0) + 1,
    );
  }
  const countByCity: Record<string, number> = {};
  for (const c of allCities) {
    countByCity[c.slug] = countByCityWebflowId.get(c.webflow_id) ?? 0;
  }

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

  // FAQPage schema — answers the People-Also-Ask questions Google surfaces
  // for "best coffee in <city>" and "specialty coffee <city>" queries. Each
  // answer points back to the on-page listing or a top-rated place from
  // the city's shortlist, so the structured data stays anchored to real
  // content (not generated filler that risks Helpful-Content flags).
  const topPick = places[0];
  const topPickName = topPick?.name;
  const faqLd = places.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Where can I find the best specialty coffee in ${city.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Our hand-picked guide to ${city.name} lists ${places.length} specialty coffee shops and roasters, ranked and reviewed by locals. ${topPickName ? `Standout picks include ${topPickName}.` : ""}`.trim(),
            },
          },
          {
            "@type": "Question",
            name: `What makes a coffee shop "specialty" in ${city.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Specialty coffee shops in ${city.name} typically work with single-origin beans, brew on commercial-grade equipment, and employ trained baristas. The shops on this list meet those criteria — most also roast their own beans or work directly with named roasters.`,
            },
          },
          {
            "@type": "Question",
            name: `Where do locals go for coffee in ${city.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `The ${places.length} cafés and roasters on this page are the spots ${city.name} locals actually go to — not tourist coffee. Each one was selected for quality of brew, atmosphere, and consistency.`,
            },
          },
        ],
      }
    : null;

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
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

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

      {/* Share row + (Brussels only) World of Coffee event banner. Placed right
       *  under the hero — the moment of value, where someone has just landed on
       *  a curated city guide worth forwarding. */}
      <section className="pt-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col gap-4">
          <ShareButtons
            url={`${SITE}/cities/${city.slug}`}
            title={`☕ ${city.name} specialty coffee crawl — ${places.length} spots worth crossing the city for:`}
            campaign={`city_${city.slug}`}
            label="Share this guide"
          />
          {city.slug === "best-coffee-in-brussels" && (
            <Link
              href="/world-of-coffee-brussels"
              className="group flex items-center justify-between gap-4 rounded-2xl bg-[#0e1f3a] text-white px-5 py-4 hover:brightness-110 transition"
            >
              <span className="text-sm md:text-base font-semibold">
                ☕ Heading to <strong>World of Coffee Brussels</strong> (Jun 25–27)? Here&apos;s where to drink between sessions →
              </span>
              <span className="shrink-0 rounded-full bg-coral-bright text-ink font-bold px-4 py-2 text-sm group-hover:bg-coral group-hover:text-white transition-colors">
                Open the guide
              </span>
            </Link>
          )}
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

      {/* Interactive map of all geocoded places in the city. Only renders once
       *  at least one place has coordinates (Phase 0 geocoding). */}
      {cityMapPoints.length > 0 && (
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              {city.name} on the map
            </h2>
            <CityMapLazy points={cityMapPoints} />
            <Link
              href={`/map/${city.slug}`}
              className="mt-4 inline-flex items-center gap-1.5 font-semibold text-coral hover:underline"
            >
              Open the full {city.name} coffee map <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      )}

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

      {/* Related cities — internal-linking boost. Weighted toward the
       * "almost on page 1" cities identified in the May 31, 2026 GSC
       * audit (Rio, Seoul, São Paulo), so link equity flows their way
       * from every sibling city page. */}
      <RelatedCitiesBlock
        currentSlug={city.slug}
        allCities={allCities}
        countByCity={countByCity}
      />

      {/* Contextual UGC prompt — revives the dormant /submissions flow with the
       *  city pre-filled. */}
      <div className="py-6">
        <SubmitSpotPrompt cityName={city.name} />
      </div>

      {/* Brewtiful Guide CTA — the email-gated Google Maps lead magnet, framed
       *  around this city. */}
      <div className="py-14">
        <BrewtifulGuide cityName={city.name} citySlug={city.slug} />
      </div>
    </>
  );
}
