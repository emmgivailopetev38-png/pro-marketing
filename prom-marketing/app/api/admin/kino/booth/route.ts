import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";
import { loadBooth } from "@/lib/kino/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/kino/booth — Режисьорската кабина в /admin/kino пита на 10 s:
 * колко души са в залата сега, въпросите, докато пристигат, и „Влизам на живо“.
 * Само с админ бисквитката на Ивайло.
 */
export async function GET() {
  const store = await cookies();
  if (!verifySession(store.get(ADMIN_COOKIE)?.value ?? null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await loadBooth(), { headers: { "Cache-Control": "private, no-store" } });
}
