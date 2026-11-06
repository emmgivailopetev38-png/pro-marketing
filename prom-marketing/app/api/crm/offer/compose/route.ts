import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { SELLERS } from "@/lib/oferti/katalog";
import { buildOffer } from "@/lib/oferti/repository";
import { buildSchema as schema } from "@/lib/oferti/schema";
import { shortSummary } from "@/lib/oferti/view";

export const dynamic = "force-dynamic";

/**
 * POST /api/crm/offer/compose — оферта от модули (нова или промяна с `id`).
 * Връща линка, PDF-а и кратко резюме. Нищо не се праща — това е чернова.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  const items = d.items && d.items.length > 0 ? d.items : d.moduli?.map((key) => ({ key }));
  const created_by = d.created_by ?? "hermes";
  const seller = d.seller ?? (created_by.includes("georgi") ? "georgi" : "ivailo");
  const r = await buildOffer(
    { ...d, items, seller },
    { created_by, owner_id: SELLERS[seller].team_member_id, seller }
  );
  if (r.error || !r.offer || !r.view) return NextResponse.json({ ok: false, error: r.error, errors: r.errors }, { status: 400 });
  return NextResponse.json({
    ok: true,
    id: r.offer.id,
    created: r.created,
    number: r.view.number,
    token: r.offer.token,
    url: r.view.url,
    pdf_url: r.view.pdfUrl,
    title: r.offer.title,
    status: r.offer.status,
    contact_id: r.offer.contact_id,
    seller: r.view.seller.name,
    valid_until: r.view.validUntil,
    totals: r.view.totals,
    summary: shortSummary(r.view),
  });
}
