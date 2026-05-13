"use server";

import { Resend } from "resend";

// Server Actions for all 5 forms.
// - Newsletter + lead-magnet signups: added directly to MailerLite. MailerLite's
//   "subscriber joined group" automation fires the "Brew-tiful Guide" email.
// - Contact / free / premium submissions: emailed to the LSC inbox via Resend.
// - Optional Make.com forward kept as a no-op when MAKE_WEBHOOK_URL is unset.

type SubmissionTier = "contact" | "submission_free" | "submission_premium" | "lead_magnet" | "newsletter";

export type FormState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_TO = process.env.NOTIFY_TO ?? "localspecialtycoffee@gmail.com";
// Resend lets you send from `onboarding@resend.dev` without verifying a custom
// domain — fine to start. Swap NOTIFY_FROM later to e.g. forms@localspecialtycoffee.com
// after adding the DNS records in Resend.
const NOTIFY_FROM = process.env.NOTIFY_FROM ?? "Local Specialty Coffee <onboarding@resend.dev>";

const SUBJECTS: Record<Exclude<SubmissionTier, "lead_magnet" | "newsletter">, string> = {
  contact: "New contact form submission",
  submission_free: "New free submission",
  submission_premium: "New premium submission",
};

async function notifyOwner(
  tier: Exclude<SubmissionTier, "lead_magnet" | "newsletter">,
  payload: Record<string, unknown>,
  replyTo?: string,
) {
  if (!RESEND_API_KEY) {
    console.error("[resend] missing RESEND_API_KEY — submission not emailed", tier, payload);
    return;
  }
  const rows = Object.entries(payload)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;"><strong>${escapeHtml(k)}</strong></td><td style="padding:4px 0;">${escapeHtml(String(v)).replace(/\n/g, "<br>")}</td></tr>`)
    .join("");
  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      replyTo: replyTo || undefined,
      subject: SUBJECTS[tier],
      html: `<table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse;">${rows}</table>`,
    });
    if (error) console.error("[resend] send error", tier, error);
  } catch (err) {
    console.error("[resend] threw", tier, err);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

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
  await Promise.all([
    notifyOwner("contact", payload, payload.email),
    forwardToMake("contact", payload),
  ]);
  return { status: "ok", message: "Thanks! We'll be in touch shortly." };
}

export async function submitFree(_prev: FormState, formData: FormData): Promise<FormState> {
  const payload = Object.fromEntries(formData.entries());
  console.log("[submission_free]", payload);
  const replyTo = typeof payload.email === "string" ? payload.email : undefined;
  await Promise.all([
    notifyOwner("submission_free", payload, replyTo),
    forwardToMake("submission_free", payload),
  ]);
  return { status: "ok", message: "Thanks! Your submission is in our review queue." };
}

export async function submitPremium(_prev: FormState, formData: FormData): Promise<FormState> {
  const payload = Object.fromEntries(formData.entries());
  console.log("[submission_premium]", payload);
  const replyTo = typeof payload.email === "string" ? payload.email : undefined;
  await Promise.all([
    notifyOwner("submission_premium", payload, replyTo),
    forwardToMake("submission_premium", payload),
  ]);
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
