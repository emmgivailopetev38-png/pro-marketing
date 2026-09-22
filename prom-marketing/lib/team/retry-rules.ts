/**
 * „Кога да звънна пак?“ — бързите избори на човека за срещите.
 *
 * Досега „Не вдигна“ значеше едно: след 3 часа (или утре в 10:00). Хората обаче
 * казват „звъннете ми другата седмица“, „в четвъртък“, „след обяд“ — и Димитър
 * трябва да може да го запише с едно докосване, без да рови в календар.
 * Чисти правила, без база — тестват се.
 */
import { TZ, nextWorkingDayAt } from "@/lib/contacts/followup";
import { sofiaLocalToIso } from "./time";

export const RETRY_PRESETS = ["3h", "tomorrow", "3d", "7d", "custom"] as const;
export type RetryPreset = (typeof RETRY_PRESETS)[number];

export const RETRY_PRESET_LABEL: Record<RetryPreset, string> = {
  "3h": "след 3 часа",
  tomorrow: "утре 10:00",
  "3d": "след 3 дни",
  "7d": "след 7 дни",
  custom: "точен час",
};

/** „Говорихме, без среща засега“ — след колко дни да опита пак. */
export const TALKED_AFTER_DAYS = [2, 3, 5, 7, 14] as const;
export const TALKED_DEFAULT_DAYS = 3;

function sofiaParts(at: Date, tz: string = TZ): { weekday: string; hour: number } {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", hourCycle: "h23" })
    .formatToParts(at)
    .reduce<Record<string, string>>((acc, x) => ((acc[x.type] = x.value), acc), {});
  return { weekday: p.weekday, hour: Number(p.hour) };
}

export function isWeekend(at: Date, tz: string = TZ): boolean {
  const w = sofiaParts(at, tz).weekday;
  return w === "Sat" || w === "Sun";
}

/**
 * След N календарни дни в hour:00 София — ако падне в уикенд, първият работен
 * ден след това. „След 7 дни“ = същият ден другата седмица, не „след 7 работни“.
 */
export function daysLaterAt(from: Date, days: number, hour = 10, tz: string = TZ): Date {
  const n = Math.max(1, Math.round(days));
  // nextWorkingDayAt дава „утре или първия работен ден след утре“ — затова
  // тръгваме от деня преди целта.
  return nextWorkingDayAt(new Date(from.getTime() + (n - 1) * 86_400_000), hour, tz);
}

/**
 * „След 3 часа“ по думите на човека — но не и в 22:00. Ако трите часа минат
 * 20:00 или паднат в уикенд, чуването отива на следващата работна сутрин.
 */
export function threeHoursLater(now: Date, tz: string = TZ): Date {
  const candidate = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const { hour } = sofiaParts(candidate, tz);
  if (!isWeekend(candidate, tz) && hour >= 8 && hour < 20) return candidate;
  return nextWorkingDayAt(now, 10, tz);
}

/**
 * Изборът от бутоните → кога. `custom` чете полето с точния час (datetime-local,
 * София); празно или невалидно → null, за да се покаже грешка, не тих default.
 */
export function retryFromPreset(
  preset: string | null | undefined,
  customLocal: string | null | undefined,
  now: Date = new Date(),
  tz: string = TZ
): Date | null {
  switch (preset) {
    case "3h":
      return threeHoursLater(now, tz);
    case "tomorrow":
      return nextWorkingDayAt(now, 10, tz);
    case "3d":
      return daysLaterAt(now, 3, 10, tz);
    case "7d":
      return daysLaterAt(now, 7, 10, tz);
    case "custom": {
      const iso = sofiaLocalToIso(customLocal, tz);
      return iso ? new Date(iso) : null;
    }
    default:
      return null;
  }
}

/** „Говорихме, без среща“: след колко дни (от списъка; друго → 3). */
export function talkedRetryAt(daysRaw: string | number | null | undefined, now: Date = new Date(), tz: string = TZ): Date {
  const n = Number(daysRaw);
  const days = (TALKED_AFTER_DAYS as readonly number[]).includes(n) ? n : TALKED_DEFAULT_DAYS;
  return daysLaterAt(now, days, 10, tz);
}

/**
 * Днес в hour:00, ако е работен ден и часът още не е минал; иначе следващият
 * работен ден. За връщането на картон към Ивайло от сутрешния крон (07:00):
 * да излезе още същата сутрин, не утре.
 */
export function sameOrNextWorkingDayAt(now: Date, hour = 10, tz: string = TZ): Date {
  const { hour: h } = sofiaParts(now, tz);
  if (!isWeekend(now, tz) && h < hour) {
    const day = now.toLocaleDateString("sv-SE", { timeZone: tz });
    const iso = sofiaLocalToIso(`${day}T${String(hour).padStart(2, "0")}:00`, tz);
    if (iso) return new Date(iso);
  }
  return nextWorkingDayAt(now, hour, tz);
}
