"use client";

/**
 * Tiny client-side button that re-opens the cookie consent dialog by
 * firing the `lsc:open-cookie-settings` event the consent banner listens
 * for. Lives in the footer so users can re-decide at any time (required
 * under GDPR — consent must be as easy to withdraw as to grant).
 */
export function OpenCookieSettings() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("lsc:open-cookie-settings"));
        }
      }}
      className="hover:text-coral transition-colors text-left"
    >
      Cookie settings
    </button>
  );
}
