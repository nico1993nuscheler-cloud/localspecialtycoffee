"use client";

import { useActionState } from "react";
import { subscribeLeadMagnet, subscribeNewsletter, type FormState } from "@/lib/actions";

const initial: FormState = { status: "idle" };

export function NewsletterForm({ tier = "newsletter" }: { tier?: "newsletter" | "lead_magnet" }) {
  const action = tier === "lead_magnet" ? subscribeLeadMagnet : subscribeNewsletter;
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.status === "ok") {
    return <p className="text-sm text-coral">{state.message}</p>;
  }
  return (
    <form action={formAction} className="flex gap-2">
      <input
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="flex-1 min-w-0 rounded-full px-4 py-2 text-sm text-ink bg-white placeholder:text-muted"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-coral text-white px-4 py-2 text-sm font-medium hover:bg-coral-300 transition-colors disabled:opacity-50"
      >
        {pending ? "..." : "Get it"}
      </button>
      {state.status === "error" && (
        <p className="text-xs text-coral mt-1 basis-full">{state.message}</p>
      )}
    </form>
  );
}
