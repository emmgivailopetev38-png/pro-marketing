import { NextResponse } from "next/server";
import { runLeadReminders } from "@/lib/team/notify";
import { settlePhoneBookings } from "@/lib/crm/phone-bookings";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Vercel Cron: GET /api/cron/lead-reminders — на всеки половин час.
 *
 * Праща на човека за срещите едно писмо с новите лийдове, които още не е
 * докоснал (45 минути / 3 часа / 24 часа). Нощем мълчи. Вече пратените
 * напомняния стоят в `automation_events`, затова повторно пускане не праща
 * второ писмо.
 *
 * Покрай това затваря телефонните срещи (без meeting_url) 2 ч след края им —
 * проведена при следа в картона, иначе „да се обади" + бележка. Тихо и
 * идемпотентно (dedupe_key); никога не събаря напомнянията.
 *
 * Auth: Vercel праща `Authorization: Bearer ${CRON_SECRET}`; за ръчна проба
 * става и INTERNAL_SEND_TOKEN. `?force=1` пренебрегва тихите часове.
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

  const force = new URL(request.url).searchParams.get("force") === "1" && !!isManual;
  const result = await runLeadReminders({ force });
  let phone: Awaited<ReturnType<typeof settlePhoneBookings>> | { error: string };
  try {
    phone = await settlePhoneBookings();
  } catch (e) {
    phone = { error: e instanceof Error ? e.message : "unknown" };
  }
  return NextResponse.json({ ...result, phone_bookings: phone }, { status: result.ok ? 200 : 500 });
}
