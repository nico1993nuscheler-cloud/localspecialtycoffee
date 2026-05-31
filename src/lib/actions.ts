"use server";

import { Resend } from "resend";
import { verifyTurnstile } from "./turnstile";

const CAPTCHA_ERROR: FormState = {
  status: "error",
  message: "Captcha check failed — please try again.",
};

function captchaToken(formData: FormData): string | null {
  const v = formData.get("cf-turnstile-response");
  return typeof v === "string" ? v : null;
}

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

type OwnerTier = Exclude<SubmissionTier, "lead_magnet" | "newsletter">;

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  full_name: "Name",
  email: "Email",
  phone: "Phone",
  city: "City",
  message: "Message",
  spot_name: "Spot",
  description: "Description",
  website: "Website",
  address: "Address",
  booking_link: "Booking link",
};

function pickStr(payload: Record<string, unknown>, key: string): string {
  const v = payload[key];
  return typeof v === "string" ? v.trim() : "";
}

function categoriesFrom(payload: Record<string, unknown>): string {
  const map: Record<string, string> = {
    category_specialty_coffee_shop: "Specialty Coffee Shop",
    category_coffee_roaster: "Coffee Roaster",
    category_barista_course: "Barista Course",
  };
  return Object.entries(map)
    .filter(([k]) => payload[k])
    .map(([, label]) => label)
    .join(", ");
}

function subjectFor(tier: OwnerTier, payload: Record<string, unknown>): string {
  const name = pickStr(payload, "name") || pickStr(payload, "full_name") || "no name";
  const city = pickStr(payload, "city");
  const spot = pickStr(payload, "spot_name");
  const where = city || pickStr(payload, "address");

  if (tier === "contact") {
    return city ? `${name} from ${city} got in touch` : `${name} got in touch`;
  }
  if (tier === "submission_free") {
    const label = spot || name;
    return where ? `Free listing request: ${label} (${where})` : `Free listing request: ${label}`;
  }
  // submission_premium
  const label = spot || name;
  return where ? `Premium listing request: ${label} (${where})` : `Premium listing request: ${label}`;
}

function bodyLines(tier: OwnerTier, payload: Record<string, unknown>): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [];
  const used = new Set<string>();
  const ordered = tier === "contact"
    ? ["name", "email", "phone", "city", "message"]
    : ["full_name", "email", "phone", "spot_name", "description", "website", "address", "booking_link"];

  for (const key of ordered) {
    const v = pickStr(payload, key);
    if (v) {
      lines.push({ label: FIELD_LABELS[key] ?? key, value: v });
      used.add(key);
    }
  }
  if (tier !== "contact") {
    const cats = categoriesFrom(payload);
    if (cats) lines.push({ label: "Category", value: cats });
  }
  // Catch any unmapped non-empty string fields so nothing is silently lost
  for (const [k, v] of Object.entries(payload)) {
    if (used.has(k) || k.startsWith("category_")) continue;
    if (typeof v === "string" && v.trim()) {
      lines.push({ label: FIELD_LABELS[k] ?? k, value: v.trim() });
    }
  }
  return lines;
}

const OPENERS: Record<OwnerTier, (payload: Record<string, unknown>) => string> = {
  contact: (p) => {
    const name = pickStr(p, "name") || "Someone";
    return `${name} sent you a message via the contact form on localspecialtycoffee.com. Hit reply to respond directly — their email is set as Reply-To.`;
  },
  submission_free: (p) => {
    const spot = pickStr(p, "spot_name") || "a new spot";
    return `Someone wants to submit ${spot} for a free listing on localspecialtycoffee.com. Hit reply to follow up.`;
  },
  submission_premium: (p) => {
    const spot = pickStr(p, "spot_name") || "a new spot";
    return `Someone wants premium placement for ${spot} on localspecialtycoffee.com. Hit reply to follow up.`;
  },
};

async function notifyOwner(
  tier: OwnerTier,
  payload: Record<string, unknown>,
  replyTo?: string,
) {
  if (!RESEND_API_KEY) {
    console.error("[resend] missing RESEND_API_KEY — submission not emailed", tier, payload);
    return;
  }

  const subject = subjectFor(tier, payload);
  const opener = OPENERS[tier](payload);
  const lines = bodyLines(tier, payload);

  const textBody = [
    opener,
    "",
    ...lines.map(({ label, value }) => `${label}: ${value}`),
    "",
    "— sent from localspecialtycoffee.com",
  ].join("\n");

  const htmlLines = lines
    .map(({ label, value }) =>
      `<p style="margin:0 0 10px 0;"><strong style="color:#222;">${escapeHtml(label)}:</strong> ${escapeHtml(value).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const htmlBody = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:520px;">
<p style="margin:0 0 16px 0;">${escapeHtml(opener)}</p>
${htmlLines}
<p style="margin:24px 0 0 0;color:#888;font-size:13px;">— sent from localspecialtycoffee.com</p>
</div>`;

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      replyTo: replyTo || undefined,
      subject,
      html: htmlBody,
      text: textBody,
    });
    if (error) console.error("[resend] send error", tier, error);
  } catch (err) {
    console.error("[resend] threw", tier, err);
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function notifyNewSubscriber(tier: "newsletter" | "lead_magnet", email: string) {
  if (!RESEND_API_KEY) {
    console.error("[resend] missing RESEND_API_KEY — subscriber notification skipped", tier, email);
    return;
  }
  const label = tier === "newsletter" ? "newsletter" : "lead-magnet";
  const subject = `New ${label} signup: ${email}`;
  const opener = `Someone just signed up for the ${label} on localspecialtycoffee.com.`;
  const textBody = [
    opener,
    "",
    `Email: ${email}`,
    `Source: ${tier}`,
    "",
    "They've been added to MailerLite group 'localspecialtycoffee Maps Subscribers'.",
    "",
    "— sent from localspecialtycoffee.com",
  ].join("\n");
  const htmlBody = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:520px;">
<p style="margin:0 0 16px 0;">${escapeHtml(opener)}</p>
<p style="margin:0 0 10px 0;"><strong style="color:#222;">Email:</strong> ${escapeHtml(email)}</p>
<p style="margin:0 0 10px 0;"><strong style="color:#222;">Source:</strong> ${escapeHtml(tier)}</p>
<p style="margin:16px 0 0 0;color:#555;">They've been added to MailerLite group <em>localspecialtycoffee Maps Subscribers</em>.</p>
<p style="margin:24px 0 0 0;color:#888;font-size:13px;">— sent from localspecialtycoffee.com</p>
</div>`;

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      subject,
      html: htmlBody,
      text: textBody,
    });
    if (error) console.error("[resend] subscriber-notify error", tier, error);
  } catch (err) {
    console.error("[resend] subscriber-notify threw", tier, err);
  }
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
  const captcha = await verifyTurnstile(captchaToken(formData));
  if (!captcha.ok) return CAPTCHA_ERROR;
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
  const captcha = await verifyTurnstile(captchaToken(formData));
  if (!captcha.ok) return CAPTCHA_ERROR;
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
  const captcha = await verifyTurnstile(captchaToken(formData));
  if (!captcha.ok) return CAPTCHA_ERROR;
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
  const captcha = await verifyTurnstile(captchaToken(formData));
  if (!captcha.ok) return CAPTCHA_ERROR;
  const email = String(formData.get("email") || "");
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Please enter a valid email." };
  }
  console.log("[lead_magnet]", { email });
  await Promise.all([
    addToMailerLite("lead_magnet", email),
    notifyNewSubscriber("lead_magnet", email),
  ]);
  return { status: "ok", message: "Thanks for submitting - check your email!" };
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const captcha = await verifyTurnstile(captchaToken(formData));
  if (!captcha.ok) return CAPTCHA_ERROR;
  const email = String(formData.get("email") || "");
  if (!email || !email.includes("@")) {
    return { status: "error", message: "Please enter a valid email." };
  }
  console.log("[newsletter]", { email });
  await Promise.all([
    addToMailerLite("newsletter", email),
    notifyNewSubscriber("newsletter", email),
  ]);
  return { status: "ok", message: "Thanks for submitting - check your email!" };
}
