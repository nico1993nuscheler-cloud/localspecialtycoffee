"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";

// Desktop + mobile site nav. On mobile (<md), the desktop link rail is
// hidden and a hamburger opens a full-screen overlay with the same links —
// previously the entire nav was `hidden md:flex`, leaving mobile users (and
// mobile-first Googlebot) with no internal links from the header at all,
// which tanked usability + crawl signals.
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the overlay on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile overlay is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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

        {/* Desktop nav */}
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

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="lsc-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-blush bg-white text-ink hover:bg-blush/40 transition-colors"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          )}
        </button>
      </nav>

      {/* Mobile overlay — full-width drawer below the sticky header */}
      <div
        id="lsc-mobile-menu"
        hidden={!open}
        className="md:hidden border-t border-blush bg-bg"
      >
        <div className="max-w-7xl mx-auto px-6 py-5">
          <ul className="flex flex-col gap-1 text-base font-medium">
            <li><Link href="/" className="block py-2.5 hover:text-coral">Home</Link></li>
            <li className="pt-3 pb-1 text-[11px] uppercase tracking-wider text-muted font-semibold">Discover Specialty Coffee</li>
            <li><Link href="/categories/specialty-coffee-shops" className="block py-2 hover:text-coral">Specialty Coffee Shops</Link></li>
            <li><Link href="/categories/coffee-roasters" className="block py-2 hover:text-coral">Coffee Roasters</Link></li>
            <li><Link href="/categories/barista-course" className="block py-2 hover:text-coral">Barista Courses</Link></li>
            <li><Link href="/cities" className="block py-2 hover:text-coral">Discover Cities</Link></li>
            <li><Link href="/submissions" className="block py-2 hover:text-coral">Submit a Roaster or Cafe</Link></li>
            <li className="pt-3 pb-1 text-[11px] uppercase tracking-wider text-muted font-semibold">More</li>
            <li><Link href="/about" className="block py-2 hover:text-coral">About</Link></li>
            <li><Link href="/faqs" className="block py-2 hover:text-coral">FAQs</Link></li>
            <li><Link href="/contact" className="block py-2 hover:text-coral">Contact</Link></li>
            <li className="pt-4">
              <Link
                href="/#city-search"
                className="block text-center rounded-full bg-coral-bright text-ink font-semibold px-5 py-3 hover:bg-coral hover:text-white transition-colors"
              >
                Search by city
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
