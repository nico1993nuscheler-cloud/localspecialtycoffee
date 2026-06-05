import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/config";

const DEFAULT_OG_IMAGE = BRAND.brewtifulMapVisual;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Specialty Coffee Near Me | Find Coffee Shops, Roasters & Beans",
    template: "%s",
  },
  description:
    "Discover dangerously good Specialty Coffee near me - Unique Coffee Shops, killer Roasters, Beans that pop. Start your Specialty Coffee Hunt. Escape mediocre Brews.",
  openGraph: {
    siteName: "Local Specialty Coffee",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Local Specialty Coffee" }],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    canonical: "/",
    // Single-language English site serving 6 continents — declare
    // x-default so Google knows there's no localized version to look for.
    // Per-route generateMetadata can override the language list later when
    // translations ship.
    languages: {
      "x-default": "/",
      en: "/",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* Sitewide structured data — Organization + WebSite + SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Local Specialty Coffee",
                url: "https://www.localspecialtycoffee.com",
                logo: BRAND.logo,
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Local Specialty Coffee",
                url: "https://www.localspecialtycoffee.com",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://www.localspecialtycoffee.com/cities?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />

        {/* Cookie consent — gates GA4 loading; replaces the Webflow-era
         * Silktide script which never rendered a banner on the new stack. */}
        <CookieConsent />
      </body>
    </html>
  );
}
