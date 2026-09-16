/**
 * Часове за опашката за звънене. Vercel върви на UTC, а човекът гледа
 * телефона си в София — всяко `datetime-local` от формата е софийско време
 * и трябва да стане UTC с отместването за ТОЗИ ден (лято +3, зима +2).
 * `new Date("2026-09-17T11:00")` на сървъра би дало 11:00 UTC = 14:00 София.
 */
import { TZ, nextWorkingDayAt } from "@/lib/contacts/followup";

export function tzOffsetMinutes(at: Date, tz: string = TZ): number {
  const asTz = new Date(at.toLocaleString("en-US", { timeZone: tz }));
  const asUtc = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((asTz.getTime() - asUtc.getTime()) / 60_000);
}

/** „2026-09-17T11:00“ (datetime-local, София) → ISO в UTC; невалидно → null. */
export function sofiaLocalToIso(naive: string | null | undefined, tz: string = TZ): string | null {
  if (!naive) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(naive.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (Number.isNaN(guess.getTime())) return null;
  let utc = new Date(guess.getTime() - tzOffsetMinutes(guess, tz) * 60_000);
  // Около смяната на часа отместването на резултата може да е друго.
  const again = tzOffsetMinutes(utc, tz);
  if (again !== tzOffsetMinutes(guess, tz)) utc = new Date(guess.getTime() - again * 60_000);
  return utc.toISOString();
}

/** ISO → стойност за `datetime-local` в София („2026-09-17T11:00“). */
export function isoToSofiaLocal(iso: string | Date, tz: string = TZ): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Кога да се звънне пак, ако не вдига: след 3 часа, ако е работен ден и още
 * е преди 15:00; иначе следващата работна сутрин в 10:00. Напомнянето не
 * изчезва и не остава „просрочено“ — същото правило като в картона.
 */
export function defaultRetryAt(now: Date = new Date(), tz: string = TZ): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  const weekend = parts.weekday === "Sat" || parts.weekday === "Sun";
  const hour = Number(parts.hour);
  if (!weekend && hour < 15) return new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return nextWorkingDayAt(now, 10, tz);
}

/** „чт 17.09, 11:00“ — кратко, за карта на телефон. */
export function fmtSofia(iso: string | Date, tz: string = TZ): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = d.toLocaleString("bg-BG", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return s.replace(/\s*г\.,?/, "").replace(",", "").replace(/(\d{2}\.\d{2})\.?\s/, "$1, ");
}

/** Краят на днешния ден в София като ISO (UTC). */
export function todayEndIso(now: Date = new Date(), tz: string = TZ): string {
  const day = now.toLocaleDateString("sv-SE", { timeZone: tz });
  const end = sofiaLocalToIso(`${day}T23:59`, tz);
  return end ? new Date(new Date(end).getTime() + 59_999).toISOString() : now.toISOString();
}
