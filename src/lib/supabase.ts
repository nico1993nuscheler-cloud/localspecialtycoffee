import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client. Uses the anon (publishable) key + RLS public
// read policies. Never imported into client components.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Supabase env vars missing — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel + .env.local",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
  global: { headers: { "x-application-name": "lsc-web" } },
});

// ── Build-time resilience ──────────────────────────────────────────────
// Supabase was downgraded Pro → Free. Free projects auto-pause after 7 days
// of inactivity, and a paused / cold-starting DB returns:
//   { code: 'PGRST002', message: 'Could not query the database for the
//     schema cache. Retrying.' }
// during `next build`. A single transient failure used to abort the entire
// production build (Failed to collect page data). `withDbRetry` retries the
// query a few times with increasing backoff so a brief outage or a Free-tier
// cold start no longer kills the build.

// PostgREST schema-cache / connection errors that are worth retrying. A cold
// Supabase typically returns PGRST002; we also retry generic network/fetch
// failures and gateway-class HTTP statuses thrown by the underlying client.
function isRetryableDbError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { code?: string; message?: string; status?: number; name?: string };
  if (e.code === "PGRST002" || e.code === "PGRST001") return true;
  if (e.status === 502 || e.status === 503 || e.status === 504) return true;
  const msg = (e.message ?? "").toLowerCase();
  return (
    msg.includes("schema cache") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("connection") ||
    e.name === "AbortError"
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run a Supabase read with retry-and-backoff. The callback should perform the
 * query and THROW on a Supabase `error` (the existing data-layer convention),
 * so both thrown PostgREST errors and rejected promises are handled.
 *
 * Defaults: 5 attempts, exponential backoff 1s → 2s → 4s → 8s (+ jitter),
 * capped at 10s. That gives ~15s of total wait, enough to ride out a Free-tier
 * cold start without meaningfully slowing a healthy build.
 *
 * Non-retryable errors (e.g. a real query bug) are re-thrown immediately so we
 * don't silently mask logic errors.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelayMs?: number; maxDelayMs?: number; label?: string } = {},
): Promise<T> {
  // Env-tunable so a build against a slow/cold Free-tier project can wait
  // longer, or a test can run fast, without code changes. Defaults: 5 attempts,
  // 1s base, 10s cap → ~15s max total wait per query.
  const envInt = (name: string): number | undefined => {
    const v = process.env[name];
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const attempts = opts.attempts ?? envInt("SUPABASE_RETRY_ATTEMPTS") ?? 5;
  const baseDelayMs = opts.baseDelayMs ?? envInt("SUPABASE_RETRY_BASE_MS") ?? 1000;
  const maxDelayMs = opts.maxDelayMs ?? envInt("SUPABASE_RETRY_MAX_MS") ?? 10000;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !isRetryableDbError(err)) throw err;
      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const delay = backoff + Math.floor(Math.random() * 250);
      const label = opts.label ? ` [${opts.label}]` : "";
      console.warn(
        `[supabase] retryable DB error${label} (attempt ${attempt}/${attempts}), ` +
          `retrying in ${delay}ms:`,
        (err as { code?: string; message?: string })?.code ??
          (err as { message?: string })?.message,
      );
      await sleep(delay);
    }
  }
  // Unreachable: loop either returns or throws. Satisfies the type checker.
  throw lastErr;
}
