import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
