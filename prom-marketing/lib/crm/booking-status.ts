/**
 * Кога една среща е „жива“ и за кой час важат пратените напомняния.
 *
 * До 01.10.2026 напомнянията в /ekip („💜 Съобщения за срещите“) объркваха
 * отменените и преместените срещи по три начина:
 *   1. преместена среща пазеше маркерите „пратено“ от стария час — за новия
 *      час напомняне не излизаше (Фани: напомнена за 29.09, срещата стана 30.09);
 *   2. нов час, записан от картата, правеше втора среща, а старата си оставаше
 *      жива — напомнянето за стария час продължаваше;
 *   3. отказ през Cal.com не стигаше до CRM-а (webhook-ът падаше на схемата).
 *
 * Тук са чистите правила — без база, тестват се. Ползват ги напомнянията,
 * местенето на час (`updateBooking`) и webhook-ът на Cal.com.
 */
import { samePerson, type Person } from "@/lib/team/sreshti-zastapvane";

/**
 * Статусите, при които срещата предстои и за нея има напомняния. Всичко друго
 * (cancelled · rejected · no_show · completed) е решено. Преместената среща
 * получава `cancelled` + `raw_payload.moved_to` — както прави и Cal.com
 * (CANCELLED + rescheduled), за да я изключат сами всички места, които вече
 * пропускат отменените (таблото, отчетът, порталът, гласовият агент).
 */
export const LIVE_BOOKING_STATUSES = ["accepted", "pending", "confirmed"] as const;

export function isLiveBooking(status: string | null | undefined): boolean {
  return (LIVE_BOOKING_STATUSES as readonly string[]).includes(String(status ?? ""));
}

const MIN = 60_000;

/** Един и същ момент — до минута разлика (Cal.com пише „…:00Z“, базата „…:00+00“). */
export function sameInstant(a: string | Date, b: string | Date, toleranceMs: number = MIN): boolean {
  const x = new Date(a).getTime();
  const y = new Date(b).getTime();
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= toleranceMs;
}

/** Маркерът „пратено“ в `bookings.raw_payload.msgs[kind]`; `for` = часът на срещата, за който е пратено. */
export interface SentMark {
  at: string;
  by: string | null;
  for?: string | null;
}

/**
 * Важи ли пратеното съобщение за срещата в този час. Маркер без `for` е
 * отпреди 01.10.2026 — смята се за верен, докато срещата не се премести
 * (тогава `stampMsgsForMove` му записва стария час и той спира да важи).
 */
export function markValidFor(mark: unknown, scheduledIso: string): boolean {
  if (!mark || typeof mark !== "object") return false;
  const forIso = (mark as Record<string, unknown>).for;
  if (typeof forIso !== "string" || !forIso) return true;
  return sameInstant(forIso, scheduledIso);
}

/**
 * Срещата се мести от `oldIso`: маркерите без час получават стария час. Така
 * „ден преди“ и „малко преди“ излизат пак — за новия час, а историята кое
 * кога е пратено остава в базата. Връща същия обект, ако няма какво да се пипа.
 */
export function stampMsgsForMove(raw: Record<string, unknown>, oldIso: string): Record<string, unknown> {
  const msgs = raw.msgs;
  if (!msgs || typeof msgs !== "object" || Array.isArray(msgs)) return raw;
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [kind, mark] of Object.entries(msgs as Record<string, unknown>)) {
    if (mark && typeof mark === "object" && !(mark as Record<string, unknown>).for) {
      next[kind] = { ...(mark as Record<string, unknown>), for: oldIso };
      changed = true;
    } else {
      next[kind] = mark;
    }
  }
  return changed ? { ...raw, msgs: next } : raw;
}

export interface BookingLite {
  id: string;
  status: string | null;
  scheduled_at: string;
  attendee_email: string | null;
  attendee_phone: string | null;
}

function personOf(b: BookingLite): Person {
  return { email: b.attendee_email, phone: b.attendee_phone };
}

/**
 * Редът в CRM-а за среща от Cal.com, когато ключът не съвпада — срещите през
 * сайта влизат и от синхрона на календара под „manual:…“. Същият човек
 * (истински имейл или телефон), същият час (± 5 мин). Живата има предимство.
 */
export function pickBookingAt<T extends BookingLite>(rows: T[], startIso: string, who: Person): T | null {
  const hits = rows.filter((r) => sameInstant(r.scheduled_at, startIso, 5 * MIN) && samePerson(who, personOf(r)));
  return hits.find((r) => isLiveBooking(r.status)) ?? hits[0] ?? null;
}

/**
 * Предстоящите живи срещи на същия човек, без `keepId`. Нов час, записан от
 * картата, значи „преместихме срещата“ — старите спират сами, вместо да чакат
 * някой да се сети. Минала среща не се пипа: тя е за „проведена / не се яви“.
 */
export function upcomingOfPerson<T extends BookingLite>(rows: T[], who: Person, now: Date, keepId?: string | null): T[] {
  return rows
    .filter(
      (r) =>
        r.id !== keepId &&
        isLiveBooking(r.status) &&
        new Date(r.scheduled_at).getTime() > now.getTime() &&
        samePerson(who, personOf(r))
    )
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}
