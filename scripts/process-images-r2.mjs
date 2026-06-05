#!/usr/bin/env node
/**
 * process-images-r2.mjs
 *
 * Phase 2 of the LSC image pipeline (lsc-image-processor skill).
 * Reads an approved image package (city + cafes source URLs), then for each image:
 *   1) downloads the source
 *   2) compresses via the TinyPNG HTTP API (falls back to raw on any failure)
 *   3) uploads to Cloudflare R2 under images/lsc/{cities|coffee-places}/{slug}/{role}.jpg
 * Writes a manifest mapping R2 URLs → the Supabase columns inject-city.mjs expects.
 *
 * Usage: node scripts/process-images-r2.mjs <image-package.json> <manifest-out.json>
 *
 * Env (from .env.local): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *                        R2_BUCKET, R2_PUBLIC_BASE_URL
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// TinyPNG key is read from the environment (TINIFY_API_KEY), sourced at call
// time from the canonical secret store — never hardcoded into this repo file.
const TINIFY_KEY = process.env.TINIFY_API_KEY;

async function loadEnv(repoRoot) {
  const raw = await fs.readFile(path.join(repoRoot, ".env.local"), "utf8");
  // Later occurrences win: .env.local contains duplicate R2_* keys (a stale one
  // first, the valid one later), so last-write must take precedence.
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function tinify(buf) {
  if (!TINIFY_KEY) throw new Error("TINIFY_API_KEY not set");
  // POST raw bytes → 201 with Location of compressed result → GET it back.
  const auth = "Basic " + Buffer.from("api:" + TINIFY_KEY).toString("base64");
  const res = await fetch("https://api.tinify.com/shrink", {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/octet-stream" },
    body: buf,
  });
  if (res.status !== 201) throw new Error(`tinify ${res.status}: ${await res.text()}`);
  const loc = res.headers.get("location");
  const out = await fetch(loc, { headers: { Authorization: auth } });
  if (!out.ok) throw new Error(`tinify fetch ${out.status}`);
  const remaining = 500 - Number(res.headers.get("compression-count") || 0);
  return { buf: Buffer.from(await out.arrayBuffer()), remaining };
}

async function main() {
  const [pkgPath, outPath] = process.argv.slice(2);
  if (!pkgPath || !outPath) {
    console.error("Usage: node scripts/process-images-r2.mjs <package.json> <manifest-out.json>");
    process.exit(2);
  }
  const repoRoot = path.resolve(import.meta.dirname, "..");
  await loadEnv(repoRoot);

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  const bucket = process.env.R2_BUCKET;
  const base = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");

  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));

  // Build a flat work list of { key, srcUrl }
  const jobs = [];
  const citySlug = pkg.city.city_slug;
  const cityBase = `images/lsc/cities/${citySlug}`;
  jobs.push({ key: `${cityBase}/thumbnail.jpg`, url: pkg.city.sources.thumbnail.url, label: "city/thumbnail" });
  jobs.push({ key: `${cityBase}/hero.jpg`, url: pkg.city.sources.hero.url, label: "city/hero" });
  (pkg.city.sources.gallery || []).forEach((g, i) =>
    jobs.push({ key: `${cityBase}/gallery/${i + 1}.jpg`, url: g.url, label: `city/gallery/${i + 1}` })
  );
  for (const cafe of pkg.cafes.cafes) {
    const cb = `images/lsc/coffee-places/${cafe.slug}`;
    jobs.push({ key: `${cb}/thumbnail.jpg`, url: cafe.sources.thumbnail.url, label: `${cafe.slug}/thumbnail` });
    jobs.push({ key: `${cb}/hero.jpg`, url: cafe.sources.hero.url, label: `${cafe.slug}/hero` });
    (cafe.sources.gallery || []).forEach((g, i) =>
      jobs.push({ key: `${cb}/gallery/${i + 1}.jpg`, url: g.url, label: `${cafe.slug}/gallery/${i + 1}` })
    );
  }

  console.log(`→ ${jobs.length} images to process`);
  let lastRemaining = null;
  for (const job of jobs) {
    try {
      const src = await fetchBuffer(job.url);
      let body = src, mode = "raw";
      try {
        const t = await tinify(src);
        body = t.buf; mode = "tinified"; lastRemaining = t.remaining;
      } catch (e) {
        console.warn(`  ⚠ ${job.label}: compress skipped (${e.message}) — uploading raw`);
      }
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: job.key,
        Body: body,
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      }));
      console.log(`  ✓ ${job.label} (${mode}, ${(body.length / 1024).toFixed(0)}kb)`);
    } catch (e) {
      console.error(`  ✗ ${job.label}: ${e.message}`);
      job.error = e.message;
    }
  }
  if (lastRemaining != null) console.log(`\nTinyPNG compressions remaining this month: ~${lastRemaining}`);

  // Build manifest in inject-city.mjs column shape
  const manifest = { city: {}, cafes: [] };
  const cu = (p) => `${base}/${p}`;
  manifest.city = {
    slug: citySlug,
    thumbnail_v1_url: cu(`${cityBase}/thumbnail.jpg`),
    thumbnail_v2_url: cu(`${cityBase}/hero.jpg`),
    thumbnail_v3_url: cu(`${cityBase}/thumbnail.jpg`),
    featured_image_url: cu(`${cityBase}/hero.jpg`),
    photo_gallery: (pkg.city.sources.gallery || []).map((_, i) => cu(`${cityBase}/gallery/${i + 1}.jpg`)),
  };
  for (const cafe of pkg.cafes.cafes) {
    const cb = `images/lsc/coffee-places/${cafe.slug}`;
    manifest.cafes.push({
      slug: cafe.slug,
      thumbnail_v1_url: cu(`${cb}/thumbnail.jpg`),
      thumbnail_v2_url: cu(`${cb}/thumbnail.jpg`),
      thumbnail_v3_url: cu(`${cb}/hero.jpg`),
      featured_image_url: cu(`${cb}/hero.jpg`),
      photo_gallery: (cafe.sources.gallery || []).map((_, i) => cu(`${cb}/gallery/${i + 1}.jpg`)),
    });
  }
  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Wrote manifest ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
