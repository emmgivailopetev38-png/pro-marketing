import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { isCapiConfigured } from "@/lib/meta/conversions-api";
import { crmEventsMode } from "@/lib/meta/crm-events-rules";
import { runCrmEvents, type RunMode } from "@/lib/meta/crm-events";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: GET /api/cron/meta-crm-events — два пъти в час.
 *
 * Праща към Meta CRM събитията за лийдовете от формите — „Meeting Booked“ при
 * първата записана среща и „Won“ при спечелен клиент (по желание и „Qualified
 * Lead“ при разговор) — по lead_id, за да може кампаниите да оптимизират по
 * „Conversion leads“, а не по „оставен телефон“. Хваща срещите от всички пътища
 * (екипът, Хермес, синхронът на календара, Cal.com, Fathom), защото чете
 * следите в CRM-а, а не едно определено действие. Правилата:
 * lib/meta/crm-events-rules.ts; дневникът срещу двойно пращане: automation_events.
 *
 * Включване (Vercel → Environment Variables → Production):
 *   CAPI_CRM_EVENTS — няма/0: изключено (по подразбиране) · dry: само смята и
 *                     логва · 1: праща
 *   CAPI_CRM_STAGES — по желание, напр. `qualified,meeting,won` (подразбиране: meeting,won)
 *
 * Auth: Vercel праща `Authorization: Bearer ${CRON_SECRET}`; за ръчна проба —
 * INTERNAL_SEND_TOKEN. Без валиден токен — 401, дори ако CRON_SECRET липсва.
 * Ръчно: `?dry=1` — какво би тръгнало (работи и при изключено, нищо не праща);
 * `?test=<код от Events Manager → Test events>` — до 3 тестови събития, без запис.
 */
function bearerMatches(header: string, expected: string | undefined): boolean {
  if (!expected || !header.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7).trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const isVercelCron = bearerMatches(header, process.env.CRON_SECRET);
  const isManual = bearerMatches(header, process.env.INTERNAL_SEND_TOKEN);
  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = crmEventsMode();
  const forceDry = isManual && url.searchParams.get("dry") === "1";
  const testCode = isManual ? url.searchParams.get("test")?.trim() || null : null;

  if (!isCapiConfigured()) {
    return NextResponse.json({ ok: true, skipped: "capi_not_configured" });
  }
  if (mode === "off" && !forceDry) {
    return NextResponse.json({ ok: true, skipped: "disabled", hint: "CAPI_CRM_EVENTS=dry или 1 във Vercel" });
  }

  // Тестът е изричното ръчно действие → пред режима; иначе dry/live според CAPI_CRM_EVENTS.
  const runMode: RunMode = forceDry ? "dry" : testCode ? "test" : mode === "dry" ? "dry" : "live";
  const report = await runCrmEvents({ mode: runMode, testEventCode: testCode });
  console.log(
    `[meta-crm-events] ${runMode}: лийдове ${report.leads}, нови ${report.planned}, пратени ${report.sent}, отказани ${report.rejected}, ` +
      `вече пратени ${report.alreadySent}, пропуснати ${JSON.stringify(report.skipped)}, повторно ${report.retried.sent}/${report.retried.tried}` +
      (report.errors.length ? `, грешки: ${report.errors.join("; ")}` : "")
  );
  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}
