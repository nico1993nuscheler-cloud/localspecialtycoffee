"use server";

// Server Actions for all 5 forms.
// - Newsletter + lead-magnet signups: added directly to MailerLite. MailerLite's
//   "subscriber joined group" automation fires the "Brew-tiful Guide" email.
// - Contact / free / premium submissions: logged server-side. View in Vercel
//   runtime logs. (No autoresponder needed for these.)
// - Optional Make.com forward kept as a no-op when MAKE_WEBHOOK_URL is unset.

type SubmissionTier = "contact" | "submission_free" | "submission_premium" | "lead_magnet" | "newsletter";

export type FormState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

async function addToMailerLite(tier: SubmissionTier, email: string) {
  if (!MAILERLITE_API_KEY || !MAILERLITE_GROUP_ID) {
    console.error("[mailerlite] missing MAILERLITE_API_KEY or MAILERLITE_GROUP_ID");
    return;
  }
  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MAILERLITE_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email,
        groups: [MAILERLITE_GROUP_ID],
        fields: { source: tier },
      }),
    });
    if (!res.ok) {
      console.error("[mailerlite] non-2xx", tier, res.status, await res.text());
    }
  } catch (err) {
    console.error("[mailerlite]", tier, err);
  }
}

async function forwardToMake(tier: SubmissionTier, payload: Record<string, unknown>) {
  if (!MAKE_WEBHOOK_URL) return;
  try {
    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, tier, submitted_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      console.error("[make-forward] non-2xx", tier, res.status, await res.text());
    }
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
  await addToMailerLite("lead_magnet", email);
  return { status: "ok", message: "Thanks for submitting - check your email!" };
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "");
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Please enter a valid email." };
  }
  console.log("[newsletter]", { email });
  await addToMailerLite("newsletter", email);
  return { status: "ok", message: "Thanks for submitting - check your email!" };
}
