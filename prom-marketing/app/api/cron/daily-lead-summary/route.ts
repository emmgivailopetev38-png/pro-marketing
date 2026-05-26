import { NextResponse } from "next/server";
import { syncAllSources } from "@/lib/leads/import";
import { sendEmail } from "@/lib/email/resend";
import { buildDailyCrmReport } from "@/lib/email/daily-crm-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: GET /api/cron/daily-lead-summary
 *
 * Triggered daily at 05:00 UTC (≈ 8 AM Sofia summer / 7 AM winter).
 *
 * What it does:
 *   1. Pulls fresh Meta leads from configured Google Sheets
 *   2. Builds a full CRM morning report:
 *      - Yesterday's activities per type
 *      - Today's follow-ups / meetings
 *      - 7-day offer follow-up reminders (auto-logs a note on each contact)
 *      - Overdue follow-ups
 *      - Pipeline snapshot
 *   3. Emails the report to ivailopetev38@gmail.com (via EMAIL_REPLY_TO env)
 *
 * Auth: Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` automatically.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Sync Meta leads first so the report includes the latest data
  const syncResult = await syncAllSources();

  // 2. Build the comprehensive CRM report (includes 7-day reminders)
  const report = await buildDailyCrmReport();

  // 3. Send the report to the user's Gmail
  const recipient = process.env.EMAIL_REPLY_TO || "ivailopetev38@gmail.com";

  const emailResult = await sendEmail({
    to: recipient,
    subject: report.subject,
    html: report.html,
    text: report.text,
  });

  return NextResponse.json({
    ok: !emailResult.error,
    sync: {
      newLeads: syncResult.totalNewLeads,
      mirrored: syncResult.mirroredToContacts,
    },
    report: report.stats,
    email: {
      to: recipient,
      id: emailResult.id,
      error: emailResult.error,
    },
  });
}
