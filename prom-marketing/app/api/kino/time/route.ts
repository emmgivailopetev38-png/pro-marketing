import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/kino/time — часът на сървъра, за да вървят всички в залата по една минута. */
export function GET() {
  return NextResponse.json({ now: Date.now() }, { headers: { "cache-control": "no-store" } });
}
