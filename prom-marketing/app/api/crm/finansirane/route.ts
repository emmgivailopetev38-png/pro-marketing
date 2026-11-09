import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { CATEGORIES, PROGRAM_STATUSES } from "@/lib/finansirane/finansirane-rules";
import { getProgramWithMatches, listPrograms } from "@/lib/finansirane/repository";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/finansirane — 🇪🇺 Евро проекти (10.11.2026).
 * Без параметри: всички програми (сортирани: активните по срок) с броя съвпадения по статус.
 * `?status=open|upcoming|rolling|closed`, `?category=…` — филтри.
 * `?key=<ключ>` — една програма с нейните съвпадения (контакт: име, фирма, етап).
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const sp = new URL(request.url).searchParams;
  const key = sp.get("key")?.trim();
  try {
    if (key) {
      const r = await getProgramWithMatches(key);
      if (!r) return NextResponse.json({ ok: false, error: "Няма такава програма" }, { status: 404 });
      return NextResponse.json({
        ok: true,
        program: r.program,
        matches: r.matches.map((m) => ({
          id: m.id,
          contact_id: m.contact_id,
          ime: m.contact?.full_name ?? null,
          firma: m.contact?.company ?? null,
          etap: m.contact?.stage ?? null,
          fit: m.fit,
          role: m.role,
          reason: m.reason,
          next_step: m.next_step,
          status: m.status,
          updated_at: m.updated_at,
        })),
      });
    }
    const status = sp.get("status") ?? undefined;
    const category = sp.get("category") ?? undefined;
    if (status && !(PROGRAM_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: `status: ${PROGRAM_STATUSES.join(" | ")}` }, { status: 400 });
    }
    if (category && !(CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: `category: ${CATEGORIES.join(" | ")}` }, { status: 400 });
    }
    const programs = await listPrograms({ status, category });
    return NextResponse.json({ ok: true, total: programs.length, programs });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "грешка" }, { status: 500 });
  }
}
