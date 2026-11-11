import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { buildInviteIcs, googleCalendarTemplateUrl, type IcsMethod, type IcsPerson } from "@/lib/cal/ics";
import { escapeHtml } from "@/lib/email/escape";
import { activeCloser } from "./closer";
import { fmtSofia } from "./time";
import {
  CLOSER_MEETING_MINUTES,
  inviteUid,
  nextInviteStep,
  phoneKey,
  readInviteState,
  realEmail,
  type CloserInviteState,
} from "./closer-calendar-rules";

/**
 * Срещата → календара на клоузъра, без Cal.com (правилата и защо: closer-calendar-rules.ts).
 *
 * Праща се покана по имейл (.ics); пощата на получателя я слага в календара му.
 * Никога не хвърля — записването на срещата не бива да пада заради покана.
 */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");

/** Постоянният Meet линк на клоузъра (той е домакин) — същият, който стои и в Cal.com. */
export function closerMeetUrl(): string | null {
  const v = (process.env.CLOSER_MEET_URL ?? "").trim();
  return /^https:\/\/\S+$/.test(v) ? v : null;
}

/**
 * Организаторът в поканата е подателят на писмото: при друг адрес пощата на
 * получателя я брои за чужда и не я слага сама в календара.
 */
export function inviteOrganizer(): IcsPerson {
  const from = (process.env.EMAIL_FROM ?? "").trim();
  const m = /^(.*?)<([^>]+)>$/.exec(from);
  const email = (m ? m[2] : from).trim().toLowerCase();
  const name = (m ? m[1] : "").replace(/"/g, "").trim() || "ProMarketing";
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? { name, email } : { name: "ProMarketing", email: "ivailo@promarketing.pw" };
}

interface BookingRow {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  scheduled_at: string;
  status: string | null;
  business: string | null;
  meeting_url: string | null;
  raw_payload: Record<string, unknown> | null;
}

const BOOKING_COLS = "id, attendee_name, attendee_email, attendee_phone, scheduled_at, status, business, meeting_url, raw_payload";

async function loadBooking(id: string): Promise<BookingRow | null> {
  const sb = createServiceClient();
  const { data } = await sb.from("bookings").select(BOOKING_COLS).eq("id", id).maybeSingle();
  return (data as BookingRow | null) ?? null;
}

async function saveState(b: BookingRow, state: CloserInviteState): Promise<void> {
  const sb = createServiceClient();
  // Прясно четене: между зареждането и записа друг може да е добавил свое в raw_payload.
  const { data } = await sb.from("bookings").select("raw_payload").eq("id", b.id).maybeSingle();
  const raw = ((data?.raw_payload ?? b.raw_payload ?? {}) as Record<string, unknown>) ?? {};
  await sb.from("bookings").update({ raw_payload: { ...raw, closer_invite: state } }).eq("id", b.id);
}

function noteOf(b: BookingRow): string {
  return String((b.raw_payload ?? {}).notes ?? "").trim();
}

function describe(b: BookingRow, startIso: string, why: string | null) {
  const name = (b.attendee_name ?? "").trim() || b.attendee_phone || "Без име";
  const business = (b.business ?? "").trim();
  const email = realEmail(b.attendee_email);
  const key = phoneKey(b.attendee_phone);
  const card = key ? `${SITE}/ekip?q=${key}` : `${SITE}/ekip/prodazhbi`;
  const meet = (b.meeting_url ?? "").trim() || closerMeetUrl();
  const note = noteOf(b);
  const when = fmtSofia(startIso);
  const title = `👤 Среща · ${name}${business ? ` (${business})` : ""}`;
  const details = [
    business ? `Дейност: ${business}` : null,
    b.attendee_phone ? `Телефон: ${b.attendee_phone}` : null,
    email ? `Имейл: ${email}` : null,
    note ? `Бележка: ${note}` : null,
    meet ? `Meet: ${meet}` : null,
    `Картон: ${card}`,
    why ? `Не мина през Cal.com: ${why}. Човекът не е получил покана по имейл — прати му линка.` : null,
    "— от CRM-а на ProMarketing",
  ]
    .filter(Boolean)
    .join("\n");
  return { name, business, email, card, meet, note, when, title, details };
}

export interface CloserInviteResult {
  ok: boolean;
  error: string | null;
  to: string | null;
  uid: string | null;
  seq: number | null;
}

const FAIL = (error: string): CloserInviteResult => ({ ok: false, error, to: null, uid: null, seq: null });

async function deliver(args: {
  b: BookingRow;
  method: IcsMethod;
  uid: string;
  seq: number;
  startIso: string;
  to: IcsPerson;
  why: string | null;
  kind: "new" | "moved" | "cancelled";
  test: boolean;
}): Promise<{ id: string | null; error: string | null }> {
  const d = describe(args.b, args.startIso, args.kind === "cancelled" ? null : args.why);
  const ics = buildInviteIcs({
    uid: args.uid,
    sequence: args.seq,
    method: args.method,
    startISO: args.startIso,
    minutes: CLOSER_MEETING_MINUTES,
    summary: d.title,
    description: d.details,
    location: d.meet,
    url: d.card,
    organizer: inviteOrganizer(),
    attendee: args.to,
    alarmMinutes: 15,
  });
  const head = args.kind === "cancelled" ? "❌ Отпадна среща" : args.kind === "moved" ? "🔁 Преместена среща" : "📅 Нова среща";
  const lead =
    args.kind === "cancelled"
      ? "Срещата е отменена или преместена в CRM-а — маха се и от календара ти."
      : args.kind === "moved"
        ? "Срещата е с нов час — календарът ти се обновява сам."
        : "Срещата е записана в CRM-а и влиза в календара ти от тази покана.";
  const add =
    args.kind === "cancelled"
      ? null
      : googleCalendarTemplateUrl({
          startISO: args.startIso,
          minutes: CLOSER_MEETING_MINUTES,
          title: d.title,
          details: d.details,
          location: d.meet,
        });
  const row = (k: string, v: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#777;vertical-align:top;">${k}</td><td>${v}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>${head} · ${escapeHtml(d.name)} · ${escapeHtml(d.when)}</strong></p>
<p>${lead}</p>
<table style="border-collapse:collapse;">
${row("Кой:", `<strong>${escapeHtml(d.name)}</strong>${d.business ? ` · ${escapeHtml(d.business)}` : ""}`)}
${row("Кога:", `<strong>${escapeHtml(d.when)}</strong> (София) · ${CLOSER_MEETING_MINUTES} мин`)}
${row("Телефон:", args.b.attendee_phone ? `<a href="tel:${escapeHtml(args.b.attendee_phone)}">${escapeHtml(args.b.attendee_phone)}</a>` : "—")}
${row("Имейл:", d.email ? escapeHtml(d.email) : "—")}
${d.note ? row("Бележка:", escapeHtml(d.note).replace(/\n/g, "<br/>")) : ""}
${d.meet && args.kind !== "cancelled" ? row("Meet:", `<a href="${escapeHtml(d.meet)}">${escapeHtml(d.meet)}</a>`) : ""}
</table>
${
  args.why && args.kind !== "cancelled"
    ? `<p style="margin-top:14px;">⚠️ Cal.com не записа този час (${escapeHtml(args.why)}), затова <strong>човекът не е получил покана по имейл</strong> — прати му Meet линка с готовото съобщение от „Съобщения за срещите“.</p>`
    : ""
}
<p style="margin-top:16px;">📇 <a href="${d.card}">Картонът в /ekip</a>${
    add ? ` · ➕ <a href="${escapeHtml(add)}">Добави в Google Календар</a> (ако не я виждаш в календара си)` : ""
  }</p>
${
  args.kind === "cancelled"
    ? ""
    : `<p style="color:#777;font-size:13px;">Само първия път: ако Gmail покаже отгоре „This event isn’t in your calendar yet“, натисни <strong>Add to calendar</strong>. Google иска това веднъж за нов подател — следващите срещи влизат в календара сами.</p>`
}
</div>`;
  const text = [
    `${head} · ${d.name} · ${d.when} (София)`,
    lead,
    d.details,
    add ? `Добави в Google Календар: ${add}` : null,
    add
      ? "Само първия път: ако Gmail покаже „This event isn’t in your calendar yet“, натисни „Add to calendar“ — следващите срещи влизат сами."
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");
  return sendEmail({
    to: args.to.email,
    subject: `${args.test ? "ПРОБА · " : ""}${head} · ${d.name} · ${d.when}`,
    html,
    text,
    attachments: [
      {
        filename: args.method === "CANCEL" ? "otmyana.ics" : "sreshta.ics",
        content: Buffer.from(ics, "utf8").toString("base64"),
        contentType: `text/calendar; charset=utf-8; method=${args.method}`,
      },
    ],
  });
}

/**
 * Праща (или праща наново) поканата за срещата.
 * `recipient` + `test` — проба към друг адрес: не оставя следа в срещата и е с отделен UID.
 */
export async function sendCloserInvite(args: {
  bookingId: string;
  why?: string | null;
  recipient?: IcsPerson | null;
  test?: boolean;
}): Promise<CloserInviteResult> {
  try {
    const b = await loadBooking(args.bookingId);
    if (!b) return FAIL("booking not found");
    const test = !!args.test;
    let to = args.recipient ?? null;
    if (!to) {
      const closer = await activeCloser();
      if (!closer?.email) return FAIL("няма активен клоузър с имейл");
      to = { name: closer.full_name, email: closer.email };
    }
    const prev = test ? null : readInviteState(b.raw_payload);
    const moved = !!prev && !prev.cancelled_at && new Date(prev.start).getTime() !== new Date(b.scheduled_at).getTime();
    const seq = prev ? prev.seq + 1 : 0;
    const why = args.why ?? prev?.why ?? null;
    const uid = prev?.uid ?? inviteUid(b.id, test);
    const r = await deliver({
      b,
      method: "REQUEST",
      uid,
      seq,
      startIso: b.scheduled_at,
      to,
      why,
      kind: moved ? "moved" : "new",
      test,
    });
    if (r.error) return FAIL(r.error);
    if (!test) {
      await saveState(b, {
        uid,
        seq,
        to: to.email,
        start: new Date(b.scheduled_at).toISOString(),
        sent_at: new Date().toISOString(),
        cancelled_at: null,
        why,
      });
    }
    return { ok: true, error: null, to: to.email, uid, seq };
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "unknown");
  }
}

/** Маха срещата от календара на получателя. При проба — отменя пробната покана. */
export async function cancelCloserInvite(args: {
  bookingId: string;
  recipient?: IcsPerson | null;
  test?: boolean;
}): Promise<CloserInviteResult> {
  try {
    const b = await loadBooking(args.bookingId);
    if (!b) return FAIL("booking not found");
    if (args.test) {
      if (!args.recipient) return FAIL("пробата иска получател");
      const uid = inviteUid(b.id, true);
      const r = await deliver({
        b,
        method: "CANCEL",
        uid,
        seq: 1,
        startIso: b.scheduled_at,
        to: args.recipient,
        why: null,
        kind: "cancelled",
        test: true,
      });
      return r.error ? FAIL(r.error) : { ok: true, error: null, to: args.recipient.email, uid, seq: 1 };
    }
    const prev = readInviteState(b.raw_payload);
    if (!prev) return FAIL("няма пратена покана за тази среща");
    if (prev.cancelled_at) return { ok: true, error: null, to: prev.to, uid: prev.uid, seq: prev.seq };
    const seq = prev.seq + 1;
    const r = await deliver({
      b,
      method: "CANCEL",
      uid: prev.uid,
      seq,
      // Отменя се часът, който е в календара му — старият, ако срещата е местена.
      startIso: prev.start,
      to: { name: prev.to, email: prev.to },
      why: null,
      kind: "cancelled",
      test: false,
    });
    if (r.error) return FAIL(r.error);
    await saveState(b, { ...prev, seq, cancelled_at: new Date().toISOString() });
    return { ok: true, error: null, to: prev.to, uid: prev.uid, seq };
  } catch (e) {
    return FAIL(e instanceof Error ? e.message : "unknown");
  }
}

/**
 * След промяна в среща (нов час, отмяна): календарът на клоузъра я следва.
 * Вика се от updateBooking и closeUpcomingMeetings само за срещи с пратена покана.
 */
export async function syncCloserInvite(bookingId: string, now: Date = new Date()): Promise<void> {
  try {
    const b = await loadBooking(bookingId);
    if (!b) return;
    const step = nextInviteStep({ state: readInviteState(b.raw_payload), status: b.status, scheduledIso: b.scheduled_at, now });
    if (step.kind === "cancel") await cancelCloserInvite({ bookingId });
    else if (step.kind === "move") await sendCloserInvite({ bookingId });
  } catch (e) {
    console.error("[closer-calendar] sync:", e instanceof Error ? e.message : e);
  }
}

export interface PendingMirror {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  business: string | null;
  scheduled_at: string;
  minutes: number;
  meeting_url: string | null;
  notes: string | null;
  /** поканата вече е в календара на клоузъра → в общия календар се слага без него като гост */
  invited: string | null;
}

/**
 * Предстоящите срещи, които не са минали през Cal.com и още не са отразени в
 * общия календар „Георги · срещи“. Календарната задача ги слага там като
 * заето време, за да не предложи Cal.com същия час на друг човек.
 */
export async function listPendingMirrors(now: Date = new Date()): Promise<PendingMirror[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("bookings")
    .select(BOOKING_COLS)
    .in("status", ["accepted", "pending", "confirmed"])
    .gt("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(300);
  const rows = (data ?? []) as BookingRow[];
  return rows
    .filter((b) => {
      const raw = b.raw_payload ?? {};
      return !raw.cal_uid && !raw.gcal_event_id && raw.source === "ekip";
    })
    .map((b) => {
      const st = readInviteState(b.raw_payload);
      return {
        id: b.id,
        name: (b.attendee_name ?? "").trim() || "Без име",
        phone: b.attendee_phone,
        email: realEmail(b.attendee_email),
        business: b.business,
        scheduled_at: b.scheduled_at,
        minutes: CLOSER_MEETING_MINUTES,
        meeting_url: b.meeting_url ?? closerMeetUrl(),
        notes: noteOf(b) || null,
        invited: st && !st.cancelled_at ? st.to : null,
      };
    });
}

/** Календарната задача отбелязва, че срещата вече е в общия календар. */
export async function markMirrored(bookingId: string, gcalEventId: string): Promise<{ ok: boolean; error: string | null }> {
  const sb = createServiceClient();
  const { data } = await sb.from("bookings").select("raw_payload").eq("id", bookingId).maybeSingle();
  if (!data) return { ok: false, error: "booking not found" };
  const raw = ((data.raw_payload ?? {}) as Record<string, unknown>) ?? {};
  const { error } = await sb
    .from("bookings")
    .update({ raw_payload: { ...raw, gcal_event_id: gcalEventId, gcal_added_at: new Date().toISOString() } })
    .eq("id", bookingId);
  return { ok: !error, error: error?.message ?? null };
}
