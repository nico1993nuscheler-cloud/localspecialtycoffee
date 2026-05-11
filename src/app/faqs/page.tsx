import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs - Local Specialty Coffee | Directory of Shops & Roasteries",
  description:
    "Frequently asked questions about localspecialtycoffee.com and specialty coffee in general. Your guide to finding top-rated specialty coffee and coffee roasters.",
  alternates: { canonical: "/faqs" },
};

const FAQS = [
  {
    q: "What counts as a specialty coffee shop?",
    a: "Cafés that source high-quality beans (typically scored 80+ on the SCA scale), brew with care, and can tell you about origin, roast date and tasting notes. No frappuccinos, no burnt espresso.",
  },
  {
    q: "How do you decide which cafés to include?",
    a: "We curate by hand. Every café on this site is researched, cross-referenced against trusted coffee-scene sources, and reviewed for quality. We don't accept pay-to-play for the free listing.",
  },
  {
    q: "How can I get my café added?",
    a: "Submit it on the /submissions page — free or premium. Free listings go through our editorial review (a few weeks). Premium goes faster and gets a featured spot.",
  },
  {
    q: "Do you sell coffee directly?",
    a: "No — we're a directory. We point you to the best places to buy. Many of the roasters we list ship internationally; check each profile.",
  },
  {
    q: "How often do you update the listings?",
    a: "Continuously. We add new cities every few weeks and review existing listings on a rolling basis.",
  },
];

export default function FAQsPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-10">Frequently asked questions</h1>
          <div className="space-y-6">
            {FAQS.map((f) => (
              <div key={f.q} className="bg-white rounded-2xl border border-blush p-6">
                <h2 className="text-lg font-semibold mb-2">{f.q}</h2>
                <p className="text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
