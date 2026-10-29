import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { findMessages } from "@/lib/messaging/sinhron";
import { SN_DEFAULTS } from "@/lib/messaging/sinhron-rules";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/messaging/sinhron — синхронът Ели ↔ Viber/WhatsApp (Ивайло, 29.10.2026).
 *
 * Връща на кого какво да се напише след обаждане (Ели не се е свързала /
 * говорила без час / записан час / Ивайло не се е свързал), по кой канал и с
 * готов текст — плюс кого и защо прескача. Нищо не праща: пращането е в
 * машината на Мака (`viber-vylni/sinhron-eli.sh` → plan.json → otvori/postavi/prati).
 *
 *   ?days=N — колко дни назад важи обаждането като повод (по подразбиране 2).
 * Bearer: HERMES_API_TOKEN или INTERNAL_SEND_TOKEN (checkHermesAuth).
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const days = Number(new URL(request.url).searchParams.get("days"));
  const opts = Number.isFinite(days) && days > 0 && days <= 14 ? { ...SN_DEFAULTS, maxAgeDays: days } : SN_DEFAULTS;
  const now = new Date();
  try {
    const r = await findMessages(now, opts);
    return NextResponse.json({ ok: true, now: now.toISOString(), days: opts.maxAgeDays, count: r.items.length, items: r.items, skipped: r.skipped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[messaging/sinhron]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
