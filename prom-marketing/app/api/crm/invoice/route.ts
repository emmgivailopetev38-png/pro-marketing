import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { invoiceInputSchema, INVOICE_STATUSES } from "@/lib/crm/types";
import { upsertInvoice } from "@/lib/crm/repository";
import { clampLimit, parseOffset, parseCsv, listInvoices } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/invoice — списък/търсене за Hermes.
 * ?status=paid,sent&contact_id=…&q=…&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=50&offset=0
 * Датите са по issue_date (fallback created_at); from включващо, to изключващо.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const status = parseCsv(p.get("status"), INVOICE_STATUSES);
  if (status?.length === 0) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listInvoices({
    status: status ?? undefined,
    contact_id: p.get("contact_id") ?? undefined,
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
