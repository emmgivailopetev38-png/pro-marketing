/**
 * Телефонните срещи (без `meeting_url`) — чиста логика, без база.
 *
 * Одитът от 24.10.2026: срещите по телефона оставаха „accepted" завинаги —
 * проверката на календара затваряше само онлайн срещите. Правилото: 2 часа
 * след края ѝ, има ли в картона обаждане/среща от час преди началото
 * нататък → `completed`; няма ли → остава `accepted`, а контактът получава
 * „да се обади" + напомняне за следващата работна сутрин и бележка
 * „📞 Телефонна среща без следа — провери" (веднъж, с dedupe_key).
 */
import { isLiveBooking } from "./booking-status";

export const DEFAULT_DURATION_MIN = 45;
export const SETTLE_AFTER_MS = 2 * 3_600_000;
export const TRACE_BEFORE_MS = 1 * 3_600_000;
/** По-стари срещи не се пипат — те са за ръчно решение в /admin/bookings. */
export const LOOKBACK_MS = 30 * 24 * 3_600_000;

export interface PhoneBookingLike {
  id: string;
  status: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  meeting_url: string | null;
}

export interface TraceLike {
  activity_type: string;
  occurred_at: string;
}

export function isPhoneBooking(b: PhoneBookingLike): boolean {
  return isLiveBooking(b.status) && !(b.meeting_url ?? "").trim();
}

export function bookingEnd(b: PhoneBookingLike): Date {
  const mins = b.duration_minutes && b.duration_minutes > 0 ? b.duration_minutes : DEFAULT_DURATION_MIN;
  return new Date(new Date(b.scheduled_at).getTime() + mins * 60_000);
}

/** Минали ли са 2 ч от края ѝ, и не е ли прекалено стара. */
export function isSettleDue(b: PhoneBookingLike, now: Date = new Date()): boolean {
  const start = new Date(b.scheduled_at).getTime();
  if (!Number.isFinite(start) || start < now.getTime() - LOOKBACK_MS) return false;
  return now.getTime() >= bookingEnd(b).getTime() + SETTLE_AFTER_MS;
}

/** Обаждане или среща в картона от час преди началото до сега. */
export function hasTrace(acts: TraceLike[], b: PhoneBookingLike, now: Date = new Date()): boolean {
  const from = new Date(b.scheduled_at).getTime() - TRACE_BEFORE_MS;
  return acts.some((a) => {
    if (a.activity_type !== "call" && a.activity_type !== "meeting") return false;
    const t = new Date(a.occurred_at).getTime();
    return Number.isFinite(t) && t >= from && t <= now.getTime();
  });
}

export type PhoneBookingDecision = "completed" | "unclear" | "skip";

export function decidePhoneBooking(b: PhoneBookingLike, acts: TraceLike[], now: Date = new Date()): PhoneBookingDecision {
  if (!isPhoneBooking(b) || !isSettleDue(b, now)) return "skip";
  return hasTrace(acts, b, now) ? "completed" : "unclear";
}

export function phoneBookingKey(bookingId: string, kind: "completed" | "check"): string {
  return `phone-booking:${bookingId}:${kind}`;
}
