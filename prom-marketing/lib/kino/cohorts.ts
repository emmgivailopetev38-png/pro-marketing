/**
 * Потоците — чисти функции (без база), за да се тестват.
 *
 * Първият поток започва в понеделник, 19.10.2026, а записването в него
 * затваря с прожекцията (screening.closeISO — нд 18.10, 23:59). После —
 * нов поток всеки месец (cohorts.everyMonths), в същия пореден ден от
 * седмицата (19.10 е третият понеделник → 16.11, 21.12, 18.01…). Записването
 * във всеки следващ затваря в деня преди него, 23:59. Местата: KINO.seats.
 *
 * Кой в кой поток влиза:
 *  - до затварянето на първия — в първия (ако има места; пълен → в следващия);
 *  - след него платилите капаро доплащат за потока, в който е капарото им;
 *  - всички останали (след разговор) — в първия поток, който още записва.
 */
import { KINO } from "./config";
import { sofiaLocalMs, sofiaDayLabel, sofiaOnDay, sofiaTimeLabel, sofiaDate } from "./time";

export interface KinoCohort {
  /** 0 — първият поток */
  index: number;
  /** „potok-2026-10-19“ — влиза в метаданните на плащанията */
  id: string;
  /** денят на старта, 00:00 софийско */
  startMs: number;
  /** записването затваря */
  closeMs: number;
  seats: number;
}

type CohortCfg = { firstStartDate: string; everyMonths: number };

const MAX_AHEAD = 36;

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): number {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const day = 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth ? day : day - 7;
}

export function cohortAt(
  index: number,
  cfg: CohortCfg = KINO.cohorts,
  firstCloseISO: string = KINO.screening.closeISO,
  seats: number = KINO.seats,
): KinoCohort {
  const [y, m, d] = cfg.firstStartDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const nth = Math.ceil(d / 7);
  const months = m - 1 + index * Math.max(1, cfg.everyMonths);
  const year = y + Math.floor(months / 12);
  const month = (months % 12) + 1;
  const day = index === 0 ? d : nthWeekdayOfMonth(year, month, weekday, nth);
  const dayBefore = new Date(Date.UTC(year, month - 1, day - 1));
  return {
    index,
    id: `potok-${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    startMs: sofiaLocalMs(year, month, day),
    closeMs:
      index === 0
        ? Date.parse(firstCloseISO)
        : sofiaLocalMs(dayBefore.getUTCFullYear(), dayBefore.getUTCMonth() + 1, dayBefore.getUTCDate(), 23, 59),
    seats,
  };
}

export function firstCohort(): KinoCohort {
  return cohortAt(0);
}

export function cohortById(id: string | null | undefined, cfg: CohortCfg = KINO.cohorts): KinoCohort | null {
  if (!id) return null;
  for (let i = 0; i <= MAX_AHEAD; i++) {
    const c = cohortAt(i, cfg);
    if (c.id === id) return c;
  }
  return null;
}

/** Първият поток, който още записва и има места. */
export function enrollmentCohort(nowMs: number, takenOf: (id: string) => number = () => 0, cfg: CohortCfg = KINO.cohorts): KinoCohort {
  let last = cohortAt(0, cfg);
  for (let i = 0; i <= MAX_AHEAD; i++) {
    const c = cohortAt(i, cfg);
    last = c;
    if (c.closeMs > nowMs && takenOf(c.id) < c.seats) return c;
  }
  return last;
}

/**
 * Потокът на конкретния човек: платилият капаро е в потока на капарото си
 * (там му е запазено мястото), останалите — в първия, който още записва.
 */
export function cohortForBuyer(args: {
  nowMs: number;
  depositCohortId?: string | null;
  takenOf?: (id: string) => number;
  cfg?: CohortCfg;
}): KinoCohort {
  const cfg = args.cfg ?? KINO.cohorts;
  if (args.depositCohortId) return cohortById(args.depositCohortId, cfg) ?? cohortAt(0, cfg);
  return enrollmentCohort(args.nowMs, args.takenOf, cfg);
}

export interface KinoCohortView {
  id: string;
  index: number;
  /** „понеделник, 19 октомври“ */
  startDay: string;
  /** „в понеделник, 19 октомври“ */
  startOnDay: string;
  /** „19.10“ */
  startShort: string;
  /** „неделя, 18 октомври“ · „23:59“ · „18.10, 23:59“ */
  closeDay: string;
  closeTime: string;
  closeShort: string;
  closeMs: number;
  seats: number;
  /** null — не се знае (няма база) */
  seatsLeft: number | null;
}

export function cohortView(c: KinoCohort, taken: number | null = null): KinoCohortView {
  return {
    id: c.id,
    index: c.index,
    startDay: sofiaDayLabel(c.startMs),
    startOnDay: sofiaOnDay(c.startMs),
    startShort: sofiaDate(c.startMs),
    closeDay: sofiaDayLabel(c.closeMs),
    closeTime: sofiaTimeLabel(c.closeMs),
    closeShort: `${sofiaDate(c.closeMs)}, ${sofiaTimeLabel(c.closeMs)}`,
    closeMs: c.closeMs,
    seats: c.seats,
    seatsLeft: taken == null ? null : Math.max(0, c.seats - taken),
  };
}

/**
 * Колко места са заети във всеки поток — по различни хора с плащане или
 * капаро. Стари записи без поток се броят към първия.
 */
export function seatsByCohort(
  rows: ReadonlyArray<{ contact_id: string; metadata: Record<string, unknown> | null }>,
  firstId: string = cohortAt(0).id,
): Map<string, number> {
  const people = new Map<string, Set<string>>();
  for (const r of rows) {
    const id = typeof r.metadata?.cohort === "string" && r.metadata.cohort ? r.metadata.cohort : firstId;
    if (!people.has(id)) people.set(id, new Set());
    people.get(id)!.add(r.contact_id);
  }
  return new Map([...people].map(([id, set]) => [id, set.size]));
}
