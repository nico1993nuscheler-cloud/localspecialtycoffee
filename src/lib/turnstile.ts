// Server-side Cloudflare Turnstile verification.
// Returns { ok: true } when the token validates, { ok: false, reason } otherwise.
// If TURNSTILE_SECRET_KEY is unset we skip verification (dev convenience) and
// log a warning — so missing env vars never block submissions in early setup.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | null | undefined,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY unset — skipping verification");
    return { ok: true };
  }
  if (!token) {
    return { ok: false, reason: "missing-token" };
  }
  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success) return { ok: true };
    const reason = data["error-codes"]?.join(",") || "unknown";
    console.warn("[turnstile] verification failed", reason);
    return { ok: false, reason };
  } catch (err) {
    console.error("[turnstile] verify threw", err);
    return { ok: false, reason: "network-error" };
  }
}
