import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { getAccountingSummary } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/accounting-summary — приход/плащания/разходи/ДДС/печалба + лични покупки.
 * Период: ?period=month|last_month|quarter|ytd|all (подразбиране month),
 * или custom range ?from=YYYY-MM-DD&to=YYYY-MM-DD (to е изключващо).
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const summary = await getAccountingSummary({
    period: url.searchParams.get("period") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  return NextResponse.json({ ok: true, summary });
}
