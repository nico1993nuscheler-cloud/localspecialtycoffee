import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { NewsletterForm } from "@/components/NewsletterForm";

/**
 * High-conversion lead-magnet block. Mirrors the Webflow design:
 * - Dark navy block doesn't span full viewport — it's a contained card.
 * - Phone mockup breaks out of the card (above + below + to the right),
 *   tilted slightly, creating depth. Section is overflow-visible.
 *
 * `compact` is used on city/cafe pages (smaller, no break-out).
 * Default (no `compact`) is used on home and dedicated CTA placements.
 */
export function BrewtifulGuide({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-[#0e1f3a] text-white rounded-3xl overflow-hidden">
          <div className="p-8 md:p-10 grid md:grid-cols-[1fr_1.2fr] gap-8 items-center">
            <div className="relative aspect-[3/4] max-w-[260px] mx-auto md:mx-0">
              <Image
                src={BRAND.brewtifulMapVisual}
                alt="Brew-tiful Google Maps Specialty Coffee Guide"
                fill
                sizes="260px"
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                A Brew-tiful Google Maps Specialty Coffee Guide ☕
              </h3>
              <p className="text-white/70 mb-5 text-sm">
                Every spot in our directory, plotted on a single Google Map. Free.
              </p>
              <div className="max-w-md">
                <NewsletterForm tier="lead_magnet" cta="Get Access to the Maps" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="relative bg-[#0e1f3a] text-white rounded-3xl overflow-hidden md:overflow-visible">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none opacity-25">
          <div className="absolute -left-32 top-1/4 w-80 h-80 bg-[#1a2f55] rotate-12 rounded-3xl" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#1a2f55] -rotate-6 rounded-3xl" />
        </div>

        <div className="relative grid md:grid-cols-[1.1fr_1fr] gap-6 md:gap-10 items-center min-h-[420px] md:min-h-[480px] py-10 md:py-14 px-6 md:pl-14 md:pr-8">
          {/* Text + form (left on desktop) */}
          <div className="order-2 md:order-1 max-w-xl">
            <h2 className="text-[26px] sm:text-3xl md:text-5xl font-bold leading-[1.15] md:leading-[1.1] mb-5">
              A Brew-tiful Google Maps Specialty Coffee Guide! ☕
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-6">
              London, Copenhagen, New York, Bangkok, Hamburg, …! 🔍☕ We&apos;ve
              mapped out the best Specialty Coffee Shops and Coffee Roasters,
              so you can explore every city&apos;s unique coffee scene — directly
              in Google Maps.
            </p>
            <div className="max-w-md">
              <NewsletterForm tier="lead_magnet" cta="Get access to the Maps" />
            </div>
            <p className="mt-4 text-xs text-white/50">
              Free. No spam. Unsubscribe with one click.
            </p>
          </div>

          {/* Phone mockup — contained on mobile, breaks out of the dark card on desktop */}
          <div className="order-1 md:order-2 relative md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:translate-x-6 lg:translate-x-12 md:w-[55%] lg:w-[52%] max-w-[260px] mx-auto md:max-w-none md:mx-0">
            <div className="relative aspect-[3/4] md:aspect-[4/5] drop-shadow-2xl">
              <Image
                src={BRAND.brewtifulMapVisual}
                alt="Brew-tiful Google Maps Specialty Coffee Guide on a phone"
                fill
                sizes="(max-width: 768px) 60vw, 500px"
                className="object-contain"
                priority={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
