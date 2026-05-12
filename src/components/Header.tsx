import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Header() {
  return (
    <header className="border-b border-blush bg-bg sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Local Specialty Coffee — Home">
          <Image
            src={BRAND.logo}
            alt="Local Specialty Coffee"
            width={180}
            height={63}
            priority
            unoptimized
            className="h-12 w-auto"
          />
        </Link>
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium">
          <li><Link href="/" className="hover:text-coral transition-colors">Home</Link></li>
          <li className="relative group">
            <button className="hover:text-coral transition-colors flex items-center gap-1">
              Specialty Coffee near me
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white border border-blush shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <p className="text-xs uppercase tracking-wider text-muted mb-2">Discover Specialty Coffee</p>
              <ul className="space-y-1.5 text-sm">
                <li><Link href="/categories/specialty-coffee-shops" className="hover:text-coral">Specialty Coffee Shops</Link></li>
                <li><Link href="/categories/coffee-roasters" className="hover:text-coral">Coffee Roasters</Link></li>
                <li><Link href="/categories/barista-course" className="hover:text-coral">Barista Courses</Link></li>
                <li><Link href="/cities" className="hover:text-coral">Discover Cities</Link></li>
                <li><Link href="/faqs" className="hover:text-coral">FAQs</Link></li>
                <li><Link href="/submissions" className="hover:text-coral">Submit a Roaster or Cafe</Link></li>
              </ul>
            </div>
          </li>
          <li><Link href="/about" className="hover:text-coral transition-colors">About</Link></li>
          <li>
            <Link
              href="/#city-search"
              className="rounded-full bg-coral-bright text-ink font-semibold px-5 py-2 hover:bg-coral hover:text-white transition-colors"
            >
              Search
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
