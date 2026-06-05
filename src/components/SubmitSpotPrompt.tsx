import Link from "next/link";

/**
 * Contextual UGC prompt. The /submissions flow already exists but had zero
 * pickup because nothing pointed to it from the pages people actually read.
 * Dropping this on every city guide (with the city pre-filled via ?city=)
 * turns "I know a spot they missed" into a 1-click contribution — and the
 * pre-filled city flows through to the owner-notification email subject.
 */
export function SubmitSpotPrompt({ cityName }: { cityName?: string }) {
  const href = cityName
    ? `/submissions?city=${encodeURIComponent(cityName)}`
    : "/submissions";
  const heading = cityName ? `Know a spot we missed in ${cityName}?` : "Know a spot we missed?";

  return (
    <section className="max-w-6xl mx-auto px-6">
      <div className="rounded-3xl border-2 border-dashed border-blush bg-coral-50 px-6 py-8 md:px-10 md:py-9 flex flex-col md:flex-row md:items-center gap-5 justify-between">
        <div>
          <h3 className="text-xl md:text-2xl font-bold">{heading}</h3>
          <p className="text-muted mt-1 max-w-xl">
            We curate, but locals know best. Tell us about a roaster or brew bar
            worth crossing the city for — we review every submission.
          </p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-coral-bright text-ink font-bold px-6 py-3 hover:bg-coral hover:text-white transition-colors text-center"
        >
          Submit a spot
        </Link>
      </div>
    </section>
  );
}
