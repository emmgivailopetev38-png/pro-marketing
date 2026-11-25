/**
 * „📅 Календар“ на екипа — чистите правила (24.11.2026, Ивайло: „срещите и
 * календарите… супер лесно да си го слагат в графиците… моят календар, срещите,
 * къде ще са и Fathom“). Без база, за да се тестват.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { dayKey } from "@/lib/contacts/followup";
import { hoursFor, hoursLabel, type Grafik } from "./grafik-rules";

export interface CalMeeting {
  id: string;
  at: string;
  minutes: number;
  name: string;
  phone: string | null;
  email: string | null;
  business: string | null;
  status: string;
  /** клоузърът, който води (картонът е негов); null = Ивайло */
  closerId: string | null;
  closer: string | null;
  /** кой е записал срещата: човек от екипа, „Ели“ или null (сайтът / Ивайло) */
  bookedBy: string | null;
  meetUrl: string | null;
  recording: string | null;
}

export type CalScope = "mine" | "all";

export interface CalViewer {
  kind: "owner" | "member";
  id: string | null;
  name: string;
  role: string;
}

/** Срещата е на екипа по продажбите (води я клоузър), не на Ивайло. */
export function isTeamMeeting(m: Pick<CalMeeting, "closerId">, closerIds: ReadonlySet<string>): boolean {
  return !!m.closerId && closerIds.has(m.closerId);
}

/**
 * Кои срещи вижда човекът: собственикът — всички (и своите); останалите — само
 * срещите на екипа. „Моите“: клоузърът — които води; сетърът — които е записал.
 */
export function visibleMeetings(all: CalMeeting[], viewer: CalViewer, scope: CalScope, closerIds: ReadonlySet<string>): CalMeeting[] {
  const team = viewer.kind === "owner" ? all : all.filter((m) => isTeamMeeting(m, closerIds));
  if (scope === "all" || viewer.kind === "owner") return team;
  const me = viewer.name.trim().toLowerCase();
  if (viewer.role === "sales") return team.filter((m) => m.closerId === viewer.id);
  if (viewer.role === "setter") return team.filter((m) => (m.bookedBy ?? "").trim().toLowerCase() === me);
  return team;
}

/** Изгледът по подразбиране: клоузърът гледа своите, останалите — целия екип. */
export function defaultScope(viewer: CalViewer): CalScope {
  return viewer.kind === "member" && viewer.role === "sales" ? "mine" : "all";
}

export interface DayGroup {
  day: string;
  meetings: CalMeeting[];
}

/** Срещите по дни (София), във възходящ ред. */
export function groupByDay(meetings: CalMeeting[]): DayGroup[] {
  const map = new Map<string, CalMeeting[]>();
  for (const m of [...meetings].sort((a, b) => a.at.localeCompare(b.at))) {
    const k = dayKey(m.at);
    map.set(k, [...(map.get(k) ?? []), m]);
  }
  return [...map.entries()].map(([day, list]) => ({ day, meetings: list }));
}

const LIVE = new Set(["accepted", "pending", "confirmed"]);
export function isLive(status: string): boolean {
  return LIVE.has(status);
}

/**
 * Заетите часове на всеки клоузър за следващите дни — за сетъра, преди да запише час.
 * `hours`: кога е на линия по графика („18–21“); "" = не е на линия; null = няма график.
 */
export function busyByCloser(
  meetings: CalMeeting[],
  closers: Array<{ id: string; name: string; grafik?: Grafik | null; role?: "sales" | "setter" }>,
  now: Date,
  days = 7
): Array<{ day: string; slots: Array<{ closer: string; times: string[]; hours: string | null; role: "sales" | "setter" }> }> {
  const out: Array<{ day: string; slots: Array<{ closer: string; times: string[]; hours: string | null; role: "sales" | "setter" }> }> = [];
  for (let i = 0; i < days; i++) {
    const day = dayKey(new Date(now.getTime() + i * 86_400_000));
    const slots = closers.map((c) => ({
      closer: c.name,
      hours: c.grafik ? hoursLabel(hoursFor(c.grafik, day)) : null,
      role: c.role ?? "sales",
      times: meetings
        .filter((m) => m.closerId === c.id && isLive(m.status) && dayKey(m.at) === day && new Date(m.at).getTime() > now.getTime() - 3_600_000)
        .sort((a, b) => a.at.localeCompare(b.at))
        .map((m) => new Date(m.at).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" })),
    }));
    out.push({ day, slots });
  }
  return out;
}

// ── Личният линк за абонамент (без вход — календарните приложения нямат бисквитки) ──

function sig(key: string, secret: string): string {
  return createHmac("sha256", secret).update(`kalendar:${key}`).digest("hex").slice(0, 32);
}

/** `<id>.<подпис>` — личен и неотгатваем; важи, докато човекът е активен. */
export function feedToken(key: string, secret: string): string {
  return `${key}.${sig(key, secret)}`;
}

export function readFeedToken(token: string | null | undefined, secret: string): string | null {
  const t = (token ?? "").replace(/\.ics$/i, "");
  const i = t.lastIndexOf(".");
  if (i <= 0) return null;
  const key = t.slice(0, i);
  const got = Buffer.from(t.slice(i + 1));
  const want = Buffer.from(sig(key, secret));
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  return key;
}
