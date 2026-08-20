import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { upsertBooking, updateBooking } from "@/lib/crm/repository";
import { clampLimit, parseOffset, parseCsv, listBookings } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

const BOOKING_STATUSES = ["accepted", "pending", "cancelled", "rejected", "completed"] as const;

/**
 * GET /api/crm/booking — срещите.
 *   ?when=upcoming|today|past · ?status=accepted,cancelled · ?q= · ?from= &to=
 *
 * Дотук Hermes нямаше как да види нито една среща: таблицата се пълнеше само
 * от Cal.com webhook-а и се четеше само от админ таблото.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;

  const status = parseCsv(p.get("status"), BOOKING_STATUSES);
  if (status?.length === 0) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const whenRaw = p.get("when");
  if (whenRaw && !["upcoming", "today", "past"].includes(whenRaw)) {
    return NextResponse.json({ error: "when must be upcoming, today or past" }, { status: 400 });
  }

  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listBookings({
    status: status ?? undefined,
    when: (whenRaw as "upcoming" | "today" | "past" | null) ?? undefined,
    q: p.get("q") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    limit,
    offset,
  });
  if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}

const bookingInput = z.object({
  cal_booking_id: z.string().trim().min(1).optional(),
  attendee_name: z.string().trim().min(1),
  attendee_email: z.string().email(),
  attendee_phone: z.string().trim().optional(),
  scheduled_at: z.string().min(4),
  duration_minutes: z.coerce.number().int().positive().max(24 * 60).optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  business: z.string().trim().optional(),
  automation_goal: z.string().trim().optional(),
  timeline: z.string().trim().optional(),
  meeting_url: z.string().trim().optional(),
  services_interested: z.unknown().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/crm/booking — записва среща, уговорена по телефона или на място.
 * Идемпотентно: същият час + същият имейл не прави втори запис.
 * Не изпраща покана и не създава Meet линк — само описва уговореното.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = bookingInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await upsertBooking(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created });
}

const bookingPatch = z.object({
  id: z.string().uuid(),
  scheduled_at: z.string().min(4).optional(),
  duration_minutes: z.coerce.number().int().positive().max(24 * 60).optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  meeting_url: z.string().trim().optional(),
  notes: z.string().optional(),
});

/** PATCH /api/crm/booking — местене на час, отмяна, потвърждение. */
export async function PATCH(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = bookingPatch.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await updateBooking(parsed.data);
  if (result.error === "booking not found") {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  const { id, ...fields } = parsed.data;
  return NextResponse.json({ ok: true, id, updated: Object.keys(fields) });
}
