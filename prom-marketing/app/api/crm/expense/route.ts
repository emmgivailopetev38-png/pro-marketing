import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { expenseInputSchema } from "@/lib/crm/types";
import { upsertExpense } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

/** POST /api/crm/expense — idempotent supplier expense (Hermes / accountant). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = expenseInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await upsertExpense(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created });
}
