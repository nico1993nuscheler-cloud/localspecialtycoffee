#!/usr/bin/env node
/**
 * export-cafes-for-outreach.mjs
 *
 * Pull every cafe from lsc_coffee_places that has a non-empty email,
 * join with lsc_cities to get city name + slug, bucket into EN / DE
 * (DACH cities → DE), and write two Lemlist-ready CSVs to
 * ../outreach/csv/.
 *
 * Columns match the {{variable}} names used in
 *   ../outreach/email-cadence-{en,de}.md
 * — same source of truth so importing into Lemlist needs no manual
 * column mapping.
 *
 * The {{badgeEmbedCode}} column is precomputed per lead (the exact HTML
 * <a href> snippet, with the cafe's profile URL already baked in). That
 * way cafes can copy the badge straight from the email body without
 * having to visit /badge first. Generated from the same helper the
 * Next.js /badge route uses (src/lib/badge.ts) — single source of truth.
 *
 * Usage:
 *   node scripts/export-cafes-for-outreach.mjs              # writes CSVs
 *   node scripts/export-cafes-for-outreach.mjs --dry-run    # counts only
 *   node scripts/export-cafes-for-outreach.mjs --out PATH   # custom out dir
 *
 * Required env (loaded from .env.local):
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(import.meta.dirname, "..");

// ── env loading (same parser as inject-city.mjs) ─────────────────────────────

async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    const out = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
    for (const [k, v] of Object.entries(out)) {
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* missing .env.local is fine when env is set externally */ }
}

function need(v, name) { if (!v) throw new Error(`Missing ${name}`); return v; }

function parseArgs(argv) {
  const opts = { dryRun: false, outDir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--out") opts.outDir = argv[++i];
  }
  return opts;
}

// ── config ───────────────────────────────────────────────────────────────────

const SITE_URL = "https://www.localspecialtycoffee.com";

// Cafes in these cities go to the DE bucket. Slugs taken from
// src/lib/geography.ts where country = Germany | Austria | Switzerland.
const DACH_SLUGS = new Set([
  "specialty-coffee-berlin",
  "specialty-coffee-shop-munich",
  "specialty-coffee-vienna",
  "specialty-coffee-zurich",
]);

// Mirror of the country map in src/lib/geography.ts. Replicated here
// because this .mjs script can't import the .ts module directly. Keep
// in sync when new cities go live (the inject-city.mjs run already
// requires editing geography.ts — extend this map at the same time).
const COUNTRY_BY_CITY_SLUG = {
  "specialty-coffee-dublin": "Ireland",
  "best-coffee-in-amsterdam": "Netherlands",
  "best-coffee-in-barcelona": "Spain",
  "best-coffee-in-brussels": "Belgium",
  "best-coffee-copenhagen": "Denmark",
  "best-coffee-in-lisbon": "Portugal",
  "best-coffee-in-madrid": "Spain",
  "best-coffee-in-oslo": "Norway",
  "best-coffee-in-stockholm": "Sweden",
  "best-coffee-manchester": "United Kingdom",
  "best-coffee-shops-in-london": "United Kingdom",
  "best-coffee-shops-in-paris-france": "France",
  "best-coffee-shops-in-prague": "Czechia",
  "coffee-shops-glasgow": "United Kingdom",
  "coffee-shops-leeds": "United Kingdom",
  "specialty-coffee-berlin": "Germany",
  "specialty-coffee-helsinki": "Finland",
  "specialty-coffee-porto": "Portugal",
  "specialty-coffee-shop-munich": "Germany",
  "specialty-coffee-vienna": "Austria",
  "specialty-coffee-zurich": "Switzerland",
  "best-coffee-in-austin": "United States",
  "best-coffee-in-chicago": "United States",
  "best-coffee-in-seattle": "United States",
  "best-coffee-shops-in-new-york": "United States",
  "best-coffee-shops-in-toronto": "Canada",
  "best-coffee-shops-san-diego": "United States",
  "best-specialty-coffee-los-angeles": "United States",
  "coffee-shops-ottawa": "Canada",
  "good-coffee-shops-in-vancouver": "Canada",
  "portland-coffee-roasters": "United States",
  "specialty-coffee-mexico-city-mexico": "Mexico",
  "specialty-coffee-bogota-colombia": "Colombia",
  "specialty-coffee-buenos-aires-argentina": "Argentina",
  "best-coffee-sao-paulo": "Brazil",
  "coffee-rio-de-janeiro": "Brazil",
  "specialty-coffee-dubai": "United Arab Emirates",
  "best-coffee-seoul": "South Korea",
  "coffee-shops-in-riyadh-9db9a": "Saudi Arabia",
  "specialty-coffee-bangkok": "Thailand",
  "specialty-coffee-singapore": "Singapore",
  "specialty-coffee-tokyo-japan": "Japan",
  "best-cafes-in-christchurch": "New Zealand",
  "best-coffee-in-auckland": "New Zealand",
  "best-coffee-in-sydney": "Australia",
  "good-coffee-melbourne": "Australia",
  "best-coffee-shops-in-cape-town": "South Africa",
};

function countryFor(citySlug) {
  return COUNTRY_BY_CITY_SLUG[citySlug] ?? "";
}

// ── badge snippet (mirror of src/lib/badge.ts buildBadgeSnippet) ─────────────
//
// Kept inline + identical to src/lib/badge.ts so the email's
// {{badgeEmbedCode}} matches what the /badge page renders. If you edit
// the design in one place, edit both.

const COFFEE_CUP_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="#c4422f" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm14 1h1.5a2.5 2.5 0 0 1 0 5H18V9Zm0 4h1.5a1.5 1.5 0 0 0 0-3H18v3ZM3 20h15v1.5H3V20ZM8 2.5c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Zm3 0c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Zm3 0c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Z"/></svg>`;

function buildInlineBadge(profileUrl) {
  return [
    `<a href="${profileUrl}" target="_blank" rel="noopener" `,
    `style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;`,
    `background:#f8f5f6;border:1px solid #f7dddb;border-radius:999px;`,
    `font-family:system-ui,-apple-system,'Helvetica Neue',sans-serif;`,
    `font-size:14px;color:#1a1a1a;text-decoration:none;line-height:1;">`,
    COFFEE_CUP_SVG,
    `<span>Featured on <strong style="color:#c4422f">Local Specialty Coffee</strong></span>`,
    `</a>`,
  ].join("");
}

// ── CSV ──────────────────────────────────────────────────────────────────────

function csvField(v) {
  const s = v == null ? "" : String(v);
  // Always quote — simpler + safer when fields contain commas, quotes,
  // newlines, or HTML (which {{badgeEmbedCode}} definitely does).
  return `"${s.replace(/"/g, '""')}"`;
}

function csvRow(values) {
  return values.map(csvField).join(",");
}

function buildCsv(rows) {
  const header = [
    "email",
    "firstName",
    "companyName",
    "companyWebsite",
    "city",
    "country",
    "cafeProfileUrl",
    "badgeEmbedCode",
    "language",
  ];
  const lines = [csvRow(header)];
  for (const r of rows) {
    lines.push(csvRow([
      r.email,
      r.firstName,
      r.companyName,
      r.companyWebsite,
      r.city,
      r.country,
      r.cafeProfileUrl,
      r.badgeEmbedCode,
      r.language,
    ]));
  }
  // CRLF line endings — what Excel and Lemlist both happily eat.
  return lines.join("\r\n") + "\r\n";
}

function todayStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  await loadEnv();
  const opts = parseArgs(process.argv.slice(2));

  const sb = createClient(
    need(process.env.SUPABASE_URL, "SUPABASE_URL"),
    need(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  console.log("🔎  Querying lsc_coffee_places…");

  // Total count for the headline blocker report.
  const { count: totalCount, error: countErr } = await sb
    .from("lsc_coffee_places")
    .select("*", { count: "exact", head: true });
  if (countErr) throw countErr;

  // Pull rows with email + the city join in one round trip.
  const { data, error } = await sb
    .from("lsc_coffee_places")
    .select("name, slug, email, website, lsc_cities(slug, name)")
    .not("email", "is", null)
    .neq("email", "");
  if (error) throw error;

  const rows = (data ?? []).map((p) => {
    const citySlug = p.lsc_cities?.slug ?? "";
    const cityName = p.lsc_cities?.name ?? "";
    const profileUrl = `${SITE_URL}/specialty-coffee-place/${p.slug}`;
    return {
      email: p.email,
      firstName: "",
      companyName: p.name ?? "",
      companyWebsite: p.website ?? "",
      city: cityName,
      country: countryFor(citySlug),
      cafeProfileUrl: profileUrl,
      badgeEmbedCode: buildInlineBadge(profileUrl),
      language: DACH_SLUGS.has(citySlug) ? "DE" : "EN",
      _slug: p.slug,
      _citySlug: citySlug,
    };
  });

  const enRows = rows.filter((r) => r.language === "EN");
  const deRows = rows.filter((r) => r.language === "DE");
  const missingCountry = rows.filter((r) => !r.country).map((r) => r._citySlug);

  console.log("");
  console.log(`  Total cafes in lsc_coffee_places: ${totalCount}`);
  console.log(`  Cafes with non-empty email:       ${rows.length}`);
  console.log(`    → EN bucket: ${enRows.length}`);
  console.log(`    → DE bucket: ${deRows.length}`);
  if (totalCount > 0) {
    const pct = ((rows.length / totalCount) * 100).toFixed(1);
    console.log(`  Email coverage:                   ${pct}%`);
  }
  if (missingCountry.length) {
    console.warn(
      `  ⚠  ${missingCountry.length} row(s) have a city slug missing from ` +
      `COUNTRY_BY_CITY_SLUG: ${[...new Set(missingCountry)].join(", ")}. ` +
      `Add them to scripts/export-cafes-for-outreach.mjs.`,
    );
  }
  if (rows.length < 20) {
    console.warn(
      "\n  🚨 BLOCKER: fewer than 20 cafes have email. The cadence is " +
      "launch-blocked until emails are enriched. See outreach/email-cadence-en.md.",
    );
  }

  if (opts.dryRun) {
    console.log("\n  --dry-run: no files written.");
    return;
  }

  const outDir = opts.outDir
    ? path.resolve(opts.outDir)
    : path.resolve(ROOT, "../outreach/csv");
  await fs.mkdir(outDir, { recursive: true });
  const stamp = todayStamp();

  const enPath = path.join(outDir, `outreach-en-${stamp}.csv`);
  const dePath = path.join(outDir, `outreach-de-${stamp}.csv`);

  await fs.writeFile(enPath, buildCsv(enRows), "utf8");
  await fs.writeFile(dePath, buildCsv(deRows), "utf8");

  console.log("");
  console.log(`  ✓ Wrote ${path.relative(process.cwd(), enPath)} (${enRows.length} rows)`);
  console.log(`  ✓ Wrote ${path.relative(process.cwd(), dePath)} (${deRows.length} rows)`);
  console.log("\n✓ Done");
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
