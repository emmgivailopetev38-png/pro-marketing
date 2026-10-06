/**
 * Какво значат пулсовете от залата — чисти функции, без база.
 *
 * Пулсът (на всеки 15 s) казва в коя секунда е човекът и дали върви. В базата
 * се пазят ИЗГЛЕДАНИТЕ МИНУТИ (без повторения) и най-далечната позиция. От тях:
 *  - процентът е по изгледани минути, НЕ по позиция: закъснелият, влязъл в
 *    30-ата минута на премиерата, не е „изгледал 70 %“;
 *  - „стигна до края“ и „стигна до поканата“ са по най-далечната позиция.
 */
import { KINO, type KinoChapter } from "./config";
import { chapterSpans } from "./time";
import { isDecisionMaker } from "./people";

export const MILESTONES = ["entered", "p25", "p50", "p75", "offer_chapter", "end"] as const;
export type MilestoneId = (typeof MILESTONES)[number];

export interface FilmShape {
  durationSec: number;
  offerAtSec: number;
  /** Краят на самия филм („Не бързайте“) — след него са въпросите и надписите. */
  againAtSec: number;
  chapters: readonly KinoChapter[];
  offerChapter: number;
}

const FILM: FilmShape = KINO.film;

export function totalMinutes(durationSec: number = FILM.durationSec): number {
  return Math.max(1, Math.ceil(durationSec / 60));
}

/** Изгледаната част от филма: различни минути / всички минути (0…1). */
export function watchedRatio(minutesCount: number, durationSec: number = FILM.durationSec): number {
  return Math.max(0, Math.min(1, minutesCount / totalMinutes(durationSec)));
}

/** Етапите, до които човек вече е стигнал (без значение кои са записани). */
export function reachedMilestones(state: { minutes: number; maxPos: number }, film: FilmShape = FILM): MilestoneId[] {
  // „Влезе“ = поне една изгледана минута (не само отворена страница).
  if (state.minutes <= 0 && state.maxPos <= 0) return [];
  const out: MilestoneId[] = ["entered"];
  const ratio = watchedRatio(state.minutes, film.durationSec);
  if (ratio >= 0.25) out.push("p25");
  if (ratio >= 0.5) out.push("p50");
  if (ratio >= 0.75) out.push("p75");
  const offerChapter = film.chapters.find((c) => c.n === film.offerChapter);
  if (offerChapter && state.maxPos >= offerChapter.startSec) out.push("offer_chapter");
  if (state.maxPos >= film.againAtSec) out.push("end");
  return out;
}

/** Новите етапи — тези, които са достигнати, но още не са записани. */
export function freshMilestones(reached: readonly string[], recorded: readonly string[]): MilestoneId[] {
  const seen = new Set(recorded);
  return reached.filter((m): m is MilestoneId => !seen.has(m) && (MILESTONES as readonly string[]).includes(m));
}

/** Заглавието на активността в CRM-а — по едно на етап. */
export function milestoneTitle(m: MilestoneId): string {
  switch (m) {
    case "entered":
      return "🎬 Влезе в залата · прожекцията";
    case "p25":
      return "⏱ Изгледа 25 % от „ВЪЛНАТА“";
    case "p50":
      return "⏱ Изгледа 50 % от „ВЪЛНАТА“";
    case "p75":
      return "⏱ Изгледа 75 % от „ВЪЛНАТА“";
    case "offer_chapter":
      return "🧭 Стигна до „Част втора“ — поканата";
    case "end":
      return "🏁 Изгледа целия филм (до „Не бързайте“)";
  }
}

// ── таблото ────────────────────────────────────────────────────────────────

export interface WatchRow {
  contact_id: string;
  minutes: number[] | null;
  max_pos: number | null;
  watched_seconds: number | null;
  first_mode: string | null;
  modes: string[] | null;
  milestones: string[] | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
}

/** Колко души са гледали всяка минута от филма (индекс = минутата). */
export function retentionByMinute(rows: readonly WatchRow[], durationSec: number = FILM.durationSec): number[] {
  const total = totalMinutes(durationSec);
  const out = new Array<number>(total).fill(0);
  for (const r of rows) {
    const seen = new Set<number>();
    for (const m of r.minutes ?? []) {
      if (Number.isInteger(m) && m >= 0 && m < total && !seen.has(m)) {
        seen.add(m);
        out[m]++;
      }
    }
  }
  return out;
}

/**
 * Задържането по глави: колко от влезлите са видели поне минута от главата.
 * Процентът е спрямо всички влезли (не спрямо предишната глава) — така кривата
 * се чете като „колко още са в залата“.
 */
export function retentionByChapter(
  rows: readonly WatchRow[],
  film: FilmShape = FILM,
): Array<{ n: number; title: string; viewers: number; pct: number }> {
  const spans = chapterSpans(film.chapters, film.againAtSec);
  const entered = rows.filter((r) => (r.minutes ?? []).length > 0).length;
  return spans.map(({ chapter, fromSec, toSec }) => {
    const fromMin = Math.floor(fromSec / 60);
    const toMin = Math.max(fromMin, Math.ceil(toSec / 60) - 1);
    let viewers = 0;
    for (const r of rows) {
      if ((r.minutes ?? []).some((m) => m >= fromMin && m <= toMin)) viewers++;
    }
    return { n: chapter.n, title: chapter.title, viewers, pct: entered ? viewers / entered : 0 };
  });
}

export const REACTIONS = ["🍿", "😂", "😢", "🔥"] as const;
export type Reaction = (typeof REACTIONS)[number];

export function isReaction(v: unknown): v is Reaction {
  return typeof v === "string" && (REACTIONS as readonly string[]).includes(v);
}

/** Реакциите по минути: [{ minute, "🍿": 3, … }] — само минутите, в които има нещо. */
export function reactionsByMinute(
  events: ReadonlyArray<{ minute: number | null; value: string | null }>,
): Array<{ minute: number; counts: Record<Reaction, number>; total: number }> {
  const map = new Map<number, Record<Reaction, number>>();
  for (const e of events) {
    if (e.minute == null || !isReaction(e.value)) continue;
    const row = map.get(e.minute) ?? { "🍿": 0, "😂": 0, "😢": 0, "🔥": 0 };
    row[e.value]++;
    map.set(e.minute, row);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([minute, counts]) => ({ minute, counts, total: REACTIONS.reduce((s, r) => s + counts[r], 0) }));
}

export interface RegistrationLite {
  contact_id: string;
  role: string | null;
}

export interface CallListPerson {
  contact_id: string;
  ratio?: number;
  maxPos?: number;
}

/**
 * Двата списъка за Димитър:
 *  (а) собственици и управители с билет — обаждане в ден −1 („запазили сме ти
 *      място — какво искаш да научиш?“), без вече платилите/капарото;
 *  (б) изгледали ≥ 50 % без покупка — обаждане до 1–2 часа след филма.
 */
export function callLists(args: {
  registrations: readonly RegistrationLite[];
  watches: readonly WatchRow[];
  buyers: ReadonlySet<string>;
  durationSec?: number;
}): { dayBefore: CallListPerson[]; warm: CallListPerson[] } {
  const seen = new Set<string>();
  const dayBefore: CallListPerson[] = [];
  for (const r of args.registrations) {
    if (seen.has(r.contact_id) || args.buyers.has(r.contact_id) || !isDecisionMaker(r.role)) continue;
    seen.add(r.contact_id);
    dayBefore.push({ contact_id: r.contact_id });
  }
  const warm = args.watches
    .map((w) => ({
      contact_id: w.contact_id,
      ratio: watchedRatio((w.minutes ?? []).length, args.durationSec ?? FILM.durationSec),
      maxPos: w.max_pos ?? 0,
    }))
    .filter((w) => w.ratio >= 0.5 && !args.buyers.has(w.contact_id))
    .sort((a, b) => b.ratio - a.ratio || b.maxPos - a.maxPos);
  return { dayBefore, warm };
}

// ── парите: едно плащане = една сесия / фактура в Stripe ─────────────────────

/**
 * Ключът на едно плащане: фактурата (вноските), иначе сесията на Checkout.
 * Записът в CRM-а е идемпотентен, но таблото и капарото броят по този ключ
 * — така двоен запис (ръчна поправка, стар webhook) не удвоява сумите.
 */
export function moneyKey(a: { id: string | number; metadata?: Record<string, unknown> | null }): string {
  const m = a.metadata ?? {};
  if (typeof m.invoice_id === "string" && m.invoice_id) return `inv:${m.invoice_id}`;
  if (typeof m.session_id === "string" && m.session_id) return `ses:${m.session_id}`;
  return `act:${a.id}`;
}

/** Първият запис за всеки ключ (редът се пази). */
export function uniqueBy<T>(rows: readonly T[], key: (r: T) => string): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const k = key(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ── изоставеното плащане ─────────────────────────────────────────────────────

/** След колко време без плащане „натисна, но не плати“ става повод за обаждане. */
export const ABANDON_AFTER_MS = 15 * 60_000;

const STREAM_INTENT = new Set(["stream", "full", "installments"]);

export interface IntentRow {
  contact_id: string;
  activity_type: string;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
}

export interface Abandoned {
  contactId: string;
  /** последното натискане / отворено плащане */
  intentAt: string;
  /** какво искаше: потока (бутон 1) или капарото (бутон 2) */
  wants: "stream" | "deposit";
  /** вече е вдигнат сигнал (kino_abandoned) */
  flagged: boolean;
}

/**
 * Кой натисна „Влизам в потока“ (бутон 1) или капарото (бутон 2) — или
 * отвори плащането в Stripe — и 15 минути след последното натискане още
 * няма нито плащане, нито капаро. Най-новите са първи.
 */
export function findAbandoned(rows: readonly IntentRow[], nowMs: number, afterMs: number = ABANDON_AFTER_MS): Abandoned[] {
  const by = new Map<string, { stream: number; deposit: number; paid: boolean; flagged: boolean }>();
  for (const r of rows) {
    const s = by.get(r.contact_id) ?? { stream: 0, deposit: 0, paid: false, flagged: false };
    const m = r.metadata ?? {};
    const t = Date.parse(r.occurred_at) || 0;
    if (r.activity_type === "kino_payment" || r.activity_type === "kino_deposit") s.paid = true;
    else if (r.activity_type === "kino_abandoned") s.flagged = true;
    else {
      const what =
        r.activity_type === "kino_click" ? String(m.button ?? "") : r.activity_type === "kino_checkout" ? String(m.plan ?? "") : "";
      if (STREAM_INTENT.has(what)) s.stream = Math.max(s.stream, t);
      else if (what === "deposit") s.deposit = Math.max(s.deposit, t);
    }
    by.set(r.contact_id, s);
  }
  const out: Abandoned[] = [];
  for (const [contactId, s] of by) {
    const last = Math.max(s.stream, s.deposit);
    if (s.paid || last === 0 || nowMs - last < afterMs) continue;
    out.push({ contactId, intentAt: new Date(last).toISOString(), wants: s.stream >= s.deposit ? "stream" : "deposit", flagged: s.flagged });
  }
  return out.sort((a, b) => b.intentAt.localeCompare(a.intentAt));
}

/** Хората с „Твоето число“ — първи (по-голямото число по-горе), останалите в досегашния ред. */
export function byHoursFirst<T>(people: readonly T[], hoursOf: (p: T) => number | null): T[] {
  return people
    .map((p, i) => ({ p, i, h: hoursOf(p) }))
    .sort((a, b) => (b.h ?? -1) - (a.h ?? -1) || a.i - b.i)
    .map((x) => x.p);
}

/** Списъците за Димитър в /admin/kino — в този ред отгоре надолу. */
export const KINO_LISTS = ["abandoned", "dayBefore", "warm"] as const;
export type KinoListId = (typeof KINO_LISTS)[number];
export function isKinoList(v: unknown): v is KinoListId {
  return typeof v === "string" && (KINO_LISTS as readonly string[]).includes(v);
}
