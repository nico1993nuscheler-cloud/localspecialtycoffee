"use client";

import { useActionState } from "react";
import { submitFree, submitPremium, type FormState } from "@/lib/actions";

const initial: FormState = { status: "idle" };

function CommonFields() {
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Full name</span>
          <input name="full_name" type="text" required className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Phone</span>
        <input name="phone" type="tel" className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Spot name</span>
        <input name="spot_name" type="text" required className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Short description</span>
        <textarea name="description" rows={3} className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Website</span>
        <input name="website" type="url" className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Address</span>
        <input name="address" type="text" className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
      </label>
      <fieldset>
        <legend className="text-sm font-medium mb-2">Category</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="category_specialty_coffee_shop" /> Specialty Coffee Shop
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="category_coffee_roaster" /> Coffee Roaster
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="category_barista_course" /> Barista Course
          </label>
        </div>
      </fieldset>
    </>
  );
}

export function SubmissionFormFree() {
  const [state, formAction, pending] = useActionState(submitFree, initial);
  if (state.status === "ok") {
    return (
      <div className="rounded-2xl bg-white border border-coral p-8 text-center">
        <p className="text-lg font-medium text-coral">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={formAction} className="grid gap-4 bg-white rounded-2xl border border-blush p-6">
      <h3 className="text-xl font-semibold">Free listing</h3>
      <CommonFields />
      {state.status === "error" && <p className="text-sm text-coral">{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-coral text-white px-6 py-3 font-medium hover:bg-coral-300 disabled:opacity-50 w-fit">
        {pending ? "Submitting..." : "Submit free listing"}
      </button>
    </form>
  );
}

export function SubmissionFormPremium() {
  const [state, formAction, pending] = useActionState(submitPremium, initial);
  if (state.status === "ok") {
    return (
      <div className="rounded-2xl bg-white border border-coral p-8 text-center">
        <p className="text-lg font-medium text-coral">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={formAction} className="grid gap-4 bg-coral-50 rounded-2xl border border-coral p-6">
      <h3 className="text-xl font-semibold">Premium listing</h3>
      <p className="text-sm text-muted">Featured placement, gallery, booking link, priority review.</p>
      <CommonFields />
      <label className="block">
        <span className="text-sm font-medium">Booking link</span>
        <input name="booking_link" type="url" className="mt-1 block w-full rounded-lg border border-blush bg-white px-3 py-2" />
      </label>
      {state.status === "error" && <p className="text-sm text-coral">{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-ink text-white px-6 py-3 font-medium hover:bg-coral disabled:opacity-50 w-fit">
        {pending ? "Submitting..." : "Submit premium listing"}
      </button>
    </form>
  );
}
