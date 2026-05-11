import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="bg-ink text-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex flex-col leading-none mb-3">
            <span className="text-sm font-light tracking-wider text-coral lowercase">local</span>
            <span className="text-base font-bold tracking-tight lowercase">specialty coffee</span>
          </div>
          <p className="text-sm text-white/70">
            A curated guide to the world&apos;s best specialty coffee shops, roasters & brew bars.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Explore</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/cities" className="hover:text-coral">Cities</Link></li>
            <li><Link href="/categories/specialty-coffee-shops" className="hover:text-coral">Coffee Shops</Link></li>
            <li><Link href="/categories/coffee-roasters" className="hover:text-coral">Roasters</Link></li>
            <li><Link href="/categories/barista-course" className="hover:text-coral">Barista Courses</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">About</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-coral">About us</Link></li>
            <li><Link href="/contact" className="hover:text-coral">Contact</Link></li>
            <li><Link href="/faqs" className="hover:text-coral">FAQs</Link></li>
            <li><Link href="/submissions" className="hover:text-coral">Submit a Spot</Link></li>
            <li><Link href="/terms-conditions" className="hover:text-coral">Terms & Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Brew-tiful Guide</h3>
          <p className="text-sm text-white/70 mb-3">
            Get the free Google Maps Specialty Coffee Guide in your inbox.
          </p>
          <NewsletterForm tier="newsletter" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-white/50 flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Local Specialty Coffee</span>
          <span>Crafted with ☕ for coffee lovers worldwide</span>
        </div>
      </div>
    </footer>
  );
}
