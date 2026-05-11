import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us - Your Local Specialty Coffee Guide",
  description:
    "Want us to add a city, add your business to Local Specialty Coffee or collaborate with us? Get in touch either via online form or email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-3">Get in touch</h1>
        <p className="text-lg text-muted mb-10">
          Want us to add a city, get your business listed, or collaborate?
          Drop us a line — we read everything.
        </p>
        <ContactForm />
      </div>
    </section>
  );
}
