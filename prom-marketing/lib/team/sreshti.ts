import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { findContactByEmailOrPhone } from "./cancelled";
import { fmtSofia } from "./time";
import type { TeamActor } from "./session";
import { MEETING_MSG_KINDS, MEETING_MSG_LABEL, dueKind, type MeetingMsgKind } from "./sreshta-saobshtenia";

/**
 * Съобщенията към хората за срещите им — кое е на ред и кое е пратено.
 *
 * „Пратено“ живее в `bookings.raw_payload.msgs[kind] = { at, by }`, за да важи
 * и за срещи без картон в CRM-а; когато картонът се намери, остава и активност
 * `viber_sent` (с `booking_msg: true`, за да не се брои за опит за контакт).
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

const OPEN_STATUSES = ["accepted", "pending", "confirmed"];

function sentKinds(raw: Record<string, unknown> | null): Set<MeetingMsgKind> {
  const msgs = (raw?.msgs ?? {}) as Record<string, unknown>;
  const out = new Set<MeetingMsgKind>();
  for (const k of MEETING_MSG_KINDS) if (msgs[k]) out.add(k);
  return out;
}

export async function loadMeetingMessages(now: Date = new Date(), daysAhead = 8): Promise<MeetingMsgRow[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("bookings")
    .select("id, attendee_name, attendee_email, attendee_phone, scheduled_at, status, meeting_url, raw_payload")
    .in("status", OPEN_STATUSES)
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", new Date(now.getTime() + daysAhead * 86_400_000).toISOString())
    .not("attendee_phone", "is", null)
    .order("scheduled_at", { ascending: true })
    .limit(30);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => {
    const raw = (r.raw_payload ?? null) as Record<string, unknown> | null;
    const notes = String(raw?.notes ?? "");
    const by = /Записа:\s*([^·\n]+)/.exec(notes);
    const sent = sentKinds(raw);
    const whenIso = String(r.scheduled_at);
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
      const msgs = { ...((raw.msgs as Record<string, unknown>) ?? {}), [args.kind]: { at: nowIso, by: args.actor.name } };
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
