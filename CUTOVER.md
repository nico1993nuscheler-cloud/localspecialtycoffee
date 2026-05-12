# LSC Cutover Runbook

Live production migration of `localspecialtycoffee.com` from Webflow to Vercel.

## Pre-cutover checklist (do once)

- [ ] Validation gate passed (sitemap diff = 0, all URLs 200, Lighthouse OK)
- [ ] `MAKE_WEBHOOK_URL` env var set in Vercel project settings (if you want
      the existing MailerLite lead-magnet flow to keep working — otherwise
      submissions just log server-side)
- [ ] You've reviewed staging preview at https://localspecialtycoffee.vercel.app

## Day 0 — 24 hours before cutover

1. **Lower DNS TTL in GoDaddy** to 300 seconds (5 min). This shortens the
   propagation window so DNS changes take effect quickly.
   - GoDaddy → My Products → Domains → localspecialtycoffee.com → DNS
   - Edit the A record (currently `198.202.211.1` → Webflow); change only the
     TTL field, not the value. Save.

## Day 1 — cutover

### Option A: I do it (you create a GoDaddy API key)

If you create a GoDaddy production API key + secret at
https://developer.godaddy.com/keys and paste them to me, I'll:

1. Update the A record via the GoDaddy API
2. Add custom domain in Vercel
3. Wait for SSL provisioning
4. Validate the cutover

### Option B: You do it (2 minutes in the GoDaddy UI)

1. **In Vercel** — Settings → Domains → Add → enter
   `localspecialtycoffee.com` and `www.localspecialtycoffee.com`. Vercel will
   show you the required DNS values.
2. **In GoDaddy** — DNS → edit the A record:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel's anycast IP — verify in Vercel's domain UI)
   - TTL: 600
   - Also add a `CNAME` for `www` → `cname.vercel-dns.com`
3. Save. Propagation typically <5 min with the lowered TTL.
4. **In Vercel** — wait for the green checkmark on the domain (SSL cert
   provisions automatically, ~1–5 min).

## Post-cutover (within 1 hour)

- [ ] Verify `https://localspecialtycoffee.com` serves the new Next.js site
- [ ] Verify `https://www.localspecialtycoffee.com` works (with or without
      www, both should resolve)
- [ ] Submit new sitemap in Google Search Console:
      https://search.google.com/search-console → Sitemaps → Add new sitemap →
      `https://www.localspecialtycoffee.com/sitemap.xml`
- [ ] Spot-check 3 pages: a city, a cafe, the homepage. Forms work, images
      load, GA4 real-time hits show

## Rollback (if anything is broken)

Revert the A record in GoDaddy back to `198.202.211.1`. Webflow site stays
published as the fallback for 14 days post-cutover. DNS propagates within 5
minutes thanks to the lowered TTL.

## Day 14 — cancel Webflow

If GSC coverage is clean and GA4 organic is within ±10% of baseline:

1. Go to https://webflow.com/dashboard
2. Select the LSC site → Site Settings → Plans → Cancel
3. **$35/mo recurring expense gone.**
