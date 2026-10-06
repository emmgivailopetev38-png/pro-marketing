import { NextResponse } from "next/server";
import Stripe from "stripe";
import { runKinoFlow, kinoFlowEnabled } from "@/lib/kino/flow";
import { sweepInstallmentSubscriptions } from "@/lib/kino/stripe";
import { runAbandonedCheck } from "@/lib/kino/abandoned";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/kino-flow — едно завъртане на напомнянията за „ВЪЛНАТА“
 * (на 15 минути, vercel.json) + веднъж в часа предпазната мрежа за вноските
 * (абонамент с изплатени 3 вноски → спира в края на периода).
 *
 * Безвреден, докато KINO_FLOW_ENABLED не е „1“: казва какво би пратил и излиза.
 * Изоставените плащания (натиснал „купи“, 15 мин без плащане) се проверяват
 * винаги — сигналът е само вътрешен (CRM + имейл/Telegram до Ивайло);
 * изключва се с KINO_ABANDONED_ALERTS=0.
 * Auth: Vercel cron праща `Authorization: Bearer ${CRON_SECRET}` (както webinar-flow).
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected && request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flow = await runKinoFlow();
  const abandoned = await runAbandonedCheck().catch((e: unknown) => ({
    found: 0,
    alerted: 0,
    errors: [e instanceof Error ? e.message : String(e)],
  }));

  let installments: Awaited<ReturnType<typeof sweepInstallmentSubscriptions>> | { skipped: string } = { skipped: "не е кръгъл час" };
  const key = process.env.STRIPE_SECRET_KEY;
  const force = new URL(request.url).searchParams.get("sweep") === "1";
  if (key && (force || new Date().getUTCMinutes() < 15)) {
    installments = await sweepInstallmentSubscriptions(new Stripe(key));
  } else if (!key) {
    installments = { skipped: "няма STRIPE_SECRET_KEY" };
  }

  return NextResponse.json(
    { enabled: kinoFlowEnabled(), flow, abandoned, installments },
    { status: flow.errors.length > 0 || abandoned.errors.length > 0 ? 207 : 200 },
  );
}
