/**
 * Часовникът на залата — чисти функции, без браузър и без база.
 *
 * Една прожекция „на живо“ (simulive): всички гледат една и съща минута.
 * Позицията НЕ идва от плейъра, а от часа: сега − началото на прожекцията.
 * Закъснелият влиза в текущата минута, без превъртане напред — като в
 * истинско кино. Повторение няма: след края в залата остава само поканата.
 */
import { KINO, type KinoChapter } from "./config";

export const TZ = "Europe/Sofia";

export type KinoPhase =
  /** преди фоайето — обратно броене */
  | "before"
  /** 19:25–19:30 — „заемете местата си“, отброяването е на екрана */
  | "doors"
  /** филмът върви „на живо“ (с въпросите и подаръка накрая) */
  | "film"
  /** след филма — в залата е само поканата, до затварянето на записването */
  | "after"
  /** записването в потока затвори */
  | "closed";

export interface KinoTimeline {
  premiereMs: number;
  doorsMs: number;
  filmEndMs: number;
  /** записването в първия поток затваря (и залата — с него) */
  closeMs: number;
  durationSec: number;
}

type TimelineInput = {
  screening: { premiereISO: string; doorsOpenMinutes: number; closeISO: string };
  film: { durationSec: number };
};

export function kinoTimeline(cfg: TimelineInput = KINO): KinoTimeline {
  const premiereMs = Date.parse(cfg.screening.premiereISO);
  return {
    premiereMs,
    doorsMs: premiereMs - cfg.screening.doorsOpenMinutes * 60_000,
    filmEndMs: premiereMs + cfg.film.durationSec * 1000,
    closeMs: Date.parse(cfg.screening.closeISO),
    durationSec: cfg.film.durationSec,
  };
}

export function phaseAt(nowMs: number, tl: KinoTimeline): KinoPhase {
  if (nowMs >= tl.closeMs) return "closed";
  if (nowMs < tl.doorsMs) return "before";
  if (nowMs < tl.premiereMs) return "doors";
  if (nowMs < tl.filmEndMs) return "film";
  return "after";
}

/**
 * Секундата, в която е филмът „на живо“ в този момент. Преди началото е 0,
 * след края — дължината на филма. Дробните секунди се пазят: плейърът се
 * изравнява по тях, а не по закръглено число.
 */
export function simulivePosition(nowMs: number, tl: KinoTimeline): number {
  const pos = (nowMs - tl.premiereMs) / 1000;
  if (pos <= 0) return 0;
  return Math.min(pos, tl.durationSec);
}

/** Главата, в която е дадената секунда (последната, чието начало е ≤ позицията). */
export function chapterIndexAt(posSec: number, chapters: readonly KinoChapter[]): number {
  let idx = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].startSec <= posSec) idx = i;
    else break;
  }
  return idx;
}

/** Колко секунди е главата (последната свършва там, където започват надписите). */
export function chapterSpans(
  chapters: readonly KinoChapter[],
  endSec: number,
): Array<{ chapter: KinoChapter; fromSec: number; toSec: number }> {
  return chapters.map((chapter, i) => ({
    chapter,
    fromSec: chapter.startSec,
    toSec: i + 1 < chapters.length ? chapters[i + 1].startSec : endSec,
  }));
}

/** Бутоните изплуват с надписите — точно в offerAt, никога по-рано. */
export function isOfferOpen(posSec: number, offerAtSec: number = KINO.film.offerAtSec): boolean {
  return posSec >= offerAtSec;
}

/**
 * Колко трябва да е изгледал човек, за да не е „допуснат напред“: в премиерата
 * плейърът не може да е по-напред от часа. Малкият толеранс е за буфериране.
 */
export function clampSimuliveSeek(requestedSec: number, livePosSec: number, toleranceSec = 1.5): number {
  return requestedSec > livePosSec + toleranceSec ? livePosSec : requestedSec;
}

export interface CountdownParts {
  totalSec: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function splitCountdown(ms: number): CountdownParts {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return {
    totalSec,
    days: Math.floor(totalSec / 86_400),
    hours: Math.floor((totalSec % 86_400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

/** 125 → „2:05“, 3725 → „1:02:05“. */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

const WEEKDAY = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];
const WEEKDAY_SHORT = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTH = [
  "януари",
  "февруари",
  "март",
  "април",
  "май",
  "юни",
  "юли",
  "август",
  "септември",
  "октомври",
  "ноември",
  "декември",
];

/**
 * Софийски час → милисекунди (UTC), с лятното/зимното часово време.
 * 18.10.2026, 23:59 → 20:59 UTC (+03:00); 15.11.2026, 23:59 → 21:59 UTC (+02:00).
 */
export function sofiaLocalMs(year: number, month: number, day: number, hour = 0, minute = 0): number {
  const want = Date.UTC(year, month - 1, day, hour, minute);
  let guess = want - 2 * 3600_000;
  for (let i = 0; i < 3; i++) {
    const p = sofiaParts(guess);
    const seen = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    if (seen === want) break;
    guess += want - seen;
  }
  return guess;
}

/** Частите на датата по софийско време — независимо в коя зона върви сървърът. */
export function sofiaParts(ms: number): { year: number; month: number; day: number; weekday: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: wd < 0 ? 0 : wd,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/** „вторник, 10 ноември“ */
export function sofiaDayLabel(ms: number): string {
  const p = sofiaParts(ms);
  return `${WEEKDAY[p.weekday]}, ${p.day} ${MONTH[p.month - 1]}`;
}

/** „във вторник, 10 ноември“ — с правилния предлог („във“ пред в/ф, иначе „в“). */
export function sofiaOnDay(ms: number): string {
  const day = sofiaDayLabel(ms);
  return /^[вф]/i.test(day) ? `във ${day}` : `в ${day}`;
}

/** „19:30“ */
export function sofiaTimeLabel(ms: number): string {
  const p = sofiaParts(ms);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** „вт 10.11“ */
export function sofiaShortDay(ms: number): string {
  const p = sofiaParts(ms);
  return `${WEEKDAY_SHORT[p.weekday]} ${String(p.day).padStart(2, "0")}.${String(p.month).padStart(2, "0")}`;
}

/** Всичко, което страниците казват за датата — от едно място. */
export function premiereLabels(cfg: TimelineInput = KINO) {
  const tl = kinoTimeline(cfg);
  return {
    day: sofiaDayLabel(tl.premiereMs),
    onDay: sofiaOnDay(tl.premiereMs),
    time: sofiaTimeLabel(tl.premiereMs),
    short: `${sofiaShortDay(tl.premiereMs)} · ${sofiaTimeLabel(tl.premiereMs)}`,
    doorsTime: sofiaTimeLabel(tl.doorsMs),
    /** записването затваря: „неделя, 18 октомври“ · „23:59“ · „18.10, 23:59“ */
    closeDay: sofiaDayLabel(tl.closeMs),
    closeOnDay: sofiaOnDay(tl.closeMs),
    closeTime: sofiaTimeLabel(tl.closeMs),
    closeShort: `${sofiaDate(tl.closeMs)}, ${sofiaTimeLabel(tl.closeMs)}`,
  };
}

/** „18.10“ */
export function sofiaDate(ms: number): string {
  const p = sofiaParts(ms);
  return `${String(p.day).padStart(2, "0")}.${String(p.month).padStart(2, "0")}`;
}

/**
 * Прегледът на Ивайло: `?sim=` пренася залата в друг момент, без да чака
 * премиерата. Приема ISO време или кратко име на момента:
 * lobby · doors · film · film:<секунди> · number · offer · qa · bonus · after · last · closed.
 * Връща милисекунди или null (непознато → залата си върви по истинския час).
 */
export function resolveSimTime(
  param: string | null | undefined,
  tl: KinoTimeline,
  cfg: { offerAtSec: number; qaAtSec: number; postCreditsAtSec: number; numberAtSec: number } = KINO.film,
): number | null {
  const v = (param ?? "").trim().toLowerCase();
  if (!v) return null;
  const film = v.match(/^film:(\d{1,5})$/);
  if (film) return tl.premiereMs + Math.min(Number(film[1]), tl.durationSec - 1) * 1000;
  switch (v) {
    case "lobby":
    case "before":
      return tl.premiereMs - 2 * 3600_000;
    case "doors":
      return tl.premiereMs - 3 * 60_000;
    case "film":
      return tl.premiereMs + 45_000;
    case "number":
      return tl.premiereMs + (cfg.numberAtSec + 3) * 1000;
    case "offer":
      return tl.premiereMs + (cfg.offerAtSec + 3) * 1000;
    case "qa":
      return tl.premiereMs + (cfg.qaAtSec + 5) * 1000;
    case "bonus":
      return tl.premiereMs + (cfg.postCreditsAtSec + 30) * 1000;
    case "after":
      return tl.filmEndMs + 10 * 60_000;
    case "last":
      return tl.closeMs - 2 * 3600_000;
    case "closed":
      return tl.closeMs + 3600_000;
  }
  const iso = Date.parse(param ?? "");
  return Number.isFinite(iso) ? iso : null;
}
