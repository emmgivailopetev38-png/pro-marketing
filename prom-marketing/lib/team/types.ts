/**
 * Екипът в CRM-а — типове без "server-only", за да ги ползват и клиентските
 * компоненти (картата на лийда, страницата „Екип“).
 */

export const TEAM_ROLES = ["owner", "setter", "sales", "delivery", "marketing"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Собственик",
  setter: "Срещи · звъни на лийдовете",
  sales: "Продавач · води разговорите и затваря",
  delivery: "Проекти · изпълнение и CRM системи",
  marketing: "Маркетинг · реклами и съдържание",
};

/** Кратък етикет за шапката и списъците. */
export const TEAM_ROLE_SHORT: Record<TeamRole, string> = {
  owner: "собственик",
  setter: "сетър",
  sales: "продавач",
  delivery: "изпълнение",
  marketing: "маркетинг",
};

/**
 * Модулите на /ekip. Кой какво вижда идва от ролята (lib/team/roles.ts), а
 * `permissions.modules` на човека го променя — така Ивайло сглобява „варианти
 * на профили“ без нова роля.
 */
export const TEAM_MODULES = [
  "zvanene",
  "prodazhbi",
  "proekti",
  "zadachi",
  "saobshtenia",
  "materiali",
  "ceni",
  "komisioni",
  "napredak",
  "belezhki",
] as const;
export type TeamModule = (typeof TEAM_MODULES)[number];

export const TEAM_MODULE_LABEL: Record<TeamModule, string> = {
  zvanene: "Звънене · опашка",
  prodazhbi: "Продажби · моите хора",
  proekti: "Проекти · изпълнение",
  zadachi: "Задачи",
  saobshtenia: "Съобщения",
  materiali: "Материали · обучение",
  ceni: "Цени",
  komisioni: "Комисионни",
  napredak: "Напредък · моите числа",
  belezhki: "Бележки · за системата",
};

export const TEAM_MODULE_HREF: Record<TeamModule, string> = {
  zvanene: "/ekip",
  prodazhbi: "/ekip/prodazhbi",
  proekti: "/ekip/proekti",
  zadachi: "/ekip/zadachi",
  saobshtenia: "/ekip/saobshtenia",
  materiali: "/ekip/materiali",
  ceni: "/ekip/ceni",
  komisioni: "/ekip/komisioni",
  napredak: "/ekip/napredak",
  belezhki: "/ekip/belezhki",
};

export interface TeamPermissions {
  /** true = вижда модула, false = не го вижда; липсващ ключ = по ролята */
  modules?: Partial<Record<TeamModule, boolean>>;
}

export interface TeamMember {
  id: string;
  slug: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: TeamRole;
  /** длъжност, както се показва на екрана („appointment setter“, „маркетинг“) */
  title?: string | null;
  permissions?: TeamPermissions | null;
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

/** Бележка от картона, както стои на картата в опашката. */
export interface CardNote {
  body: string;
  at: string;
  by: string | null;
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
  /** Колко пъти не е вдигнал — от него зависи бутонът „Спираме да звъним“. */
  no_answers?: number;
  /** Последните бележки в картона („Само бележка“ и др.), най-новата отгоре. */
  team_notes?: CardNote[];
  /** Ако е при екипа: защо — „не вдига“, „разбрахте се…“, „отказа срещата“. */
  given_reason?: string | null;
  /** При „не се яви“: коя среща е пропуснал (ISO) и линкът ѝ — за готовото съобщение. */
  missed_at?: string | null;
  missed_url?: string | null;
  missed_booking_id?: string | null;
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
 * noshow — не се е явил на срещата: звъни се пак и се записва нов час ·
 * retry — обещано чуване, чийто ден е дошъл ·
 * waiting — не е вдигнал / чуване по-късно, може да върне обаждане ·
 * search — намерен през търсачката (върнал е обаждане, който и да е).
 */
export type LeadCardMode = "fresh" | "given" | "cancelled" | "noshow" | "retry" | "waiting" | "search";

export const EKIP_ACTIONS = [
  "no_answer",
  "callback",
  "talked",
  "will_call",
  "meeting",
  "handoff",
  "not_interested",
  "wrong_number",
  "give_up",
  "note",
  "hide",
] as const;
export type EkipActionKind = (typeof EKIP_ACTIONS)[number];

export interface EkipActionResult {
  ok: boolean;
  message?: string;
  error?: string;
  /** Картата остава на екрана (бележка) — не се заменя със зеленото „готово“. */
  keep?: boolean;
}
