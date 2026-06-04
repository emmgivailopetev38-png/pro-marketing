import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { getSalesSummary } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

/** GET /api/crm/sales-summary — pipeline counts + follow-up state. */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const summary = await getSalesSummary();
  return NextResponse.json({ ok: true, summary });
}
