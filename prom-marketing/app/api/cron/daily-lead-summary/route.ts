import { NextResponse } from "next/server";
import { runLeadSequence } from "@/lib/email/lead-sequence";
import { runWarmSequence } from "@/lib/email/warm-sequence";
import { TRACK_LABEL } from "@/lib/email/warm-steps";
import { createServiceClient } from "@/lib/supabase/service";
import { syncAllSources } from "@/lib/leads/import";
import { sendEmail } from "@/lib/email/resend";
import { buildDailyCrmReport } from "@/lib/email/daily-crm-report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SeqOut = Awaited<ReturnType<typeof runLeadSequence>> | { error: string };
type WarmOut = Awaited<ReturnType<typeof runWarmSequence>> | { error: string };

/**
 * Какво свършиха двете поредици в този такт — кратък блок под сутрешния отчет.
 * В пробен режим (без WARM_SEQUENCE_ENABLED=true) показва кого БИ докоснал
 * топлият кръг, за да се види обхватът преди първото писмо.
 */
function automationSummary(sequence: SeqOut, warm: WarmOut): { html: string; text: string } {
  const cold =
    "error" in sequence
      ? `Студената поредица: грешка — ${sequence.error}`
      : `Студената поредица: ${sequence.sent} изпратени · ${sequence.checked} проверени`;

  let warmLine: string;
  let warmList: string[] = [];
  if ("error" in warm) {
    warmLine = `Топлият кръг: грешка — ${warm.error}`;
  } else if (warm.mode === "off") {
    warmLine = "Топлият кръг: изключен (WARM_SEQUENCE_ENABLED=false)";
  } else {
    const label = warm.mode === "dry" ? "ПРОБЕН режим — би пратил" : "изпратени";
    warmLine = `Топлият кръг: ${label} ${warm.details.length} писма · ${warm.checked} проверени`;
    warmList = warm.details.slice(0, 25).map((d) => `${d.name ?? d.contact_id} · ${TRACK_LABEL[d.track]} · ${d.step}`);
  }

  const html = `<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#0d1221;max-width:680px;background:#f5f7fa;border-radius:8px;padding:14px 18px;margin-top:12px">
    <h2 style="margin:0 0 6px;font-size:15px;color:#0066cc">✉️ Автоматичните писма тази сутрин</h2>
    <p style="margin:0 0 4px">${cold}</p>
    <p style="margin:0">${warmLine}</p>
    ${warmList.length ? `<ul style="margin:6px 0 0;padding-left:20px;color:#444">${warmList.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}
  </div>`;
  const text = `\n\n✉️ АВТОМАТИЧНИТЕ ПИСМА ТАЗИ СУТРИН\n${cold}\n${warmLine}${warmList.length ? `\n${warmList.map((l) => `  ${l}`).join("\n")}` : ""}\n`;
  return { html, text };
}

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
 *   3. Emails the report to emmgivailopetev38@gmail.com (via EMAIL_REPLY_TO env)
 *   4. Дава един такт на продажбената поредица към новите лийдове
 *      (`runLeadSequence`) — тук е, защото Hobby дава само 2 крона.
 *   5. Дава един такт и на топлия кръг (`runWarmSequence`) — писмата към
 *      хората, с които вече сме говорили и които не са спечелени.
 *
 * Auth: Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` automatically.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const internalToken = process.env.INTERNAL_SEND_TOKEN;
  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isManualTest = internalToken && authHeader === `Bearer ${internalToken}`;
  if (cronSecret && !isVercelCron && !isManualTest) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Sync Meta leads first so the report includes the latest data
  const syncResult = await syncAllSources();

  // 2. Build the comprehensive CRM report (includes 7-day reminders)
  const report = await buildDailyCrmReport();

  // 2b. Продажбената поредица към лийдовете — един такт на ден.
  // Живее тук, защото Vercel Hobby дава 2 крона и двата са заети. Никога не
  // бива да събори отчета, затова е в try/catch.
  let sequence: Awaited<ReturnType<typeof runLeadSequence>> | { error: string };
  try {
    sequence = await runLeadSequence(createServiceClient());
  } catch (e) {
    sequence = { error: e instanceof Error ? e.message : "unknown" };
  }

  // 2c. Топлият кръг — писмата към хората, с които ВЕЧЕ сме говорили. Студената
  // поредица спира при първия разговор; оттам нататък поема този кръг, за да не
  // изстива никой между обажданията. Пази се в същия try/catch по същата
  // причина: сутрешният отчет е по-важен от всяко писмо.
  let warm: Awaited<ReturnType<typeof runWarmSequence>> | { error: string };
  try {
    warm = await runWarmSequence(createServiceClient());
  } catch (e) {
    warm = { error: e instanceof Error ? e.message : "unknown" };
  }

  // 3. Send the report to the user's Gmail — с какво са направили автоматичните
  // писма тази сутрин, за да се вижда, че машината работи (или че е на празен ход).
  const recipient = process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
  const auto = automationSummary(sequence, warm);

  const emailResult = await sendEmail({
    to: recipient,
    subject: report.subject,
    html: report.html + auto.html,
    text: report.text + auto.text,
  });

  return NextResponse.json({
    ok: !emailResult.error,
    sync: {
      newLeads: syncResult.totalNewLeads,
      mirrored: syncResult.mirroredToContacts,
    },
    report: report.stats,
    sequence,
    warm,
    email: {
      to: recipient,
      id: emailResult.id,
      error: emailResult.error,
    },
  });
}
