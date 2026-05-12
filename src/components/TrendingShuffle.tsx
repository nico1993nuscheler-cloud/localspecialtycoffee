"use client";

import { useEffect, useState } from "react";
import { PlaceCard } from "@/components/PlaceCard";
import type { PlaceWithRefs } from "@/lib/types";

/**
 * Renders a randomized subset of `pool` places. The initial render uses a
 * deterministic slice (first `count`) so SSR + first paint match; on the
 * client, useEffect re-shuffles every mount. That means a fresh page load
 * surfaces a different set of spots each time — until a real `is_featured`
 * pricing/curation flag exists in the CMS.
 */
export function TrendingShuffle({
  pool,
  count = 6,
}: {
  pool: PlaceWithRefs[];
  count?: number;
}) {
  const [items, setItems] = useState<PlaceWithRefs[]>(() => pool.slice(0, count));

  useEffect(() => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    setItems(shuffled);
  }, [pool, count]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((p) => (
        <PlaceCard key={p.webflow_id} place={p} showCity />
      ))}
    </div>
  );
}
