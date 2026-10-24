/**
 * Напомнянията за пратена оферта — чиста логика, без база.
 *
 * Одитът от 24.10.2026: напомнянето идваше чак на 7-ия ден. Сега първото е на
 * 3-ия, второто на 7-ия: бележка в картона + „да се обади" + напомняне за
 * следващата работна сутрин в 10:00 София, ако няма по-ранна бъдеща дата.
 * Dedupe по контакт, ден на офертата и праг. Нищо към клиента.
 */
import { dayKey, nextWorkingDayAt, TZ } from "@/lib/contacts/followup";

export const OFFER_REMINDER_DAYS = [3, 7] as const;
export type OfferReminderDay = (typeof OFFER_REMINDER_DAYS)[number];

/** Дни между два календарни дни („2026-10-10" → „2026-10-24" = 14). */
export function daysBetweenDays(fromDay: string, toDay: string): number {
  const [fy, fm, fd] = fromDay.split("-").map(Number);
  const [ty, tm, td] = toDay.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** 3 или 7, ако офертата е пратена точно преди толкова календарни дни; иначе null. */
export function offerReminderDay(sentAt: string | Date, now: Date = new Date()): OfferReminderDay | null {
  const d = daysBetweenDays(dayKey(sentAt), dayKey(now));
  return (OFFER_REMINDER_DAYS as readonly number[]).includes(d) ? (d as OfferReminderDay) : null;
}

export function offerReminderKey(contactId: string, sentAt: string | Date, day: OfferReminderDay): string {
  return `offer-reminder:${contactId}:${dayKey(sentAt)}:${day}`;
}

function sofiaHour(at: Date, tz: string = TZ): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(at));
}

function sofiaWeekday(at: Date, tz: string = TZ): number {
  const w = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(at);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(w);
}

/**
 * Следващата работна сутрин в 10:00 София: днес, ако е работен ден и още не е
 * 10:00 (сутрешният крон върви в 08:00); иначе следващият работен ден.
 */
export function nextWorkingMorning(now: Date = new Date(), hour = 10, tz: string = TZ): Date {
  const wd = sofiaWeekday(now, tz);
  if (wd >= 1 && wd <= 5 && sofiaHour(now, tz) < hour) {
    // nextWorkingDayAt дава утре; връщаме се един ден назад — същият работен ден.
    const yesterday = new Date(now.getTime() - 86_400_000);
    const today = nextWorkingDayAt(yesterday, hour, tz);
    if (dayKey(today, tz) === dayKey(now, tz) && today.getTime() > now.getTime()) return today;
  }
  return nextWorkingDayAt(now, hour, tz);
}

/**
 * Кога да е напомнянето: следващата работна сутрин, освен ако картонът вече
 * има по-ранна БЪДЕЩА дата — тогава null (не се пипа).
 */
export function planFollowupAt(existingNext: string | null | undefined, now: Date = new Date()): string | null {
  const candidate = nextWorkingMorning(now);
  if (existingNext) {
    const ex = new Date(existingNext);
    if (!Number.isNaN(ex.getTime()) && ex.getTime() > now.getTime() && ex.getTime() <= candidate.getTime()) return null;
  }
  return candidate.toISOString();
}

export interface OfferSignal {
  contact_id: string;
  sent_at: string;
  /** Откъде е сигналът — за бележката. */
  label: string;
}

/**
 * По един сигнал на контакт (най-новият с праг 3 или 7), без вече напомнените.
 */
export function planOfferReminders(
  signals: OfferSignal[],
  existingKeys: Set<string>,
  now: Date = new Date()
): Array<OfferSignal & { day: OfferReminderDay; dedupe_key: string }> {
  const byContact = new Map<string, OfferSignal & { day: OfferReminderDay; dedupe_key: string }>();
  for (const s of [...signals].sort((a, b) => b.sent_at.localeCompare(a.sent_at))) {
    const day = offerReminderDay(s.sent_at, now);
    if (!day) continue;
    const key = offerReminderKey(s.contact_id, s.sent_at, day);
    if (existingKeys.has(key)) continue;
    if (!byContact.has(s.contact_id)) byContact.set(s.contact_id, { ...s, day, dedupe_key: key });
  }
  return [...byContact.values()];
}
