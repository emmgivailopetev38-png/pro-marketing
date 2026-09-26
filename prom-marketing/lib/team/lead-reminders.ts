/**
 * Напомнянията за недокоснат лийд.
 *
 * Човекът за срещите получава писмо в мига, в който влезе нов лийд
 * (`notifyTeamNewLead`). Но лийд, който остане без обаждане, изчезва тихо:
 * първият ден на Димитър (16.09.2026) свърши с 11 нови и 2 обаждания.
 * Затова: ако след 45 минути още няма нито едно докосване, идва напомняне;
 * после на 3 часа и на 24 часа. Три пъти и спира — напомняне, което идва
 * безкрайно, се научава да се игнорира.
 *
 * Тук са чистите правила (без база), за да се тестват.
 */
import { TZ } from "@/lib/contacts/followup";

/** Нивата на напомняне: минути от създаването на лийда. */
export const REMINDER_LEVELS = [
  { level: 1, afterMinutes: 45, label: "чака от 45 минути" },
  { level: 2, afterMinutes: 3 * 60, label: "чака от 3 часа" },
  { level: 3, afterMinutes: 24 * 60, label: "чака от вчера" },
] as const;

/** По-стар от това вече не е „нов лийд“ — влиза в общата опашка, не в напомняне. */
export const MAX_AGE_MINUTES = 48 * 60;

/** Тихите часове: нищо не тръгва преди 8 и след 21 софийско време. */
export const QUIET_BEFORE_HOUR = 8;
export const QUIET_AFTER_HOUR = 21;

export function sofiaHour(at: Date, tz: string = TZ): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(at)
  );
}

export function withinWorkingHours(at: Date, tz: string = TZ): boolean {
  const h = sofiaHour(at, tz);
  return h >= QUIET_BEFORE_HOUR && h < QUIET_AFTER_HOUR;
}

/** Най-високото ниво, което вече е заслужено на тази възраст; null = още рано. */
export function levelForAge(ageMinutes: number): number | null {
  let out: number | null = null;
  for (const l of REMINDER_LEVELS) if (ageMinutes >= l.afterMinutes) out = l.level;
  return out;
}

export function levelLabel(level: number): string {
  return REMINDER_LEVELS.find((l) => l.level === level)?.label ?? "чака";
}

export interface ReminderCandidate {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  business: string | null;
  source: string;
  created_at: string;
  /** при кого е влязъл по ротацията — напомнянето отива при него */
  routed_to?: string | null;
}

export interface DueReminder {
  contact: ReminderCandidate;
  level: number;
  ageMinutes: number;
}

/** Ключът, по който напомнянето не се праща два пъти. */
export function reminderKey(contactId: string, level: number): string {
  return `lead_reminder:${contactId}:${level}`;
}

/**
 * Кои напомняния са дължими сега.
 *
 * `alreadySent` са ключовете от `automation_events`. Праща се само НАЙ-ВИСОКОТО
 * заслужено ниво: ако лийд е седял цяла нощ и сутринта е на 14 часа, той не
 * получава три писма едно след друго, а едно — „чака от 3 часа“, и по-късно
 * „чака от вчера“.
 */
export function dueReminders(
  candidates: ReminderCandidate[],
  alreadySent: Set<string>,
  now: Date = new Date()
): DueReminder[] {
  const out: DueReminder[] = [];
  for (const c of candidates) {
    const ageMinutes = Math.floor((now.getTime() - new Date(c.created_at).getTime()) / 60_000);
    if (ageMinutes < 0 || ageMinutes > MAX_AGE_MINUTES) continue;
    const level = levelForAge(ageMinutes);
    if (level === null) continue;
    if (alreadySent.has(reminderKey(c.id, level))) continue;
    out.push({ contact: c, level, ageMinutes });
  }
  return out.sort((a, b) => b.ageMinutes - a.ageMinutes);
}
