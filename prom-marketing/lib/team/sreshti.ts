import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { updateBooking } from "@/lib/crm/repository";
import { LIVE_BOOKING_STATUSES, isLiveBooking, upcomingOfPerson, type BookingLite } from "@/lib/crm/booking-status";
import { findContactByEmailOrPhone, handleCancelledBooking } from "./cancelled";
import { fmtSofia } from "./time";
import type { TeamActor } from "./session";
import type { Person } from "./sreshti-zastapvane";
import { MEETING_MSG_LABEL, dueKind, sentKindsFor, type MeetingMsgKind } from "./sreshta-saobshtenia";

/**
 * Съобщенията към хората за срещите им — кое е на ред и кое е пратено.
 *
 * „Пратено“ живее в `bookings.raw_payload.msgs[kind] = { at, by, for }`, за да
 * важи и за срещи без картон в CRM-а; `for` е часът на срещата, за който е
 * пратено — премести ли се срещата, напомнянията излизат пак за новия час.
 * Когато картонът се намери, остава и активност `viber_sent` (с
 * `booking_msg: true`, за да не се брои за опит за контакт).
 *
 * Напомняне има само за жива среща (LIVE_BOOKING_STATUSES): отменена,
 * преместена, проведена или „не се яви“ не излиза — без никой да го спира.
 */
export interface MeetingMsgRow {
  bookingId: string;
  name: string;
  phone: string;
  email: string | null;
  whenIso: string;
  meetingUrl: string | null;
  status: string;
  /** кой е записал срещата (от бележката „Записа: …“), null = Cal.com/Ивайло */
  bookedBy: string | null;
  sent: MeetingMsgKind[];
  due: MeetingMsgKind | null;
}

export async function loadMeetingMessages(now: Date = new Date(), daysAhead = 8): Promise<MeetingMsgRow[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("bookings")
    .select("id, attendee_name, attendee_email, attendee_phone, scheduled_at, status, meeting_url, raw_payload")
    .in("status", [...LIVE_BOOKING_STATUSES])
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", new Date(now.getTime() + daysAhead * 86_400_000).toISOString())
    .not("attendee_phone", "is", null)
    .order("scheduled_at", { ascending: true })
    .limit(30);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => {
    const raw = (r.raw_payload ?? null) as Record<string, unknown> | null;
    const notes = String(raw?.notes ?? "");
    const by = /Записа:\s*([^·\n]+)/.exec(notes);
    const whenIso = String(r.scheduled_at);
    const sent = sentKindsFor(raw, whenIso);
    return {
      bookingId: String(r.id),
      name: String(r.attendee_name ?? ""),
      phone: String(r.attendee_phone ?? ""),
      email: (r.attendee_email as string | null) ?? null,
      whenIso,
      meetingUrl: (r.meeting_url as string | null) ?? null,
      status: String(r.status ?? ""),
      bookedBy: by ? by[1].trim() : null,
      sent: [...sent],
      due: dueKind(whenIso, now, sent),
    };
  });
}

/** Колко съобщения са на ред за срещи през следващите 36 часа — за сутрешното писмо. */
export async function countDueMeetingMessages(now: Date = new Date()): Promise<number> {
  const rows = await loadMeetingMessages(now, 2).catch(() => [] as MeetingMsgRow[]);
  return rows.filter((r) => r.due).length;
}

export async function markMessageSent(args: {
  actor: TeamActor;
  bookingId: string | null;
  contactId: string | null;
  kind: MeetingMsgKind;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const sb = createServiceClient();
  const nowIso = new Date().toISOString();
  let contactId = args.contactId;
  let whenIso: string | null = null;

  if (args.bookingId) {
    const { data: b } = await sb
      .from("bookings")
      .select("id, attendee_email, attendee_phone, scheduled_at, raw_payload")
      .eq("id", args.bookingId)
      .maybeSingle();
    if (b) {
      whenIso = String(b.scheduled_at);
      const raw = ((b.raw_payload ?? {}) as Record<string, unknown>) ?? {};
      // `for` = за кой час е пратено: премести ли се срещата, маркерът спира да важи.
      const msgs = {
        ...((raw.msgs as Record<string, unknown>) ?? {}),
        [args.kind]: { at: nowIso, by: args.actor.name, for: whenIso },
      };
      const { error } = await sb
        .from("bookings")
        .update({ raw_payload: { ...raw, msgs }, updated_at: nowIso })
        .eq("id", b.id);
      if (error) return { ok: false, error: error.message };
      if (!contactId) {
        const c = await findContactByEmailOrPhone(b.attendee_email as string | null, b.attendee_phone as string | null);
        contactId = c?.id ?? null;
      }
    }
  }

  if (contactId) {
    await sb.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: "viber_sent",
      title: `💜 Viber · ${MEETING_MSG_LABEL[args.kind]}${whenIso ? ` · среща ${fmtSofia(whenIso)}` : ""}`,
      body: args.text.trim().slice(0, 2000) || null,
      occurred_at: nowIso,
      created_by: args.actor.name,
      metadata: {
        team: true,
        team_member_id: args.actor.member?.id ?? null,
        team_member_slug: args.actor.slug,
        booking_id: args.bookingId,
        kind: args.kind,
        booking_msg: true,
        outcome: null,
      },
    });
  }
  return { ok: true };
}

export interface ClosedMeeting {
  id: string;
  whenIso: string;
  name: string;
}

/**
 * Затваря предстоящите живи срещи на човека (без `keepId`). Два повода:
 *   moved          — от картата е записан нов час: старият е преместен;
 *   not_interested — човекът каза, че не се интересува: срещата отпада.
 * Статусът става `cancelled` (+ поводът в raw_payload), затова напомнянията,
 * таблото, отчетът и проверката за застъпване спират да я броят сами — никой
 * не трябва да помни да ги спира. Странично действие: никога не хвърля.
 */
export async function closeUpcomingMeetings(args: {
  who: Person;
  why: "moved" | "not_interested";
  by: string;
  keepId?: string | null;
  movedTo?: { id: string | null; at: string } | null;
  now?: Date;
}): Promise<ClosedMeeting[]> {
  try {
    const now = args.now ?? new Date();
    const nowIso = now.toISOString();
    const sb = createServiceClient();
    const { data } = await sb
      .from("bookings")
      .select("id, status, scheduled_at, attendee_name, attendee_email, attendee_phone, raw_payload")
      .in("status", [...LIVE_BOOKING_STATUSES])
      .gt("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(300);
    type Row = BookingLite & { attendee_name: string | null; raw_payload: Record<string, unknown> | null };
    const rows = upcomingOfPerson((data ?? []) as Row[], args.who, now, args.keepId);
    const out: ClosedMeeting[] = [];
    for (const r of rows) {
      const why =
        args.why === "moved"
          ? { moved_to: { booking_id: args.movedTo?.id ?? null, at: args.movedTo?.at ?? null, by: args.by, on: nowIso } }
          : { cancelled_via: { reason: "not_interested", by: args.by, on: nowIso } };
      const { error } = await sb
        .from("bookings")
        .update({ status: "cancelled", raw_payload: { ...(r.raw_payload ?? {}), ...why }, updated_at: nowIso })
        .eq("id", r.id)
        .in("status", [...LIVE_BOOKING_STATUSES]);
      if (!error) out.push({ id: r.id, whenIso: r.scheduled_at, name: r.attendee_name ?? "" });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * „❌ Отказа срещата“ от „💜 Срещите“ в /ekip: човекът е казал (по телефона,
 * във Viber), че няма да дойде. Срещата става `cancelled` — напомнянията за нея
 * спират сами — и тръгва общият път на отказа: картонът влиза в „❌ Отказаха
 * срещата“ за нов час, а Ивайло научава, че часът му е свободен.
 */
export async function cancelMeetingByTeam(
  actor: TeamActor,
  bookingId: string
): Promise<{ ok: boolean; error?: string; whenIso?: string; name?: string; hasCard?: boolean }> {
  const sb = createServiceClient();
  const { data: b } = await sb
    .from("bookings")
    .select("id, status, attendee_name, attendee_email, attendee_phone, scheduled_at")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) return { ok: false, error: "Срещата не е намерена." };
  if (!isLiveBooking(b.status as string | null)) return { ok: false, error: "Срещата вече не е активна — опресни страницата." };
  const r = await updateBooking({ id: bookingId, status: "cancelled" });
  if (r.error) return { ok: false, error: r.error };
  const whenIso = String(b.scheduled_at);
  const name = String(b.attendee_name ?? "");
  const email = (b.attendee_email as string | null) ?? null;
  const phone = (b.attendee_phone as string | null) ?? null;
  await handleCancelledBooking({
    attendeeName: name || null,
    attendeeEmail: email,
    attendeePhone: phone,
    scheduledAtIso: whenIso,
    reason: `каза на ${actor.name}, че няма да дойде в този час`,
    by: actor.name,
  });
  const card = await findContactByEmailOrPhone(email, phone).catch(() => null);
  return { ok: true, whenIso, name, hasCard: !!card?.phone };
}
