/**
 * Записите от срещите (10.11.2026) — базата: кои срещи на продавача чакат линк от записа,
 * запазване на линка (среща + картон + задачата се затваря), напомнянията и задачите в /ekip.
 * Правилата (кога, колко често, кой линк е валиден) са в zapisi-rules.ts.
 */
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { createTask, setTaskStatus } from "@/lib/team/tasks";
import { dayPlus } from "@/lib/team/tasks-rules";
import { fmtSofia } from "@/lib/team/time";
import { DAYS_BACK, cleanRecordingUrl, dueForReminder, needsRecording, reminderText, taskMark, type ZapisBooking } from "./zapisi-rules";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");
const BOOKING_COLS =
  "id, attendee_name, attendee_email, attendee_phone, scheduled_at, duration_minutes, status, recording_url, recording_added_at, recording_reminders, recording_reminded_at";

export interface ZapisMeeting extends ZapisBooking {
  name: string;
  when: string;
  contact_id: string | null;
  recording_added_at?: string | null;
}

type Row = ZapisBooking & {
  attendee_name: string;
  attendee_email: string | null;
  attendee_phone: string | null;
  recording_added_at: string | null;
};

const phone9 = (p: string | null | undefined) => (p ?? "").replace(/\D/g, "").slice(-9);

/** Срещите на продавача (картоните с owner = той) от последните 7 дни до сега — с и без запис. */
export async function memberMeetings(memberId: string, now: Date = new Date()): Promise<ZapisMeeting[]> {
  const sb = createServiceClient();
  const { data: cs } = await sb.from("contacts").select("id, email, phone").eq("owner_id", memberId).limit(2000);
  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  for (const c of (cs ?? []) as Array<{ id: string; email: string | null; phone: string | null }>) {
    if (c.email) byEmail.set(c.email.toLowerCase(), c.id);
    if (c.phone && phone9(c.phone)) byPhone.set(phone9(c.phone), c.id);
  }
  const { data } = await sb
    .from("bookings")
    .select(BOOKING_COLS)
    .gte("scheduled_at", new Date(now.getTime() - DAYS_BACK * 86_400_000).toISOString())
    .lte("scheduled_at", now.toISOString())
    .not("status", "in", "(cancelled,rejected)")
    .order("scheduled_at", { ascending: false })
    .limit(200);
  const out: ZapisMeeting[] = [];
  for (const b of (data ?? []) as Row[]) {
    const cid = (b.attendee_email && byEmail.get(b.attendee_email.toLowerCase())) || (b.attendee_phone && byPhone.get(phone9(b.attendee_phone))) || null;
    if (!cid) continue;
    out.push({ ...b, name: b.attendee_name, when: fmtSofia(b.scheduled_at), contact_id: cid });
  }
  return out;
}

/** Линкът влиза: в срещата, в историята на картона, и задачата „🎥 Линк от записа“ се отмята. */
export async function saveRecording(args: {
  bookingId: string;
  url: string;
  by: string;
  /** член на екипа → само срещи на негови картони */
  memberId?: string | null;
}): Promise<{ ok: boolean; error?: string; contact_id?: string | null; url?: string }> {
  const url = cleanRecordingUrl(args.url);
  if (!url) return { ok: false, error: "Това не е линк — трябва да почва с https://" };
  const sb = createServiceClient();
  const { data: b } = await sb.from("bookings").select(BOOKING_COLS).eq("id", args.bookingId).maybeSingle();
  if (!b) return { ok: false, error: "Срещата не е намерена." };
  const row = b as Row;

  // кой е човекът — по имейл/телефон, както навсякъде в /ekip
  let contactId: string | null = null;
  if (row.attendee_email) {
    const { data: c } = await sb.from("contacts").select("id, owner_id").ilike("email", row.attendee_email).limit(1).maybeSingle();
    if (c) contactId = (c as { id: string }).id;
  }
  if (!contactId && phone9(row.attendee_phone)) {
    const { data: c } = await sb.from("contacts").select("id, owner_id").ilike("phone", `%${phone9(row.attendee_phone)}`).limit(1).maybeSingle();
    if (c) contactId = (c as { id: string }).id;
  }
  if (args.memberId) {
    const { data: c } = contactId ? await sb.from("contacts").select("owner_id").eq("id", contactId).maybeSingle() : { data: null };
    if (!contactId || (c as { owner_id?: string | null } | null)?.owner_id !== args.memberId) {
      return { ok: false, error: "Тази среща не е на твой картон." };
    }
  }

  const nowIso = new Date().toISOString();
  const { error } = await sb
    .from("bookings")
    .update({ recording_url: url, recording_added_at: nowIso, recording_added_by: args.by })
    .eq("id", args.bookingId);
  if (error) return { ok: false, error: error.message };

  if (contactId) {
    await sb.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: "meeting_recording",
      title: `🎥 Запис от срещата · ${fmtSofia(row.scheduled_at)}`,
      body: url,
      occurred_at: nowIso,
      created_by: args.by,
      metadata: { booking_id: args.bookingId, recording_url: url },
    });
  }
  // задачата „🎥 Линк от записа“ за тази среща → отметната
  const { data: tasks } = await sb
    .from("project_tasks")
    .select("id")
    .ilike("description", `%${taskMark(args.bookingId)}%`)
    .neq("status", "done");
  for (const t of (tasks ?? []) as Array<{ id: string }>) {
    await setTaskStatus({ id: t.id, status: "done", actor: args.by, actorMemberId: args.memberId ?? null }).catch(() => null);
  }
  return { ok: true, contact_id: contactId, url };
}

/**
 * Напомнянето (вика се на всеки 30 мин от асистента на продавача): за всяка минала среща без запис
 * има задача в /ekip → Задачи; на които е дошло време — текст за Telegram и отбелязване „напомнено“.
 */
export async function remindRecordings(memberId: string, now: Date = new Date()): Promise<{
  missing: ZapisMeeting[];
  due: ZapisMeeting[];
  tasks_created: number;
  text: string;
}> {
  const sb = createServiceClient();
  const all = await memberMeetings(memberId, now);
  const missing = all.filter((m) => needsRecording(m, now));
  let created = 0;
  for (const m of missing) {
    const mark = taskMark(m.id);
    const { data: ex } = await sb.from("project_tasks").select("id").ilike("description", `%${mark}%`).limit(1);
    if ((ex ?? []).length > 0) continue;
    const r = await createTask({
      title: `🎥 Линк от записа — ${m.name} (${m.when})`,
      description: `Добави линка от записа на срещата (Fathom / Meet / Drive), за да я анализираме: ${SITE}/ekip/prodazhbi → „🎥 Запис“, или го прати на асистента в Telegram. ${mark}`,
      due_date: dayPlus(now, 0),
      priority: "high",
      assignee_id: memberId,
      contact_id: m.contact_id,
      created_by: "система · записи от срещите",
    });
    if (r.id) created++;
  }
  const due = missing.filter((m) => dueForReminder(m, now));
  for (const m of due) {
    await sb
      .from("bookings")
      .update({ recording_reminders: (m.recording_reminders ?? 0) + 1, recording_reminded_at: now.toISOString() })
      .eq("id", m.id);
  }
  const text = reminderText(
    due.map((m) => ({ name: m.name, when: m.when, reminders: m.recording_reminders ?? 0 })),
    SITE
  );
  return { missing, due, tasks_created: created, text };
}
