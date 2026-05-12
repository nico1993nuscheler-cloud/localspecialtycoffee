import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-24">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-6xl font-bold text-coral mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-3">Brewing… nothing here.</h2>
        <p className="text-muted mb-8">
          The page you&apos;re looking for has been roasted into oblivion. Try one of these:
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="rounded-full bg-coral-bright text-ink px-6 py-3 font-bold hover:bg-coral hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/cities" className="rounded-full border border-ink px-6 py-3 font-medium hover:bg-blush transition-colors">
            Browse cities
          </Link>
        </div>
      </div>
    </section>
  );
}
