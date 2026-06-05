"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Contextual share row. The shareable unit on LSC is a *curated list* (a city
 * guide) or a *single spot* — not "the website" — so this is always rendered
 * with a real title/url, at the moment of value (top of a city guide, next to
 * a café's CTAs).
 *
 * WhatsApp is the primary action (the dominant share channel across every
 * market LSC serves, and 1-tap on mobile). Telegram / X / native-share /
 * copy-link are fallbacks. Every outbound link carries a per-channel
 * `utm_source` + the campaign, so return traffic from shares is measurable.
 */
type Props = {
  /** Canonical page URL, no query string. */
  url: string;
  /** Pre-filled message / hook in LSC voice. */
  title: string;
  /** utm_campaign value, e.g. `city_brussels` or `place_koppi`. */
  campaign: string;
  label?: string;
};

function withUtm(url: string, source: string, campaign: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=${source}&utm_medium=share&utm_campaign=${encodeURIComponent(campaign)}`;
}

export function ShareButtons({ url, title, campaign, label = "Share this guide" }: Props) {
  const [copied, setCopied] = useState(false);
  // Server renders `false` (no navigator); the client re-reads after hydration.
  // useSyncExternalStore keeps SSR/CSR consistent without a setState-in-effect.
  const canNativeShare = useSyncExternalStore(
    noop,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${withUtm(url, "whatsapp", campaign)}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(withUtm(url, "telegram", campaign))}&text=${encodeURIComponent(title)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(withUtm(url, "x", campaign))}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(withUtm(url, "copy", campaign));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: title, url: withUtm(url, "native", campaign) });
    } catch {
      /* user cancelled — no-op */
    }
  }

  const pill =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-sm font-semibold text-ink mr-1">{label}</span>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className={`${pill} bg-[#25D366] text-white hover:brightness-95`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.042zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        WhatsApp
      </a>

      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={`${pill} border-2 border-ink text-ink hover:bg-ink hover:text-white`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>
      )}

      <a href={telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram" className={`${pill} border-2 border-blush text-ink hover:border-ink`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
        Telegram
      </a>

      <a href={xUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className={`${pill} border-2 border-blush text-ink hover:border-ink`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
        </svg>
        X
      </a>

      <button type="button" onClick={copyLink} className={`${pill} border-2 border-blush text-ink hover:border-ink`}>
        {copied ? (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            Copied
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
            Copy link
          </>
        )}
      </button>
    </div>
  );
}
