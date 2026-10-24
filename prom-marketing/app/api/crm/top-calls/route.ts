import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { loadTopCalls } from "@/lib/crm/top-calls";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/top-calls?limit=10 — „📞 Топ 10 за днес": просрочените и
 * днешните напомняния по стойност на сделката, после по давност; won/lost
 * не влизат; студените (lead/contacted без сума, „да се обади" > 14 дни) са
 * само брой — `cold` — за вълната по 10 на ден. Същият списък стои в
 * сутрешния CRM имейл.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = Number(new URL(request.url).searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(raw) ? Math.min(50, Math.max(1, Math.floor(raw))) : 10;
  try {
    const r = await loadTopCalls(new Date(), limit);
    return NextResponse.json({ ok: true, count: r.top.length, cold: r.cold, warm_total: r.warm_total, items: r.top });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
