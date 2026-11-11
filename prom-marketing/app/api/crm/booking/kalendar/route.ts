import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { cancelCloserInvite, listPendingMirrors, markMirrored, sendCloserInvite } from "@/lib/team/closer-calendar";
import { ownerEmail } from "@/lib/team/notify";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/booking/kalendar — предстоящите срещи, записани от /ekip, които
 * не са минали през Cal.com и още не са в общия календар „Георги · срещи“.
 *
 * Клоузърът вече ги има в своя календар (поканата тръгва при записването).
 * Календарната задача ги слага и в общия календар като заето време, за да не
 * предложи Cal.com същия час на друг човек, и после ги отбелязва с POST
 * `action: "mirrored"`.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await listPendingMirrors().catch(() => null);
  if (!items) return NextResponse.json({ ok: false, error: "read failed" }, { status: 500 });
  return NextResponse.json({ ok: true, count: items.length, items });
}

const input = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(["send", "cancel", "mirrored"]).default("send"),
  /** `owner` = проба към собственика: не оставя следа в срещата и е с отделен UID. */
  to: z.enum(["closer", "owner"]).default("closer"),
  gcal_event_id: z.string().trim().min(3).max(200).optional(),
});

/**
 * POST /api/crm/booking/kalendar
 *   { booking_id, action: "send" }                    → поканата към клоузъра (пак), за час извън Cal.com
 *   { booking_id, action: "cancel" }                  → маха срещата от календара му
 *   { booking_id, action: "send"|"cancel", to: "owner" } → проба към собственика
 *   { booking_id, action: "mirrored", gcal_event_id } → срещата вече е в общия календар
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = input.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  if (d.action === "mirrored") {
    if (!d.gcal_event_id) return NextResponse.json({ ok: false, error: "gcal_event_id is required" }, { status: 400 });
    const r = await markMirrored(d.booking_id, d.gcal_event_id);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }

  const test = d.to === "owner";
  const recipient = test ? { name: "Ивайло Петев", email: ownerEmail() } : null;
  const r =
    d.action === "cancel"
      ? await cancelCloserInvite({ bookingId: d.booking_id, recipient, test })
      : await sendCloserInvite({ bookingId: d.booking_id, recipient, test });
  return NextResponse.json({ ok: r.ok, error: r.error, to: r.to, uid: r.uid, seq: r.seq }, { status: r.ok ? 200 : 400 });
}
