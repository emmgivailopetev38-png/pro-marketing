import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { metaAdsReportInputSchema } from "@/lib/crm/types";
import { upsertMetaAdsReport } from "@/lib/crm/repository";
import { clampLimit, parseOffset, listMetaAdsReports } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/meta-ads-report — четене на вече записаните отчети.
 *   ?campaign= · ?from= &to= · ?limit= &offset=
 *
 * Дотук маршрутът беше само за писане, тоест Hermes не можеше да сравни
 * днешния разход с вчерашния, без да пита Meta наново.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listMetaAdsReports({
    campaign: p.get("campaign") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    limit,
    offset,
  });
  if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}

/**
 * POST /api/crm/meta-ads-report — Hermes posts the structured morning ad
 * analysis (campaign, spend, leads, CPL, quality, recommendations). Upsert per
 * (report_date, campaign) so re-ingesting refreshes rather than duplicates.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = metaAdsReportInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await upsertMetaAdsReport(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created });
}
