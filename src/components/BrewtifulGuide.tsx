import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { NewsletterForm } from "@/components/NewsletterForm";

/**
 * High-conversion lead-magnet block. Mirrors the original Webflow section:
 * dark navy background, phone mockup on left, headline + email capture on
 * right. Used on home, city pages, and place pages — it's the main funnel.
 */
export function BrewtifulGuide({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <section className="bg-[#0e1f3a] text-white rounded-3xl overflow-hidden">
        <div className="p-8 md:p-10 grid md:grid-cols-[1fr_1.2fr] gap-8 items-center">
          <div className="relative aspect-square max-w-[280px] mx-auto md:mx-0">
            <Image
              src={BRAND.brewtifulMapVisual}
              alt="Brew-tiful Google Maps Specialty Coffee Guide"
              fill
              sizes="280px"
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Your Brew-tiful Google Maps Specialty Coffee Guide ☕
            </h3>
            <p className="text-white/70 mb-5 text-sm">
              Every spot in our directory, plotted on a single Google Map. Free.
            </p>
            <NewsletterForm tier="lead_magnet" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#0e1f3a] text-white relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -left-20 top-1/3 w-72 h-72 bg-[#1a2f55] rotate-12 rounded-3xl" />
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-[#1a2f55] -rotate-6 rounded-3xl" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div className="relative aspect-[4/5] max-w-[420px] mx-auto md:mx-0">
          <Image
            src={BRAND.brewtifulMapVisual}
            alt="Brew-tiful Google Maps Specialty Coffee Guide on a phone"
            fill
            priority={false}
            sizes="(max-width: 768px) 90vw, 420px"
            className="object-contain"
          />
        </div>
        <div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Your Brew-tiful Google Maps Specialty Coffee Guide! ☕
          </h2>
          <p className="text-white/80 text-lg mb-6 max-w-xl">
            London, Copenhagen, New York, Bangkok, Hamburg, …! 🔍☕ We&apos;ve
            mapped out Specialty Coffee Spots and Coffee Roasters in Google
            Maps, so you can explore every city&apos;s unique coffee scene — on
            the go.
          </p>
          <div className="bg-white p-2 rounded-full max-w-md">
            <NewsletterForm tier="lead_magnet" cta="Get Access to the Maps" />
          </div>
          <p className="mt-4 text-xs text-white/50">
            Free. No spam. Unsubscribe with one click.
          </p>
        </div>
      </div>
    </section>
  );
}
