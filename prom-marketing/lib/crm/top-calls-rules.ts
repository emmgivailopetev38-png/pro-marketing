/**
 * „📞 Топ 10 за днес" — кого да звънне Ивайло първо. Чиста логика, без база.
 *
 * Одитът от 24.10.2026: ~49 истински сделки (~58 000 €) се губеха сред 113
 * студени просрочени `needs_call`. Плоският списък „просрочени" не казва кое е
 * важно. Тук: просрочените + днешните напомняния, подредени по стойност на
 * сделката, после по давност; спечелените и загубените не влизат; студените
 * (lead/contacted без сума, „да се обади" от над 14 дни) излизат отделно като
 * брой — за вълната по 10 на ден, не в топ 10.
 */
import { dayKey, followupState, type FollowupState } from "@/lib/contacts/followup";

export interface TopCallCandidate {
  id: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  stage: string;
  followup_status: string | null;
  deal_value_eur: number | null;
  next_followup_at: string | null;
  last_heard_from_at: string | null;
  /** Последният `call`/`meeting` в картона (за правилото „изпълнено"). */
  last_attempt_at: string | null;
  /** Последната активност от какъвто и да е тип, вече случила се. */
  last_activity: { type: string; occurred_at: string } | null;
}

export interface TopCallRow {
  id: string;
  name: string;
  company: string | null;
  amount: number | null;
  stage: string;
  followup_status: string | null;
  days_overdue: number;
  due_at: string;
  last_activity: { type: string; occurred_at: string } | null;
  phone: string | null;
  email: string | null;
}

export interface TopCallsResult {
  top: TopCallRow[];
  /** Студените за вълната — по 10 на ден, извън топ 10. */
  cold: number;
  /** Всички живи (просрочени + днешни), без студените. */
  warm_total: number;
}

export const COLD_AFTER_DAYS = 14;

/** Дни между два календарни дни в София („2026-10-10" → „2026-10-24" = 14). */
export function daysBetweenDays(fromDay: string, toDay: string): number {
  const [fy, fm, fd] = fromDay.split("-").map(Number);
  const [ty, tm, td] = toDay.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function isColdCandidate(c: TopCallCandidate, daysOverdue: number): boolean {
  return (
    (c.stage === "lead" || c.stage === "contacted") &&
    !c.deal_value_eur &&
    c.followup_status === "needs_call" &&
    daysOverdue > COLD_AFTER_DAYS
  );
}

export function rankTopCalls(candidates: TopCallCandidate[], now: Date = new Date(), limit = 10): TopCallsResult {
  const today = dayKey(now);
  const warm: TopCallRow[] = [];
  let cold = 0;

  for (const c of candidates) {
    if (c.stage === "won" || c.stage === "lost" || !c.next_followup_at) continue;
    const state: FollowupState = followupState(c, c.last_attempt_at, now);
    if (state !== "overdue" && state !== "due_today") continue;
    const daysOverdue = Math.max(0, daysBetweenDays(dayKey(c.next_followup_at), today));
    if (isColdCandidate(c, daysOverdue)) {
      cold++;
      continue;
    }
    warm.push({
      id: c.id,
      name: c.full_name?.trim() || c.company?.trim() || c.phone || c.email || "—",
      company: c.company,
      amount: c.deal_value_eur ?? null,
      stage: c.stage,
      followup_status: c.followup_status,
      days_overdue: daysOverdue,
      due_at: c.next_followup_at,
      last_activity: c.last_activity,
      phone: c.phone,
      email: c.email,
    });
  }

  warm.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0) || b.days_overdue - a.days_overdue || a.name.localeCompare(b.name, "bg"));
  return { top: warm.slice(0, limit), cold, warm_total: warm.length };
}
