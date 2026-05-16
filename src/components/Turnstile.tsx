"use client";

import Script from "next/script";

const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

// Invisible by default: Cloudflare verifies silently in the background.
// A challenge modal only appears for visitors Cloudflare flags as
// suspicious — most users never see anything.
export function Turnstile({
  size = "invisible",
  className = "",
}: {
  size?: "normal" | "compact" | "flexible" | "invisible";
  className?: string;
}) {
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div
        className={`cf-turnstile ${className}`}
        data-sitekey={SITE_KEY}
        data-size={size}
        data-theme="light"
      />
    </>
  );
}
