#!/usr/bin/env node
/**
 * Migrate the hardcoded Webflow CDN URLs in src/lib/brand.ts to Vercel Blob.
 * Brand assets are not in the JSON data, so the main migration script
 * missed them. This script:
 *   1. Parses brand.ts for any cdn.prod.website-files.com URLs
 *   2. Downloads + uploads each to the same Blob store under images/lsc/
 *   3. Rewrites brand.ts to use the new URLs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { put, list } from "@vercel/blob";

const ROOT = path.resolve(import.meta.dirname, "..");
const BRAND_TS = path.join(ROOT, "src/lib/brand.ts");

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
  const u = new URL(url);
  const base = decodeURIComponent(u.pathname.split("/").pop() || "");
  const safe = base.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `images/lsc/${safe}`;
}

async function listExisting() {
  const seen = new Map();
  let cursor;
  do {
    const r = await list({ prefix: "images/lsc/", cursor, limit: 1000 });
    for (const b of r.blobs) seen.set(b.pathname, b.url);
    cursor = r.cursor;
  } while (cursor);
  return seen;
}

async function migrateOne(url, existing) {
  const pathname = pathnameForCDN(url);
  if (existing.has(pathname)) return { url, newUrl: existing.get(pathname), skipped: true };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") ?? undefined;
  const blob = await put(pathname, buf, {
    access: "public",
    addRandomSuffix: false,
    contentType: ct,
    allowOverwrite: true,
  });
  return { url, newUrl: blob.url, skipped: false };
}

async function main() {
  await loadEnv();
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN missing");

  let source = await fs.readFile(BRAND_TS, "utf8");

  // Extract all unique Webflow CDN URLs in brand.ts. Each is a template-literal
  // string like `${CDN}/file.ext` — but after JS eval the constant strings show
  // up as the full url, so we resolve those manually.
  const CDN = "https://cdn.prod.website-files.com/67d40637d300a0e9ce062510";
  const CAT_CDN = "https://cdn.prod.website-files.com/67d40638d300a0e9ce06264e";

  const urls = new Set();
  for (const m of source.matchAll(/`\$\{CDN\}\/([^`]+)`/g)) urls.add(`${CDN}/${m[1]}`);
  for (const m of source.matchAll(/`\$\{CAT_CDN\}\/([^`]+)`/g)) urls.add(`${CAT_CDN}/${m[1]}`);

  console.log(`Found ${urls.size} brand asset URLs in brand.ts`);

  const existing = await listExisting();
  const map = {};
  for (const url of urls) {
    try {
      const r = await migrateOne(url, existing);
      map[url] = r.newUrl;
      console.log(`  ${r.skipped ? "skip" : "ok  "}  ${url.slice(-60)} → ${r.newUrl.slice(-60)}`);
    } catch (err) {
      console.error(`  ERR ${url}: ${err.message}`);
    }
  }

  // Now rewrite brand.ts: replace the CDN/CAT_CDN constants with the blob host
  // and rewrite each path. Simpler: replace each full URL in-place. But the
  // URLs in source are template literals using CDN constants. Cleanest: drop
  // the constants and write absolute URLs.
  for (const [oldUrl, newUrl] of Object.entries(map)) {
    // Reconstruct the original template-literal form to find + replace.
    // CDN form: `${CDN}/path` → `path` part is everything after the host+id.
    const u = new URL(oldUrl);
    const filename = u.pathname.split("/").pop();
    if (oldUrl.startsWith(CDN)) {
      source = source.replaceAll(`\${CDN}/${decodeURIComponent(filename)}`, newUrl);
      source = source.replaceAll(`\${CDN}/${filename}`, newUrl);
    } else if (oldUrl.startsWith(CAT_CDN)) {
      source = source.replaceAll(`\${CAT_CDN}/${decodeURIComponent(filename)}`, newUrl);
      source = source.replaceAll(`\${CAT_CDN}/${filename}`, newUrl);
    }
  }

  // The template literals are gone, but the constants are unused now. That's
  // OK for TS — they'll just be dead. Leave them so the file stays diff-able.
  await fs.writeFile(BRAND_TS, source);
  console.log(`\n✅ Rewrote ${path.relative(ROOT, BRAND_TS)}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
