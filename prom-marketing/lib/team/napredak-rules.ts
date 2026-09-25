/**
 * „Напредък“ — числата на един човек от екипа (и на собственика), сметнати по
 * едни и същи правила за всекиго. Чисти функции, без база, за да се тестват.
 *
 * Източниците:
 *  - contact_activities — какво е натиснал човекът (created_by = името му);
 *  - bookings — кой е записал срещата („Записа: Димитър“ в raw_payload.notes)
 *    и какво е станало с нея (проведена, не се яви, предстои, отказана);
 *  - project_tasks — задачите му (през loadTasksFor);
 *  - contacts — кога се е появил лийдът, за скоростта до първото докосване.
 *
 * Няма измислени „цели“. Единствените сравнения са истински: с предходния
 * равен период и с другите хора.
 */
import { dayKey } from "@/lib/contacts/followup";
import {
  TOUCH_TYPES,
  deltaPct,
  normalizeActor,
  perDay,
  speedOf,
  workdaysBetween,
  type Actor,
  type SpeedStats,
} from "@/lib/crm/efektivnost";
import { bucketOf, type TaskLite } from "./tasks-rules";
import type { TeamRole } from "./types";

// ── Входът ──────────────────────────────────────────────────────────────────

export interface NapredakActivity {
  contact_id: string;
  activity_type: string;
  occurred_at: string;
  /** кога е записана — при среща, записана днес за утре, това е „днес“ */
  created_at?: string | null;
  created_by: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NapredakBooking {
  id: string;
  status: string;
  scheduled_at: string;
  created_at: string;
  /** raw_payload.notes — тук стои подписът „Записа: <име>“ */
  notes: string | null;
}

export interface NapredakLead {
  id: string;
  created_at: string;
}

/** Задачата, както идва от loadTasksFor — с името на изпълнителя, попълнено при четене. */
export interface NapredakTask extends TaskLite {
  assignee_name?: string | null;
}

export interface PersonRef {
  /** slug-ът на човека; собственикът е „ivailo“ (както в TeamActor) */
  key: string;
  name: string;
  role: TeamRole;
  kind: "owner" | "team";
  memberId: string | null;
}

export const OWNER_REF: PersonRef = { key: "ivailo", name: "Ивайло", role: "owner", kind: "owner", memberId: null };

export interface NapredakPool {
  activities: NapredakActivity[];
  leads: NapredakLead[];
  bookings: NapredakBooking[];
  /** team_members.full_name — всички, и спрените, за да се разпознаят старите записи */
  teamNames: string[];
}

// ── Периодът ────────────────────────────────────────────────────────────────

export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

/** `?d=30` → 30; всичко друго → подразбирането. */
export function parsePeriod(v: string | string[] | undefined | null, fallback: Period = 30): Period {
  const raw = Array.isArray(v) ? v[0] : v;
  const n = Number(raw);
  return (PERIODS as readonly number[]).includes(n) ? (n as Period) : fallback;
}

// ── Кога е свършена работата ────────────────────────────────────────────────

const ms = (iso: string): number => new Date(iso).getTime();

/**
 * Моментът на действието: по-ранното от „кога е станало“ и „кога е записано“.
 * Срещата, записана днес за утре, стои в картона с датата на срещата — но
 * работата (обаждането) е от днес. Обратното — стар разговор, въведен по-късно —
 * си остава на своя ден.
 */
export function actedAt(a: Pick<NapredakActivity, "occurred_at" | "created_at">): string {
  if (!a.created_at) return a.occurred_at;
  return ms(a.created_at) < ms(a.occurred_at) ? a.created_at : a.occurred_at;
}

export interface Window {
  from: Date;
  to: Date;
}

/** В прозореца: от включително, до включително. */
export function inWindow(iso: string, w: Window): boolean {
  const t = ms(iso);
  return t >= w.from.getTime() && t <= w.to.getTime();
}

// ── Кой го е направил ───────────────────────────────────────────────────────

export function actorOf(a: Pick<NapredakActivity, "created_by">, teamNames: string[]): Actor {
  return normalizeActor(a.created_by, teamNames);
}

export function isBy(actor: Actor, person: PersonRef): boolean {
  if (person.kind === "owner") return actor.kind === "owner";
  return actor.kind === "team" && actor.name.trim().toLowerCase() === person.name.trim().toLowerCase();
}

/** Активностите на всеки човек от списъка — един проход, без значение колко са хората. */
export function splitByPerson(activities: NapredakActivity[], persons: PersonRef[], teamNames: string[]): Map<string, NapredakActivity[]> {
  const out = new Map<string, NapredakActivity[]>();
  for (const p of persons) out.set(p.key, []);
  for (const a of activities) {
    const actor = actorOf(a, teamNames);
    if (actor.kind === "auto") continue;
    for (const p of persons) {
      if (isBy(actor, p)) out.get(p.key)?.push(a);
    }
  }
  return out;
}

const BOOKED_BY = /Записа:\s*([^·(\n]+)/u;

/**
 * Кой е записал срещата. Екипът подписва бележката („… · Записа: Димитър“);
 * всичко без подпис — Cal.com, Хермес, ръчно от телефона — е на Ивайло.
 */
export function bookedBy(b: Pick<NapredakBooking, "notes">, teamNames: string[]): Actor {
  const m = b.notes ? BOOKED_BY.exec(b.notes) : null;
  if (m) {
    const actor = normalizeActor(m[1].trim(), teamNames);
    if (actor.kind !== "auto") return actor;
  }
  return { kind: "owner", name: "Ивайло" };
}

// ── Обажданията: какъв е бил изходът ────────────────────────────────────────

export type CallOutcome = "talked" | "no_answer" | "not_interested" | "wrong_number" | "unknown";

/** Бутоните от опашката, след които е имало истински разговор, стигнал донякъде. */
export const TALKED_OUTCOMES = new Set(["callback", "talked", "will_call", "meeting", "handoff"]);

/**
 * Изходът от обаждането. Екипът натиска бутон и той стои в metadata.outcome;
 * старите записи на Ивайло са с друг речник (answered_*, voicemail), а
 * записът в дневника (kind = dnevnik) е разговор по определение. Обаждане без
 * никакъв изход е „неизвестно“ — не се брои нито за „говорихме“, нито за
 * „не вдигна“, за да не се измислят числа.
 */
export function callOutcome(a: Pick<NapredakActivity, "metadata">): CallOutcome {
  const m = a.metadata ?? {};
  if (m.kind === "dnevnik") return "talked";
  const o = typeof m.outcome === "string" ? m.outcome : "";
  if (!o) return "unknown";
  if (TALKED_OUTCOMES.has(o) || o.startsWith("answered") || o.startsWith("callback")) return "talked";
  // „Спираме да звъним“ е последното „не вдигна“ — брои се като такова.
  if (o === "no_answer" || o === "voicemail" || o === "give_up") return "no_answer";
  if (o === "not_interested") return "not_interested";
  if (o === "wrong_number") return "wrong_number";
  return "unknown";
}

export function isHandoff(a: Pick<NapredakActivity, "metadata">): boolean {
  const m = a.metadata ?? {};
  return m.outcome === "handoff" || m.handoff === true;
}

/** Готовото съобщение по Viber за среща — брои се като съобщение, не като обаждане. */
export function isBookingMessage(a: Pick<NapredakActivity, "activity_type" | "metadata">): boolean {
  return a.activity_type === "viber_sent" && a.metadata?.booking_msg === true;
}

/** Човек се е чул (или писал) с човек. */
export function isTouch(a: Pick<NapredakActivity, "activity_type" | "metadata">): boolean {
  return (TOUCH_TYPES as readonly string[]).includes(a.activity_type) && !isBookingMessage(a);
}

/** Активността „среща“, натисната от бутона „Записах среща“ — тя е и обаждане. */
function isBookedMeeting(a: Pick<NapredakActivity, "activity_type" | "metadata">): boolean {
  return a.activity_type === "meeting" && a.metadata?.outcome === "meeting";
}

/** Действията, които се виждат по дни: чувания, готови задачи, обновления по проекти. */
export function isAction(a: Pick<NapredakActivity, "activity_type" | "metadata">): boolean {
  return isTouch(a) || a.activity_type === "task_done" || a.activity_type === "project_update";
}

/**
 * „Върнат на Ивайло след 7 дни без отговор“ — пише го сутрешната проверка
 * (created_by „система“), не човекът. Чий е: на този от екипа, който е
 * звънял на картона ПРЕДИ връщането. Собственикът получава картона, не го
 * губи, затова за него е винаги нула.
 */
export function escalationsOf(all: NapredakActivity[], mine: NapredakActivity[], person: PersonRef, w: Window): number {
  if (person.kind !== "team") return 0;
  const touchedAt = new Map<string, number>();
  for (const a of mine) {
    if (!isTouch(a)) continue;
    const t = ms(actedAt(a));
    const prev = touchedAt.get(a.contact_id);
    if (prev === undefined || t < prev) touchedAt.set(a.contact_id, t);
  }
  let n = 0;
  for (const a of all) {
    if (a.activity_type !== "escalated") continue;
    const at = actedAt(a);
    if (!inWindow(at, w)) continue;
    const first = touchedAt.get(a.contact_id);
    if (first !== undefined && first < ms(at)) n += 1;
  }
  return n;
}

// ── Обем ────────────────────────────────────────────────────────────────────

export interface CallStats {
  /** опити за обаждане: активност call + „Записах среща“ (тя също е обаждане) */
  calls: number;
  /** callback / talked / handoff / meeting / дневник */
  talked: number;
  /** вдигнали: говорихме + „не се интересува“ */
  reached: number;
  noAnswer: number;
  notInterested: number;
  wrongNumber: number;
  /** обаждания без отбелязан изход */
  unknown: number;
  /** предадени на Ивайло */
  handoffs: number;
  /** активности „среща“ — записани от бутона или вписани в картона */
  meetingsLogged: number;
  /** готови съобщения по Viber за срещи */
  messages: number;
  /** други Viber съобщения */
  viber: number;
  notes: number;
  projectUpdates: number;
  /** следи „готова задача“ в картоните на клиентите */
  tasksLogged: number;
  /** записи в дневника */
  diary: number;
  /** различни хора, докоснати поне веднъж */
  people: number;
  /** върнати на Ивайло след 7 дни без отговор */
  escalated: number;
}

export function emptyCallStats(): CallStats {
  return {
    calls: 0,
    talked: 0,
    reached: 0,
    noAnswer: 0,
    notInterested: 0,
    wrongNumber: 0,
    unknown: 0,
    handoffs: 0,
    meetingsLogged: 0,
    messages: 0,
    viber: 0,
    notes: 0,
    projectUpdates: 0,
    tasksLogged: 0,
    diary: 0,
    people: 0,
    escalated: 0,
  };
}

/**
 * Какво е свършил човекът по активностите му. Разбивката на обажданията се
 * събира до `calls`: не вдигна + не се интересува + грешен номер + говорихме +
 * без изход. Срещата от бутона „Записах среща“ е обаждане, което е стигнало
 * до среща — влиза и в `calls`, и в `talked`.
 */
export function callStats(acts: NapredakActivity[]): CallStats {
  const s = emptyCallStats();
  const people = new Set<string>();
  for (const a of acts) {
    if (a.metadata?.kind === "dnevnik") s.diary += 1;
    switch (a.activity_type) {
      case "call": {
        s.calls += 1;
        people.add(a.contact_id);
        const o = callOutcome(a);
        if (o === "talked") s.talked += 1;
        else if (o === "no_answer") s.noAnswer += 1;
        else if (o === "not_interested") s.notInterested += 1;
        else if (o === "wrong_number") s.wrongNumber += 1;
        else s.unknown += 1;
        if (isHandoff(a)) s.handoffs += 1;
        break;
      }
      case "meeting": {
        s.meetingsLogged += 1;
        people.add(a.contact_id);
        if (isBookedMeeting(a)) {
          s.calls += 1;
          s.talked += 1;
        }
        break;
      }
      case "viber_sent": {
        if (isBookingMessage(a)) s.messages += 1;
        else {
          s.viber += 1;
          people.add(a.contact_id);
        }
        break;
      }
      case "note":
        s.notes += 1;
        break;
      case "project_update":
        s.projectUpdates += 1;
        break;
      case "task_done":
        s.tasksLogged += 1;
        break;
      default:
        break;
    }
  }
  s.reached = s.talked + s.notInterested;
  s.people = people.size;
  return s;
}

// ── Срещите по bookings ─────────────────────────────────────────────────────

export interface MeetingStats {
  /** записани в периода (по created_at на записа) */
  booked: number;
  completed: number;
  noShow: number;
  upcoming: number;
  cancelled: number;
  /** минали, без никой да е отбелязал какво е станало */
  pastUnmarked: number;
  /** проведени / (проведени + не се явили) */
  showRate: number | null;
}

export function meetingStats(bookings: NapredakBooking[], now: Date): MeetingStats {
  const s: MeetingStats = { booked: 0, completed: 0, noShow: 0, upcoming: 0, cancelled: 0, pastUnmarked: 0, showRate: null };
  const nowMs = now.getTime();
  for (const b of bookings) {
    s.booked += 1;
    switch (b.status) {
      case "completed":
        s.completed += 1;
        break;
      case "no_show":
        s.noShow += 1;
        break;
      case "cancelled":
      case "rejected":
        s.cancelled += 1;
        break;
      default:
        if (ms(b.scheduled_at) > nowMs) s.upcoming += 1;
        else s.pastUnmarked += 1;
    }
  }
  const decided = s.completed + s.noShow;
  s.showRate = decided === 0 ? null : Math.round((s.completed / decided) * 100);
  return s;
}

// ── Задачите ────────────────────────────────────────────────────────────────

export interface TaskStats {
  /** готови в периода (по done_at) */
  done: number;
  overdue: number;
  today: number;
  week: number;
  later: number;
  nodate: number;
  open: number;
}

export function tasksDoneBetween(tasks: Array<Pick<TaskLite, "status" | "done_at">>, w: Window): number {
  let n = 0;
  for (const t of tasks) {
    if (t.status !== "done" || !t.done_at) continue;
    if (inWindow(t.done_at, w)) n += 1;
  }
  return n;
}

/** Снимка на задачите сега + готовите за периода. */
export function taskStats(tasks: NapredakTask[], now: Date, w: Window): TaskStats {
  const s: TaskStats = { done: tasksDoneBetween(tasks, w), overdue: 0, today: 0, week: 0, later: 0, nodate: 0, open: 0 };
  for (const t of tasks) {
    const b = bucketOf(t, now);
    if (b === "done") continue;
    s[b] += 1;
    s.open += 1;
  }
  return s;
}

/**
 * Задачите на собственика: без изпълнител и без отговорник по проекта.
 * loadTasksFor попълва assignee_name „Ивайло“ точно в този случай; всичко
 * с име на човек от екипа е негово, дори assignee_id да е празен (наследено
 * от проекта).
 */
export function ownerTasksOf<T extends NapredakTask>(rows: T[]): T[] {
  return rows.filter((r) => !r.assignee_id && r.assignee_name === "Ивайло");
}

// ── Сглобяването за един човек ──────────────────────────────────────────────

export interface PeriodStats {
  volume: CallStats;
  meetings: MeetingStats;
  speed: SpeedStats;
  tasksDone: number;
  /** говорихме / обаждания с отбелязан изход, в проценти */
  talkedPct: number | null;
  /** колко разговора („говорихме“) за една записана среща */
  perMeeting: number | null;
}

export type DeltaKey = "calls" | "talked" | "meetings" | "people" | "tasksDone" | "messages" | "projectUpdates";

export interface PersonNapredak {
  person: PersonRef;
  cur: PeriodStats;
  prev: PeriodStats;
  deltas: Record<DeltaKey, number | null>;
  tasks: TaskStats;
  perDay: Array<{ day: string; n: number }>;
  insights: string[];
}

export interface AggregateContext {
  days: number;
  now: Date;
}

export function windowsFor(ctx: AggregateContext): { cur: Window; prev: Window } {
  const from = new Date(ctx.now.getTime() - ctx.days * 86_400_000);
  const prevFrom = new Date(from.getTime() - ctx.days * 86_400_000);
  // Предходният период свършва миг преди да започне текущият.
  return { cur: { from, to: ctx.now }, prev: { from: prevFrom, to: new Date(from.getTime() - 1) } };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function periodStats(args: {
  mine: NapredakActivity[];
  all: NapredakActivity[];
  person: PersonRef;
  bookings: NapredakBooking[];
  leads: NapredakLead[];
  tasks: NapredakTask[];
  teamNames: string[];
  w: Window;
  now: Date;
}): PeriodStats {
  const { w } = args;
  const acts = args.mine.filter((a) => inWindow(actedAt(a), w));
  const volume = callStats(acts);
  volume.escalated = escalationsOf(args.all, args.mine, args.person, w);

  const booked = args.bookings.filter((b) => inWindow(b.created_at, w) && isBy(bookedBy(b, args.teamNames), args.person));
  const meetings = meetingStats(booked, args.now);

  // Първото МОЕ докосване на всеки лийд — където и да е във времето, за да
  // не изчезне лийд от края на периода, чуван ден по-късно.
  const firstTouch = new Map<string, string>();
  for (const a of args.mine) {
    if (!isTouch(a)) continue;
    const t = actedAt(a);
    const prev = firstTouch.get(a.contact_id);
    if (!prev || ms(t) < ms(prev)) firstTouch.set(a.contact_id, t);
  }
  const leads = args.leads.filter((l) => inWindow(l.created_at, w));
  const speed = speedOf(
    leads.map((l) => ({ id: l.id, stage: "lead", created_at: l.created_at, updated_at: l.created_at, deal_value_eur: null, next_followup_at: null, last_heard_from_at: null })),
    firstTouch
  );

  const known = volume.calls - volume.unknown;
  return {
    volume,
    meetings,
    speed,
    tasksDone: tasksDoneBetween(args.tasks, w),
    talkedPct: known === 0 ? null : Math.round((volume.talked / known) * 100),
    perMeeting: meetings.booked === 0 || volume.talked === 0 ? null : round1(volume.talked / meetings.booked),
  };
}

/** Числата на един човек за периода и за предходния равен период. */
export function personNapredak(pool: NapredakPool, person: PersonRef, mine: NapredakActivity[], tasks: NapredakTask[], ctx: AggregateContext): PersonNapredak {
  const { cur, prev } = windowsFor(ctx);
  const base = { mine, all: pool.activities, person, bookings: pool.bookings, leads: pool.leads, tasks, teamNames: pool.teamNames, now: ctx.now };
  const curStats = periodStats({ ...base, w: cur });
  const prevStats = periodStats({ ...base, w: prev });

  const actions = mine
    .filter((a) => isAction(a))
    .map((a) => ({ ...a, occurred_at: actedAt(a) }))
    .filter((a) => inWindow(a.occurred_at, cur));

  const out: PersonNapredak = {
    person,
    cur: curStats,
    prev: prevStats,
    deltas: {
      calls: deltaPct(curStats.volume.calls, prevStats.volume.calls),
      talked: deltaPct(curStats.volume.talked, prevStats.volume.talked),
      meetings: deltaPct(curStats.meetings.booked, prevStats.meetings.booked),
      people: deltaPct(curStats.volume.people, prevStats.volume.people),
      tasksDone: deltaPct(curStats.tasksDone, prevStats.tasksDone),
      messages: deltaPct(curStats.volume.messages, prevStats.volume.messages),
      projectUpdates: deltaPct(curStats.volume.projectUpdates, prevStats.volume.projectUpdates),
    },
    tasks: taskStats(tasks, ctx.now, cur),
    perDay: perDay(actions, cur.from, cur.to),
    insights: [],
  };
  out.insights = insightsFor(out);
  return out;
}

// ── Сравнението с екипа ─────────────────────────────────────────────────────

export interface TeamRow {
  person: PersonRef;
  calls: number;
  talked: number;
  meetings: number;
  showRate: number | null;
  medianMinutes: number | null;
  people: number;
  tasksDone: number;
  tasksOverdue: number;
  projectUpdates: number;
}

export type TeamAverage = Omit<TeamRow, "person">;

export function teamRowOf(p: PersonNapredak): TeamRow {
  return {
    person: p.person,
    calls: p.cur.volume.calls,
    talked: p.cur.volume.talked,
    meetings: p.cur.meetings.booked,
    showRate: p.cur.meetings.showRate,
    medianMinutes: p.cur.speed.medianMinutes,
    people: p.cur.volume.people,
    tasksDone: p.cur.tasksDone,
    tasksOverdue: p.tasks.overdue,
    projectUpdates: p.cur.volume.projectUpdates,
  };
}

function hasWork(r: TeamRow): boolean {
  return r.calls + r.meetings + r.tasksDone + r.projectUpdates + r.people > 0;
}

/**
 * Средното по хората, които изобщо са работили в периода — човек без нито
 * едно действие не сваля средното на другите. Явяемост и скорост се
 * усредняват само по тези, които ги имат.
 */
export function teamAverage(rows: TeamRow[]): TeamAverage | null {
  const active = rows.filter(hasWork);
  if (active.length === 0) return null;
  const mean = (pick: (r: TeamRow) => number | null): number | null => {
    const vals = active.map(pick).filter((v): v is number => v !== null);
    return vals.length === 0 ? null : round1(vals.reduce((s, v) => s + v, 0) / vals.length);
  };
  return {
    calls: mean((r) => r.calls) ?? 0,
    talked: mean((r) => r.talked) ?? 0,
    meetings: mean((r) => r.meetings) ?? 0,
    showRate: mean((r) => r.showRate),
    medianMinutes: mean((r) => r.medianMinutes),
    people: mean((r) => r.people) ?? 0,
    tasksDone: mean((r) => r.tasksDone) ?? 0,
    tasksOverdue: mean((r) => r.tasksOverdue) ?? 0,
    projectUpdates: mean((r) => r.projectUpdates) ?? 0,
  };
}

// ── Всички наведнъж ─────────────────────────────────────────────────────────

export interface NapredakAll {
  days: number;
  from: string;
  to: string;
  workdays: number;
  people: PersonNapredak[];
  team: TeamRow[];
  average: TeamAverage | null;
}

/** Таблото на един човек: неговите числа + всички в сравнението. */
export interface NapredakData {
  days: number;
  from: string;
  to: string;
  workdays: number;
  me: PersonNapredak;
  team: TeamRow[];
  average: TeamAverage | null;
  /** кои хора има — за превключвателя на собственика */
  people: PersonRef[];
}

export function aggregateAll(pool: NapredakPool, persons: PersonRef[], tasksByKey: Map<string, NapredakTask[]>, ctx: AggregateContext): NapredakAll {
  const { cur } = windowsFor(ctx);
  const split = splitByPerson(pool.activities, persons, pool.teamNames);
  const people = persons.map((p) => personNapredak(pool, p, split.get(p.key) ?? [], tasksByKey.get(p.key) ?? [], ctx));
  const team = people.map(teamRowOf);
  return {
    days: ctx.days,
    from: cur.from.toISOString(),
    to: cur.to.toISOString(),
    workdays: workdaysBetween(cur.from, cur.to),
    people,
    team,
    average: teamAverage(team),
  };
}

export function dataFor(all: NapredakAll, key: string): NapredakData | null {
  const me = all.people.find((p) => p.person.key === key);
  if (!me) return null;
  return {
    days: all.days,
    from: all.from,
    to: all.to,
    workdays: all.workdays,
    me,
    team: all.team,
    average: all.average,
    people: all.people.map((p) => p.person),
  };
}

// ── Изводите: прости правила върху истинските числа ────────────────────────

/** Минути → „34 мин“ / „5 ч 20 мин“ / „2 дни“. */
export function humanMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} мин`;
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
  }
  const d = Math.round(minutes / 1440);
  return d === 1 ? "1 ден" : `${d} дни`;
}

export function fmtNum(n: number): string {
  return n.toLocaleString("bg-BG", { maximumFractionDigits: 1 });
}

/** „1 среща“ / „3 срещи“ — за изреченията. */
export function plural(n: number, one: string, many: string): string {
  return `${fmtNum(n)} ${n === 1 ? one : many}`;
}

export function insightsFor(p: PersonNapredak): string[] {
  const out: string[] = [];
  const { cur, prev, tasks } = p;
  const v = cur.volume;
  const nothing = v.calls + v.people + cur.meetings.booked + cur.tasksDone + v.projectUpdates + v.notes + v.messages === 0;
  if (nothing) {
    out.push("Още няма записани действия за този период.");
    if (tasks.overdue > 0) out.push(`${plural(tasks.overdue, "просрочена задача", "просрочени задачи")}.`);
    return out;
  }

  // Колко разговора за една среща — само когато има и двете и има смисъл (≥ 1).
  if (cur.perMeeting !== null && cur.perMeeting >= 1) {
    const now = plural(cur.perMeeting, "разговор", "разговора");
    const before = prev.perMeeting !== null && prev.perMeeting >= 1 ? `; миналия период бяха ${fmtNum(prev.perMeeting)}` : "";
    out.push(`За 1 среща ти трябват ${now}${before}.`);
  }

  // Вдигнали → среща: истинската конверсия на разговорите.
  if (v.notInterested > 0 && cur.meetings.booked > 0 && v.reached >= cur.meetings.booked) {
    out.push(`От ${plural(v.reached, "вдигнал", "вдигнали")} ${cur.meetings.booked} записаха среща (${Math.round((cur.meetings.booked / v.reached) * 100)}%).`);
  }

  // Говорихме / обаждания — по обажданията с отбелязан изход.
  const known = v.calls - v.unknown;
  if (cur.talkedPct !== null && known >= 5) {
    const before = prev.talkedPct !== null ? ` Миналия период: ${prev.talkedPct}%.` : "";
    out.push(`Говорихме в ${cur.talkedPct}% от обажданията (${v.talked} от ${known}).${before}`);
  }

  if (v.calls > 0 && p.deltas.calls !== null && Math.abs(p.deltas.calls) >= 15) {
    const dir = p.deltas.calls > 0 ? "повече" : "по-малко";
    out.push(`Обажданията са с ${Math.abs(p.deltas.calls)}% ${dir} от предходния период (${v.calls} срещу ${prev.volume.calls}).`);
  }

  if (cur.speed.medianMinutes !== null) {
    const before = prev.speed.medianMinutes !== null ? ` Миналия период: ${humanMinutes(prev.speed.medianMinutes)}.` : "";
    out.push(`Средно стигаш до новия лийд за ${humanMinutes(cur.speed.medianMinutes)}.${before}`);
  }

  if (cur.meetings.showRate !== null) {
    out.push(`Явяемост ${cur.meetings.showRate}% — ${cur.meetings.completed} проведени, ${cur.meetings.noShow} не се явиха.`);
  }
  // Предстоящите се виждат в панела „Срещи“; тук само това, което иска действие.
  if (cur.meetings.pastUnmarked > 0) {
    out.push(`${plural(cur.meetings.pastUnmarked, "минала среща", "минали срещи")} без отбелязан изход — проведена или не се яви?`);
  }

  if (v.handoffs > 0) out.push(`${plural(v.handoffs, "човек е предаден", "души са предадени")} на Ивайло.`);
  if (v.escalated > 0) out.push(`${plural(v.escalated, "лийд е върнат", "лийда са върнати")} на Ивайло след 7 дни без отговор.`);

  if (tasks.overdue > 0) out.push(`${plural(tasks.overdue, "просрочена задача", "просрочени задачи")}.`);
  else if (tasks.today > 0) out.push(`Няма просрочени задачи; ${tasks.today} за днес.`);
  if (cur.tasksDone > 0 && p.deltas.tasksDone !== null && p.deltas.tasksDone !== 0) {
    out.push(`${plural(cur.tasksDone, "готова задача", "готови задачи")}; миналия период ${prev.tasksDone}.`);
  }
  if (v.projectUpdates > 0) {
    const before = prev.volume.projectUpdates > 0 ? `; миналия период ${prev.volume.projectUpdates}` : "";
    out.push(`${plural(v.projectUpdates, "обновление по проект", "обновления по проекти")}${before}.`);
  }
  if (v.messages > 0) out.push(`${plural(v.messages, "съобщение по Viber за среща", "съобщения по Viber за срещи")}.`);

  return out;
}

/** Само за спарклайна: събота и неделя се оцветяват различно. */
export function isWeekend(day: string): boolean {
  return [0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay());
}

/** Днешният ключ — за да се маркира последната колона. */
export function todayKey(now: Date = new Date()): string {
  return dayKey(now);
}
