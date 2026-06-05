import type { Metadata } from "next";
import { SubmissionFormFree, SubmissionFormPremium } from "@/components/SubmissionForms";

export const metadata: Metadata = {
  title: "Local Specialty Coffee | How to submit your Business",
  description:
    "Submit here your Business information to us, so we can list your Specialty Coffee Shop or Coffee Roastery on our site. Increase your visibility with us.",
  alternates: { canonical: "/submissions" },
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const defaultCity = typeof city === "string" ? city : undefined;

  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-3">
          {defaultCity ? `Submit a spot in ${defaultCity}` : "Submit your business"}
        </h1>
        <p className="text-lg text-muted mb-10 max-w-2xl">
          {defaultCity
            ? `Know a specialty roaster or brew bar in ${defaultCity} we haven't listed? Tell us — we review every submission. Free or premium, pick what fits.`
            : "Run an exceptional specialty coffee spot? Get listed in our directory. Free or premium — pick what fits."}
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          <SubmissionFormFree defaultCity={defaultCity} />
          <SubmissionFormPremium defaultCity={defaultCity} />
        </div>
      </div>
    </section>
  );
}
