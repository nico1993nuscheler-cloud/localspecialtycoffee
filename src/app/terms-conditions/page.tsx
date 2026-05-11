import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions and Legal - LocalSpecialtyCoffee.com",
  description:
    "Looking for amazing coffee? Explore our curated directory of local specialty coffee shops and roasteries. Find your next favourite independent cafe!",
  alternates: { canonical: "/terms-conditions" },
};

export default function TermsPage() {
  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-6 prose-seo">
        <h1 className="text-4xl font-bold mb-6">Terms & Conditions</h1>
        <p className="text-muted">
          By using localspecialtycoffee.com you agree to the following terms.
        </p>

        <h2 className="text-xl font-bold mt-8">1. Content</h2>
        <p>
          Listings are curated editorially. We do our best to keep details
          accurate but information (hours, addresses, offerings) can change
          without notice. Verify directly with the business before visiting.
        </p>

        <h2 className="text-xl font-bold mt-8">2. Submissions</h2>
        <p>
          By submitting a business via the /submissions page, you grant Local
          Specialty Coffee the right to publish the information provided as part
          of our directory. You confirm you have authority to represent the
          business and that the information is accurate.
        </p>

        <h2 className="text-xl font-bold mt-8">3. Premium listings</h2>
        <p>
          Premium placements include enhanced visibility (featured badge, gallery,
          booking link). Premium status does not influence our editorial
          assessment of coffee quality.
        </p>

        <h2 className="text-xl font-bold mt-8">4. Liability</h2>
        <p>
          Local Specialty Coffee is provided as an editorial guide. We&apos;re not
          liable for your experience at any listed venue. Use your own judgment
          and have a great cup.
        </p>

        <h2 className="text-xl font-bold mt-8">5. Privacy</h2>
        <p>
          We collect minimal data: anonymous analytics (GA4), submission form
          contents, and newsletter email addresses. We don&apos;t sell your data.
        </p>

        <h2 className="text-xl font-bold mt-8">6. Contact</h2>
        <p>
          Questions? <a href="/contact">Reach us here</a>.
        </p>
      </div>
    </section>
  );
}
