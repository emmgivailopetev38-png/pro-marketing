/**
 * „🗓 Моят график“ — кога клоузърът може да води срещи (25.11.2026, Теодор във
 * Viber: „не виждам как мога да си менижирам графикът“; Ивайло: „календар…
 * само да си цъка на него, да му е максимално лесно“).
 *
 * Моделът е като в Calendly: обичайна седмица + конкретни дни, които я заменят
 * (отпуска, зъболекар). Една клетка = един час: 18 → 18:00–19:00. Срещите са от
 * 10:00 (правилото на Ивайло), затова решетката е 10:00–22:00.
 * Без график (null в базата) — без ограничение, както досега.
 *
 * Чисти функции без база — ползват ги и решетката в браузъра, и проверката при
 * „Записах среща“ на сървъра.
 */
import { MEETING_MINUTES } from "@/lib/cal/types";
import { dayKey } from "@/lib/contacts/followup";
import { isoToSofiaLocal, sofiaLocalToIso } from "./time";

export const FIRST_HOUR = 10;
export const LAST_HOUR = 21;
export const HOURS: readonly number[] = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
/** ISO дни: „1“ = понеделник … „7“ = неделя. */
export const WEEK_DAYS = ["1", "2", "3", "4", "5", "6", "7"] as const;
export const WEEK_DAY_SHORT: Record<string, string> = { "1": "Пн", "2": "Вт", "3": "Ср", "4": "Чт", "5": "Пт", "6": "Сб", "7": "Нд" };

export interface Grafik {
  /** обичайната седмица: ISO ден → часовете, в които е на линия */
  week: Record<string, number[]>;
  /** конкретни дни („2026-11-27“) → часовете за този ден; заменят обичайната седмица (празен = не е на линия) */
  days: Record<string, number[]>;
}

const DAY_MS = 86_400_000;

export function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

function cleanHours(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map(Number).filter((h) => Number.isInteger(h) && h >= FIRST_HOUR && h <= LAST_HOUR))].sort((a, b) => a - b);
}

export function emptyGrafik(): Grafik {
  return { week: {}, days: {} };
}

/**
 * От базата / от браузъра → чист график. null (или не-обект) = без график.
 * Празен обект = графикът е включен, но няма нито един свободен час.
 * Миналите конкретни дни се изхвърлят, за да не се трупат.
 */
export function readGrafik(raw: unknown, today?: string): Grafik | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as { week?: unknown; days?: unknown };
  const week: Record<string, number[]> = {};
  if (r.week && typeof r.week === "object") {
    for (const d of WEEK_DAYS) {
      const h = cleanHours((r.week as Record<string, unknown>)[d]);
      if (h.length) week[d] = h;
    }
  }
  const days: Record<string, number[]> = {};
  if (r.days && typeof r.days === "object") {
    for (const [k, v] of Object.entries(r.days as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || (today && k < today)) continue;
      days[k] = cleanHours(v);
    }
  }
  return { week, days };
}

export function isoWeekDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`).getUTCDay();
  return String(d === 0 ? 7 : d);
}

export function isDayOverride(g: Grafik, day: string): boolean {
  return Object.prototype.hasOwnProperty.call(g.days, day);
}

/** Часовете за конкретен ден: неговите, ако е нагласен отделно, иначе обичайната седмица. */
export function hoursFor(g: Grafik, day: string): number[] {
  return isDayOverride(g, day) ? g.days[day] : (g.week[isoWeekDay(day)] ?? []);
}

export function hasAnyHour(g: Grafik): boolean {
  return Object.values(g.week).some((h) => h.length > 0) || Object.values(g.days).some((h) => h.length > 0);
}

/**
 * Срещата се побира в графика: всички часове, които докосва, са „на линия“.
 * Без график → да (както досега).
 */
export function fitsGrafik(g: Grafik | null, startIso: string, minutes: number = MEETING_MINUTES): boolean {
  if (!g) return true;
  const local = isoToSofiaLocal(startIso);
  const day = local.slice(0, 10);
  const m0 = Number(local.slice(11, 13)) * 60 + Number(local.slice(14, 16));
  const m1 = m0 + Math.max(1, minutes);
  if (m1 > 24 * 60) return false;
  const on = new Set(hoursFor(g, day));
  for (let h = Math.floor(m0 / 60); h <= Math.floor((m1 - 1) / 60); h++) if (!on.has(h)) return false;
  return true;
}

export interface BusySlot {
  at: string;
  minutes: number;
}

/**
 * Следващите свободни часове по графика — на кръгъл час, като стойност за
 * datetime-local („2026-11-27T18:00“, София): без заетите и без миналото.
 */
export function freeSlots(
  g: Grafik | null,
  busy: BusySlot[],
  now: Date,
  opts: { days?: number; limit?: number; minutes?: number; leadMinutes?: number } = {}
): string[] {
  if (!g) return [];
  const { days = 7, limit = 12, minutes = MEETING_MINUTES, leadMinutes = 30 } = opts;
  const out: string[] = [];
  const minStart = now.getTime() + leadMinutes * 60_000;
  const seen = new Set<string>();
  for (let i = 0; i <= days && out.length < limit; i++) {
    const day = dayKey(new Date(now.getTime() + i * DAY_MS));
    if (seen.has(day)) continue;
    seen.add(day);
    for (const h of hoursFor(g, day)) {
      const local = `${day}T${String(h).padStart(2, "0")}:00`;
      const iso = sofiaLocalToIso(local);
      if (!iso) continue;
      const s = new Date(iso).getTime();
      if (s < minStart || !fitsGrafik(g, iso, minutes)) continue;
      const e = s + minutes * 60_000;
      const taken = busy.some((b) => {
        const bs = new Date(b.at).getTime();
        return bs < e && s < bs + Math.max(1, b.minutes) * 60_000;
      });
      if (taken) continue;
      out.push(local);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** „чт 27.11 18:00“ от „2026-11-27T18:00“. */
export function slotLabel(local: string): string {
  const day = local.slice(0, 10);
  const wd = new Date(`${day}T12:00:00Z`).toLocaleDateString("bg-BG", { weekday: "short", timeZone: "UTC" });
  return `${wd} ${day.slice(8, 10)}.${day.slice(5, 7)} ${local.slice(11, 16)}`;
}

/** „10–13 · 17–21“ — поредните часове слепени; празно → "". */
export function hoursLabel(hours: readonly number[]): string {
  const hs = [...hours].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = -1;
  let prev = -1;
  for (const h of hs) {
    if (start < 0) {
      start = prev = h;
    } else if (h === prev + 1) {
      prev = h;
    } else {
      parts.push(`${start}–${prev + 1}`);
      start = prev = h;
    }
  }
  if (start >= 0) parts.push(`${start}–${prev + 1}`);
  return parts.join(" · ");
}

/** Отказът към сетъра, когато часът е извън графика на клоузъра. */
export function grafikMessage(name: string, startIso: string, slots: string[]): string {
  const when = slotLabel(isoToSofiaLocal(startIso));
  if (!slots.length) {
    return `${name} не е на линия в ${when} и в графика му няма свободен час през следващата седмица. Избери друг клоузър или му пиши в „Съобщения“.`;
  }
  return `${name} не е на линия в ${when} — този час не е в графика му. Свободни часове: ${slots.slice(0, 6).map(slotLabel).join(" · ")}. Избери някой от тях (целият график е в „📅 Календар“).`;
}

/** Отказът, когато срещата е „по ред“ и в този час не е на линия нито един клоузър. */
export function grafikMessageAll(startIso: string, byCloser: Array<{ name: string; slots: string[] }>): string {
  const when = slotLabel(isoToSofiaLocal(startIso));
  const lines = byCloser.map((c) => (c.slots.length ? `${c.name}: ${c.slots.slice(0, 4).map(slotLabel).join(" · ")}` : `${c.name}: няма свободен час`));
  return `В ${when} нито един клоузър не е на линия. Свободни часове — ${lines.join("; ")}. Избери някой от тях (графиците са в „📅 Календар“).`;
}

// ── Промените от решетката ──

const sameHours = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export function withWeekHours(g: Grafik, wd: string, hours: number[]): Grafik {
  const week = { ...g.week };
  const h = cleanHours(hours);
  if (h.length) week[wd] = h;
  else delete week[wd];
  return { week, days: { ...g.days } };
}

/** Клетка от обичайната седмица; `on` — задължителното състояние при влачене. */
export function toggleWeekHour(g: Grafik, wd: string, hour: number, on?: boolean): Grafik {
  const cur = new Set(g.week[wd] ?? []);
  if (on ?? !cur.has(hour)) cur.add(hour);
  else cur.delete(hour);
  return withWeekHours(g, wd, [...cur]);
}

/** Цял ред (един час за всичките 7 дни): ако е пълен — маха се, иначе се слага навсякъде. */
export function toggleWeekRow(g: Grafik, hour: number): Grafik {
  const full = WEEK_DAYS.every((d) => (g.week[d] ?? []).includes(hour));
  return WEEK_DAYS.reduce((acc, d) => toggleWeekHour(acc, d, hour, !full), g);
}

export function resetDay(g: Grafik, day: string): Grafik {
  const days = { ...g.days };
  delete days[day];
  return { week: { ...g.week }, days };
}

export function withDayHours(g: Grafik, day: string, hours: number[]): Grafik {
  return { week: { ...g.week }, days: { ...g.days, [day]: cleanHours(hours) } };
}

/**
 * Клетка в конкретен ден: денят се откъсва от обичайната седмица и се пипа само
 * той. Ако стане същият като обичайния — отделното правило се маха.
 */
export function toggleDayHour(g: Grafik, day: string, hour: number, on?: boolean): Grafik {
  const cur = new Set(hoursFor(g, day));
  if (on ?? !cur.has(hour)) cur.add(hour);
  else cur.delete(hour);
  const next = withDayHours(g, day, [...cur]);
  return sameHours(next.days[day], g.week[isoWeekDay(day)] ?? []) ? resetDay(next, day) : next;
}

export const PRESETS: Array<{ id: string; label: string; week: Record<string, number[]> }> = [
  { id: "den", label: "Делнични 10–18", week: Object.fromEntries(["1", "2", "3", "4", "5"].map((d) => [d, range(10, 17)])) },
  { id: "vecher", label: "Делнични вечер 17–21", week: Object.fromEntries(["1", "2", "3", "4", "5"].map((d) => [d, range(17, 20)])) },
  { id: "vsichko", label: "Всеки ден 10–21", week: Object.fromEntries(WEEK_DAYS.map((d) => [d, range(10, 20)])) },
];

export function applyPreset(g: Grafik | null, id: string): Grafik {
  const p = PRESETS.find((x) => x.id === id);
  return { week: p ? { ...p.week } : {}, days: { ...(g?.days ?? {}) } };
}

/** Следващите `n` дни от днес (София) — колоните на „Моят календар“. */
export function nextDays(now: Date, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; out.length < n && i < n + 2; i++) {
    const d = dayKey(new Date(now.getTime() + i * DAY_MS));
    if (!out.includes(d)) out.push(d);
  }
  return out;
}
