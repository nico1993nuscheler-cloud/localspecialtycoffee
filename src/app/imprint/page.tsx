import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imprint — Local Specialty Coffee",
  description:
    "Legal information per § 5 TMG for localspecialtycoffee.com — operator details, contact, VAT ID, and EU dispute resolution notice.",
  alternates: { canonical: "/imprint" },
  robots: { index: true, follow: true },
};

export default function ImprintPage() {
  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-6 prose-seo">
        <h1 className="text-4xl font-bold mb-2">Imprint</h1>
        <p className="text-sm text-muted mb-10">
          Information according to § 5 TMG (German Telemedia Act) and § 18 (2) MStV. Effective:{" "}
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}.
        </p>

        <h2 className="text-2xl font-bold mt-8">Service provider</h2>
        <p>
          <strong>Nico Nuscheler</strong>
          <br />
          Business name: Nico Nuscheler Digital Services
          <br />
          Schwedenstraße 25
          <br />
          86825 Bad Wörishofen
          <br />
          Germany
        </p>
        <p>Sole proprietor (Einzelunternehmer, not registered in the commercial register).</p>

        <h2 className="text-2xl font-bold mt-8">Contact</h2>
        <p>
          Email:{" "}
          <a href="mailto:localspecialtycoffee@gmail.com">
            localspecialtycoffee@gmail.com
          </a>
        </p>

        <h2 className="text-2xl font-bold mt-8">VAT</h2>
        <p>
          VAT identification number according to § 27a UStG:{" "}
          <strong>DE361379594</strong>
        </p>

        <h2 className="text-2xl font-bold mt-8">
          Responsible for content according to § 18 (2) MStV
        </h2>
        <p>Nico Nuscheler (address as above).</p>

        <h2 className="text-2xl font-bold mt-8">EU online dispute resolution</h2>
        <p>
          The European Commission provides a platform for online dispute resolution (ODR):{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
          . Our email address can be found above.
        </p>

        <h2 className="text-2xl font-bold mt-8">Consumer dispute resolution</h2>
        <p>
          We are not willing or obliged to participate in dispute settlement
          proceedings in front of a consumer arbitration board.
        </p>

        <h2 className="text-2xl font-bold mt-8">Liability for content</h2>
        <p>
          As a service provider, we are responsible for our own content on these
          pages according to § 7 (1) TMG under general laws. However, according to
          §§ 8 to 10 TMG, we are not obliged as a service provider to monitor
          transmitted or stored third-party information or to investigate
          circumstances that indicate illegal activity.
        </p>
        <p>
          Obligations to remove or block the use of information under general laws
          remain unaffected. However, liability in this respect is only possible
          from the point in time at which a specific infringement of the law
          becomes known. If we become aware of such legal violations, we will
          remove this content immediately.
        </p>

        <h2 className="text-2xl font-bold mt-8">Liability for links</h2>
        <p>
          Our website contains links to external websites of third parties, over
          whose content we have no influence. Therefore, we cannot accept any
          liability for this third-party content. The respective provider or
          operator of the linked pages is always responsible for the content of
          those pages. The linked pages were checked for possible legal violations
          at the time of linking. Illegal content was not recognisable at the time
          of linking.
        </p>

        <h2 className="text-2xl font-bold mt-8">Copyright</h2>
        <p>
          The content and works on these pages created by the site operator are
          subject to German copyright law. Reproduction, processing, distribution,
          and any kind of use outside the limits of copyright require the written
          consent of the respective author or creator. Café names, café photos and
          editorial descriptions remain the property of their respective owners
          and are used under fair-use editorial review.
        </p>

        <p className="mt-12 text-sm">
          See also our <a href="/privacy">Privacy Policy</a> and{" "}
          <a href="/terms-conditions">Terms &amp; Conditions</a>.
        </p>
      </div>
    </section>
  );
}
