import { NextResponse } from "next/server";
import { z } from "zod";
import { markOfferViewed } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

const schema = z.object({ path: z.string().trim().min(1).max(200) });

/**
 * POST /api/tracking/offer-view — публичен view beacon от /oferta/* страниците.
 * Без auth по дизайн: единственото, което може да направи, е да премести
 * ИЗПРАТЕНА оферта в „виждана" (никога не деградира статус и не чете данни).
 */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success || !parsed.data.path.startsWith("/oferta/")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const r = await markOfferViewed(parsed.data.path);
  return NextResponse.json({ ok: true, marked: r.marked });
}
