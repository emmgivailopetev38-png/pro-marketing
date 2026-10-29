import { NextResponse } from "next/server";
import { runAutoCalls } from "@/lib/voice/auto-call";
import { runFollowupQueue } from "@/lib/voice/followup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: GET /api/cron/voice-auto — на 2 минути, пон–пт през деня (UTC).
 *
 * Ели набира новите лийдове и неявилите се (lib/voice/auto-call.ts), а после
 * изчерпва опашката за персонален фолоуъп (lib/voice/followup.ts) — същите
 * спирачки: часове в София (09:00–17:50), ключът „пауза“, кредитите, тавани.
 * Извън тях минава тихо.
 *
 * Auth: Vercel праща `Authorization: Bearer ${CRON_SECRET}`; за ръчна проба
 * става и INTERNAL_SEND_TOKEN.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const internalToken = process.env.INTERNAL_SEND_TOKEN;
  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isManual = internalToken && authHeader === `Bearer ${internalToken}`;
  if (cronSecret && !isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runAutoCalls();
    // Фолоуъпът не бива да падне заради новите лийдове и обратно — всяка грешка остава своя.
    const followup = await runFollowupQueue().catch((e) => ({ ok: false, state: "error" as const, detail: e instanceof Error ? e.message : String(e) }));
    return NextResponse.json({ ...result, followup }, { status: result.ok ? 200 : 500 });
  } catch (e) {
    console.error("[cron/voice-auto]", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
