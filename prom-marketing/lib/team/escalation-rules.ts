/**
 * Седем дни без резултат → картонът се връща на Ивайло с цялата информация.
 *
 * Човек, който не вдига или отлага седмица наред, не бива да виси вечно при
 * човека за срещите: след 7 дни от първия негов опит, без среща, без „предай
 * на Ивайло“ и без „не се интересува“, картата излиза в сутрешния списък на
 * Ивайло („да ми се обадиш“) и напуска опашката на екипа. Чисти правила.
 */
import type { AttemptRow } from "./queue-rules";

export const ESCALATE_AFTER_DAYS = 7;
export const ESCALATED_TYPE = "escalated";

/** Изходи, след които няма какво да се връща — човекът е решил или е при Ивайло. */
const CLOSING = new Set(["meeting", "handoff", "not_interested", "wrong_number"]);

export interface EscalationVerdict {
  escalate: boolean;
  /** първият опит на екипа (в разглеждания отрязък) */
  firstTeamAt: string | null;
  teamAttempts: number;
  noAnswer: number;
  talked: number;
  lastOutcome: string | null;
  lastBy: string | null;
  daysSinceFirst: number | null;
}

/**
 * Редовете идват НИЗХОДЯЩО по време. Гледа се само отрязъкът след последното
 * връщане (`escalated`) — картон, вече върнат веднъж и пак даден на екипа,
 * се връща отново само след нови 7 дни.
 */
export function escalationVerdict(rows: AttemptRow[], now: Date = new Date(), days = ESCALATE_AFTER_DAYS): EscalationVerdict {
  const team: AttemptRow[] = [];
  for (const r of rows) {
    if (r.activity_type === ESCALATED_TYPE) break;
    if (r.activity_type === "team_assigned") continue;
    if (r.metadata?.team !== true) continue;
    if (r.metadata?.booking_msg === true) continue;
    team.push(r);
  }
  const out: EscalationVerdict = {
    escalate: false,
    firstTeamAt: team.length ? team[team.length - 1].occurred_at : null,
    teamAttempts: team.length,
    noAnswer: team.filter((r) => r.metadata?.outcome === "no_answer").length,
    talked: team.filter((r) => ["talked", "callback"].includes(String(r.metadata?.outcome ?? ""))).length,
    lastOutcome: team.length ? (typeof team[0].metadata?.outcome === "string" ? (team[0].metadata.outcome as string) : null) : null,
    lastBy: team.length ? team[0].created_by : null,
    daysSinceFirst: null,
  };
  if (!out.firstTeamAt) return out;
  out.daysSinceFirst = Math.floor((now.getTime() - new Date(out.firstTeamAt).getTime()) / 86_400_000);
  const closed = team.some((r) => r.activity_type === "meeting" || CLOSING.has(String(r.metadata?.outcome ?? "")));
  out.escalate = !closed && out.daysSinceFirst >= days;
  return out;
}

/** Едно изречение за картона и за писмото. */
export function escalationSummary(v: EscalationVerdict): string {
  const parts = [`${v.teamAttempts} опита от екипа за ${v.daysSinceFirst ?? 0} дни`];
  if (v.noAnswer) parts.push(`${v.noAnswer} × не вдигна`);
  if (v.talked) parts.push(`${v.talked} × говорихме без среща`);
  return parts.join(" · ");
}
