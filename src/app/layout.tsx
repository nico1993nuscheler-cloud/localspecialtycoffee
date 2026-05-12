import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const DEFAULT_OG_IMAGE =
  "https://cdn.prod.website-files.com/67d40637d300a0e9ce062510/67ec41bcc721c1659c005b6c_Specialty_Coffee_Map_Visual%20(2).png";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.localspecialtycoffee.com"),
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
  },
};

const GA_ID = "G-MJYKNFPEZ6";

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
                logo: "https://cdn.prod.website-files.com/67d40637d300a0e9ce062510/67d563468b5918265ae11dff_brandmark-design_2%20(1).png",
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

        {/* Silktide cookie consent (mirrors current Webflow setup) */}
        <Script
          src="https://storage.googleapis.com/localspecialtycoffee-public-web-assets/silktide-consent-manager.js"
          strategy="afterInteractive"
        />

        {/* Google Analytics 4 — same property as current Webflow site */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
