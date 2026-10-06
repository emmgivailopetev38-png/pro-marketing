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

/** „Искам първо да поговорим“ — за какво. Третият бутон води и „направете го вместо мен“. */
export const PRECALL_TOPICS: readonly Choice[] = [
  { id: "stream", label: "Дали потокът е за мен" },
  { id: "start", label: "Откъде да започна в моя бизнес" },
  { id: "done-for-you", label: "Искам да го направите вместо мен" },
  { id: "other", label: "Друго" },
];

export const PRECALL_WHEN: readonly Choice[] = [
  { id: "tonight", label: "Още тази вечер" },
  { id: "tomorrow", label: "Утре" },
  { id: "week", label: "Тази седмица" },
];

export function labelOf(list: readonly Choice[], id: string | null | undefined): string {
  return list.find((c) => c.id === id)?.label ?? "—";
}
