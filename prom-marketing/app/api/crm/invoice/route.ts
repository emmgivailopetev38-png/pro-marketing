import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { invoiceInputSchema } from "@/lib/crm/types";
import { upsertInvoice } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

/** POST /api/crm/invoice — idempotent invoice upsert (Hermes ledger monitor). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = invoiceInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const result = await upsertInvoice(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    id: result.id,
    created: result.created,
    contact_id: result.contact_id,
    // FX audit so Hermes can verify EUR invoices keep original_amount null.
    audit: result.audit,
  });
}
