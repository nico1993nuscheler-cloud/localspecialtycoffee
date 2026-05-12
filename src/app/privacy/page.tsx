import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Local Specialty Coffee",
  description:
    "How localspecialtycoffee.com processes your data — hosting, analytics, newsletter, contact forms — under GDPR Art. 13/14.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-6 prose-seo">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-10">
          Effective:{" "}
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}.
          This notice informs you about the nature, scope and purpose of the
          processing of personal data on localspecialtycoffee.com under Articles
          13 and 14 GDPR.
        </p>

        <h2 className="text-2xl font-bold">1. Controller</h2>
        <p>
          The controller within the meaning of the GDPR and other national data
          protection laws is:
        </p>
        <p>
          <strong>Nico Nuscheler</strong>
          <br />
          Business name: Nico Nuscheler Digital Services
          <br />
          Schwedenstraße 25, 86825 Bad Wörishofen, Germany
          <br />
          Email:{" "}
          <a href="mailto:localspecialtycoffee@gmail.com">
            localspecialtycoffee@gmail.com
          </a>
        </p>

        <h2 className="text-2xl font-bold mt-10">2. General notes on data processing</h2>
        <p>
          We collect and use personal data of our users only insofar as this is
          necessary to provide a functional website as well as our content and
          services. Collection and use are generally only carried out with the
          user&apos;s consent or where a legal basis permits the processing.
        </p>
        <p>
          <strong>Legal bases.</strong> Where we obtain consent (Art. 6 (1) (a)
          GDPR); where processing is necessary for the performance of a contract
          (Art. 6 (1) (b)); where required by a legal obligation (Art. 6 (1) (c));
          or where processing is necessary to safeguard a legitimate interest
          (Art. 6 (1) (f)).
        </p>
        <p>
          <strong>Retention.</strong> Personal data is deleted as soon as the
          purpose of storage no longer applies, unless retention is required by
          law (e.g. commercial or tax retention obligations of 6–10 years).
        </p>

        <h2 className="text-2xl font-bold mt-10">3. Hosting (Vercel)</h2>
        <p>
          This website is hosted by <strong>Vercel Inc.</strong>, 440 N Barranca
          Ave #4133, Covina, CA 91723, USA. When you access the site, the
          following connection data is processed:
        </p>
        <ul>
          <li>IP address (truncated after connection)</li>
          <li>Date and time of access</li>
          <li>Requested URL and HTTP status code</li>
          <li>User-Agent (browser, version, OS)</li>
          <li>Referrer URL (if transmitted)</li>
        </ul>
        <p>
          <strong>Legal basis:</strong> Art. 6 (1) (f) GDPR (legitimate interest
          in error-free delivery of the website).{" "}
          <strong>Retention:</strong> maximum 30 days then automatically deleted
          or anonymised.{" "}
          <strong>Third-country transfer:</strong> Vercel may transfer data to the
          USA. Vercel is certified under the EU–U.S. Data Privacy Framework
          (Art. 45 GDPR adequacy decision).
        </p>

        <h2 className="text-2xl font-bold mt-10">4. Web analytics (Google Analytics 4)</h2>
        <p>
          We use Google Analytics 4, a web analytics service provided by Google
          Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland.
          Analytics tracking only loads after you give consent via our cookie
          banner. Without consent, no Google Analytics requests are made.
        </p>
        <p>
          <strong>Data processed:</strong> anonymised IP address, page visits,
          device type, referrer, approximate location (country/region), session
          duration. We do not collect personally identifying information.
        </p>
        <p>
          <strong>Legal basis:</strong> Art. 6 (1) (a) GDPR — your consent.{" "}
          <strong>Retention:</strong> 14 months in Google&apos;s system, then
          deleted.{" "}
          <strong>Third-country transfer:</strong> Google LLC (US) — certified
          under the EU–U.S. Data Privacy Framework.
        </p>
        <p>
          You can revoke your consent at any time via the cookie banner (provided
          by Silktide Consent Manager). Google&apos;s privacy notice:{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://policies.google.com/privacy
          </a>
          .
        </p>

        <h2 className="text-2xl font-bold mt-10">5. Cookie consent</h2>
        <p>
          We use a first-party consent banner to obtain and manage your
          preferences. Your choice is stored in your browser&apos;s local
          storage under the key <code>lsc-consent-v1</code> and never leaves
          your device. No personal data is processed beyond this local
          preference.
        </p>
        <p>
          You can change or withdraw consent at any time via the &ldquo;Cookie
          settings&rdquo; link in the footer.
        </p>
        <p>
          <strong>Legal basis:</strong> Art. 6 (1) (c) GDPR (legal obligation
          per TTDSG / ePrivacy).
        </p>

        <h2 className="text-2xl font-bold mt-10">6. Newsletter (MailerLite + Make)</h2>
        <p>
          If you subscribe to our newsletter or our &ldquo;Brew-tiful Google Maps
          Specialty Coffee Guide&rdquo;, we collect your email address and
          forward it via{" "}
          <strong>Make.com</strong> (Celonis SE / Integromat s.r.o., Prague,
          Czech Republic) to <strong>MailerLite</strong> (UAB MailerLite,
          Paupio g. 46, Vilnius LT-11341, Lithuania). MailerLite then stores your
          email and sends our newsletter. You can unsubscribe at any time via the
          link in every newsletter.
        </p>
        <p>
          <strong>Legal basis:</strong> Art. 6 (1) (a) GDPR — your consent (you
          actively submitted the form).{" "}
          <strong>Retention:</strong> until you unsubscribe; up to 7 days
          additionally in opt-in logs for proof of consent.
        </p>

        <h2 className="text-2xl font-bold mt-10">7. Contact form &amp; cafe submissions</h2>
        <p>
          When you submit our <a href="/contact">contact</a> form or our{" "}
          <a href="/submissions">submission</a> form, we process the data you
          enter (name, email, phone, city, message, business details). The data
          is sent via Make.com to{" "}
          <a href="mailto:localspecialtycoffee@gmail.com">
            localspecialtycoffee@gmail.com
          </a>{" "}
          (Google Workspace) where we read it and respond.
        </p>
        <p>
          <strong>Legal basis:</strong> Art. 6 (1) (b) GDPR (pre-contractual
          steps in response to your inquiry) or Art. 6 (1) (a) (consent if
          marketing-related).{" "}
          <strong>Retention:</strong> until your inquiry is processed; up to 12
          months thereafter for follow-up, then deleted.
        </p>

        <h2 className="text-2xl font-bold mt-10">8. Embedded content</h2>
        <p>
          Some café pages embed <strong>Google Maps</strong> (Google Ireland
          Limited) to show the café&apos;s location. Maps are loaded on demand;
          interacting with the map may transmit data to Google. See Google&apos;s
          privacy notice linked above. Café images are currently served from the
          Webflow CDN (Webflow Inc., 60 Rausch St, San Francisco, CA 94103,
          USA — DPF-certified).
        </p>

        <h2 className="text-2xl font-bold mt-10">9. Your rights under GDPR</h2>
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li>Right of access (Art. 15)</li>
          <li>Right to rectification (Art. 16)</li>
          <li>Right to erasure / &ldquo;to be forgotten&rdquo; (Art. 17)</li>
          <li>Right to restriction of processing (Art. 18)</li>
          <li>Right to data portability (Art. 20)</li>
          <li>Right to object (Art. 21)</li>
          <li>
            Right to lodge a complaint with a supervisory authority (Art. 77) —
            for us: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA),
            Promenade 18, 91522 Ansbach, Germany
          </li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a href="mailto:localspecialtycoffee@gmail.com">
            localspecialtycoffee@gmail.com
          </a>
          . We will respond within one month.
        </p>

        <h2 className="text-2xl font-bold mt-10">10. Changes to this notice</h2>
        <p>
          We may update this privacy policy as our processing changes or as the
          legal situation evolves. The latest version always applies and is
          available at this URL.
        </p>

        <p className="mt-12 text-sm">
          See also our <a href="/imprint">Imprint</a> and{" "}
          <a href="/terms-conditions">Terms &amp; Conditions</a>.
        </p>
      </div>
    </section>
  );
}
