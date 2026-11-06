import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { sendOffer } from "@/lib/oferti/repository";
import { sendSchema as schema } from "@/lib/oferti/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/crm/offer/send — офертата по имейл с прикачен PDF; отговорите стигат до продавача и Ивайло. */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  const r = await sendOffer(parsed.data, parsed.data.created_by ?? "hermes");
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
  return NextResponse.json(r);
}
