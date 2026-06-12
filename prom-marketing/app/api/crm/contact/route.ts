import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { CONTACT_STAGES } from "@/lib/contacts/types";
import { FOLLOWUP_STATUSES } from "@/lib/crm/types";
import { updateContact } from "@/lib/crm/repository";
import { clampLimit, parseOffset, parseCsv, listContacts, getContactProfile } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/contact — търсене на контакти за Hermes.
 *   ?q=иван | 0888111222 | firma.bg&stage=lead,client&followup_status=…&limit=…&offset=…
 * GET /api/crm/contact?id=<uuid> — пълен профил: контакт + последни активности
 *   + фактури + плащания + абонаменти (всичко вързано към contact_id).
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;

  const id = p.get("id");
  if (id) {
    const profile = await getContactProfile(id);
    if (profile.error) {
      return NextResponse.json({ ok: false, error: profile.error }, { status: 404 });
    }
    return NextResponse.json({ ok: true, ...profile, error: undefined });
  }

  const stage = parseCsv(p.get("stage"), CONTACT_STAGES);
  if (stage?.length === 0) {
    return NextResponse.json({ error: "Invalid stage filter" }, { status: 400 });
  }
  const followup = parseCsv(p.get("followup_status"), FOLLOWUP_STATUSES);
  if (followup?.length === 0) {
    return NextResponse.json({ error: "Invalid followup_status filter" }, { status: 400 });
  }
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listContacts({
    q: p.get("q") ?? undefined,
    stage: stage ?? undefined,
    followup_status: followup ?? undefined,
    limit,
    offset,
  });
  if (r.error) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}

const contactPatchSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1).optional(),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  deal_value_eur: z.coerce.number().int().optional(),
  stage: z.enum(CONTACT_STAGES).optional(),
  followup_status: z.enum(FOLLOWUP_STATUSES).optional(),
  next_followup_at: z.string().optional(),
});

/**
 * PATCH /api/crm/contact — частична корекция (Hermes поправя грешни данни).
 * Пипа само подадените полета; оставя активност в профила като одитна следа.
 */
export async function PATCH(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = contactPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { id, ...fields } = parsed.data;
  const result = await updateContact({ id, ...fields });
  if (result.error === "contact not found") {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id, updated: Object.keys(fields) });
}
