"use client";

import { useActionState } from "react";
import { subscribeLeadMagnet, subscribeNewsletter, type FormState } from "@/lib/actions";

const initial: FormState = { status: "idle" };

export function NewsletterForm({
  tier = "newsletter",
  cta,
}: {
  tier?: "newsletter" | "lead_magnet";
  cta?: string;
}) {
  const action = tier === "lead_magnet" ? subscribeLeadMagnet : subscribeNewsletter;
  const [state, formAction, pending] = useActionState(action, initial);
  const buttonLabel = cta ?? (tier === "lead_magnet" ? "Get Access to the Maps" : "Get it");

  if (state.status === "ok") {
    return <p className="text-sm text-coral font-medium px-4 py-3">{state.message}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col sm:flex-row gap-2 sm:gap-1 w-full">
      <input
        name="email"
        type="email"
        required
        placeholder="Enter your email"
        className="flex-1 min-w-0 rounded-full px-5 py-3 text-base text-ink bg-white placeholder:text-muted outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-coral-bright text-ink font-bold px-6 py-3 hover:bg-coral hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {pending ? "..." : buttonLabel}
      </button>
      {state.status === "error" && (
        <p className="text-xs text-coral basis-full mt-1 sm:px-4">{state.message}</p>
      )}
    </form>
  );
}
