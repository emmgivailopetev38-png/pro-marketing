import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { recurringServiceInputSchema, RECURRING_SERVICE_TYPES } from "@/lib/crm/types";
import { upsertRecurringService, updateRecurringService } from "@/lib/crm/repository";
import { clampLimit, parseOffset, parseCsv, parseBoolParam, listRecurringServices } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

const recurringPatchSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
  excluded_from_auto_send: z.boolean().optional(),
  excluded_reason: z.string().trim().optional(),
  amount: z.coerce.number().optional(),
  billing_day: z.coerce.number().int().min(1).max(31).optional(),
  notes: z.string().optional(),
  ended_at: z.string().optional(),
});

/** PATCH /api/crm/recurring-service — пауза/изключване/корекция на абонамент. */
export async function PATCH(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = recurringPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await updateRecurringService(parsed.data);
  if (result.error === "recurring service not found") {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: parsed.data.id });
}

/**
 * GET /api/crm/recurring-service — списък абонаменти (GPS месечното фактуриране).
 * ?service_type=gps&active=true&contact_id=…&limit=…&offset=…
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const serviceType = parseCsv(p.get("service_type"), RECURRING_SERVICE_TYPES);
  if (serviceType?.length === 0) {
    return NextResponse.json({ error: "Invalid service_type filter" }, { status: 400 });
  }
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listRecurringServices({
    service_type: serviceType ?? undefined,
    active: parseBoolParam(p.get("active")),
    contact_id: p.get("contact_id") ?? undefined,
    limit,
    offset,
  });
  if (r.error) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}

/**
 * POST /api/crm/recurring-service — upsert a recurring billing record
 * (GPS/CRM/etc.) by (contact_id, service_type). Supports excluded_from_auto_send
 * so automations skip ended relationships (e.g. Borima Trans after May 2026).
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = recurringServiceInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const result = await upsertRecurringService(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created });
}
