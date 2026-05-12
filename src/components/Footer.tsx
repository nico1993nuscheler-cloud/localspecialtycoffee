import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { NewsletterForm } from "@/components/NewsletterForm";

export function Footer() {
  return (
    <footer className="bg-ink text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="inline-block mb-4 bg-white rounded-xl p-3">
            <Image
              src={BRAND.logo}
              alt="Local Specialty Coffee"
              width={150}
              height={53}
              unoptimized
              className="h-12 w-auto"
            />
          </Link>
          <p className="text-sm text-white/70">
            A curated guide to the world&apos;s best specialty coffee shops,
            roasters & brew bars. Discover dangerously good cups, anywhere.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider">Explore</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/cities" className="hover:text-coral">All cities</Link></li>
            <li><Link href="/categories/specialty-coffee-shops" className="hover:text-coral">Specialty coffee shops</Link></li>
            <li><Link href="/categories/coffee-roasters" className="hover:text-coral">Coffee roasters</Link></li>
            <li><Link href="/categories/barista-course" className="hover:text-coral">Barista courses</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider">About</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-coral">About us</Link></li>
            <li><Link href="/contact" className="hover:text-coral">Contact</Link></li>
            <li><Link href="/faqs" className="hover:text-coral">FAQs</Link></li>
            <li><Link href="/submissions" className="hover:text-coral">Submit a Spot</Link></li>
            <li><Link href="/terms-conditions" className="hover:text-coral">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
            <Image src={BRAND.newsletterIcon} alt="" width={20} height={20} unoptimized />
            Newsletter
          </h3>
          <p className="text-sm text-white/70 mb-3">
            New cities, new spots, and the occasional brewing tip. Once a week, max.
          </p>
          <NewsletterForm tier="newsletter" cta="Subscribe" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 text-xs text-white/50 flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Local Specialty Coffee</span>
          <span>Crafted with ☕ for coffee lovers worldwide</span>
        </div>
      </div>
    </footer>
  );
}
