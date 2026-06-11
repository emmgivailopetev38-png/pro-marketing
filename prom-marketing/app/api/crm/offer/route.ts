import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { offerInputSchema, OFFER_STATUSES } from "@/lib/crm/types";
import { upsertOffer, setOfferStatus } from "@/lib/crm/repository";
import { clampLimit, parseOffset, parseCsv, listOffers } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/** POST /api/crm/offer — идемпотентен upsert на оферта (Hermes/админ). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = offerInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await upsertOffer(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created, contact_id: result.contact_id });
}

/**
 * GET /api/crm/offer — списък оферти.
 * ?status=sent,accepted&contact_id=…&q=…&from=…&to=…&limit=…&offset=…
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const status = parseCsv(p.get("status"), OFFER_STATUSES);
  if (status?.length === 0) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listOffers({
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

const statusSchema = z.object({ id: z.string().uuid(), status: z.enum(OFFER_STATUSES) });

/**
 * PATCH /api/crm/offer — смяна на статус. „accepted" автоматично създава
 * проект и връща project_id.
 */
export async function PATCH(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await setOfferStatus(parsed.data);
  if (result.error === "offer not found") {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: parsed.data.id, status: parsed.data.status, project_id: result.project_id });
}
