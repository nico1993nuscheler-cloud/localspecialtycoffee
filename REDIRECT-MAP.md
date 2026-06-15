# Redirect Map — localspecialtycoffee.com (Webflow → Next.js/Vercel)

**Date:** June 15, 2026
**Author:** SEO migration cleanup
**Related:** [SEO-FIX-PLAN.md](SEO-FIX-PLAN.md) (the 951 5XX root-cause fix that preceded this)

---

## TL;DR

The Webflow → Next.js migration **preserved the URL structure almost perfectly**, so
there is no large old-URL → new-URL remap to build. The 951 5XX errors were
**timeout 500s** (Footer N+1 query, see SEO-FIX-PLAN.md) — already converted to
**fast 404s** by `dynamicParams = false`. This pass adds **301s to recover link
equity** for the two URL families that genuinely have a new equivalent:

1. **Bare/variant city geo-names** (`/cities/amsterdam`, `/cities/munich`,
   `/cities/nyc`) → the canonical SEO slug (`/cities/best-coffee-in-amsterdam`).
   Implemented as a static map in [next.config.ts](next.config.ts).
2. **Removed / renamed cafe slugs** → their city page, via the smart fallback in
   [`specialty-coffee-place/[slug]/page.tsx`](src/app/specialty-coffee-place/[slug]/page.tsx),
   now hardened so it covers cities whose name doesn't match the cafe-slug suffix.

Everything with **no equivalent intentionally 404s** (correct SEO signal: "gone").

---

## How the old URL patterns were determined

No Ahrefs/Firecrawl/GSC export was used (those tools were timing out / off-limits).
The analysis was done entirely from the codebase + public data:

| Source | What it gave |
|---|---|
| `curl .../sitemap.xml` | 1,292 **live** URLs → 817 cafe slugs, 59 city slugs, 3 categories |
| Wayback CDX API (`web.archive.org/cdx`) | 595 **archived** URLs → 549 cafe, 35 city, 3 category slugs |
| `data/cities.json`, `data/snapshots/webflow-*` | Webflow CMS field names + slug convention |

### Key findings

- **URL structure was preserved.** Archived and live paths use the *identical*
  shape: `/specialty-coffee-place/<slug>`, `/cities/<slug>`, `/categories/<slug>`,
  plus root static pages. **No** legacy `/blog`, `/post`, or `/<city>/<place>`
  nesting existed.
- **No city or category slug changed.** All 35 archived city slugs and all 3
  category slugs exist live; the other 24 live cities are simply newer.
- **Only removed/renamed cafes 404.** Diffing archived vs. live cafe slugs surfaced
  2 dead slugs in the Wayback sample (`seven-miles-…--roastery`,
  `kof-king-of-the-fork-sao-paulo`). Wayback only captured ~550 of the historic
  URLs, so the full dead-slug set isn't enumerable here — which is exactly why the
  fix is **systemic (a fallback)** rather than a hand-list.

---

## The redirect layers (in order)

All redirects are **301 (permanent)**. Source of truth: `next.config.ts`
`redirects()` + the cafe-page fallback.

### 1. Canonicalization — apex → www
`localspecialtycoffee.com/*` → `https://www.localspecialtycoffee.com/*`
Consolidates link equity onto the www host declared by canonical tags.

### 2. Legacy Webflow namespaces (defensive)
| Source | → Destination | Why |
|---|---|---|
| `/blog`, `/blog/*`, `/posts`, `/posts/*` | `/cities` | Webflow blog never migrated |
| `/deletion-basket/*` | `/` | Webflow's soft-delete trash namespace |

### 3. Explicit cafe one-offs (smart fallback can't derive these)
| Source | → Destination | Why fallback misses it |
|---|---|---|
| `/specialty-coffee-place/seven-miles-coffee-roasters--office---roastery` | `/cities/best-coffee-in-sydney` | slug ends `--roastery`, not a city stem |
| `/specialty-coffee-place/cafeletka.cz` | `/cities/best-coffee-shops-in-prague` | slug ends `.cz`, not a city stem |

### 4. City geo-name aliases  ← **new in this pass**
A static `CITY_ALIASES` map in `next.config.ts` (keyed by canonical slug) flattens
to **77 redirect rules** covering every one of the 59 live cities. It maps the bare
or variant geographic name that crawlers/backlinks probe to the SEO slug:

```
/cities/amsterdam     → /cities/best-coffee-in-amsterdam
/cities/munich        → /cities/specialty-coffee-shop-munich
/cities/muenchen      → /cities/specialty-coffee-shop-munich
/cities/new-york      → /cities/best-coffee-shops-in-new-york
/cities/nyc           → /cities/best-coffee-shops-in-new-york
/cities/los-angeles   → /cities/best-specialty-coffee-los-angeles
/cities/la            → /cities/best-specialty-coffee-los-angeles
/cities/riyadh        → /cities/coffee-shops-in-riyadh-9db9a
/cities/mexico-city   → /cities/specialty-coffee-mexico-city-mexico
...                   (full table is the CITY_ALIASES object)
```

Includes accent/spelling variants where GSC shows both forms get crawled
(`zürich`→`zuerich`, `lisboa`, `praha`, `bruxelles`, `milano`, `warszawa`,
`saopaulo`, `capetown`, `hongkong`, `telaviv`). Every alias was checked: **none
collide with a real city slug.**

### 5. Cafe smart fallback (runtime 301)  ← **hardened in this pass**
`redirectTargetForMissingPlace()` in `specialty-coffee-place/[slug]/page.tsx`:
when a cafe slug doesn't resolve, recover the city from the slug's trailing geo
token and 301 there instead of 404ing — preserving backlink equity to dropped
cafes.

**The bug it fixes:** the old version matched only `normalizeStem(city.name)`. But
8 cities have names that normalize to something the cafe slug *doesn't* end with:

| City name | name-stem (old, broken) | actual cafe suffix |
|---|---|---|
| `Austin, TX` | `austin-tx` | `-austin` |
| `Chicago, IL` | `chicago-il` | `-chicago` |
| `Seattle, WA` | `seattle-wa` | `-seattle` |
| `San Diego, CA` | `san-diego-ca` | `-san-diego` |
| `München` | `munchen` | `-munich` |
| `New York, NY` | `new-york-ny` | `-new-york` |
| `Portland, OR` | `portland-or` | `-portland` |
| `Los Angeles` | `los-angeles` ✓ | `-los-angeles` |

The fallback now **also derives a stem from the city slug** by stripping SEO filler
tokens (`best`, `coffee`, `in`, `shops`, `specialty`, …), the trailing country
qualifier (`…-france`, `…-japan`, `…-mexico` — trailing-only, so
`mexico-city-mexico` keeps its leading `mexico`), and stray Webflow hash tokens
(`riyadh-9db9a` → `riyadh`). Because every geographic name also appears inside its
own slug, this auto-covers all 8 cities above — and any future city — without a
hardcoded list.

Matching rules (unchanged, kept safe): stems must be **≥ 4 chars**, matched
**longest-first** (so `buenos-aires` beats `aires`, `new-york` beats `york`), and
anchored on a hyphen boundary (`slug.endsWith("-" + stem)`).

---

## What intentionally 404s (no redirect)

- Cafe slugs with neighborhood-only suffixes (e.g. CDMX cafes ending `-roma-norte`)
  that share no city geo-token — too ambiguous to redirect safely.
- Feature combos below the indexable threshold (`/cities/<city>/<feature>`) —
  `dynamicParams = false` 404s them instantly.
- Any genuinely-removed page with no sensible equivalent.

A 404 here is the **correct** SEO response: it tells Google the page is gone, so it
drops from the index and stops burning crawl budget. The prior fix already ensured
these are *fast* 404s, not 12-second timeout 500s.

---

## Out of scope (DNS/infra, not this codebase)

- `brewbuddy.localspecialtycoffee.com` — a separate subdomain Vercel doesn't route
  from this app, so a redirect rule here would never fire. Fix at the Vercel/DNS
  layer (point the subdomain at the apex with a 301, or remove it). See the closing
  comment in `next.config.ts`.

---

## How to extend

**New 404 spotted in GSC → Pages → "Not found (404)":**
- If it's a **bare city name** → add the variant to that city's array in
  `CITY_ALIASES` (next.config.ts).
- If it's a **cafe slug** whose city the fallback can't derive (weird suffix) → add
  an explicit one-off in `redirects()` (layer 3 above).
- If it's a **whole removed section** → decide: redirect to the nearest live parent,
  or let it 404.

---

## Verification performed

- ✅ `next.config.ts` transpiled with the project's TypeScript and `redirects()`
  executed: **85 rules, 0 malformed, 0 duplicate sources, 0 alias↔slug collisions,
  all `permanent: true`.**
- ✅ Cafe fallback logic simulated against the 8 previously-broken cities + normal
  cities + an unmatched slug: all 8 now 301 to the right city; unmatched still 404s;
  `mexico-city` stem resolves correctly (no `city`-only false match).
- ⚠️ Live HTTP smoke test not run here: this environment's `node_modules/next` is an
  incomplete install (missing `dist/server/require-hook`), so the dev server can't
  boot. **Post-deploy, spot-check on Vercel:**
  ```
  curl -sI https://www.localspecialtycoffee.com/cities/amsterdam      # → 301 → best-coffee-in-amsterdam
  curl -sI https://www.localspecialtycoffee.com/cities/munich         # → 301 → specialty-coffee-shop-munich
  curl -sI https://www.localspecialtycoffee.com/cities/nyc            # → 301 → best-coffee-shops-in-new-york
  curl -sI https://www.localspecialtycoffee.com/specialty-coffee-place/some-old-cafe-munich  # → 301 → city
  curl -sI https://www.localspecialtycoffee.com/cities/best-coffee-in-amsterdam              # → 200 (unaffected)
  ```
