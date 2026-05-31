import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// On-demand cache invalidation for the `lsc-data` tag.
//
// Called by scripts/inject-city.mjs (and any future CMS-edit tool) after
// writes to Supabase. Replaces the empty-commit redeploy ritual: a plain
// HTTP POST flushes the unstable_cache + page-level ISR entries tagged
// "lsc-data" in seconds, without burning a build.
//
// Token check is required — without REVALIDATE_TOKEN set we 503 rather
// than silently accept anything, so a misconfigured env never opens the
// endpoint to the world.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_TOKEN not configured" },
      { status: 503 },
    );
  }
  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (provided !== token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let tag = "lsc-data";
  try {
    const body = (await req.json()) as { tag?: string } | null;
    if (body?.tag && typeof body.tag === "string") tag = body.tag;
  } catch {
    // empty body is fine — default to lsc-data
  }

  revalidateTag(tag);
  return NextResponse.json({ ok: true, tag, revalidatedAt: new Date().toISOString() });
}
