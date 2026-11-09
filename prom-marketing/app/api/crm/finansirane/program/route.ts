import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { programPayloadSchema } from "@/lib/finansirane/finansirane-rules";
import { upsertPrograms } from "@/lib/finansirane/repository";

export const dynamic = "force-dynamic";

/**
 * POST /api/crm/finansirane/program — upsert на програми по `key`
 * (една, масив до 100 или `{ programs: [...] }`). Пипат се само подадените полета.
 * Връща записаните ключове, кои са нови и при кои се е сменил статусът или срокът.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = programPayloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  const r = await upsertPrograms(parsed.data);
  return NextResponse.json(r, { status: r.ok || r.keys.length > 0 ? 200 : 400 });
}
