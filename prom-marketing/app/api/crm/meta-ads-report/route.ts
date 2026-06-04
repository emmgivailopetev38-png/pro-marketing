import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { metaAdsReportInputSchema } from "@/lib/crm/types";
import { upsertMetaAdsReport } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

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
