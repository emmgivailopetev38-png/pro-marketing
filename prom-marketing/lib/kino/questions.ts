/**
 * Въпросите към човека — едно място за текстовете и стойностите, които
 * отиват в CRM-а. Ползват ги билетът, залата и /api/kino/answers.
 */

export interface Choice {
  id: string;
  label: string;
}

/** Четирите нива от глава 9 („Тази вечер“) + „още никое“. */
export const WARMUP_LEVELS: readonly Choice[] = [
  { id: "none", label: "Още никое — тепърва започвам" },
  { id: "advisor", label: "Съветникът — питам AI, той отговаря" },
  { id: "helper", label: "Помощникът — някои неща вече стават сами" },
  { id: "employee", label: "Служителят — AI върши работа вместо мен" },
  { id: "team", label: "Екипът — няколко AI служители работят заедно" },
];

export const WARMUP_START: readonly Choice[] = [
  { id: "now", label: "Веднага — тази седмица" },
  { id: "month", label: "До месец" },
  { id: "quarter", label: "До 3 месеца" },
  { id: "looking", label: "Засега само разглеждам" },
];

/** „Твоето число“ — сцена 9.7: полето под филма. */
export const NUMBER_QUESTION = "Колко часа седмично ти отиват в повтаряща се работа?";
export const NUMBER_MAX_HOURS = 100;

/** Часовете, закръглени до половин час и в границите (0–100). null — ако не е число. */
export function cleanHours(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(",", ".")) : Number.NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(NUMBER_MAX_HOURS, Math.round(n * 2) / 2);
}

/** Заявката преди разговора (третият бутон „Искам първо да поговорим“). */
export const APP_TEAM: readonly Choice[] = [
  { id: "solo", label: "Сам съм" },
  { id: "small", label: "2–10 души" },
  { id: "big", label: "Над 10" },
];

export const APP_START: readonly Choice[] = [
  { id: "now", label: "Сега" },
  { id: "month", label: "До месец" },
  { id: "later", label: "По-късно" },
];

export function labelOf(list: readonly Choice[], id: string | null | undefined): string {
  return list.find((c) => c.id === id)?.label ?? "—";
}
