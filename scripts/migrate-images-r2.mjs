#!/usr/bin/env node
/**
 * Migration script targeting Cloudflare R2 (S3-compatible).
 *
 * Inputs (env vars):
 *   R2_ACCOUNT_ID            — Cloudflare account ID
 *   R2_ACCESS_KEY_ID         — R2 token Access Key ID
 *   R2_SECRET_ACCESS_KEY     — R2 token Secret Access Key
 *   R2_BUCKET                — bucket name, defaults to "lsc-images"
 *   R2_PUBLIC_BASE_URL       — public base URL for the bucket, e.g.
 *                              https://pub-xxxx.r2.dev (no trailing slash)
 *
 * Behavior:
 *   - Collects all Webflow CDN URLs referenced in places.json /
 *     cities.json / categories.json + the hardcoded brand asset URLs
 *     in src/lib/brand.ts.
 *   - Downloads each from Webflow, uploads to R2 under images/lsc/.
 *   - Idempotent: HEADs existing R2 objects, skips if present.
 *   - Rewrites the JSON files AND brand.ts to use R2 URLs.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");
const BRAND_TS = path.join(ROOT, "src/lib/brand.ts");
const MAP_FILE = path.join(DATA, "snapshots/webflow-to-r2-url-map.json");

async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}

function pathnameForCDN(url) {
  const u = new URL(url);
  const base = decodeURIComponent(u.pathname.split("/").pop() || "");
  const safe = base.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `images/lsc/${safe}`;
}

function urlsFromObject(obj, fields) {
  const out = [];
  for (const f of fields) {
    const v = obj[f];
    if (typeof v === "string" && v.startsWith("http")) out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && x.startsWith("http") && out.push(x));
  }
  return out;
}

async function collectAllUrls() {
  const places = JSON.parse(await fs.readFile(path.join(DATA, "places.json"), "utf8"));
  const cities = JSON.parse(await fs.readFile(path.join(DATA, "cities.json"), "utf8"));
  const cats = JSON.parse(await fs.readFile(path.join(DATA, "categories.json"), "utf8"));

  const placeFields = ["thumbnail_v1_url","thumbnail_v2_url","thumbnail_v3_url","featured_image_url","photo_gallery"];
  const cityFields = ["thumbnail_v1_url","thumbnail_v2_url","thumbnail_v3_url","featured_image_url","photo_gallery"];
  const catFields = ["icon_large_url","icon_small_url","icon_dark_small_url"];

  const all = new Set();
  for (const p of places) urlsFromObject(p, placeFields).forEach((u) => all.add(u));
  for (const c of cities) urlsFromObject(c, cityFields).forEach((u) => all.add(u));
  for (const c of cats) urlsFromObject(c, catFields).forEach((u) => all.add(u));

  // Add brand.ts URLs (logo, hero collage, etc.) by extracting cdn.prod.* URLs
  const brand = await fs.readFile(BRAND_TS, "utf8");
  for (const m of brand.matchAll(/https:\/\/cdn\.prod\.website-files\.com\/[^\s`"]+/g)) all.add(m[0]);
  // Also resolve template-literal CDN URLs in case they remain
  const CDN = "https://cdn.prod.website-files.com/67d40637d300a0e9ce062510";
  const CAT_CDN = "https://cdn.prod.website-files.com/67d40638d300a0e9ce06264e";
  for (const m of brand.matchAll(/`\$\{CDN\}\/([^`]+)`/g)) all.add(`${CDN}/${m[1]}`);
  for (const m of brand.matchAll(/`\$\{CAT_CDN\}\/([^`]+)`/g)) all.add(`${CAT_CDN}/${m[1]}`);

  // Filter to only Webflow CDN URLs (already-migrated Vercel Blob URLs should
  // not be re-uploaded; we'll handle those during the JSON rewrite step).
  return [...all].filter((u) => u.includes("cdn.prod.website-files.com"));
}

async function headExists(s3, bucket, key) {
  try { await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true; }
  catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === "NotFound") return false;
    throw err;
  }
}

async function migrateOne(s3, bucket, publicBase, url) {
  const pathname = pathnameForCDN(url);
  if (await headExists(s3, bucket, pathname)) {
    return { url, newUrl: `${publicBase}/${pathname}`, skipped: true };
  }
  const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "lsc-migrate/1.0" } });
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") ?? undefined;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: pathname,
    Body: buf,
    ContentType: ct,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return { url, newUrl: `${publicBase}/${pathname}`, skipped: false };
}

async function withConcurrency(items, limit, fn, onProgress) {
  const results = new Array(items.length);
  let i = 0;
  let done = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try { results[idx] = await fn(items[idx]); }
      catch (err) { results[idx] = { error: err.message, url: items[idx] }; }
      done++;
      if (done % 50 === 0 || done === items.length) onProgress?.(done, items.length);
    }
  });
  await Promise.all(workers);
  return results;
}

function rewriteObj(obj, fields, map) {
  for (const f of fields) {
    if (typeof obj[f] === "string" && map[obj[f]]) obj[f] = map[obj[f]];
    else if (Array.isArray(obj[f])) obj[f] = obj[f].map((u) => (typeof u === "string" && map[u]) ? map[u] : u);
  }
  return obj;
}

async function main() {
  await loadEnv();
  const account = process.env.R2_ACCOUNT_ID;
  const access = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || "lsc-images";
  const publicBase = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (!account || !access || !secret || !publicBase) {
    throw new Error("Missing R2 env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_BASE_URL");
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: access, secretAccessKey: secret },
  });

  const urls = await collectAllUrls();
  console.log(`Collected ${urls.length} Webflow CDN URLs to migrate`);

  let last = Date.now();
  const results = await withConcurrency(urls, 8, (url) => migrateOne(s3, bucket, publicBase, url), (d, t) => {
    if (Date.now() - last > 1500) { console.log(`  ${d}/${t}`); last = Date.now(); }
  });

  const map = {};
  let errors = 0;
  for (const r of results) {
    if (!r) continue;
    if (r.error) { errors++; console.error(`  ERR ${r.url}: ${r.error}`); continue; }
    map[r.url] = r.newUrl;
  }
  console.log(`Mapped ${Object.keys(map).length} URLs (${errors} errors)`);

  await fs.mkdir(path.dirname(MAP_FILE), { recursive: true });
  await fs.writeFile(MAP_FILE, JSON.stringify(map, null, 2));

  // Rewrite JSON files
  const placeFields = ["thumbnail_v1_url","thumbnail_v2_url","thumbnail_v3_url","featured_image_url","photo_gallery"];
  const cityFields = ["thumbnail_v1_url","thumbnail_v2_url","thumbnail_v3_url","featured_image_url","photo_gallery"];
  const catFields = ["icon_large_url","icon_small_url","icon_dark_small_url"];

  for (const [file, fields] of [
    ["places.json", placeFields],
    ["cities.json", cityFields],
    ["categories.json", catFields],
  ]) {
    const fp = path.join(DATA, file);
    const arr = JSON.parse(await fs.readFile(fp, "utf8"));
    for (const item of arr) rewriteObj(item, fields, map);
    // Also remap any Vercel-Blob URLs by deriving R2 equivalents
    // (handled in a separate pass below to keep this map pure).
    await fs.writeFile(fp, JSON.stringify(arr, null, 2));
    console.log(`Rewrote ${file} (${arr.length} items)`);
  }

  // Rewrite brand.ts: replace every Webflow CDN URL referenced via template
  // literals or string-literals with the R2 equivalent.
  let brand = await fs.readFile(BRAND_TS, "utf8");
  for (const [oldUrl, newUrl] of Object.entries(map)) {
    const u = new URL(oldUrl);
    const file = u.pathname.split("/").pop();
    brand = brand.replaceAll(`\${CDN}/${decodeURIComponent(file)}`, newUrl);
    brand = brand.replaceAll(`\${CDN}/${file}`, newUrl);
    brand = brand.replaceAll(`\${CAT_CDN}/${decodeURIComponent(file)}`, newUrl);
    brand = brand.replaceAll(`\${CAT_CDN}/${file}`, newUrl);
    brand = brand.replaceAll(oldUrl, newUrl);
  }
  await fs.writeFile(BRAND_TS, brand);
  console.log(`Rewrote src/lib/brand.ts`);

  if (errors > 0) {
    console.error(`\n⚠️  ${errors} downloads failed. Re-run to retry (idempotent).`);
    process.exit(1);
  }
  console.log("\n✅ R2 migration complete.");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
