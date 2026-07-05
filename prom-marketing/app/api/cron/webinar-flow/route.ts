import { NextResponse } from "next/server";
import { runWebinarFlow } from "@/lib/webinar/flow";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/webinar-flow — едно завъртане на Webinar Flow.
 *
 * Върти се на всеки час (vercel.json). Ако няма зададена дата в
 * lib/webinar/config.ts, излиза веднага — безвреден е. Зададеш ли дата,
 * стъпките (−3д, −1д, −1ч, +3ч оферта, +27ч последен шанс) тръгват сами.
 *
 * Auth: Vercel cron праща `Authorization: Bearer ${CRON_SECRET}`.
 * Може да се пусне и ръчно със същия header (за тест или от Хермес).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWebinarFlow();
  return NextResponse.json(result, { status: result.errors.length > 0 ? 207 : 200 });
}
