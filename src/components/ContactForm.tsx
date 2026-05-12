"use client";

import { useActionState } from "react";
import { submitContact, type FormState } from "@/lib/actions";

const initial: FormState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initial);
  if (state.status === "ok") {
    return (
      <div className="rounded-2xl bg-white border border-coral p-8 text-center">
        <p className="text-lg font-medium text-coral">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input name="name" type="text" required className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Phone</span>
          <input name="phone" type="tel" className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">City</span>
          <input name="city" type="text" className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Message</span>
        <textarea name="message" required rows={5} placeholder="Leave us a message" className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
      </label>
      {state.status === "error" && <p className="text-sm text-coral">{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-coral-bright text-ink px-6 py-3 font-bold hover:bg-coral hover:text-white transition-colors disabled:opacity-50 w-fit">
        {pending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
