/**
 * Чистите правила на опашката за звънене — без база и без "server-only", за
 * да се тестват. Тук живее отговорът на въпроса „къде е картата сега“:
 *
 * - „нови“ = без нито един опит за контакт;
 * - „от Ивайло“ = Ивайло изрично е дал картона на екипа (не вдигат, разбрали
 *   сте се и не се обадиха, или контактът е бил съвсем лек). Стои там, докато
 *   екипът не го докосне веднъж — тогава влиза в обичайния поток;
 * - „за повторно“ = екипът е насрочил чуване и денят му е дошъл;
 * - „чакат обратно обаждане“ = екипът е натиснал „Не вдигна“ или „чуване пак“
 *   за по-нататък. Картата НЕ изчезва — хората връщат обаждане десет минути
 *   по-късно и срещата трябва да се запише от същата карта. Изчезва, когато
 *   човекът сам я скрие или когато часът ѝ дойде (тогава е „за повторно“);
 * - предаден на Ивайло (handoff) = вече не е в списъка на екипа.
 */
import { TZ, dayKey } from "@/lib/contacts/followup";
import type { LastAttempt } from "./types";

export interface AttemptRow {
  contact_id: string;
  activity_type: string;
  title: string;
  occurred_at: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

/** Маркерът „този картон е на екипа“ — не е опит за контакт. */
export const ASSIGN_TYPE = "team_assigned";

/** Защо картонът е при екипа: Ивайло го е дал, човекът е отказал срещата, или не се е явил на нея. */
export type GivenKind = "given" | "cancelled" | "noshow";

/** Активността „върнат на Ивайло след 7 дни без резултат“ — не е опит за контакт. */
export const ESCALATED_TYPE = "escalated";

/** Защо картонът е даден — излиза на картата, за да знае човекът с какво влиза. */
export interface GivenMark {
  at: string;
  by: string | null;
  /** на кого е дадено — за да се вижда в списъка на Ивайло кой го държи */
  to: string | null;
  kind: GivenKind;
  reason: string | null;
  /** при „не се яви“: коя среща е пропусната и линкът ѝ */
  missed_at: string | null;
  missed_url: string | null;
  missed_booking_id: string | null;
}

export interface AttemptSummary {
  count: number;
  /** поне един опит е на човек от екипа */
  team: boolean;
  /** последният ИСТИНСКИ опит; null, ако има само маркер за прехвърляне */
  last: LastAttempt | null;
  /** даден от Ивайло и още недокоснат от екипа */
  given: GivenMark | null;
  /** върнат на Ивайло (7 дни без резултат) и екипът не е звънял след това */
  escalated: boolean;
}

/** Изходите, след които човекът може да върне обаждане и картата остава под ръка. */
export const AWAITING_CALLBACK = new Set(["no_answer", "callback", "talked"]);

export function lastAttemptFromRow(row: AttemptRow): LastAttempt {
  const m = row.metadata ?? {};
  return {
    title: row.title,
    at: row.occurred_at,
    by: row.created_by,
    outcome: typeof m.outcome === "string" ? m.outcome : null,
    hidden: m.hidden === true,
    handoff: m.handoff === true,
  };
}

/**
 * Редовете идват подредени по occurred_at НИЗХОДЯЩО — първият за картон е
 * последният опит. Маркерът за прехвърляне не се брои за опит: той само казва
 * „този е на екипа“ и важи, докато екипът не звънне ПОСЛЕ него.
 */
export function summarizeAttempts(rows: AttemptRow[]): Map<string, AttemptSummary> {
  const out = new Map<string, AttemptSummary>();
  const touchedAfter = new Set<string>();
  for (const a of rows) {
    const cur = out.get(a.contact_id) ?? { count: 0, team: false, last: null, given: null, escalated: false };
    if (!out.has(a.contact_id)) out.set(a.contact_id, cur);
    if (a.activity_type === ESCALATED_TYPE) {
      // Върнат на Ивайло: важи, докато екипът не го докосне отново. По-старите
      // маркери „дадено на екипа“ вече не важат — затова се брои за „докоснат“.
      if (!touchedAfter.has(a.contact_id)) cur.escalated = true;
      touchedAfter.add(a.contact_id);
      continue;
    }
    if (a.activity_type === ASSIGN_TYPE) {
      // Даден на продавач (owner_id) — това не е маркер за опашката за звънене.
      if (a.metadata?.kind === "sales") continue;
      // Най-новият маркер, стига екипът да не е звънял след него.
      if (!cur.given && !touchedAfter.has(a.contact_id)) {
        cur.given = {
          at: a.occurred_at,
          by: a.created_by,
          to: strOf(a.metadata?.to_name),
          kind: a.metadata?.kind === "cancelled" ? "cancelled" : a.metadata?.kind === "noshow" ? "noshow" : "given",
          reason: reasonOf(a),
          missed_at: strOf(a.metadata?.missed_at),
          missed_url: strOf(a.metadata?.missed_url),
          missed_booking_id: strOf(a.metadata?.missed_booking_id),
        };
      }
      continue;
    }
    // Готовите съобщения за срещата (потвърждение, напомняне) не са опит за
    // контакт: не местят картата и не „докосват“ маркера от Ивайло.
    if (a.activity_type === "viber_sent" && a.metadata?.booking_msg === true) continue;
    const team = a.metadata?.team === true;
    cur.count += 1;
    cur.team = cur.team || team;
    if (team) touchedAfter.add(a.contact_id);
    if (!cur.last) cur.last = lastAttemptFromRow(a);
  }
  return out;
}

function strOf(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function reasonOf(row: AttemptRow): string | null {
  return strOf(row.metadata?.reason) ?? row.title ?? null;
}

/**
 * Картоните, които Ивайло е дал и екипът още не е пипнал — най-скоро дадените
 * най-горе. Излизат независимо от датата за чуване: те са в списъка, защото
 * някой ги е дал, а не защото им е дошъл часът.
 */
export function pickGiven<T extends { id: string }>(rows: T[], attempts: Map<string, AttemptSummary>): T[] {
  return rows
    .filter((c) => attempts.get(c.id)?.given)
    .sort((a, b) => (attempts.get(b.id)?.given?.at ?? "").localeCompare(attempts.get(a.id)?.given?.at ?? ""));
}

export interface DueSplit<T> {
  retry: T[];
  waiting: T[];
  later: number;
}

/**
 * Разпределя хората със `needs_call`, на които екипът е звънял:
 * retry — часът е до края на днешния ден; waiting — още не е дошъл, но
 * последният изход позволява обратно обаждане и картата не е скрита;
 * later — само брой, за да се знае, че не са изгубени.
 * Предадените на Ивайло (последният опит е handoff) и върнатите след 7 дни
 * (escalated) не са на екипа изобщо.
 */
export function splitTeamDue<T extends { id: string; next_followup_at: string | null }>(
  due: T[],
  attempts: Map<string, AttemptSummary>,
  todayEnd: string
): DueSplit<T> {
  const team = due.filter((c) => {
    const a = attempts.get(c.id);
    return !!a && a.team && !a.last?.handoff && !a.escalated;
  });
  const retry = team.filter((c) => (c.next_followup_at ?? "") <= todayEnd);
  const retryIds = new Set(retry.map((c) => c.id));
  const waiting = team
    .filter((c) => {
      if (retryIds.has(c.id)) return false;
      const last = attempts.get(c.id)?.last;
      return !!last && !last.hidden && last.outcome !== null && AWAITING_CALLBACK.has(last.outcome);
    })
    .sort((a, b) => (attempts.get(b.id)?.last?.at ?? "").localeCompare(attempts.get(a.id)?.last?.at ?? ""));
  return { retry, waiting, later: team.length - retry.length - waiting.length };
}

/** Същият календарен ден в София. */
export function sameSofiaDay(a: string | Date, b: string | Date, tz: string = TZ): boolean {
  return dayKey(a, tz) === dayKey(b, tz);
}

/**
 * Каквото човекът види на екрана на телефона си, когато му звънят обратно:
 * „+359 876 888 162“, „0876888162“, „876 888“. Свежда се до цифрите без
 * кода на страната и без водещата нула, за да съвпадне и с „+359…“, и с „0…“
 * в базата. Под 3 цифри не е телефон.
 */
export function phoneDigits(q: string): string {
  let d = q.replace(/\D/g, "");
  if (d.startsWith("00359")) d = d.slice(5);
  else if (d.startsWith("359") && d.length >= 9) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d.length >= 3 ? d : "";
}

/** Заявката е телефон, ако няма букви и има поне 3 цифри. */
export function looksLikePhone(q: string): boolean {
  return !/\p{L}/u.test(q) && phoneDigits(q).length >= 3;
}

/** Текст за PostgREST `or(...)` — запетаите и скобите биха счупили филтъра. */
export function safeTextQuery(q: string): string {
  return q.replace(/[,()"'\\%]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}
