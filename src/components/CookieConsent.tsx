"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const STORAGE_KEY = "lsc-consent-v1";
const GA_ID = "G-MJYKNFPEZ6";

type Prefs = {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

function readPrefs(): Prefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Prefs;
  } catch {
    return null;
  }
}

function writePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore (private mode, storage full, etc.)
  }
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftMarketing, setDraftMarketing] = useState(false);

  // Decide visibility on mount + listen for "open settings" events
  useEffect(() => {
    const stored = readPrefs();
    setPrefs(stored);
    if (!stored) setOpen(true);

    const onOpen = () => {
      const cur = readPrefs();
      setDraftAnalytics(cur?.analytics ?? false);
      setDraftMarketing(cur?.marketing ?? false);
      setShowSettings(true);
      setOpen(true);
    };
    window.addEventListener("lsc:open-cookie-settings", onOpen);
    return () => window.removeEventListener("lsc:open-cookie-settings", onOpen);
  }, []);

  const acceptAll = () => {
    const next: Prefs = { analytics: true, marketing: true, decidedAt: new Date().toISOString() };
    writePrefs(next);
    setPrefs(next);
    setOpen(false);
    setShowSettings(false);
  };
  const rejectAll = () => {
    const next: Prefs = { analytics: false, marketing: false, decidedAt: new Date().toISOString() };
    writePrefs(next);
    setPrefs(next);
    setOpen(false);
    setShowSettings(false);
  };
  const saveCustom = () => {
    const next: Prefs = {
      analytics: draftAnalytics,
      marketing: draftMarketing,
      decidedAt: new Date().toISOString(),
    };
    writePrefs(next);
    setPrefs(next);
    setOpen(false);
    setShowSettings(false);
  };

  const analyticsOn = prefs?.analytics === true;

  return (
    <>
      {/* GA4 loaded ONLY after consent (analytics === true) */}
      {analyticsOn && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {/* Consent banner */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cc-title"
          className="fixed bottom-4 inset-x-4 md:bottom-6 md:inset-x-auto md:right-6 md:max-w-md z-50 motion-safe:animate-fade-up"
        >
          <div className="bg-white border border-blush shadow-2xl rounded-2xl p-5">
            {!showSettings ? (
              <>
                <h2 id="cc-title" className="font-bold text-lg mb-1">
                  Cookies, but the digital kind ☕
                </h2>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  We use a privacy-friendly analytics setup to understand which
                  cities and cafés you love. You can accept, reject, or pick the
                  details. Necessary cookies (the technical bits that make the
                  site work) are always on.{" "}
                  <a href="/privacy" className="text-coral underline hover:text-coral-300">
                    Learn more
                  </a>
                  .
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="rounded-full bg-coral-bright text-ink px-5 py-2 font-bold hover:bg-coral hover:text-white transition-colors"
                  >
                    Accept all
                  </button>
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="rounded-full border-2 border-ink px-5 py-2 font-semibold hover:bg-blush transition-colors"
                  >
                    Reject all
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = readPrefs();
                      setDraftAnalytics(cur?.analytics ?? false);
                      setDraftMarketing(cur?.marketing ?? false);
                      setShowSettings(true);
                    }}
                    className="rounded-full px-5 py-2 font-medium text-muted hover:text-ink underline-offset-2 hover:underline"
                  >
                    Manage
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-bold text-lg mb-1">Cookie preferences</h2>
                <p className="text-sm text-muted mb-4">
                  Pick the categories you&apos;re comfortable with. You can
                  change this any time via the footer.
                </p>
                <div className="space-y-3 mb-4">
                  <ToggleRow
                    label="Necessary"
                    desc="Required for the site to work — page navigation, cookie banner state, form submissions."
                    checked
                    disabled
                  />
                  <ToggleRow
                    label="Analytics"
                    desc="Google Analytics 4 with anonymised IPs — helps us see which cities and cafés get traffic."
                    checked={draftAnalytics}
                    onChange={setDraftAnalytics}
                  />
                  <ToggleRow
                    label="Marketing"
                    desc="Not used today. Reserved for future use (we'll re-ask before turning anything on)."
                    checked={draftMarketing}
                    onChange={setDraftMarketing}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveCustom}
                    className="rounded-full bg-coral-bright text-ink px-5 py-2 font-bold hover:bg-coral hover:text-white transition-colors"
                  >
                    Save preferences
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="rounded-full border-2 border-ink px-5 py-2 font-semibold hover:bg-blush transition-colors"
                  >
                    Accept all
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="rounded-full px-5 py-2 font-medium text-muted hover:text-ink underline-offset-2 hover:underline"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg border ${disabled ? "border-blush bg-blush/40" : "border-blush hover:border-coral cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 accent-coral w-4 h-4"
      />
      <div className="min-w-0">
        <p className="font-semibold text-sm">{label}{disabled && <span className="text-xs text-muted font-normal ml-2">(always on)</span>}</p>
        <p className="text-xs text-muted leading-snug">{desc}</p>
      </div>
    </label>
  );
}
