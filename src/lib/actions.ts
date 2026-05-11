"use server";

// Server Actions for all 5 forms. v1 logs submission server-side and (optionally)
// forwards to a Make.com webhook. Phase 4 will swap to Supabase inserts + Resend.
//
// Why this is enough for v1:
// - Webflow stops receiving submissions the moment DNS cuts over, so we just need
//   to not lose any leads.
// - Console log + Make.com forwarding covers both internal tracking and the
//   existing "Brew-tiful Guide" lead-magnet email automation.
// - Replacing with Supabase + Resend is mechanical and zero-SEO-risk later.

type SubmissionTier = "contact" | "submission_free" | "submission_premium" | "lead_magnet" | "newsletter";

export type FormState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

async function forwardToMake(tier: SubmissionTier, payload: Record<string, unknown>) {
  if (!MAKE_WEBHOOK_URL) return;
  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, payload, submitted_at: new Date().toISOString() }),
    });
  } catch (err) {
    console.error("[make-forward]", tier, err);
  }
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const payload = {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    city: String(formData.get("city") || ""),
    message: String(formData.get("message") || ""),
  };
  if (!payload.email || !payload.message) {
    return { status: "error", message: "Email and message are required." };
  }
  console.log("[contact]", payload);
  await forwardToMake("contact", payload);
  return { status: "ok", message: "Thanks! We'll be in touch shortly." };
}

export async function submitFree(_prev: FormState, formData: FormData): Promise<FormState> {
  const payload = Object.fromEntries(formData.entries());
  console.log("[submission_free]", payload);
  await forwardToMake("submission_free", payload);
  return { status: "ok", message: "Thanks! Your submission is in our review queue." };
}

export async function submitPremium(_prev: FormState, formData: FormData): Promise<FormState> {
  const payload = Object.fromEntries(formData.entries());
  console.log("[submission_premium]", payload);
  await forwardToMake("submission_premium", payload);
  return { status: "ok", message: "Thanks! We'll get back to you about premium placement." };
}

export async function subscribeLeadMagnet(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "");
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Please enter a valid email." };
  }
  console.log("[lead_magnet]", { email });
  await forwardToMake("lead_magnet", { email });
  return { status: "ok", message: "Thanks for submitting - check your email!" };
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "");
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Please enter a valid email." };
  }
  console.log("[newsletter]", { email });
  await forwardToMake("newsletter", { email });
  return { status: "ok", message: "Thanks for submitting - check your email!" };
}
