import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";
import {
  isLiveBooking,
  pickBookingAt,
  sameInstant,
  stampMsgsForMove,
  type BookingLite,
} from "@/lib/crm/booking-status";
import type { Person } from "@/lib/team/sreshti-zastapvane";

/**
 * Отмяна и преместване, дошли от Cal.com, върху ИСТИНСКИЯ ред в CRM-а.
 *
 * Срещата в CRM-а не винаги е под ключа на Cal.com: срещите през сайта влизат
 * и от синхрона на календара под „manual:<час>:<имейл>“, а записаните от екипа
 * пазят uid-а в `raw_payload.cal_uid`. Досега webhook-ът правеше нов ред по
 * uid-а — отменената среща оставаше жива под другия ключ и напомнянията към
 * човека продължаваха; преместената ставаше втори ред със статус, който
 * напомнянията не познават. Тук редът се търси по uid, после по човек + час.
 */

type Sb = ReturnType<typeof createServiceClient>;

const COLS = "id, cal_booking_id, status, scheduled_at, attendee_email, attendee_phone, meeting_url, raw_payload";
const WINDOW_MS = 5 * 60_000;

type Row = BookingLite & {
  cal_booking_id: string | null;
  meeting_url: string | null;
  raw_payload: Record<string, unknown> | null;
};

/** По uid-а на Cal.com: ключът на реда или uid-ът, записан при създаване от екипа / гласовия агент. */
async function byUid(sb: Sb, uid: string | null | undefined): Promise<Row | null> {
  const u = uid?.trim();
  if (!u) return null;
  const { data: a } = await sb.from("bookings").select(COLS).eq("cal_booking_id", u).maybeSingle();
  if (a) return a as Row;
  const { data: b } = await sb.from("bookings").select(COLS).eq("raw_payload->>cal_uid", u).limit(1);
  return ((b ?? [])[0] as Row | undefined) ?? null;
}

/** По човек (истински имейл или телефон) и час ± 5 мин. */
async function byPersonAt(sb: Sb, startIso: string | null | undefined, who: Person): Promise<Row | null> {
  if (!startIso) return null;
  const t = new Date(startIso).getTime();
  if (!Number.isFinite(t)) return null;
  const { data } = await sb
    .from("bookings")
    .select(COLS)
    .gte("scheduled_at", new Date(t - WINDOW_MS).toISOString())
    .lte("scheduled_at", new Date(t + WINDOW_MS).toISOString())
    .limit(50);
  return pickBookingAt((data ?? []) as Row[], startIso, who);
}

/** Нашите ключове в raw_payload (кой записа, бележката, пратените напомняния) остават; Cal.com добавя своите. */
function mergeRaw(existing: Record<string, unknown> | null, calData: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return { ...(existing ?? {}), ...calData, ...extra };
}

export interface CalChangeResult {
  /** намерен ли е ред в CRM-а; ако не — webhook-ът прави нов по uid-а, както досега */
  matched: boolean;
  id: string | null;
  /** беше ли срещата жива преди събитието — само тогава тръгва „отказаха срещата“ */
  wasLive: boolean;
  /** при преместване: старият час */
  fromIso: string | null;
  error: string | null;
}

/**
 * BOOKING_CANCELLED: живата среща става `cancelled` — напомнянията спират сами.
 * Вече решена (проведена, „не се яви“, отменена или преместена) не се пипа,
 * само се отбелязва какво е дошло — за да не тръгнат известия втори път.
 */
export async function applyCalCancel(
  sb: Sb,
  a: { uid: string; startIso: string; who: Person; calData: Record<string, unknown>; reason: string | null }
): Promise<CalChangeResult> {
  const found = (await byUid(sb, a.uid)) ?? (await byPersonAt(sb, a.startIso, a.who));
  if (!found) return { matched: false, id: null, wasLive: true, fromIso: null, error: null };
  const wasLive = isLiveBooking(found.status);
  const nowIso = new Date().toISOString();
  const { error } = await sb
    .from("bookings")
    .update({
      ...(wasLive ? { status: "cancelled" } : {}),
      raw_payload: mergeRaw(found.raw_payload, a.calData, { cal_cancel: { on: nowIso, reason: a.reason } }),
      updated_at: nowIso,
    })
    .eq("id", found.id);
  return { matched: true, id: found.id, wasLive, fromIso: null, error: error?.message ?? null };
}

/**
 * BOOKING_RESCHEDULED: срещата се мести НА МЯСТО — същият ред, новият час.
 * Така остават кой я е записал, бележката и историята; пратените напомняния
 * получават стария час и „ден преди“ / „малко преди“ излизат пак за новия.
 * Ако по грешка има и ред за новия uid, и стар ред — старият се затваря.
 */
export async function applyCalReschedule(
  sb: Sb,
  a: {
    uid: string;
    oldUid: string | null;
    oldStartIso: string | null;
    startIso: string;
    durationMinutes: number;
    meetingUrl: string | null;
    who: Person;
    calData: Record<string, unknown>;
  }
): Promise<CalChangeResult> {
  const current = await byUid(sb, a.uid);
  const old = (a.oldUid ? await byUid(sb, a.oldUid) : null) ?? (await byPersonAt(sb, a.oldStartIso, a.who));
  const target = current ?? old;
  if (!target) return { matched: false, id: null, wasLive: false, fromIso: null, error: null };

  const nowIso = new Date().toISOString();
  const fromIso = target.scheduled_at;
  const moved = !sameInstant(fromIso, a.startIso);
  const raw = mergeRaw(moved ? stampMsgsForMove(target.raw_payload ?? {}, fromIso) : target.raw_payload, a.calData, {
    cal_uid: a.uid,
    ...(moved ? { moved_from: { at: fromIso, uid: a.oldUid, via: "cal.com", on: nowIso } } : {}),
  });
  const { error } = await sb
    .from("bookings")
    .update({
      scheduled_at: new Date(a.startIso).toISOString(),
      duration_minutes: a.durationMinutes,
      status: isLiveBooking(target.status) ? target.status : "accepted",
      meeting_url: a.meetingUrl ?? target.meeting_url,
      raw_payload: raw,
      updated_at: nowIso,
    })
    .eq("id", target.id);
  if (error) return { matched: true, id: target.id, wasLive: isLiveBooking(target.status), fromIso: null, error: error.message };

  if (current && old && old.id !== current.id && isLiveBooking(old.status)) {
    await sb
      .from("bookings")
      .update({
        status: "cancelled",
        raw_payload: { ...(old.raw_payload ?? {}), moved_to: { booking_id: current.id, at: a.startIso, by: "Cal.com", on: nowIso } },
        updated_at: nowIso,
      })
      .eq("id", old.id);
  }
  return { matched: true, id: target.id, wasLive: isLiveBooking(target.status), fromIso: moved ? fromIso : null, error: null };
}
