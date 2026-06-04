import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { getAccountingSummary } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

/** GET /api/crm/accounting-summary — this-month turnover, payments, expenses, profit. */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const summary = await getAccountingSummary();
  return NextResponse.json({ ok: true, summary });
}
