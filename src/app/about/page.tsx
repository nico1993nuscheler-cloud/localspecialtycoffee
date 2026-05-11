import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About LocalSpecialtyCoffee | Our Mission & Story",
  description:
    "Learn about the passion and people behind LocalSpecialtyCoffee. Discover our mission to connect coffee lovers with amazing local specialty shops and roasters.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-6 prose-seo">
        <h1 className="text-4xl font-bold mb-6">About Local Specialty Coffee</h1>
        <p className="text-lg text-muted">
          We&apos;re a curated discovery platform for the world&apos;s best specialty
          coffee. Our mission is simple: get great coffee into more cups, more
          often, in more places.
        </p>
        <p>
          We&apos;ve been traveling, drinking and writing about specialty coffee
          since long before it had a category name. Every spot in our directory
          is here because it earned it — through craft, sourcing, and the kind of
          attention to detail that turns a transactional drink into something
          worth lingering over.
        </p>
        <h2 className="text-2xl font-bold mt-10 mb-4">What we look for</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Specialty-grade beans (SCA 80+), preferably with traceable origin</li>
          <li>Skilled baristas who can talk you through what they&apos;re pouring</li>
          <li>A space that respects your time — whether you&apos;re grabbing-and-going or staying for hours</li>
          <li>An obvious love for the craft. You feel it the moment you walk in.</li>
        </ul>
        <h2 className="text-2xl font-bold mt-10 mb-4">Get involved</h2>
        <p>
          Know a great spot we should add? <a href="/submissions">Submit it here</a>.
          Have feedback, ideas, or want to collaborate?{" "}
          <a href="/contact">Drop us a line</a>.
        </p>
      </div>
    </section>
  );
}
