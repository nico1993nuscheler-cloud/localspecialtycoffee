import type { Metadata } from "next";
import Link from "next/link";
import { buildBadgeSnippet, buildProfileUrl } from "@/lib/badge";
import { getPlaceBySlug } from "@/lib/data";
import { CopyButton } from "./CopyButton";

export const metadata: Metadata = {
  title: "Get the Featured-on-LSC badge | Local Specialty Coffee",
  description:
    "Copy-paste embed badge linking back to your Local Specialty Coffee profile. Two variants, ready to drop in your site footer.",
  // No-index so the badge builder doesn't compete with content pages or
  // dilute crawl budget. It's a tool, not a content page.
  robots: { index: false, follow: true },
  alternates: { canonical: "/badge" },
};

export default async function BadgePage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;

  // If a slug is passed, try to resolve the cafe so we can show its name
  // in the heading. Resolution failure is non-fatal — we still render
  // the badge using the (invalid) slug as-is, because the badge itself
  // is just a URL builder and a bad slug just means a 404 link, not a
  // broken badge page.
  // Resolution failure (including a transient DB outage) is non-fatal — fall
  // back to the raw slug per the note above.
  const cafe = slug ? await getPlaceBySlug(slug).catch(() => null) : null;
  const effectiveSlug = cafe?.slug ?? slug ?? null;
  const profileUrl = buildProfileUrl(effectiveSlug);
  const inlineSnippet = buildBadgeSnippet({ variant: "inline", slug: effectiveSlug });
  const cardSnippet = buildBadgeSnippet({ variant: "card", slug: effectiveSlug });

  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-3">
          {cafe ? `Get your "Featured" badge` : "Get the Featured-on-LSC badge"}
        </h1>
        <p className="text-lg text-muted mb-2">
          {cafe ? (
            <>
              You&apos;re featured on Local Specialty Coffee as{" "}
              <Link href={`/specialty-coffee-place/${cafe.slug}`} className="text-coral hover:underline font-medium">
                {cafe.name}
              </Link>
              . Drop one of these into your site to link back.
            </>
          ) : (
            <>Two embed badges your café can drop into its website to link back to your Local Specialty Coffee profile.</>
          )}
        </p>
        <p className="text-sm text-muted mb-10">
          Real <code className="bg-blush px-1.5 py-0.5 rounded text-ink">&lt;a href&gt;</code> markup, no iframes, no JavaScript — works everywhere.
        </p>

        {!cafe && !slug && (
          <div className="bg-coral-50 border border-blush rounded-xl p-5 text-sm mb-10">
            Tip: visit <code className="bg-white px-1.5 py-0.5 rounded">/badge?slug=YOUR-SLUG</code> from your profile page to pre-fill the link for you. Your slug is the last part of your LSC profile URL.
          </div>
        )}

        {slug && !cafe && (
          <div className="bg-coral-50 border border-blush rounded-xl p-5 text-sm mb-10">
            We couldn&apos;t find a café with slug <code className="bg-white px-1.5 py-0.5 rounded">{slug}</code>. The badges below still work — they&apos;ll just link to <code className="bg-white px-1.5 py-0.5 rounded">{profileUrl}</code>.
          </div>
        )}

        {/* Variant A — Inline */}
        <h2 className="text-2xl font-bold mt-12 mb-2">Inline badge</h2>
        <p className="text-muted mb-4">~60px tall pill. Sits naturally in a footer or &quot;as seen on&quot; row.</p>
        <div className="bg-white border border-blush rounded-2xl p-8 flex items-center justify-center mb-3 min-h-[120px]">
          <span dangerouslySetInnerHTML={{ __html: inlineSnippet }} />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <CopyButton code={inlineSnippet} />
          <span className="text-sm text-muted">Paste this into your site&apos;s HTML.</span>
        </div>
        <pre className="bg-ink text-[#e8e8e8] p-4 rounded-lg text-xs leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
          {inlineSnippet}
        </pre>

        {/* Variant B — Card */}
        <h2 className="text-2xl font-bold mt-12 mb-2">Card badge</h2>
        <p className="text-muted mb-4">200×200 stacked block. Use it in a sidebar or grid of partners.</p>
        <div className="bg-white border border-blush rounded-2xl p-8 flex items-center justify-center mb-3 min-h-[240px]">
          <span dangerouslySetInnerHTML={{ __html: cardSnippet }} />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <CopyButton code={cardSnippet} />
          <span className="text-sm text-muted">Paste this into your site&apos;s HTML.</span>
        </div>
        <pre className="bg-ink text-[#e8e8e8] p-4 rounded-lg text-xs leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
          {cardSnippet}
        </pre>

        <div className="mt-16 text-sm text-muted border-t border-blush pt-6">
          Questions? <Link href="/contact" className="text-coral hover:underline">Get in touch</Link>.
        </div>
      </div>
    </section>
  );
}
