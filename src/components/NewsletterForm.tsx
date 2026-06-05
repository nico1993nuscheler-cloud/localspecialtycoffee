"use client";

import { useActionState } from "react";
import { subscribeLeadMagnet, subscribeNewsletter, type FormState } from "@/lib/actions";
import { Turnstile } from "./Turnstile";

const initial: FormState = { status: "idle" };

export function NewsletterForm({
  tier = "newsletter",
  cta,
  citySlug,
  cityName,
}: {
  tier?: "newsletter" | "lead_magnet";
  cta?: string;
  /** When set on a lead-magnet form, the signup is tagged to this city so the
   *  automation email delivers the city-specific map. */
  citySlug?: string;
  cityName?: string;
}) {
  const action = tier === "lead_magnet" ? subscribeLeadMagnet : subscribeNewsletter;
  const [state, formAction, pending] = useActionState(action, initial);
  const buttonLabel = cta ?? (tier === "lead_magnet" ? "Get Access to the Maps" : "Get it");

  if (state.status === "ok") {
    return <p className="text-sm text-coral font-medium px-4 py-3">{state.message}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 w-full">
      {tier === "lead_magnet" && citySlug && (
        <>
          <input type="hidden" name="city_slug" value={citySlug} />
          <input type="hidden" name="city_name" value={cityName ?? ""} />
        </>
      )}
      <div className="bg-white p-1 rounded-2xl sm:rounded-full w-full flex flex-col sm:flex-row gap-2 sm:gap-1">
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
      </div>
      <Turnstile />
      {state.status === "error" && (
        <p className="text-xs text-coral">{state.message}</p>
      )}
    </form>
  );
}
