import { NextResponse } from "next/server";
import { syncAllSources } from "@/lib/leads/import";
import { sendEmail } from "@/lib/email/resend";
import { renderDailyLeadsEmail } from "@/lib/email/daily-leads-email";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: GET /api/cron/daily-lead-summary
 *
 * Triggered daily at 05:00 UTC (≈ 8 AM Sofia summer / 7 AM winter).
 * 1. Pulls each enabled meta_lead_sources sheet and upserts new leads
 * 2. Counts leads in the last 24h and 7d
 * 3. Emails a summary to every address in ALLOWED_ADMIN_EMAILS
 *
 * Authenticated via Vercel's automatic `Authorization: Bearer ${CRON_SECRET}`
 * header. The same endpoint is callable manually with the secret for testing.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const syncResult = await syncAllSources();
  const supabase = createServiceClient();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: last24h }, { count: last7d }] = await Promise.all([
    supabase
      .from("meta_leads")
      .select("*", { count: "exact", head: true })
      .gte("imported_at", oneDayAgo),
    supabase
      .from("meta_leads")
      .select("*", { count: "exact", head: true })
      .gte("imported_at", sevenDaysAgo),
  ]);

  const syncErrors = syncResult.results
    .filter((r) => r.error)
    .map((r) => `${r.label}: ${r.error}`);

  const { subject, html, text } = renderDailyLeadsEmail({
    leads: syncResult.newLeads,
    totalLast24h: last24h ?? 0,
    totalLast7d: last7d ?? 0,
    syncErrors,
  });

  const recipients = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return NextResponse.json({
      ok: true,
      sync: syncResult,
      email: { skipped: "no recipients in ALLOWED_ADMIN_EMAILS" },
    });
  }

  const emailResult = await sendEmail({
    to: recipients,
    subject,
    html,
    text,
  });

  return NextResponse.json({
    ok: true,
    sync: syncResult,
    email: emailResult,
    counts: { last24h: last24h ?? 0, last7d: last7d ?? 0 },
  });
}
