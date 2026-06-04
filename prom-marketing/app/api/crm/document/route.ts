import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { documentInputSchema } from "@/lib/crm/types";
import { upsertDocument } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

/**
 * POST /api/crm/document — register a document (PDF/photo/bank statement) with
 * optional Hermes-extracted OCR text + structured fields, and link it to a
 * contact/invoice/payment/expense. Unlinked docs go to manual review.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = documentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await upsertDocument(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created, contact_id: result.contact_id });
}
