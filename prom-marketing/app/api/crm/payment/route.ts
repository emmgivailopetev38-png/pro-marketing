import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { paymentInputSchema, MATCH_STATUSES } from "@/lib/crm/types";
import { upsertPayment } from "@/lib/crm/repository";
import { clampLimit, parseOffset, parseCsv, listPayments } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/payment — списък/търсене за Hermes.
 * ?match_status=matched,unmatched&contact_id=…&invoice_id=…&q=…&from=…&to=…&limit=…&offset=…
 * Датите са по paid_at (fallback created_at); from включващо, to изключващо.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const matchStatus = parseCsv(p.get("match_status"), MATCH_STATUSES);
  if (matchStatus?.length === 0) {
    return NextResponse.json({ error: "Invalid match_status filter" }, { status: 400 });
  }
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listPayments({
    match_status: matchStatus ?? undefined,
    contact_id: p.get("contact_id") ?? undefined,
    invoice_id: p.get("invoice_id") ?? undefined,
    q: p.get("q") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    limit,
    offset,
  });
  if (r.error) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}

/**
 * POST /api/crm/payment — idempotent payment record (bank statement / email
 * evidence). Does NOT settle any invoice — that is /api/crm/match-payment.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = paymentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const result = await upsertPayment(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created });
}
