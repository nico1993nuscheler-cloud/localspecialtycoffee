#!/usr/bin/env node
/**
 * inject-city.mjs
 *
 * End-to-end LSC city launch driver (generalized from Vienna's inject-vienna.mjs):
 *   1. Download each cafe's photo #N from Google Places + city hero/gallery sources
 *   2. Compress via TinyPNG
 *   3. Upload to R2 at images/lsc/places/<slug>_{thumb,hero}.jpg (cafes) or
 *      images/lsc/cities/<slug>/{thumb,hero,gallery-N}.jpg (city)
 *   4. Insert the city row into lsc_cities + N cafe rows into lsc_coffee_places
 *
 * Idempotent: HEAD before PUT on R2 (skip if exists); upsert by slug on Supabase.
 *
 * Required env (loaded from .env.local):
 *   R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_BASE_URL
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *
 * TinyPNG key is loaded from ~/Claude/keys/tinify-api-key.txt OR hardcoded
 * fallback (matches ~/Claude/tools/image-compress.py for cross-tool consistency).
 *
 * Usage:
 *   node scripts/inject-city.mjs data/.tmp/<city>/injection-package.json \
 *     data/.tmp/<city>/photos.json
 *
 *   --dry-run                  Don't write anything (R2 PUT, Supabase insert)
 *   --skip-images              Don't process images, only inject rows
 *   --photo-index N            Which Place Photo index to use per cafe (default 0)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import { homedir } from "node:os";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import tinify from "tinify";

const ROOT = path.resolve(import.meta.dirname, "..");

// ── env loading ──────────────────────────────────────────────────────────────

async function loadEnv() {
  // Last-wins semantics (standard dotenv behavior). This matters when
  // .env.local has been edited to append new credentials — the appended
  // values override the older ones above without manual file cleanup.
  // Process env still wins overall (only set if not already set after the
  // full loop), so CI / explicit `KEY=… node …` invocations are respected.
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
      out[m[1]] = v;  // overwrites prior occurrences → last-wins
    }
    for (const [k, v] of Object.entries(out)) {
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* */ }
}

async function loadTinifyKey() {
  // Match image-compress.py's hardcoded key as fallback so both tools use one TinyPNG account.
  try {
    const f = path.join(homedir(), "Claude/keys/tinify-api-key.txt");
    const k = (await fs.readFile(f, "utf8")).trim();
    if (k) return k;
  } catch { /* */ }
  return "4V0LyD5kb6gkFGLJdN4F2XmS4KCM7K0d";
}

function need(v, name) { if (!v) throw new Error(`Missing ${name}`); return v; }

function parseArgs(argv) {
  const positional = [];
  const opts = { dryRun: false, skipImages: false, photoIndex: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--skip-images") opts.skipImages = true;
    else if (a === "--photo-index") opts.photoIndex = Number(argv[++i]);
    else positional.push(a);
  }
  return { positional, opts };
}

// ── image pipeline ───────────────────────────────────────────────────────────

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function r2KeyFor(scope, slug, kind) {
  // Stable per-(slug,kind) keys → idempotent re-runs.
  if (scope === "city") return `images/lsc/cities/${slug}/${kind}.jpg`;
  return `images/lsc/places/${slug}_${kind}.jpg`;
}

async function uploadIfMissing(s3, bucket, key, body, opts) {
  if (opts.dryRun) { console.log(`    [dry-run] R2 PUT ${key}`); return; }
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`    R2 HEAD hit → skip ${key}`);
    return;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode !== 404) throw err;
  }
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  console.log(`    R2 PUT ${key} (${(body.length / 1024).toFixed(0)} KB)`);
}

async function processOne(scope, slug, kind, sourceUrl, s3, bucket, publicBase, opts) {
  const key = r2KeyFor(scope, slug, kind);
  const publicUrl = `${publicBase.replace(/\/$/, "")}/${key}`;

  if (opts.skipImages) return publicUrl;

  // Skip the work entirely if already in R2
  if (!opts.dryRun) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      console.log(`    cache hit → ${publicUrl}`);
      return publicUrl;
    } catch (err) {
      if (err?.$metadata?.httpStatusCode !== 404) throw err;
    }
  }

  console.log(`  ↓ ${sourceUrl.slice(0, 80)}...`);
  const original = await downloadBuffer(sourceUrl);
  console.log(`    downloaded ${(original.length / 1024).toFixed(0)} KB`);

  let compressed = original;
  try {
    compressed = await tinify.fromBuffer(original).toBuffer();
    console.log(`    tinified → ${(compressed.length / 1024).toFixed(0)} KB (${
      Math.round((1 - compressed.length / original.length) * 100)
    }% smaller)`);
  } catch (err) {
    // TinyPNG can occasionally choke on certain JPEGs; fall back to original.
    console.warn(`    tinify failed (${err.message}); using original buffer`);
  }

  await uploadIfMissing(s3, bucket, key, compressed, opts);
  return publicUrl;
}

// ── Supabase injection ───────────────────────────────────────────────────────

function buildCityRow(pkg, urls) {
  const c = pkg.city;
  return {
    webflow_id: c.webflow_id,
    slug: c.slug,
    name: c.name,
    h1: c.h1,
    meta_description: c.meta_description,
    summary: c.summary,
    excerpt_short: c.excerpt_short,
    excerpt_long: c.excerpt_long,
    seo_paragraph: c.seo_paragraph,
    seo_h2: c.seo_h2,
    thumbnail_v1_url: urls.thumb,
    thumbnail_v2_url: urls.hero,
    thumbnail_v3_url: urls.thumb,
    featured_image_url: urls.hero,
    photo_gallery: urls.gallery,
    google_maps_url: c.google_maps_url,
  };
}

const ALL_SWITCH_COLUMNS = [
  "in_house_roasting","ethical_sourcing","single_origin","award_winning","micro_lots",
  "experimental_styles","hand_brews","batch_brews","espresso_milk_drinks","decaf_options",
  "alt_milk","cold_brew","offers_classes","retail_beans","online_beans","pastry_snacks",
  "lunch_brunch","work_friendly","outdoor_seating","pet_friendly","certified_baristas",
  "ships_internationally","subscription","to_go","byo_cup_loyalty","community_events",
];

function buildCafeRow(cafe, cityId, categoryId, verified, urls) {
  const switches = Object.fromEntries(ALL_SWITCH_COLUMNS.map((col) => [col, false]));
  for (const s of cafe.switches || []) switches[s] = true;

  const hours = verified?.openingHours || [];
  // Places' weekdayDescriptions = 7 strings starting Monday. Collapse into the
  // schema's three buckets the way migrated rows do: a Mon–Fri summary line,
  // a Saturday line, a Sunday line.
  const monFri = hours.slice(0, 5).join(" · ");
  const saturday = hours[5] || "";
  const sunday = hours[6] || "";

  return {
    webflow_id: `lsc-${cafe.slug}`,
    slug: cafe.slug,
    name: cafe.name,
    city_id: cityId,
    category_id: categoryId,
    excerpt_short: cafe.excerpt_short,
    excerpt_long: cafe.excerpt_long,
    summary: cafe.summary,
    flavour_profile: cafe.flavour_profile,
    about: cafe.about,
    button_text: cafe.button_text || `Discover ${cafe.name}`,
    rating: verified?.rating != null ? String(verified.rating) : null,
    address: verified?.formattedAddress || null,
    hours_weekday: monFri,
    hours_saturday: saturday,
    hours_sunday: sunday,
    thumbnail_v1_url: urls.thumb,
    thumbnail_v2_url: urls.thumb,
    thumbnail_v3_url: urls.hero,
    featured_image_url: urls.hero,
    photo_gallery: [],
    website: verified?.websiteUri || null,
    instagram: null,
    booking_link: null,
    phone: null,
    email: null,
    is_featured: false,
    ...switches,
  };
}

async function upsertOne(sb, table, row, opts) {
  if (opts.dryRun) { console.log(`    [dry-run] upsert ${table}/${row.slug}`); return; }
  const { error } = await sb.from(table).upsert(row, { onConflict: "slug" });
  if (error) throw new Error(`upsert ${table}/${row.slug}: ${error.message}`);
  console.log(`    upserted ${table}/${row.slug}`);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  const [pkgPath, photosPath] = positional;
  if (!pkgPath || !photosPath) {
    console.error(
      "Usage: node scripts/inject-vienna.mjs " +
        "<injection-package.json> <photos.json> [--dry-run] [--skip-images] [--photo-index N]"
    );
    process.exit(2);
  }

  await loadEnv();
  tinify.key = await loadTinifyKey();

  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  const photoReport = JSON.parse(await fs.readFile(photosPath, "utf8"));

  // ── R2 + Supabase clients
  const accountId = need(process.env.R2_ACCOUNT_ID, "R2_ACCOUNT_ID");
  const accessKey = need(process.env.R2_ACCESS_KEY_ID, "R2_ACCESS_KEY_ID");
  const secret = need(process.env.R2_SECRET_ACCESS_KEY, "R2_SECRET_ACCESS_KEY");
  const bucket = need(process.env.R2_BUCKET, "R2_BUCKET");
  const publicBase = need(process.env.R2_PUBLIC_BASE_URL, "R2_PUBLIC_BASE_URL");

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secret },
  });

  const sb = createClient(
    need(process.env.SUPABASE_URL, "SUPABASE_URL"),
    need(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  // ── 1) City images
  console.log("\n[1/4] City image package");
  const city = pkg.city;
  const cityUrls = { thumb: "", hero: "", gallery: [] };
  cityUrls.thumb = await processOne("city", city.slug, "thumb", city._hero_source_url, s3, bucket, publicBase, opts);
  cityUrls.hero = await processOne("city", city.slug, "hero", city._hero_source_url, s3, bucket, publicBase, opts);
  for (let i = 0; i < (city._gallery_source_urls || []).length; i++) {
    const g = await processOne("city", city.slug, `gallery-${i + 1}`, city._gallery_source_urls[i], s3, bucket, publicBase, opts);
    cityUrls.gallery.push(g);
  }

  // ── 2) City row + FK lookups
  console.log("\n[2/4] City row");
  const cityRow = buildCityRow(pkg, cityUrls);
  await upsertOne(sb, "lsc_cities", cityRow, opts);

  // Resolve city_id (UUID PK) by slug — cafe rows need this as FK.
  let cityId = null;
  if (!opts.dryRun) {
    const { data: cityBack, error: cityErr } = await sb
      .from("lsc_cities")
      .select("id")
      .eq("slug", city.slug)
      .single();
    if (cityErr || !cityBack) throw new Error(`Could not look up city id: ${cityErr?.message}`);
    cityId = cityBack.id;
    console.log(`    city_id resolved: ${cityId}`);
  }

  // Pre-fetch all categories, indexed by webflow_id (what's in the injection
  // package) → UUID id (what the FK actually needs).
  const categoryWebflowToUuid = new Map();
  if (!opts.dryRun) {
    const { data: cats, error: catErr } = await sb
      .from("lsc_categories")
      .select("id, webflow_id");
    if (catErr) throw new Error(`Could not fetch categories: ${catErr.message}`);
    for (const c of cats) categoryWebflowToUuid.set(c.webflow_id, c.id);
    console.log(`    ${categoryWebflowToUuid.size} categories indexed`);
  }

  // ── 3) Cafe images + verified-data lookup
  console.log("\n[3/4] Cafe image packages");
  // Index the photo report by slug for fast lookup.
  const byPhotoSlug = new Map(photoReport.cafes.map((c) => [c.input.slug, c]));

  const cafeUrlsBySlug = new Map();
  const verifiedBySlug = new Map();
  for (const cafe of pkg.cafes) {
    console.log(`\n  • ${cafe.name}`);
    const pr = byPhotoSlug.get(cafe.slug);
    if (!pr || pr.error) {
      console.warn(`    SKIPPING: no Places photo report for ${cafe.slug} (${pr?.error || "missing"})`);
      continue;
    }
    verifiedBySlug.set(cafe.slug, pr.verified);
    const photoUrl = pr.photos?.[opts.photoIndex]?.url;
    if (!photoUrl) {
      console.warn(`    SKIPPING images: no photo at index ${opts.photoIndex}`);
      cafeUrlsBySlug.set(cafe.slug, { thumb: null, hero: null });
      continue;
    }
    // Same source URL drives both thumbnail + hero crops at render time.
    const thumb = await processOne("place", cafe.slug, "thumb", photoUrl, s3, bucket, publicBase, opts);
    const hero = await processOne("place", cafe.slug, "hero", photoUrl, s3, bucket, publicBase, opts);
    cafeUrlsBySlug.set(cafe.slug, { thumb, hero });
  }

  // ── 4) Cafe rows
  console.log("\n[4/4] Cafe rows");
  for (const cafe of pkg.cafes) {
    const urls = cafeUrlsBySlug.get(cafe.slug) || { thumb: null, hero: null };
    const verified = verifiedBySlug.get(cafe.slug);
    const categoryId = categoryWebflowToUuid.get(cafe.category_id) || cafe.category_id;
    if (!opts.dryRun && !categoryWebflowToUuid.has(cafe.category_id)) {
      console.warn(`    ⚠️  unknown category webflow_id ${cafe.category_id} for ${cafe.slug}`);
    }
    const row = buildCafeRow(cafe, cityId, categoryId, verified, urls);
    await upsertOne(sb, "lsc_coffee_places", row, opts);
  }

  // ── 5) Geography mapping — append slug → { continent, country } to
  // src/lib/geography.ts so the /cities filters group the new city
  // correctly. Hand-curated file; we only insert if the slug is missing,
  // never overwrite. Requires `country`, `continent`, and `country_flag`
  // on `pkg.city` — missing fields just log a warning and skip.
  console.log("\n[5/5] Geography mapping (src/lib/geography.ts)");
  await ensureGeographyEntry(pkg.city, opts);

  // Cache flush: hit /api/revalidate so the new city + cafes surface
  // immediately. Falls back to the old "push an empty commit" instruction
  // if REVALIDATE_TOKEN / REVALIDATE_URL aren't set.
  await flushVercelCache(opts);

  console.log("\n✓ Done");
  console.log(`  City: ${publicBase}/cities/${city.slug}`);
  console.log(`  Verify: https://www.localspecialtycoffee.com/cities/${city.slug}`);
}

async function flushVercelCache(opts) {
  const url = process.env.REVALIDATE_URL ?? "https://www.localspecialtycoffee.com/api/revalidate";
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) {
    console.log("\n[6/6] Cache flush — SKIPPED (REVALIDATE_TOKEN not set in .env.local).");
    console.log("       Fallback: push an empty commit to flush via redeploy:");
    console.log("         git commit --allow-empty -m 'Flush cache for new city' && git push");
    return;
  }
  if (opts.dryRun) {
    console.log(`\n[6/6] Cache flush — [dry-run] would POST ${url}`);
    return;
  }
  console.log(`\n[6/6] Cache flush — POST ${url}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tag: "lsc-data" }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.warn(`    ⚠️  revalidate endpoint returned ${res.status}: ${body}`);
      console.warn(`        Fallback: push an empty commit to flush via redeploy.`);
      return;
    }
    console.log(`    ✓ ${body}`);
  } catch (err) {
    console.warn(`    ⚠️  revalidate request failed: ${err.message}`);
    console.warn(`        Fallback: push an empty commit to flush via redeploy.`);
  }
}

async function ensureGeographyEntry(city, opts) {
  const { slug, country, continent, country_flag: flag } = city;
  if (!country || !continent) {
    console.warn(
      `    ⚠️  pkg.city missing { country, continent } — skipping geography.ts update.\n` +
      `        Add these fields to injection-package.json:\n` +
      `        "country": "Thailand", "continent": "Asia", "country_flag": "🇹🇭"`,
    );
    return;
  }
  const geoPath = path.join(ROOT, "src/lib/geography.ts");
  let src;
  try { src = await fs.readFile(geoPath, "utf8"); }
  catch { console.warn(`    ⚠️  could not read ${geoPath} — skipping`); return; }

  // 1. META map: insert slug entry if missing
  const slugLine = `  "${slug}": { continent: "${continent}", country: "${country}" },`;
  if (src.includes(`"${slug}":`)) {
    console.log(`    ✓ META already has ${slug}`);
  } else {
    // Insert right after the matching continent header comment.
    // Comments look like `  // Europe`, `  // Asia`, etc.
    const headerRe = new RegExp(`(  // ${continent}\\r?\\n)`);
    if (!headerRe.test(src)) {
      console.warn(`    ⚠️  no "// ${continent}" section found — append manually`);
      return;
    }
    src = src.replace(headerRe, `$1${slugLine}\n`);
    console.log(`    ✓ inserted META entry: ${slug} → ${continent} / ${country}`);
  }

  // 2. COUNTRY_FLAGS map: add country flag if missing
  if (flag) {
    if (src.includes(`"${country}":`) && src.match(new RegExp(`"${country}":\\s*"[^"]+"`))) {
      // already present in some map — verify it's in COUNTRY_FLAGS context
      const flagsBlockRe = /const COUNTRY_FLAGS:[\s\S]*?\n\};/;
      const flagsBlock = src.match(flagsBlockRe)?.[0] ?? "";
      if (flagsBlock.includes(`"${country}":`)) {
        console.log(`    ✓ COUNTRY_FLAGS already has ${country}`);
      } else {
        // Country name appears in META but not in flags; insert.
        src = src.replace(/(const COUNTRY_FLAGS: Record<string, string> = \{)/,
          `$1\n  "${country}": "${flag}",`);
        console.log(`    ✓ inserted COUNTRY_FLAGS entry: ${country} → ${flag}`);
      }
    } else {
      src = src.replace(/(const COUNTRY_FLAGS: Record<string, string> = \{)/,
        `$1\n  "${country}": "${flag}",`);
      console.log(`    ✓ inserted COUNTRY_FLAGS entry: ${country} → ${flag}`);
    }
  } else {
    console.warn(`    ⚠️  pkg.city.country_flag not provided — COUNTRY_FLAGS untouched (card will render without flag)`);
  }

  if (opts.dryRun) {
    console.log(`    [dry-run] would write ${geoPath}`);
    return;
  }
  await fs.writeFile(geoPath, src, "utf8");
  console.log(`    wrote ${geoPath}`);
}

main().catch((err) => { console.error("\nFATAL:", err); process.exit(1); });
