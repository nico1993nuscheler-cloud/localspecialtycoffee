import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { NewsletterForm } from "@/components/NewsletterForm";
import { OpenCookieSettings } from "@/components/OpenCookieSettings";
import { getAllCities, getFooterCityCounts } from "@/lib/data";

const TAGLINE_BY_CITY: Record<string, string> = {
  "best-coffee-shops-in-new-york": "Explore NY's specialty coffee scene",
  "best-coffee-shops-in-london": "Explore London's unique coffee roasters",
  "specialty-coffee-berlin": "Explore Berlin's coffee scene",
  "best-coffee-in-amsterdam": "Discover Amsterdam's top spots",
  "good-coffee-melbourne": "Coffee-mad Melbourne, mapped",
  "best-coffee-shops-in-paris-france": "Paris cafés worth the detour",
};

export async function Footer() {
  // SEO FIX (Jun 14, 2026): Replaced N+1 getPlacesInCity() calls (one per
  // city) with a single getAllPlaces() + in-memory grouping. The old pattern
  // caused Vercel function timeouts on dynamically-rendered pages (including
  // 404/not-found) because the Footer is part of the root layout.
  //
  // EGRESS FIX (Jul 2026): getAllPlaces() pulled the full ~2.3 MB
  // places-light payload (every column, all rows) on every single page
  // render just to count places per city — the Footer runs on every page,
  // so this alone was the dominant driver of Supabase egress. Replaced with
  // getFooterCityCounts(), which fetches only the `city_id` column.
  const [cities, countByCity] = await Promise.all([getAllCities(), getFooterCityCounts()]);
  const withCounts = cities.map((c) => ({
    ...c,
    _count: countByCity[c.webflow_id] ?? 0,
  }));
  const featuredFooterCities = withCounts
    .sort((a, b) => b._count - a._count)
    .slice(0, 3);

  return (
    <footer className="bg-ink text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">

        {/* Newsletter strip — promoted to top of footer (highest conversion priority) */}
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/10 p-5 md:px-7 md:py-5 grid md:grid-cols-[1.1fr_1fr] gap-6 items-center mb-10">
          <div className="flex items-center gap-4">
            <Image
              src={BRAND.newsletterIcon}
              alt=""
              width={42}
              height={42}
              unoptimized
              className="shrink-0"
            />
            <div>
              <h3 className="text-lg md:text-xl font-bold mb-0.5">Brew-tiful News! ☕</h3>
              <p className="text-sm text-white/60 max-w-md">
                The Google Maps list, city updates, bean stories & subscriber-only deals.
              </p>
            </div>
          </div>
          <div>
            <NewsletterForm tier="lead_magnet" cta="Subscribe" />
          </div>
        </div>

        {/* 3-column links — tightened */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8 mb-10">
          <div>
            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-wider text-coral-bright">
              Discover Specialty Coffee
            </h3>
            <ul className="space-y-2 text-sm text-white/85">
              <li><Link href="/categories/specialty-coffee-shops" className="hover:text-coral-bright transition-colors">Specialty Coffee Shops</Link></li>
              <li><Link href="/categories/coffee-roasters" className="hover:text-coral-bright transition-colors">Coffee Roasters</Link></li>
              <li><Link href="/categories/barista-course" className="hover:text-coral-bright transition-colors">Barista Courses</Link></li>
              <li><Link href="/cities" className="hover:text-coral-bright transition-colors">Discover Cities</Link></li>
              <li><Link href="/submissions" className="hover:text-coral-bright transition-colors">Submit a Spot</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-wider text-coral-bright">
              New cities added
            </h3>
            <ul className="space-y-2">
              {featuredFooterCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/cities/${c.slug}`}
                    className="group flex items-center gap-3"
                  >
                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                      {c.thumbnail_v3_url && (
                        <Image
                          src={c.thumbnail_v3_url}
                          alt={c.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm group-hover:text-coral-bright transition-colors leading-tight">
                        {c.name}
                      </p>
                      <p className="text-xs text-white/50 leading-tight mt-0.5 line-clamp-1">
                        {TAGLINE_BY_CITY[c.slug] ?? `${c._count} curated spots`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold mb-3 uppercase tracking-wider text-coral-bright">
              Localspecialtycoffee.com
            </h3>
            <ul className="space-y-2 text-sm text-white/85">
              <li><Link href="/about" className="hover:text-coral-bright transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-coral-bright transition-colors">Contact</Link></li>
              <li><Link href="/faqs" className="hover:text-coral-bright transition-colors">FAQs</Link></li>
              <li><Link href="/submissions" className="hover:text-coral-bright transition-colors">Submissions</Link></li>
              <li><Link href="/terms-conditions" className="hover:text-coral-bright transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-coral-bright transition-colors">Privacy Policy</Link></li>
              <li><Link href="/imprint" className="hover:text-coral-bright transition-colors">Imprint</Link></li>
              <li className="text-white/85"><OpenCookieSettings /></li>
            </ul>
          </div>
        </div>

        {/* Brand + copyright row */}
        <div className="border-t border-white/10 pt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Link href="/" className="inline-flex" aria-label="Local Specialty Coffee — Home">
            <span className="bg-white rounded-lg p-2">
              <Image
                src={BRAND.logo}
                alt="Local Specialty Coffee"
                width={120}
                height={42}
                unoptimized
                className="h-8 w-auto"
              />
            </span>
          </Link>
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} Local Specialty Coffee · Crafted with ☕ for coffee lovers worldwide
          </p>
        </div>

      </div>
    </footer>
  );
}
