# LSC Runbook — common tasks

Where everything lives and how to do the routine work. Read this before
asking Claude — it'll often save a round-trip.

## Stack snapshot

| Layer | Where |
|---|---|
| Code | This repo (Next.js 15, deployed on Vercel) |
| Domain | `localspecialtycoffee.com` (GoDaddy registrar, Vercel-served) |
| Data | Supabase `sprich-prod` project, `lsc_*` tables under `public` schema |
| Images | Cloudflare R2 bucket `lsc-images`, served from `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev` |
| Forms | Server Actions → Make.com webhook → MailerLite |
| Analytics | GA4 `G-MJYKNFPEZ6` (consent-gated by the in-app banner) |
| Search Console | Verified on the apex domain |

## Add a new cafe (no scripts, no keys)

The fastest path for 1–2 new cafes.

1. **Source 2 source images** (1 thumbnail + 1 hero). See `lsc-coffee-place-image-builder` skill for what makes a good source.
2. **Compress** (optional but recommended):
   ```bash
   python3 ~/Claude/tools/image-compress.py path/to/image.jpg
   ```
3. **Upload to R2 via Cloudflare dashboard:**
   - https://dash.cloudflare.com/41ee177d729d84c8257d2f306cce6da3/r2/default/buckets/lsc-images
   - Click "Upload" → drop files into folder `images/lsc/coffee-places/{cafe-slug}/` (you can create folders by typing the path)
   - Use filenames `thumbnail.jpg`, `hero.jpg` for consistency
   - The public URLs will be `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/coffee-places/{cafe-slug}/thumbnail.jpg` etc.
4. **Insert the row in Supabase Studio:**
   - https://supabase.com/dashboard/project/djiixtplbsutuiuxfhiy/editor
   - Open `lsc_coffee_places` table → click "Insert" → "Insert row"
   - Required: `slug`, `name`, `city_id` (click → "Select record" → pick the city), `category_id` (same), `webflow_id` (any unique string)
   - Recommended: at least one of `thumbnail_v1_url`, `featured_image_url` (point at the R2 URLs you uploaded)
   - Set any of the 27 capability booleans (`in_house_roasting`, `single_origin`, etc.) — these drive the filter chips + programmatic landing pages
   - Save
5. **Wait ~2 minutes.** ISR picks the row up and the cafe is live at
   `https://www.localspecialtycoffee.com/specialty-coffee-place/{cafe-slug}`. It also appears on its city page and any matching landing pages.

## Add a new city (multiple cafes — keys recommended)

For batch launches (~15 cafes at a time). Same flow as the initial migration —
delegate to Claude with the skill chain:

1. `lsc-keyword-research [city]` → slug + meta strategy
2. `lsc-research-coffee-places [city]` → shortlist of 15 cafes
3. `lsc-city-content-writer [city]` → city page content
4. `lsc-enrichment-coffee-places [city]` → per-cafe content
5. `lsc-city-image-builder [city]` → city image sources
6. `lsc-coffee-place-image-builder [city]` → cafe image sources
7. `lsc-image-processor` → compress + upload all to R2
8. `lsc-cms-injection` → insert all rows into Supabase

Or just say *"let's launch [city]"* and the `lsc-master-orchestrator` skill drives the whole chain.

## Tweak existing content

Anything already in Supabase — text, images, booleans — edit directly in Studio. ISR makes the change live within 2 minutes.

- City: https://supabase.com/dashboard/project/djiixtplbsutuiuxfhiy/editor/lsc_cities
- Cafe: https://supabase.com/dashboard/project/djiixtplbsutuiuxfhiy/editor/lsc_coffee_places
- Category: https://supabase.com/dashboard/project/djiixtplbsutuiuxfhiy/editor/lsc_categories

If a change is urgent (sub-2-min), trigger a manual revalidation by pushing an empty commit:
```bash
git commit --allow-empty -m "Revalidate" && git push
```

## Form submissions land

- Make.com scenario: drops a new email into MailerLite + sends the "Brew-tiful Guide" autoresponder.
- Contact form / submission form: same webhook, surfaced in your Make.com run history.

## Local dev

```bash
cd "~/Claude/Nicos Businesses/LSC/website"
npm install                                       # only once
npm run dev                                       # http://localhost:3000
```

`.env.local` has every credential needed (gitignored, never leaves your laptop).

## What's NOT in `.env.local` (lives only in Vercel)

These are auto-applied in production builds. You don't need them locally:

- `BLOB_READ_WRITE_TOKEN` — leftover from the Vercel Blob attempt; unused now
- `VERCEL_OIDC_TOKEN` — auto-managed

## Credentials reference

`.env.local` currently holds (gitignored, never committed):

| Var | What for | Rotate when |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Public read of LSC data; safe to expose | Only on suspected leak |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Programmatic writes (import scripts) | If you ever share / paste it externally |
| `R2_*` | R2 image uploads (migration + batch scripts) | If you ever share / paste it externally |
| `MAKE_WEBHOOK_URL` | Form forwarding | Only if you change the Make scenario |

All Cloudflare + Supabase dashboards keep an audit log of every API key use,
so if you ever suspect leakage you can spot foreign activity there.

## Deploy

Auto-deploys on push to `main`. Vercel runs the build, generates ~840 SSG pages, and rolls out.

For a manual deploy: `vercel deploy --prod` from the repo.

## Rollback

Every push creates a Vercel deployment with rollback. `vercel rollback` reverts to the previous deployment in seconds, or use the Vercel dashboard.

## SEO smoke test (after a big change)

```bash
# All sample pages 200?
for p in / /cities /cities/specialty-coffee-berlin /specialty-coffee-place/maat-specialty-coffee-seoul /privacy /imprint; do
  echo -n "$p → "; curl -s -o /dev/null -w "%{http_code}\n" "https://www.localspecialtycoffee.com$p"
done

# Sitemap URL count (~837 today)
curl -s https://www.localspecialtycoffee.com/sitemap.xml | grep -c '<loc>'
```
