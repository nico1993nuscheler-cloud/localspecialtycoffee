#!/usr/bin/env node
/**
 * Generate SQL INSERT statements to import places.json / cities.json /
 * categories.json into the LSC Supabase schema.
 *
 * Re-tuned: each batch must fit under ~25 KB so it fits comfortably into
 * a single Supabase MCP execute_sql call.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");
const OUT = "/tmp";
const MAX_BYTES = 90000;

function sqlVal(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v) || typeof v === "object") {
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

function makeRow(fields, obj, extras = "") {
  return "(" + fields.map((f) => sqlVal(obj[f])).join(", ") + extras + ")";
}

function chunkByBytes(rows, fields, header, footer, extraRowCols = "") {
  const chunks = [];
  let current = [];
  let bytes = header.length + footer.length;
  for (const r of rows) {
    const rowSql = makeRow(fields, r, extraRowCols ? `, ${extraRowCols(r)}` : "");
    const added = rowSql.length + 2; // comma + newline
    if (current.length && bytes + added > MAX_BYTES) {
      chunks.push(current);
      current = [];
      bytes = header.length + footer.length;
    }
    current.push(rowSql);
    bytes += added;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

async function main() {
  // Wipe old chunk files to avoid stale leftovers
  for (const f of await fs.readdir(OUT)) {
    if (f.startsWith("lsc-import-") && f.endsWith(".sql")) {
      await fs.rm(path.join(OUT, f));
    }
  }

  const cats = JSON.parse(await fs.readFile(path.join(DATA, "categories.json"), "utf8"));
  const cities = JSON.parse(await fs.readFile(path.join(DATA, "cities.json"), "utf8"));
  const places = JSON.parse(await fs.readFile(path.join(DATA, "places.json"), "utf8"));

  // ── Categories — one chunk fine
  const catFields = ["webflow_id","slug","name","description","icon_large_url","icon_small_url","icon_dark_small_url"];
  const catSql =
    `INSERT INTO public.lsc_categories (${catFields.join(", ")}) VALUES\n` +
    cats.map((c) => makeRow(catFields, c)).join(",\n") +
    `\nON CONFLICT (webflow_id) DO NOTHING;`;
  await fs.writeFile(path.join(OUT, "lsc-import-categories.sql"), catSql);
  console.log(`✓ lsc-import-categories.sql (${cats.length} rows, ${catSql.length}b)`);

  // ── Cities — chunked
  const cityFields = [
    "webflow_id","slug","name","h1","meta_description","summary",
    "excerpt_short","excerpt_long","seo_paragraph","seo_h2",
    "thumbnail_v1_url","thumbnail_v2_url","thumbnail_v3_url","featured_image_url",
    "photo_gallery","google_maps_url",
  ];
  const cityHeader = `INSERT INTO public.lsc_cities (${cityFields.join(", ")}) VALUES\n`;
  const cityFooter = `\nON CONFLICT (webflow_id) DO NOTHING;`;
  const cityChunks = chunkByBytes(cities, cityFields, cityHeader, cityFooter);
  for (let i = 0; i < cityChunks.length; i++) {
    const sql = cityHeader + cityChunks[i].join(",\n") + cityFooter;
    const file = `lsc-import-cities-${String(i + 1).padStart(2, "0")}.sql`;
    await fs.writeFile(path.join(OUT, file), sql);
    console.log(`✓ ${file} (${cityChunks[i].length} rows, ${sql.length}b)`);
  }

  // ── Coffee places — chunked + FK subqueries
  const placeFields = [
    "webflow_id","slug","name",
    "excerpt_short","excerpt_long","summary","flavour_profile","about","button_text","rating",
    "address","hours_weekday","hours_saturday","hours_sunday",
    "thumbnail_v1_url","thumbnail_v2_url","thumbnail_v3_url","featured_image_url","photo_gallery",
    "website","instagram","booking_link","phone","email",
    "is_featured","in_house_roasting","ethical_sourcing","single_origin","award_winning","micro_lots",
    "experimental_styles","hand_brews","batch_brews","espresso_milk_drinks","decaf_options","alt_milk","cold_brew",
    "offers_classes","retail_beans","online_beans","pastry_snacks","lunch_brunch","work_friendly",
    "outdoor_seating","pet_friendly","certified_baristas","ships_internationally","subscription",
    "to_go","byo_cup_loyalty","community_events",
  ];
  const placeHeader = `INSERT INTO public.lsc_coffee_places (${placeFields.join(", ")}, city_id, category_id) VALUES\n`;
  const placeFooter = `\nON CONFLICT (webflow_id) DO NOTHING;`;
  const placeExtraCols = (p) =>
    `(SELECT id FROM public.lsc_cities WHERE webflow_id = ${sqlVal(p.city_webflow_id)}), ` +
    `(SELECT id FROM public.lsc_categories WHERE webflow_id = ${sqlVal(p.category_webflow_id)})`;

  const placeChunks = chunkByBytes(places, placeFields, placeHeader, placeFooter, placeExtraCols);
  for (let i = 0; i < placeChunks.length; i++) {
    const sql = placeHeader + placeChunks[i].join(",\n") + placeFooter;
    const file = `lsc-import-places-${String(i + 1).padStart(2, "0")}.sql`;
    await fs.writeFile(path.join(OUT, file), sql);
    console.log(`✓ ${file} (${placeChunks[i].length} rows, ${sql.length}b)`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
