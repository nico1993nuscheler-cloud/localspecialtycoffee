#!/usr/bin/env node
/**
 * One-shot bulk import: load places.json / cities.json / categories.json
 * into the Supabase LSC tables. Uses the service role key (bypasses RLS).
 *
 * Required env (passed inline at run-time):
 *   SUPABASE_URL              https://djiixtplbsutuiuxfhiy.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY (one-time use; rotate after)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");

function need(v, name) { if (!v) throw new Error(`Missing ${name}`); return v; }

async function main() {
  const url = need(process.env.SUPABASE_URL, "SUPABASE_URL");
  const key = need(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const cats = JSON.parse(await fs.readFile(path.join(DATA, "categories.json"), "utf8"));
  const cities = JSON.parse(await fs.readFile(path.join(DATA, "cities.json"), "utf8"));
  const places = JSON.parse(await fs.readFile(path.join(DATA, "places.json"), "utf8"));

  // ── Categories ──
  console.log(`Categories: upserting ${cats.length}...`);
  const { error: cErr } = await sb
    .from("lsc_categories")
    .upsert(cats, { onConflict: "webflow_id" });
  if (cErr) throw new Error(`categories: ${cErr.message}`);
  const { count: catCount } = await sb.from("lsc_categories").select("*", { count: "exact", head: true });
  console.log(`  ✓ ${catCount} rows`);

  // ── Cities ──
  console.log(`Cities: upserting ${cities.length}...`);
  const { error: ciErr } = await sb
    .from("lsc_cities")
    .upsert(cities, { onConflict: "webflow_id" });
  if (ciErr) throw new Error(`cities: ${ciErr.message}`);
  const { count: cityCount } = await sb.from("lsc_cities").select("*", { count: "exact", head: true });
  console.log(`  ✓ ${cityCount} rows`);

  // ── Build webflow_id → uuid maps so we can resolve FKs ──
  const { data: catRows } = await sb.from("lsc_categories").select("id,webflow_id");
  const { data: cityRows } = await sb.from("lsc_cities").select("id,webflow_id");
  const catMap = new Map(catRows.map((r) => [r.webflow_id, r.id]));
  const cityMap = new Map(cityRows.map((r) => [r.webflow_id, r.id]));

  // ── Places ── transform to include city_id / category_id, drop webflow refs
  const placeRows = places.map((p) => {
    const { city_webflow_id, category_webflow_id, ...rest } = p;
    return {
      ...rest,
      city_id: cityMap.get(city_webflow_id) ?? null,
      category_id: catMap.get(category_webflow_id) ?? null,
    };
  });

  // Upsert in batches of 100 to stay polite with the REST API
  const BATCH = 100;
  console.log(`Places: upserting ${placeRows.length} in batches of ${BATCH}...`);
  for (let i = 0; i < placeRows.length; i += BATCH) {
    const slice = placeRows.slice(i, i + BATCH);
    const { error: pErr } = await sb
      .from("lsc_coffee_places")
      .upsert(slice, { onConflict: "webflow_id" });
    if (pErr) throw new Error(`places batch ${i}-${i + slice.length}: ${pErr.message}`);
    console.log(`  ✓ ${i + slice.length}/${placeRows.length}`);
  }
  const { count: placeCount } = await sb.from("lsc_coffee_places").select("*", { count: "exact", head: true });
  console.log(`  ✓ ${placeCount} rows total`);

  console.log("\n✅ Import complete.");
}

main().catch((err) => { console.error("Fatal:", err.message ?? err); process.exit(1); });
