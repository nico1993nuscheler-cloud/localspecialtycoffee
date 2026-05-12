#!/usr/bin/env node
/**
 * One-shot job: download every Webflow CDN image referenced by the LSC
 * snapshot data and upload it to Vercel Blob. Then rewrite the JSON files
 * to point at the new durable URLs.
 *
 * Run from the website dir:
 *   node scripts/migrate-images.mjs
 *
 * Requires BLOB_READ_WRITE_TOKEN in env (vercel env pull .env.local).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { put, list } from "@vercel/blob";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");
const MAP_FILE = path.join(DATA, "snapshots/webflow-to-blob-url-map.json");

// Load .env.local manually (Node doesn't auto-load it).
async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"]+?)"?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}

function pathnameForCDN(url) {
  // Webflow URLs like:
  //   https://cdn.prod.website-files.com/67d40637d300a0e9ce062510/690f5fcea_maat-spec_500x500.jpeg
  // Map to:
  //   images/lsc/{filename}
  // Filenames are already unique (file id prefix). Decode + sanitize.
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
  return [...all];
}

async function loadExistingMap() {
  try { return JSON.parse(await fs.readFile(MAP_FILE, "utf8")); }
  catch { return {}; }
}

async function listExistingBlobs() {
  const seen = new Map();
  let cursor;
  do {
    const r = await list({ prefix: "images/lsc/", cursor, limit: 1000 });
    for (const b of r.blobs) seen.set(b.pathname, b.url);
    cursor = r.cursor;
  } while (cursor);
  return seen;
}

async function migrateOne(url, existingBlobs) {
  const pathname = pathnameForCDN(url);
  if (existingBlobs.has(pathname)) return { url, pathname, newUrl: existingBlobs.get(pathname), skipped: true };

  const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "lsc-migrate/1.0" } });
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? undefined;

  const blob = await put(pathname, buf, {
    access: "public",
    addRandomSuffix: false,
    contentType,
    allowOverwrite: true,
  });
  return { url, pathname, newUrl: blob.url, skipped: false };
}

async function withConcurrency(items, limit, fn, onProgress) {
  const results = new Array(items.length);
  let i = 0;
  let done = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try { results[idx] = await fn(items[idx], idx); }
      catch (err) { results[idx] = { error: err.message, url: items[idx] }; }
      done++;
      if (done % 50 === 0 || done === items.length) onProgress?.(done, items.length);
    }
  });
  await Promise.all(workers);
  return results;
}

function rewrite(obj, fields, map) {
  for (const f of fields) {
    if (typeof obj[f] === "string" && map[obj[f]]) obj[f] = map[obj[f]];
    else if (Array.isArray(obj[f])) obj[f] = obj[f].map((u) => (typeof u === "string" && map[u]) ? map[u] : u);
  }
  return obj;
}

async function main() {
  await loadEnv();
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing");

  const urls = await collectAllUrls();
  const existingBlobs = await listExistingBlobs();
  console.log(`Collected ${urls.length} unique source URLs; ${existingBlobs.size} already in Blob`);

  let lastLog = Date.now();
  const results = await withConcurrency(urls, 10, (url) => migrateOne(url, existingBlobs), (done, total) => {
    const now = Date.now();
    if (now - lastLog > 1500) {
      console.log(`  ${done} / ${total}`);
      lastLog = now;
    }
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
    for (const item of arr) rewrite(item, fields, map);
    await fs.writeFile(fp, JSON.stringify(arr, null, 2));
    console.log(`Rewrote ${file} (${arr.length} items)`);
  }

  if (errors > 0) {
    console.error(`\n⚠️  ${errors} downloads failed. Check logs above; re-run to retry (idempotent).`);
    process.exit(1);
  }
  console.log("\n✅ Image migration complete.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
