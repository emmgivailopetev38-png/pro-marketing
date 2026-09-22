/**
 * Екипът в CRM-а — типове без "server-only", за да ги ползват и клиентските
 * компоненти (картата на лийда, страницата „Екип“).
 */

export const TEAM_ROLES = ["owner", "setter", "delivery"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Собственик",
  setter: "Срещи · звъни на лийдовете",
  delivery: "Проекти · изпълнение",
};

export interface TeamMember {
  id: string;
  slug: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: TeamRole;
  active: boolean;
  notify_new_leads: boolean;
  notes: string | null;
  last_login_at: string | null;
  created_at: string;
}

/** Дейностите, между които човекът за срещите избира с едно докосване. */
export const BUSINESS_OPTIONS = [
  "Онлайн магазин / е-търговия",
  "Търговия / магазин",
  "Услуги / кабинет / салон",
  "Производство / цех",
  "Строителство / имоти / ремонти",
  "Счетоводство / консултации / обучения",
  "Транспорт / логистика",
  "Ресторант / хотел / туризъм",
  "Друго",
] as const;

export interface FormAnswer {
  question: string;
  answer: string;
}

/**
 * Последният опит за контакт от картона (call / meeting / viber_sent).
 * `outcome` е бутонът, който човекът от екипа е натиснал; `hidden` — той сам е
 * махнал картата от „чакат обратно обаждане“; `handoff` — предал е човека на
 * Ивайло и картата вече не е в неговия списък.
 */
export interface LastAttempt {
  title: string;
  at: string;
  by: string | null;
  outcome: string | null;
  hidden: boolean;
  handoff: boolean;
}

/** Ред в опашката за звънене — картонът плюс каквото трябва за разговора. */
export interface QueueLead {
  id: string;
  full_name: string | null;
  phone: string;
  email: string | null;
  company: string | null;
  business: string | null;
  source: string;
  stage: string;
  followup_status: string | null;
  next_followup_at: string | null;
  created_at: string;
  notes: string | null;
  ad_name: string | null;
  form_answers: FormAnswer[];
  attempts: number;
  last_attempt: LastAttempt | null;
  /** Ако е при екипа: защо — „не вдига“, „разбрахте се…“, „отказа срещата“. */
  given_reason?: string | null;
}

export interface BookedRow {
  id: string;
  attendee_name: string;
  attendee_phone: string | null;
  scheduled_at: string;
  business: string | null;
  status: string;
  notes: string | null;
}

/**
 * Откъде идва картата на екрана — определя кои бутони са отпред:
 * fresh — нов, за първи разговор · given — Ивайло го е дал на екипа ·
 * cancelled — човекът е отказал срещата и трябва да се премести ·
 * retry — обещано чуване, чийто ден е дошъл ·
 * waiting — не е вдигнал / чуване по-късно, може да върне обаждане ·
 * search — намерен през търсачката (върнал е обаждане, който и да е).
 */
export type LeadCardMode = "fresh" | "given" | "cancelled" | "retry" | "waiting" | "search";

export const EKIP_ACTIONS = [
  "no_answer",
  "callback",
  "meeting",
  "handoff",
  "not_interested",
  "wrong_number",
  "note",
  "hide",
] as const;
export type EkipActionKind = (typeof EKIP_ACTIONS)[number];

export interface EkipActionResult {
  ok: boolean;
  message?: string;
  error?: string;
}
