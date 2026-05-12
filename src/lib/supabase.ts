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
