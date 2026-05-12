"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export function Gallery({ urls, label }: { urls: string[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(
    () => setOpen((i) => (i === null ? null : (i - 1 + urls.length) % urls.length)),
    [urls.length],
  );
  const next = useCallback(
    () => setOpen((i) => (i === null ? null : (i + 1) % urls.length)),
    [urls.length],
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, prev, next]);

  if (!urls || urls.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            className="relative aspect-square bg-blush rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-coral"
            aria-label={`${label} photo ${i + 1} — click to view`}
          >
            <Image
              src={url}
              alt={`${label} — photo ${i + 1} of ${urls.length}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white"
            aria-label="Previous photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="relative max-w-5xl max-h-[85vh] w-full aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
            <Image src={urls[open]} alt={`${label} ${open + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white"
            aria-label="Next photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
            {open + 1} / {urls.length}
          </p>
        </div>
      )}
    </>
  );
}
