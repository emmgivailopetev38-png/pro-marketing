/**
 * Записите от срещите — чистите правила (10.11.2026).
 * Ивайло: „Георги след всеки разговор да добавя линковете от записаните срещи, за да ги анализираме после —
 * бутон, място, напомняне след всяка среща и задача в системата.“
 * Без база и без мрежа — тестват се (zapisi-rules.test.ts).
 */

/** Срещата по подразбиране е 45 минути (sreshti-45-minuti). */
export const DEFAULT_MEETING_MIN = 45;
/** Първото напомняне — 10 минути след края на срещата. */
export const FIRST_REMINDER_AFTER_MIN = 10;
/** После — на всеки 3 часа, докато линкът не влезе. */
export const REMIND_EVERY_MIN = 180;
/** Колко назад гледаме (по-старите вече не се гонят). */
export const DAYS_BACK = 7;
/** Напомняме само в будни часове (софийско време). */
export const REMIND_FROM_HOUR = 9;
export const REMIND_TO_HOUR = 21;

const DONE = new Set(["cancelled", "rejected", "no_show"]);

export interface ZapisBooking {
  id: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  status: string | null;
  recording_url?: string | null;
  recording_reminders?: number | null;
  recording_reminded_at?: string | null;
}

/** Маркерът в описанието на задачата — по него задачата се намира и се затваря, когато линкът влезе. */
export function taskMark(bookingId: string): string {
  return `[zapis:${bookingId}]`;
}

/** Линкът към записа: само http(s), без интервали, до 1000 знака; режат се точка/запетая накрая. */
export function cleanRecordingUrl(raw: unknown): string | null {
  const s = String(raw ?? "")
    .trim()
    .replace(/[)\].,;!?“”"'»]+$/u, "");
  if (!/^https?:\/\/[^\s]+$/i.test(s) || s.length > 1000) return null;
  try {
    const u = new URL(s);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function meetingEnd(b: Pick<ZapisBooking, "scheduled_at" | "duration_minutes">): Date {
  const min = b.duration_minutes && b.duration_minutes > 0 ? b.duration_minutes : DEFAULT_MEETING_MIN;
  return new Date(new Date(b.scheduled_at).getTime() + min * 60_000);
}

/** Срещата е минала (поне 10 мин след края), не е отменена/неявила се, в последните 7 дни и няма запис. */
export function needsRecording(b: ZapisBooking, now: Date = new Date()): boolean {
  if (b.recording_url) return false;
  if (DONE.has(String(b.status ?? ""))) return false;
  const start = new Date(b.scheduled_at).getTime();
  if (Number.isNaN(start) || start < now.getTime() - DAYS_BACK * 86_400_000) return false;
  return meetingEnd(b).getTime() + FIRST_REMINDER_AFTER_MIN * 60_000 <= now.getTime();
}

export function sofiaHour(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", hour: "2-digit", hour12: false }).format(now)) % 24;
}

/** Време ли е за напомняне: липсва запис + будни часове + не е напомняно последните 3 часа. */
export function dueForReminder(b: ZapisBooking, now: Date = new Date()): boolean {
  if (!needsRecording(b, now)) return false;
  const h = sofiaHour(now);
  if (h < REMIND_FROM_HOUR || h >= REMIND_TO_HOUR) return false;
  if (!b.recording_reminded_at) return true;
  return now.getTime() - new Date(b.recording_reminded_at).getTime() >= REMIND_EVERY_MIN * 60_000;
}

/** Текстът на напомнянето (Telegram) — кратко, с линк към мястото в /ekip. */
export function reminderText(items: Array<{ name: string; when: string; reminders: number }>, site: string): string {
  if (items.length === 0) return "";
  const lines = items.map((i) => `• ${i.name} — ${i.when}${i.reminders >= 2 ? " (пак напомням)" : ""}`);
  const one = items.length === 1;
  return [
    one ? "🎥 Срещата свърши — липсва линкът от записа:" : `🎥 ${items.length} срещи без линк от записа:`,
    ...lines,
    "",
    "Прати ми линка тук (Fathom / Meet / Drive) и го записвам, или натисни „🎥 Запис“ в " + `${site}/ekip/prodazhbi` + ".",
    "Не се е състояла? Там натисни „🙈 Не се яви“ — и спирам да питам.",
  ].join("\n");
}
