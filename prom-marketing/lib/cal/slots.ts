/**
 * Свободните часове на Ивайло — четени от Cal.com, тоест от Google Календара.
 *
 * ⚠️ Този четец нарочно НЕ ползва `CAL_API_KEY`. Слотовете на публичен тип
 * събитие се дават и без ключ — същият адрес, който отваря страницата
 * cal.com/promarketing/consultation в браузъра. Така гласовият агент може да
 * казва свободните часове дори ако ключът за писане липсва или е изтекъл,
 * и един ключ по-малко пътува към трета страна.
 *
 * ⚠️ Версията на API-то тук е ДРУГА (`2024-09-04`), не онази в
 * `create-booking.ts`. Cal.com версионира всеки ресурс поотделно; с версията
 * за резервации този адрес връща 404 без никакво обяснение.
 */

import { CAL_TIMEZONE } from "./create-booking";

const API = "https://api.cal.com/v2/slots";
const API_VERSION = "2024-09-04";

function username(): string {
  return (process.env.CAL_USERNAME ?? process.env.NEXT_PUBLIC_CAL_USERNAME ?? "promarketing").trim();
}

function eventSlug(): string {
  return (process.env.CAL_EVENT_SLUG ?? process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "consultation").trim();
}

export type Slot = {
  /** Началото в UTC (ISO) — това влиза после в резервацията. */
  startISO: string;
  /** Софийският ден, `2026-09-08`. Групирането е по него, не по UTC. */
  day: string;
};

const DAYS = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];
const MONTHS = [
  "януари", "февруари", "март", "април", "май", "юни",
  "юли", "август", "септември", "октомври", "ноември", "декември",
];

/** Софийските части на един момент — без да местим системната зона. */
function sofiaParts(d: Date): { y: number; m: number; day: number; h: number; min: number; weekday: number } {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAL_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(d);
  const g = (t: string) => f.find((p) => p.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
  return {
    y: Number(g("year")),
    m: Number(g("month")),
    day: Number(g("day")),
    // 24:00 вместо 00:00 идва от hour12:false — иначе полунощ става „24 часа".
    h: Number(g("hour")) % 24,
    min: Number(g("minute")),
    weekday: wd,
  };
}

/** „вторник, 8 септември" — както човек го казва на глас. */
export function speakDay(d: Date): string {
  const p = sofiaParts(d);
  return `${DAYS[p.weekday]}, ${p.day} ${MONTHS[p.m - 1]}`;
}

/** „девет и половина", „десет часа" — часът, изговорен, не изписан. */
export function speakTime(d: Date): string {
  const p = sofiaParts(d);
  if (p.min === 0) return `${p.h} часа`;
  if (p.min === 30) return `${p.h} и половина`;
  return `${p.h} и ${p.min}`;
}

/**
 * Свободните часове напред. `days` е колко дни да гледа — 14 покрива
 * „другата седмица", без да товари отговора със стотици слотове.
 */
export async function fetchSlots(opts?: { days?: number; from?: Date }): Promise<
  { ok: true; slots: Slot[] } | { ok: false; error: string }
> {
  const from = opts?.from ?? new Date();
  const days = Math.min(Math.max(opts?.days ?? 14, 1), 60);
  const to = new Date(from.getTime() + days * 86400_000);

  const qs = new URLSearchParams({
    eventTypeSlug: eventSlug(),
    username: username(),
    start: from.toISOString().slice(0, 10),
    end: to.toISOString().slice(0, 10),
    timeZone: CAL_TIMEZONE,
  });

  try {
    const res = await fetch(`${API}?${qs}`, {
      headers: { "cal-api-version": API_VERSION },
      // Гласовият инструмент трябва да отговори, преди човекът да реши, че
      // линията е прекъснала. По-добре „в момента не виждам календара",
      // отколкото шест секунди мълчание.
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const json = (await res.json()) as { data?: Record<string, Array<{ start?: string }>> };
    const data = json?.data ?? {};

    const slots: Slot[] = [];
    for (const [day, list] of Object.entries(data)) {
      for (const item of list ?? []) {
        if (!item?.start) continue;
        const when = new Date(item.start);
        if (Number.isNaN(when.getTime())) continue;
        // Час, който започва след по-малко от час, на практика не става —
        // докато човекът затвори и отвори пощата, вече е минал.
        if (when.getTime() < Date.now() + 3600_000) continue;
        slots.push({ startISO: when.toISOString(), day });
      }
    }
    slots.sort((a, b) => a.startISO.localeCompare(b.startISO));
    return { ok: true, slots };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/**
 * Изречението, което агентът казва.
 *
 * Нарочно НЕ изброява всичко: списък от трийсет часа по телефона е шум и
 * човекът не помни нито един. Предлагат се най-близките два дни, по три часа
 * от ден — колкото се задържат в главата.
 */
export function speakSlots(slots: Slot[], opts?: { days?: number; perDay?: number }): string {
  if (slots.length === 0) {
    return "В следващите две седмици нямам свободен час. Кажи ми кога ти е удобно и ще се разберем иначе.";
  }

  const perDay = opts?.perDay ?? 3;
  const maxDays = opts?.days ?? 2;

  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const list = byDay.get(s.day) ?? [];
    if (list.length < perDay) list.push(s);
    byDay.set(s.day, list);
  }

  const parts: string[] = [];
  for (const [, list] of Array.from(byDay.entries()).slice(0, maxDays)) {
    const day = speakDay(new Date(list[0].startISO));
    const times = list.map((s) => speakTime(new Date(s.startISO)));
    parts.push(`${day} — ${joinBg(times)}`);
  }

  return `Мога ${joinBg(parts, "; ")}. Кой от тези ти върши работа?`;
}

/** „едно, друго и трето" — с „и" пред последното, както се говори. */
function joinBg(items: string[], sep = ", "): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(sep)} и ${items[items.length - 1]}`;
}

/**
 * Търси искания час измежду свободните.
 *
 * Толерансът е нарочен: агентът чува „в десет", а слотът е 10:00 — съвпада
 * точно. Но чуе ли „към десет" и слотовете са 9:30 и 10:30, по-добре да
 * предложи най-близкия, отколкото да откаже. Затова се връща и точното
 * съвпадение, и най-близкото в рамките на 90 минути, а изборът е на рута.
 */
export function matchSlot(
  slots: Slot[],
  wanted: Date
): { exact: Slot | null; nearest: Slot | null } {
  const target = wanted.getTime();
  let exact: Slot | null = null;
  let nearest: Slot | null = null;
  let bestDiff = Infinity;

  for (const s of slots) {
    const diff = Math.abs(new Date(s.startISO).getTime() - target);
    if (diff === 0) exact = s;
    if (diff < bestDiff && diff <= 90 * 60_000) {
      bestDiff = diff;
      nearest = s;
    }
  }
  return { exact, nearest };
}
