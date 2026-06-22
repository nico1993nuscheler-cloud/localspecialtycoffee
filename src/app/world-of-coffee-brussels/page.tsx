import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCategories, getCityBySlug, getPlacesInCity } from "@/lib/data";
import { PlaceFilters } from "@/components/PlaceFilters";
import { CityMapLazy } from "@/components/CityMapLazy";
import { ShareButtons } from "@/components/ShareButtons";
import { SubmitSpotPrompt } from "@/components/SubmitSpotPrompt";
import { BrewtifulGuide } from "@/components/BrewtifulGuide";
import { placesToMapPoints } from "@/lib/geo-points";

// Revalidate daily — this is a timely event page (World of Coffee Brussels,
// Jun 25–27 2026), so we want it to pick up Brussels listing changes fast in
// the run-up without rebuilding the whole site.
export const revalidate = 86400;

const SITE = "https://www.localspecialtycoffee.com";
const PATH = "/world-of-coffee-brussels";

export async function generateMetadata(): Promise<Metadata> {
  // withDbRetry covers a cold Supabase; on a persistent outage fall back to the
  // count-less copy so metadata collection doesn't abort the build.
  const city = await getCityBySlug("best-coffee-in-brussels").catch(() => undefined);
  const count = city ? (await getPlacesInCity(city.webflow_id).catch(() => [])).length : 0;
  const title = "World of Coffee Brussels 2026: Where to Drink Specialty Coffee";
  const description = count
    ? `Heading to World of Coffee Brussels (Jun 25–27)? Our local guide to ${count} specialty cafés & roasters worth crossing the city for between cuppings.`
    : "Your local guide to the best specialty coffee in Brussels during World of Coffee 2026 (Jun 25–27).";
  return {
    title,
    description,
    alternates: { canonical: PATH },
    openGraph: {
      title,
      description,
      images: city?.featured_image_url ? [city.featured_image_url] : undefined,
    },
  };
}

export default async function WorldOfCoffeeBrusselsPage() {
  // BUILD RESILIENCE: withDbRetry rides out a cold Supabase. On a persistent
  // outage, treat it like a missing city (404) instead of throwing and aborting
  // the build; ISR regenerates the page once the DB is reachable.
  const city = await getCityBySlug("best-coffee-in-brussels").catch(() => undefined);
  if (!city) return notFound();

  const [places, allCategories] = await Promise.all([
    getPlacesInCity(city.webflow_id),
    getAllCategories(),
  ]);
  const mapPoints = placesToMapPoints(places);

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "World of Coffee Brussels 2026",
    startDate: "2026-06-25",
    endDate: "2026-06-27",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    // Google recommends an absolute, crawlable image for Event rich results.
    ...(city.featured_image_url ? { image: [city.featured_image_url] } : {}),
    location: {
      "@type": "Place",
      name: "Brussels Expo",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Place de Belgique 1",
        postalCode: "1020",
        addressLocality: "Brussels",
        addressCountry: "BE",
      },
    },
    // The SCA is the actual host of World of Coffee; we attribute it explicitly.
    organizer: {
      "@type": "Organization",
      name: "Specialty Coffee Association",
      url: "https://sca.coffee",
    },
    // Tickets are sold on the official event site, not by us.
    offers: {
      "@type": "Offer",
      url: "https://europe.worldofcoffee.org/",
      availability: "https://schema.org/InStock",
      validFrom: "2025-06-19",
    },
    description:
      "The Specialty Coffee Association's flagship European trade show. This page is an independent local guide to specialty coffee in Brussels for attendees.",
    url: `${SITE}${PATH}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Brussels guide", item: `${SITE}/cities/${city.slug}` },
      { "@type": "ListItem", position: 3, name: "World of Coffee Brussels", item: `${SITE}${PATH}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Hero */}
      <section className="relative">
        <div className="relative aspect-square sm:aspect-[2880/1400] md:aspect-[2880/900] bg-blush">
          {city.featured_image_url && (
            <Image
              src={city.featured_image_url}
              alt="Specialty coffee in Brussels during World of Coffee 2026"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15" />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full max-w-6xl mx-auto px-6 pb-8 md:pb-14 text-white">
              <span className="inline-block rounded-full bg-coral-bright text-ink font-bold text-xs md:text-sm px-3 py-1 mb-3">
                June 25–27 2026 · Brussels Expo
              </span>
              <h1 className="text-[26px] leading-[1.15] md:text-6xl md:leading-tight font-bold drop-shadow-lg">
                World of Coffee Brussels: Where to Actually Drink Coffee
              </h1>
              <p className="mt-3 text-base md:text-xl max-w-2xl drop-shadow leading-snug">
                11,000 of us descend on Brussels for the cuppings and comps. Here&apos;s the
                local pour — {places.length} specialty spots worth slipping out for between sessions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Share + intro */}
      <section className="pt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col gap-6">
          <ShareButtons
            url={`${SITE}${PATH}`}
            title="☕ Where to drink specialty coffee during World of Coffee Brussels — the local guide:"
            campaign="woc_brussels_2026"
            label="Send to your WoC crew"
          />
          <div className="prose-seo text-muted text-base leading-relaxed max-w-3xl">
            <p>
              The roaster village is unmissable — but the city itself is the real cupping table.
              Between the {places.length} spots below you&apos;ll find Brussels&apos; light-roast obsessives,
              its on-site roasters, and the brew bars locals queue for. Save the map, and crawl
              the scene on foot between your sessions at the Expo.
            </p>
          </div>
        </div>
      </section>

      {/* Map */}
      {mapPoints.length > 0 && (
        <section className="py-8">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Brussels coffee, mapped</h2>
            <CityMapLazy points={mapPoints} />
          </div>
        </section>
      )}

      {/* The list */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            {places.length} specialty coffee spots in Brussels
          </h2>
          <PlaceFilters places={places} mode="city" categories={allCategories} />
          <p className="mt-6 text-sm text-muted">
            Want the full city guide?{" "}
            <Link href={`/cities/${city.slug}`} className="text-coral font-semibold hover:underline">
              See our complete Brussels specialty coffee guide →
            </Link>
          </p>
        </div>
      </section>

      {/* UGC prompt — roasters and locals at WoC are the perfect contributors */}
      <div className="py-6">
        <SubmitSpotPrompt cityName="Brussels" />
      </div>

      {/* Maps lead magnet, Brussels-framed */}
      <div className="py-14">
        <BrewtifulGuide cityName="Brussels" citySlug={city.slug} />
      </div>
    </>
  );
}
