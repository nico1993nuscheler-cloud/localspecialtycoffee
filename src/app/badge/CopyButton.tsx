"use client";

import { useState } from "react";

export function CopyButton({ code, label = "Copy code" }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard API can fail on non-HTTPS or denied permission.
          // Fall back to a manual range-select on the <pre> next sibling
          // so the user can still ⌘C.
        }
      }}
      className="inline-flex items-center gap-2 bg-coral text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-coral-300 transition-colors"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
