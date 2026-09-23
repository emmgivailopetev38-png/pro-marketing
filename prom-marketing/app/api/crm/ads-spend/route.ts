import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { classifyCampaign, summarize, toEur, USD_PER_EUR, type SpendRow } from "@/lib/crm/ads-spend";

export const dynamic = "force-dynamic";

/**
 * Дневният рекламен разход по кампания.
 *
 * POST — синхронът на сървъра го праща всеки ден (Meta Graph API → тук).
 * Записът е идемпотентен по (платформа, акаунт, кампания, ден), затова един и
 * същ ден може да се праща колкото пъти трябва: числата на Meta се дозакръглят
 * до два дни назад и последното изпращане печели.
 *
 * GET — какъв е разходът за последните N дни, разделен по предназначение.
 */

const rowSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  campaign_id: z.string().min(1),
  campaign_name: z.string().nullish(),
  objective: z.string().nullish(),
  spend: z.coerce.number().min(0),
  impressions: z.coerce.number().int().min(0).default(0),
  clicks: z.coerce.number().int().min(0).default(0),
  leads: z.coerce.number().int().min(0).default(0),
});

const payloadSchema = z.object({
  platform: z.string().default("meta"),
  account_id: z.string().min(1),
  currency: z.string().default("USD"),
  usd_per_eur: z.coerce.number().positive().default(USD_PER_EUR),
  rows: z.array(rowSchema).max(2000),
});

export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { platform, account_id, currency, usd_per_eur, rows } = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, written: 0, note: "няма редове" });
  }

  const now = new Date().toISOString();
  const records = rows.map((r) => {
    const { spend_eur, fx_rate, fx_source } = toEur(r.spend, currency, usd_per_eur);
    return {
      day: r.day,
      platform,
      account_id,
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name ?? null,
      objective: r.objective ?? null,
      purpose: classifyCampaign(r.campaign_name),
      spend: r.spend,
      currency: currency.toUpperCase(),
      spend_eur,
      fx_rate,
      fx_source,
      impressions: r.impressions,
      clicks: r.clicks,
      leads: r.leads,
      synced_at: now,
    };
  });

  const sb = createServiceClient();
  const { error } = await sb.from("ad_spend_daily").upsert(records, { onConflict: "platform,account_id,campaign_id,day" });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const days = [...new Set(records.map((r) => r.day))].sort();
  return NextResponse.json({
    ok: true,
    written: records.length,
    from: days[0],
    to: days[days.length - 1],
    eur: Math.round(records.reduce((s, r) => s + r.spend_eur, 0) * 100) / 100,
  });
}

/** GET /api/crm/ads-spend?days=30 — разходът за периода, разделен по предназначение. */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const days = Math.min(Math.max(Number(p.get("days")) || 30, 1), 400);
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("ad_spend_daily")
    .select("day, campaign_id, campaign_name, purpose, spend, spend_eur, impressions, clicks, leads")
    .gte("day", from)
    .order("day", { ascending: false })
    .limit(5000);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const summary = summarize((data ?? []) as SpendRow[]);
  return NextResponse.json({ ok: true, days, from, ...summary });
}
