import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { clampLimit, parseOffset, parseCsv, listAutomationEvents } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

const EVENT_STATUSES = ["success", "failed", "skipped"] as const;

/**
 * GET /api/crm/automation-event — журналът на автоматизациите (за Одитора).
 * ?event_type=expense_recorded,invoice_upserted&status=failed&since=2026-06-01&limit=…&offset=…
 * event_type е свободен текст (csv), status е success|failed|skipped,
 * since е включващо (created_at ≥ since).
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const status = parseCsv(p.get("status"), EVENT_STATUSES);
  if (status?.length === 0) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const eventTypeRaw = p.get("event_type");
  const eventType = eventTypeRaw
    ? eventTypeRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listAutomationEvents({
    event_type: eventType,
    status: status ?? undefined,
    since: p.get("since") ?? undefined,
    limit,
    offset,
  });
  if (r.error) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}
