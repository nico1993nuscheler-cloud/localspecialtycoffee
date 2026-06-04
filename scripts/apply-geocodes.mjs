#!/usr/bin/env node
/**
 * apply-geocodes.mjs
 *
 * Push the latitude/longitude resolved by geocode-places.mjs (data/geocodes.json)
 * into Supabase lsc_coffee_places. Idempotent — re-running is safe.
 *
 * Required env (read from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (bypasses RLS for the write)
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function need(v, n) { if (!v) throw new Error(`Missing ${n}`); return v; }

async function loadEnv(root) {
  const wanted = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  if (wanted.every((k) => process.env[k])) return;
  try {
    const raw = await fs.readFile(path.join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (m && wanted.includes(m[1]) && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* caller errors if missing */ }
}

async function main() {
  const root = path.resolve(import.meta.dirname, "..");
  await loadEnv(root);
  const url = need(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const key = need(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const rows = JSON.parse(await fs.readFile(path.join(root, "data", "geocodes.json"), "utf8"))
    .filter((r) => r.lat != null && r.lng != null);

  console.log(`Applying ${rows.length} coordinate pairs...`);
  let ok = 0;
  for (const r of rows) {
    const { error } = await sb
      .from("lsc_coffee_places")
      .update({ latitude: r.lat, longitude: r.lng })
      .eq("webflow_id", r.webflow_id);
    if (error) { console.error(`  ✗ ${r.name}: ${error.message}`); continue; }
    ok++;
  }
  console.log(`✓ Updated ${ok}/${rows.length}`);

  const { count } = await sb
    .from("lsc_coffee_places")
    .select("*", { count: "exact", head: true })
    .not("latitude", "is", null);
  console.log(`✓ ${count} places now have coordinates in Supabase`);
}

main().catch((e) => { console.error("Fatal:", e.message ?? e); process.exit(1); });
