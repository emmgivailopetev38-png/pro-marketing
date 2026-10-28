import { NextResponse } from "next/server";
import { runAutoCalls } from "@/lib/voice/auto-call";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: GET /api/cron/voice-auto — на 15 минути, пон–чт през деня (UTC).
 *
 * Ели набира новите лийдове и неявилите се (lib/voice/auto-call.ts). Часовете
 * в София (10:00–17:45) се проверяват вътре — кронът е по-широк заради
 * лятното/зимното време. Извън тях, при спрян ключ, таван или без кредити
 * минава тихо.
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
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e) {
    console.error("[cron/voice-auto]", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
