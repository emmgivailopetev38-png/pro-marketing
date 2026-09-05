import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { runCrmConsistency } from "@/lib/crm/consistency";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Рутинното изравняване на CRM-а, на ръка.
 *
 *   GET  /api/crm/consistency          → пробно: какво БИ се оправило, без запис
 *   POST /api/crm/consistency          → оправя го (тяло `{ "dry": true }` = пак пробно)
 *
 * Същото върви всяка сутрин в крона `daily-lead-summary`, преди отчета.
 * Зад Bearer-а на Хермес — това е негов инструмент колкото и на Ивайло.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await runCrmConsistency({ dry: true });
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { dry?: boolean };
  const result = await runCrmConsistency({ dry: body.dry === true });
  return NextResponse.json({ ok: result.errors.length === 0, ...result });
}
