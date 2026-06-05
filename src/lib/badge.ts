// "Featured on Local Specialty Coffee" embed badge generator.
//
// Single source of truth for the HTML snippet cafes paste into their
// sites. Consumed by:
//   - /badge (server-rendered page where cafes copy the code)
//   - outreach/badge.html (standalone reference)
//   - scripts/export-cafes-for-outreach.mjs (precomputes
//     {{badgeEmbedCode}} per lead so cafes can copy from the email)
//
// Design constraints (off-page SEO requirements):
//   - Plain <a href> — must be crawlable. NOT an iframe, NOT JS-rendered.
//   - rel="noopener" only. No nofollow, no sponsored — we want PageRank
//     to flow from the cafe's domain to its LSC profile.
//   - target="_blank" so the cafe's visitors stay on the cafe's site.
//   - Inline SVG icon — no LSC-server image dependency, no broken-image
//     risk, truly copy-paste.
//   - Inline styles only — no class names, no external CSS to load.
//   - System font stack — no font loading.
//   - Anchor text "Featured on Local Specialty Coffee" — branded +
//     mildly keyword-rich without looking spammy.

import { SITE_URL } from "./config";

export type BadgeVariant = "inline" | "card";

export type BuildBadgeOptions = {
  variant: BadgeVariant;
  /** Cafe slug. If omitted, badge links to the LSC home page. */
  slug?: string | null;
};

const COFFEE_CUP_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="#c4422f" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm14 1h1.5a2.5 2.5 0 0 1 0 5H18V9Zm0 4h1.5a1.5 1.5 0 0 0 0-3H18v3ZM3 20h15v1.5H3V20ZM8 2.5c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Zm3 0c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Zm3 0c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Z"/></svg>`;

const COFFEE_CUP_SVG_LARGE = `<svg width="48" height="48" viewBox="0 0 24 24" fill="#c4422f" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm14 1h1.5a2.5 2.5 0 0 1 0 5H18V9Zm0 4h1.5a1.5 1.5 0 0 0 0-3H18v3ZM3 20h15v1.5H3V20ZM8 2.5c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Zm3 0c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Zm3 0c0 1 .5 1.5.5 2.5s-.5 1.5-.5 2.5h-1c0-1 .5-1.5.5-2.5s-.5-1.5-.5-2.5h1Z"/></svg>`;

export function buildProfileUrl(slug?: string | null): string {
  if (!slug) return SITE_URL;
  return `${SITE_URL}/specialty-coffee-place/${slug}`;
}

export function buildBadgeSnippet(opts: BuildBadgeOptions): string {
  const href = buildProfileUrl(opts.slug);
  if (opts.variant === "inline") {
    // ~62px tall pill. Sits naturally in a footer or "as seen on" row.
    return [
      `<a href="${href}" target="_blank" rel="noopener" `,
      `style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;`,
      `background:#f8f5f6;border:1px solid #f7dddb;border-radius:999px;`,
      `font-family:system-ui,-apple-system,'Helvetica Neue',sans-serif;`,
      `font-size:14px;color:#1a1a1a;text-decoration:none;line-height:1;">`,
      COFFEE_CUP_SVG,
      `<span>Featured on <strong style="color:#c4422f">Local Specialty Coffee</strong></span>`,
      `</a>`,
    ].join("");
  }
  // Card variant — 200×200, stacked.
  return [
    `<a href="${href}" target="_blank" rel="noopener" `,
    `style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;`,
    `width:200px;height:200px;padding:20px;box-sizing:border-box;`,
    `background:#f8f5f6;border:1px solid #f7dddb;border-radius:16px;`,
    `font-family:system-ui,-apple-system,'Helvetica Neue',sans-serif;`,
    `color:#1a1a1a;text-decoration:none;text-align:center;line-height:1.3;">`,
    COFFEE_CUP_SVG_LARGE,
    `<span style="margin-top:12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;">Featured on</span>`,
    `<strong style="margin-top:4px;font-size:16px;color:#c4422f;">Local Specialty Coffee</strong>`,
    `</a>`,
  ].join("");
}
