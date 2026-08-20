import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { activityInputSchema } from "@/lib/crm/types";
import { recordActivity } from "@/lib/crm/repository";
import { clampLimit, parseOffset, listActivities } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/activity — лентата „какво се случи“ през целия CRM.
 *   ?contact_id= · ?activity_type=note,meeting · ?created_by=hermes
 *   ?q= · ?from= &to= · ?limit= &offset=
 *
 * Дотук активности се четяха само през профила на един контакт, така че
 * въпрос от рода на „какво стана днес“ нямаше отговор с едно извикване.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const types = p.get("activity_type")?.split(",").map((s) => s.trim()).filter(Boolean);
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listActivities({
    contact_id: p.get("contact_id") ?? undefined,
    activity_type: types?.length ? types : undefined,
    created_by: p.get("created_by") ?? undefined,
    q: p.get("q") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    limit,
    offset,
  });
  if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}

/**
 * POST /api/crm/activity — Hermes Gmail→CRM write.
 * Find-or-create a contact, optionally log an idempotent activity, and patch
 * sales follow-up fields (stage, followup_status, next_followup_at, mark_heard).
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = activityInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const result = await recordActivity(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    contact_id: result.contact_id,
    activity_id: result.activity_id,
    created: result.created,
  });
}
