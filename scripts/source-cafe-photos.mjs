#!/usr/bin/env node
/**
 * source-cafe-photos.mjs
 *
 * For each cafe in a shortlist JSON, query the Google Places API (New) to:
 *   1) Find the best match (Text Search)
 *   2) Pull verified address / rating / hours / website / photos (Place Details)
 *   3) Resolve up to N direct image URLs (Place Photo, skipHttpRedirect=true)
 *
 * Output: a JSON report + a Markdown picker doc so Nico can review 5 candidate
 * photos per cafe and pick a thumbnail + hero in one focused session.
 *
 * Why: replaces manual Google Maps URL right-clicking, scales to any city,
 * and incidentally verifies all the "TBD" fields from Step 4 enrichment.
 *
 * Required env:
 *   GOOGLE_PLACES_API_KEY   (in ~/Claude/Nicos Businesses/LSC/website/.env.local)
 *
 * Usage:
 *   node scripts/source-cafe-photos.mjs <input.json> <output-dir> [options]
 *
 *   input.json  : array of { name, address?, city, country?, slug }
 *   output-dir  : where to write photos.json + photos.md
 *
 * Options:
 *   --photos-per-cafe N   (default 5)
 *   --max-width N         (default 2560)
 *   --city-filter STRING  (substring to require in formattedAddress, e.g. "Wien")
 *
 * Cost (Vienna, 15 cafes, defaults):
 *   Under Google Maps Platform's per-SKU free tier (effective March 1, 2025):
 *     - Pro SKUs (Text Search, Place Details w/ photos): 5,000 free calls/month each
 *     - Essentials SKUs (Place Photo): 10,000 free calls/month
 *   A full 15-cafe city run = 15+15+75 = 105 calls total. We're at <1% of
 *   any free bucket. You'd need to launch ~330 cities/month to leave the
 *   free tier. Note: the old "$200/month recurring credit" no longer exists —
 *   replaced by the per-SKU buckets above.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const API_BASE = "https://places.googleapis.com/v1";

function need(v, name) {
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function parseArgs(argv) {
  const positional = [];
  const opts = { photosPerCafe: 5, maxWidth: 2560, cityFilter: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--photos-per-cafe") opts.photosPerCafe = Number(argv[++i]);
    else if (a === "--max-width") opts.maxWidth = Number(argv[++i]);
    else if (a === "--city-filter") opts.cityFilter = argv[++i];
    else positional.push(a);
  }
  return { positional, opts };
}

async function loadEnv(repoRoot) {
  // Light .env.local loader — only reads GOOGLE_PLACES_API_KEY.
  // We intentionally don't pull in dotenv to keep the script dep-free.
  if (process.env.GOOGLE_PLACES_API_KEY) return;
  try {
    const raw = await fs.readFile(path.join(repoRoot, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^GOOGLE_PLACES_API_KEY\s*=\s*(.+)$/);
      if (m) {
        process.env.GOOGLE_PLACES_API_KEY = m[1].trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  } catch { /* env file may not exist; caller will error if key missing */ }
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
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri",
      ].join(","),
    },
    body: JSON.stringify({ textQuery: query }),
  });
  if (!res.ok) throw new Error(`textSearch ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.places || [];
}

async function placeDetails(apiKey, placeId) {
  // Field mask includes the Pro SKU (photos), Place Details Advanced SKU
  // (regularOpeningHours, websiteUri). Single request, ~$0.04.
  const res = await fetch(`${API_BASE}/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "rating",
        "userRatingCount",
        "websiteUri",
        "googleMapsUri",
        "regularOpeningHours.weekdayDescriptions",
        "photos.name",
        "photos.widthPx",
        "photos.heightPx",
        "photos.authorAttributions",
      ].join(","),
    },
  });
  if (!res.ok) throw new Error(`placeDetails ${res.status}: ${await res.text()}`);
  return res.json();
}

async function resolvePhotoUrl(apiKey, photoName, maxWidth) {
  // Uses skipHttpRedirect=true to get the resolved URL back as JSON
  // instead of following the 302 ourselves. The returned `photoUri`
  // is a googleusercontent.com URL we can pass to TinyPNG + R2 unchanged.
  const url =
    `${API_BASE}/${photoName}/media` +
    `?maxWidthPx=${maxWidth}&skipHttpRedirect=true&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  photo ${photoName}: ${res.status} ${await res.text()}`);
    return null;
  }
  const data = await res.json();
  return data.photoUri || null;
}

function pickBestMatch(candidates, cityFilter) {
  if (!candidates.length) return null;
  let filtered = candidates;
  if (cityFilter) {
    const f = candidates.filter((p) =>
      (p.formattedAddress || "").toLowerCase().includes(cityFilter.toLowerCase())
    );
    if (f.length) filtered = f;
  }
  // Rank by review count × rating — proxies for "the actual famous location"
  // when a name resolves to multiple branches.
  filtered.sort((a, b) => {
    const score = (p) => (p.rating || 0) * (p.userRatingCount || 0);
    return score(b) - score(a);
  });
  return filtered[0];
}

function escapeMd(s) {
  return (s || "").replace(/\|/g, "\\|");
}

function buildMarkdown(report) {
  const lines = [
    `# Cafe Photo Picker — ${report.city}`,
    "",
    `Generated: ${new Date().toISOString().split("T")[0]} · ${report.cafes.length} cafes · ` +
      `${report.cafes.reduce((n, c) => n + (c.photos?.length || 0), 0)} photo candidates`,
    "",
    `For each cafe, pick **1 thumbnail** + **1 hero** from the candidates listed. ` +
      `Reply with the cafe slug + the picked photo indices (e.g. \`jonas-reindl-vienna: thumb=2, hero=4\`).`,
    "",
    `**Rule reminder:** prefer photos with **people** (owner / baristas / team), ` +
      `with the cafe visible around them. Empty interiors and product closeups only as last resort.`,
    "",
    "---",
    "",
  ];
  for (const c of report.cafes) {
    lines.push(`## ${c.input.name}`);
    lines.push(`**Slug:** \`${c.input.slug}\``);
    if (c.error) {
      lines.push(`> ⚠️ **${c.error}**`);
      lines.push("");
      lines.push("---");
      lines.push("");
      continue;
    }
    const v = c.verified;
    lines.push(`**Verified address:** ${escapeMd(v.formattedAddress)}`);
    lines.push(`**Rating:** ${v.rating ?? "?"} (${v.userRatingCount ?? 0} reviews)`);
    lines.push(`**Website:** ${v.websiteUri || "_(not on file)_"}`);
    lines.push(`**Google Maps:** ${v.googleMapsUri}`);
    if (v.openingHours?.length) {
      lines.push(`**Opening hours:**`);
      for (const line of v.openingHours) lines.push(`- ${escapeMd(line)}`);
    }
    lines.push("");
    if (!c.photos?.length) {
      lines.push("> No photo candidates returned. Source manually from website / IG.");
    } else {
      lines.push(`### Photo candidates (${c.photos.length})`);
      lines.push("");
      lines.push("| # | Preview | Dim | Attribution |");
      lines.push("|---|---|---|---|");
      c.photos.forEach((p, i) => {
        const preview = p.url ? `![${i}](${p.url})` : "(failed to resolve)";
        const attr = (p.authorAttributions || [])
          .map((a) => a.displayName)
          .join(", ") || "—";
        lines.push(`| ${i + 1} | ${preview} | ${p.widthPx}×${p.heightPx} | ${escapeMd(attr)} |`);
      });
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  const [inputPath, outDir] = positional;
  if (!inputPath || !outDir) {
    console.error(
      "Usage: node scripts/source-cafe-photos.mjs <input.json> <output-dir> " +
        "[--photos-per-cafe N] [--max-width N] [--city-filter STRING]"
    );
    process.exit(2);
  }

  const repoRoot = path.resolve(import.meta.dirname, "..");
  await loadEnv(repoRoot);
  const apiKey = need(process.env.GOOGLE_PLACES_API_KEY, "GOOGLE_PLACES_API_KEY");

  const input = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const city = input[0]?.city || "unknown";
  console.log(`→ ${input.length} cafes · city=${city} · photos/cafe=${opts.photosPerCafe}`);

  const report = { city, generatedAt: new Date().toISOString(), cafes: [] };

  for (const cafe of input) {
    const query =
      `${cafe.name} ${cafe.address ? cafe.address + " " : ""}${cafe.city}${
        cafe.country ? " " + cafe.country : ""
      }`;
    console.log(`\n• ${cafe.name}`);
    const entry = { input: cafe };

    try {
      const candidates = await textSearch(apiKey, query);
      const match = pickBestMatch(candidates, opts.cityFilter);
      if (!match) {
        entry.error = `No Places match for query: ${query}`;
        report.cafes.push(entry);
        continue;
      }
      console.log(`    matched ${match.id} (${match.formattedAddress})`);

      const details = await placeDetails(apiKey, match.id);
      entry.verified = {
        placeId: details.id,
        displayName: details.displayName?.text,
        formattedAddress: details.formattedAddress,
        rating: details.rating,
        userRatingCount: details.userRatingCount,
        websiteUri: details.websiteUri,
        googleMapsUri: details.googleMapsUri,
        openingHours: details.regularOpeningHours?.weekdayDescriptions || [],
      };

      const photos = (details.photos || []).slice(0, opts.photosPerCafe);
      console.log(`    ${photos.length} photo candidates`);
      entry.photos = [];
      for (const p of photos) {
        const url = await resolvePhotoUrl(apiKey, p.name, opts.maxWidth);
        entry.photos.push({
          name: p.name,
          widthPx: p.widthPx,
          heightPx: p.heightPx,
          authorAttributions: p.authorAttributions,
          url,
        });
      }
    } catch (err) {
      console.error(`    ERROR: ${err.message}`);
      entry.error = err.message;
    }

    report.cafes.push(entry);
  }

  await fs.mkdir(outDir, { recursive: true });
  const jsonOut = path.join(outDir, "photos.json");
  const mdOut = path.join(outDir, "photos.md");
  await fs.writeFile(jsonOut, JSON.stringify(report, null, 2));
  await fs.writeFile(mdOut, buildMarkdown(report));

  console.log(`\n✓ Wrote ${jsonOut}`);
  console.log(`✓ Wrote ${mdOut}`);
  console.log(`\nOpen photos.md to review and pick thumbnail + hero per cafe.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
