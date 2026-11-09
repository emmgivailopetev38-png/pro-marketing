import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { matchPayloadSchema } from "@/lib/finansirane/finansirane-rules";
import { upsertMatches } from "@/lib/finansirane/repository";

export const dynamic = "force-dynamic";

/**
 * POST /api/crm/finansirane/match — upsert на съвпадения програма ↔ контакт
 * (масив до 500 или `{ matches: [...] }`) по (program_key, contact_id).
 * `status` НЕ се пипа — новите стават „nov“, старите си пазят статуса (той е на Ивайло).
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = matchPayloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  const r = await upsertMatches(parsed.data);
  return NextResponse.json(r, { status: r.ok || r.new + r.updated > 0 ? 200 : 400 });
}
