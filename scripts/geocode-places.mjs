#!/usr/bin/env node
/**
 * geocode-places.mjs
 *
 * Resolve latitude/longitude for LSC coffee places using the Google Places API
 * (New). Reads the place list straight from Supabase (the source of truth —
 * data/places.json is a stale snapshot), geocodes each one, and writes an
 * auditable result file + a Markdown report of low-confidence matches.
 *
 * It does NOT write to Supabase. The coordinates are applied separately (via
 * the Supabase MCP / a reviewed UPDATE) so the geocode pass stays auditable and
 * needs no service-role key here.
 *
 * Idempotent: by default skips places that already have coordinates in Supabase
 * AND merges into any existing data/geocodes.json, so per-city runs accumulate.
 *
 * Required env (read from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   GOOGLE_PLACES_API_KEY
 *
 * Usage:
 *   node scripts/geocode-places.mjs [options]
 *
 * Options:
 *   --city <slug>     Only geocode places in this city slug (e.g. specialty-coffee-zurich)
 *   --limit N         Stop after N places (smoke-test cap)
 *   --force           Re-geocode even places that already have coordinates
 *   --out PATH        Output JSON (default data/geocodes.json)
 *
 * Cost: 1 Text Search call per place. Pro-SKU free tier = 5,000 calls/month.
 *   A full 768-place run is ~15% of one month's free bucket → $0.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const API_BASE = "https://places.googleapis.com/v1";

function need(v, name) {
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function parseArgs(argv) {
  const opts = { city: null, limit: Infinity, force: false, out: "data/geocodes.json" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--city") opts.city = argv[++i];
    else if (a === "--limit") opts.limit = Number(argv[++i]);
    else if (a === "--force") opts.force = true;
    else if (a === "--out") opts.out = argv[++i];
  }
  return opts;
}

async function loadEnv(repoRoot) {
  // Light .env.local loader for the three keys we need. Dep-free on purpose.
  const wanted = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GOOGLE_PLACES_API_KEY",
  ];
  if (wanted.every((k) => process.env[k])) return;
  try {
    const raw = await fs.readFile(path.join(repoRoot, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (m && wanted.includes(m[1]) && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* env file may not exist; caller errors if a key is missing */ }
}

async function textSearch(apiKey, query) {
  const res = await fetch(`${API_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
      ].join(","),
    },
    body: JSON.stringify({ textQuery: query }),
  });
  if (!res.ok) throw new Error(`textSearch ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.places || [];
}

// Lowercase + strip diacritics so "Zurich" matches Google's "Zürich" and
// "Sao Paulo" matches "São Paulo".
function norm(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Rank by formattedAddress containing a token from the expected city, then by
// presence of a location. We don't have rating in the field mask (geocoding
// doesn't need it) so the first city-matching candidate wins.
function pickBestMatch(candidates, cityTok) {
  if (!candidates.length) return null;
  const withLoc = candidates.filter((p) => p.location?.latitude != null);
  if (!withLoc.length) return null;
  if (cityTok) {
    const tok = norm(cityTok);
    const inCity = withLoc.filter((p) => norm(p.formattedAddress).includes(tok));
    if (inCity.length) return inCity[0];
  }
  return withLoc[0];
}

// A short token we expect in the resolved address to trust the city match.
// Strip trailing ", XX" state suffixes ("Austin, TX" -> "Austin").
function cityToken(cityName) {
  return (cityName || "").split(",")[0].trim();
}

function escapeMd(s) {
  return (s || "").replace(/\|/g, "\\|");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(import.meta.dirname, "..");
  await loadEnv(repoRoot);

  const supabaseUrl = need(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = need(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const apiKey = need(process.env.GOOGLE_PLACES_API_KEY, "GOOGLE_PLACES_API_KEY");

  const sb = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

  // Pull places + their city (name/slug) via the city_id FK.
  let q = sb
    .from("lsc_coffee_places")
    .select("webflow_id,slug,name,address,latitude,longitude,lsc_cities!inner(slug,name)")
    .order("name");
  if (opts.city) q = q.eq("lsc_cities.slug", opts.city);
  const { data: rows, error } = await q;
  if (error) throw new Error(`supabase read: ${error.message}`);

  // Load + merge any prior results (idempotent accumulation).
  const outPath = path.isAbsolute(opts.out) ? opts.out : path.join(repoRoot, opts.out);
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(outPath, "utf8"));
  } catch { /* first run */ }
  const byId = new Map(existing.map((r) => [r.webflow_id, r]));

  const todo = rows.filter((r) => {
    if (opts.force) return true;
    // skip if already geocoded in Supabase OR already in our result file
    if (r.latitude != null && r.longitude != null) return false;
    if (byId.has(r.webflow_id) && byId.get(r.webflow_id).lat != null) return false;
    return true;
  });

  const limited = todo.slice(0, opts.limit);
  console.log(
    `→ ${rows.length} places in scope · ${todo.length} need geocoding · processing ${limited.length}` +
      (opts.city ? ` · city=${opts.city}` : ""),
  );

  const lowConfidence = [];
  let done = 0;
  for (const r of limited) {
    const cityName = r.lsc_cities?.name || "";
    const tok = cityToken(cityName);
    const query = `${r.name} ${r.address || ""} ${cityName}`.trim();
    try {
      const candidates = await textSearch(apiKey, query);
      const match = pickBestMatch(candidates, tok);
      if (!match) {
        const entry = { webflow_id: r.webflow_id, slug: r.slug, name: r.name, city: cityName, lat: null, lng: null, resolvedAddress: null, confidence: "none" };
        byId.set(r.webflow_id, entry);
        lowConfidence.push(entry);
        console.log(`  ✗ ${r.name} — no match`);
        continue;
      }
      const resolved = match.formattedAddress || "";
      const matchesCity = tok ? norm(resolved).includes(norm(tok)) : true;
      const entry = {
        webflow_id: r.webflow_id,
        slug: r.slug,
        name: r.name,
        city: cityName,
        lat: match.location.latitude,
        lng: match.location.longitude,
        resolvedAddress: resolved,
        confidence: matchesCity ? "ok" : "city-mismatch",
      };
      byId.set(r.webflow_id, entry);
      if (!matchesCity) lowConfidence.push(entry);
      done++;
      console.log(`  ${matchesCity ? "✓" : "⚠"} ${r.name} → ${entry.lat.toFixed(5)}, ${entry.lng.toFixed(5)}${matchesCity ? "" : "  (city mismatch: " + resolved + ")"}`);
    } catch (err) {
      const entry = { webflow_id: r.webflow_id, slug: r.slug, name: r.name, city: cityName, lat: null, lng: null, resolvedAddress: null, confidence: "error", error: err.message };
      byId.set(r.webflow_id, entry);
      lowConfidence.push(entry);
      console.error(`  ERROR ${r.name}: ${err.message}`);
    }
  }

  const merged = [...byId.values()].sort((a, b) => (a.city + a.name).localeCompare(b.city + b.name));
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(merged, null, 2));

  // Report — only the rows a human needs to look at.
  const reportPath = path.join(repoRoot, "data", "geocode-report.md");
  const lines = [
    `# Geocode report`,
    "",
    `${merged.length} places resolved total · ${merged.filter((r) => r.lat != null).length} with coords · ${lowConfidence.length} need review.`,
    "",
  ];
  if (lowConfidence.length) {
    lines.push("## Needs manual review", "", "| City | Cafe | Issue | Resolved address |", "|---|---|---|---|");
    for (const r of lowConfidence) {
      lines.push(`| ${escapeMd(r.city)} | ${escapeMd(r.name)} | ${r.confidence}${r.error ? ": " + escapeMd(r.error) : ""} | ${escapeMd(r.resolvedAddress || "—")} |`);
    }
  } else {
    lines.push("✓ No low-confidence matches in this run.");
  }
  await fs.writeFile(reportPath, lines.join("\n"));

  console.log(`\n✓ ${done} geocoded this run · ${lowConfidence.length} flagged`);
  console.log(`✓ Wrote ${outPath}`);
  console.log(`✓ Wrote ${reportPath}`);
  console.log(`\nNext: review geocode-report.md, then apply coords to Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
