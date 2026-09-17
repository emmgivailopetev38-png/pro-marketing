/**
 * „Моята ефективност“ — правилата, по които се мери СОБСТВЕНАТА работа.
 *
 * Таблото на /admin показва пари и тръба. Това тук отговаря на друг въпрос:
 * върша ли си работата и къде тече. Затова всичко брои само ЧОВЕШКИ действия —
 * автоматичните поредици, вносът от Meta и Хермес не са заслуга на никого.
 *
 * Чисти функции, без база: същите числа искаме и в теста, и на страницата.
 */
import { TZ, dayKey } from "@/lib/contacts/followup";
import type { PromiseRow } from "@/lib/contacts/dnevnik";

// ── Кой е направил действието ───────────────────────────────────────────────

export type ActorKind = "owner" | "team" | "auto";
export interface Actor {
  kind: ActorKind;
  name: string;
}

/** Каквото Ивайло е писал под различни имена през годините. */
const OWNER_ALIASES = new Set(["ивайло", "ivailo", "emmgivailopetev38@gmail.com", "ivailo petev", "ивайло петев"]);

/**
 * Автоматиките. Всичко, което не е човек от екипа и не е Ивайло, е автоматика —
 * нарочно „по подразбиране автоматика“: нов бот утре не бива да се брои
 * мълчаливо за нечия работа.
 */
export function normalizeActor(createdBy: string | null | undefined, teamNames: string[] = []): Actor {
  const raw = (createdBy ?? "").trim();
  const low = raw.toLowerCase();
  if (!raw) return { kind: "auto", name: "автоматика" };
  if (OWNER_ALIASES.has(low)) return { kind: "owner", name: "Ивайло" };
  const team = teamNames.find((n) => n.trim().toLowerCase() === low);
  if (team) return { kind: "team", name: team };
  return { kind: "auto", name: raw };
}

/** Действията, които значат „човек се е чул с човек“. */
export const TOUCH_TYPES = ["call", "meeting", "viber_sent"] as const;
/** Действията, които значат „изпратихме нещо“ — броят се само когато са ръчни. */
export const SENT_TYPES = ["email_sent", "presentation_sent", "offer_sent", "offer_created", "contract_sent"] as const;

export interface ActivityLite {
  contact_id: string;
  activity_type: string;
  occurred_at: string;
  created_by: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ContactLite {
  id: string;
  stage: string;
  created_at: string;
  updated_at: string;
  deal_value_eur: number | null;
  mood?: string | null;
  next_followup_at: string | null;
  last_heard_from_at: string | null;
}

// ── Обем: колко работа е свършена ───────────────────────────────────────────

export interface Volume {
  calls: number;
  meetings: number;
  sent: number;
  /** записани разговори в дневника (metadata.kind = "dnevnik") */
  diary: number;
  /** различни хора, докоснати поне веднъж */
  people: number;
}

export function volumeOf(activities: ActivityLite[]): Volume {
  const people = new Set<string>();
  let calls = 0;
  let meetings = 0;
  let sent = 0;
  let diary = 0;
  for (const a of activities) {
    if ((TOUCH_TYPES as readonly string[]).includes(a.activity_type)) {
      people.add(a.contact_id);
      if (a.activity_type === "meeting") meetings += 1;
      else calls += 1;
    }
    if ((SENT_TYPES as readonly string[]).includes(a.activity_type)) sent += 1;
    if (a.metadata?.kind === "dnevnik") diary += 1;
  }
  return { calls, meetings, sent, diary, people: people.size };
}

/** Промяната спрямо предходния равен период, в проценти; null, когато няма с какво да се сравни. */
export function deltaPct(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / before) * 100);
}

// ── Скорост: колко бързо стигам до новия човек ──────────────────────────────

export interface SpeedStats {
  leads: number;
  touched: number;
  untouched: number;
  within1h: number;
  within24h: number;
  medianMinutes: number | null;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/**
 * Времето от появата на лийда до първото човешко докосване.
 *
 * Мери се само по лийдове, ПОЯВИЛИ се в периода — иначе вчерашният недокоснат
 * лийд утре разваля числото на ден, в който не е имало нови хора.
 */
export function speedOf(leads: ContactLite[], firstTouchByContact: Map<string, string>): SpeedStats {
  const minutes: number[] = [];
  let within1h = 0;
  let within24h = 0;
  for (const l of leads) {
    const t = firstTouchByContact.get(l.id);
    if (!t) continue;
    const diff = Math.round((new Date(t).getTime() - new Date(l.created_at).getTime()) / 60_000);
    if (diff < 0) continue;
    minutes.push(diff);
    if (diff <= 60) within1h += 1;
    if (diff <= 1440) within24h += 1;
  }
  return {
    leads: leads.length,
    touched: minutes.length,
    untouched: leads.length - minutes.length,
    within1h,
    within24h,
    medianMinutes: median(minutes),
  };
}

// ── Дисциплина: държа ли на думата си ───────────────────────────────────────

export interface PromiseStats {
  total: number;
  done: number;
  onTime: number;
  late: number;
  open: number;
  overdue: number;
  /** процент изпълнени навреме от приключените със срок */
  onTimePct: number | null;
}

export function promiseStats(promises: PromiseRow[], now: Date = new Date()): PromiseStats {
  const nowIso = now.toISOString();
  let done = 0;
  let onTime = 0;
  let late = 0;
  let open = 0;
  let overdue = 0;
  for (const p of promises) {
    if (p.done_at) {
      done += 1;
      if (p.due_at) {
        if (dayKey(p.done_at) <= dayKey(p.due_at)) onTime += 1;
        else late += 1;
      }
    } else {
      open += 1;
      if (p.due_at && p.due_at < nowIso) overdue += 1;
    }
  }
  const closedWithDue = onTime + late;
  return {
    total: promises.length,
    done,
    onTime,
    late,
    open,
    overdue,
    onTimePct: closedWithDue === 0 ? null : Math.round((onTime / closedWithDue) * 100),
  };
}

/** Напомнянията в момента: колко чакат днес и колко са минали без обаждане. */
export function followupSnapshot(contacts: ContactLite[], now: Date = new Date(), tz: string = TZ) {
  const today = dayKey(now, tz);
  let dueToday = 0;
  let overdue = 0;
  let future = 0;
  for (const c of contacts) {
    if (!c.next_followup_at) continue;
    if (c.stage === "won" || c.stage === "lost") continue;
    const day = dayKey(c.next_followup_at, tz);
    const heard = c.last_heard_from_at ? dayKey(c.last_heard_from_at, tz) : null;
    if (heard && heard >= day) continue;
    if (day === today) dueToday += 1;
    else if (day < today) overdue += 1;
    else future += 1;
  }
  return { dueToday, overdue, future };
}

// ── Резултат: какво излиза от работата ──────────────────────────────────────

export const FUNNEL_ORDER = ["lead", "contacted", "discovery", "presentation_sent", "offer_sent", "negotiating", "won"] as const;

export interface FunnelStep {
  stage: string;
  reached: number;
  /** процент спрямо предходната стъпка */
  fromPrev: number | null;
}

const STAGE_RANK: Record<string, number> = {
  lead: 0,
  contacted: 1,
  discovery: 2,
  presentation_sent: 3,
  offer_sent: 4,
  negotiating: 5,
  won: 6,
  lost: -1,
};

/**
 * Фунията по „докъде е стигнал“, не по „къде седи сега“: човек в преговори е
 * минал и през среща, и през оферта. Загубените се броят до там, докъдето са
 * стигнали, затова `lost` не е стъпка — той е изход от всяка стъпка.
 */
export function funnelOf(contacts: Array<{ stage: string; maxStage?: string }>): FunnelStep[] {
  const reached = new Map<string, number>();
  for (const s of FUNNEL_ORDER) reached.set(s, 0);
  for (const c of contacts) {
    const rank = STAGE_RANK[c.maxStage ?? c.stage] ?? -1;
    if (rank < 0) continue;
    for (const s of FUNNEL_ORDER) {
      if ((STAGE_RANK[s] ?? 99) <= rank) reached.set(s, (reached.get(s) ?? 0) + 1);
    }
  }
  return FUNNEL_ORDER.map((stage, i) => {
    const cur = reached.get(stage) ?? 0;
    const prev = i === 0 ? null : reached.get(FUNNEL_ORDER[i - 1]) ?? 0;
    return { stage, reached: cur, fromPrev: prev === null ? null : prev === 0 ? null : Math.round((cur / prev) * 100) };
  });
}

/**
 * Кога човекът наистина е станал клиент.
 *
 * `updated_at` не става: той се мести при всяко пипване на картона, включително
 * от рутинното изравняване — така 16 стари клиента изглеждат спечелени този
 * месец. Истинската дата е в активностите: смяна на етапа към „won“, подписан
 * договор или първо плащане. Ако ги няма, връща `null` и контактът не се брои
 * за периода, вместо да го раздуе.
 */
export function wonDate(acts: ActivityLite[]): string | null {
  let best: string | null = null;
  for (const a of acts) {
    const isWonChange = a.activity_type === "stage_change" && String(a.metadata?.to ?? "").includes("won");
    if (isWonChange || a.activity_type === "contract_signed" || a.activity_type === "payment_received") {
      if (!best || a.occurred_at < best) best = a.occurred_at;
    }
  }
  return best;
}

export interface WonStats {
  count: number;
  sumEur: number;
  avgEur: number | null;
  /** дни от появата на човека до спечелването */
  medianDays: number | null;
  /** от тях датирани по последна редакция, защото няма следа кога са спечелени */
  estimated: number;
}

export function wonStats(won: Array<ContactLite & { won_at?: string | null }>): WonStats {
  const sum = won.reduce((s, c) => s + (c.deal_value_eur ?? 0), 0);
  // Дните до клиент се мерят само по картоните с истинска дата — приблизителната
  // дата на редакция би ги направила по-дълги, отколкото са били.
  const days = won
    .filter((c) => c.won_at)
    .map((c) => Math.round((new Date(c.won_at as string).getTime() - new Date(c.created_at).getTime()) / 86_400_000))
    .filter((d) => d >= 0);
  return {
    count: won.length,
    sumEur: sum,
    avgEur: won.length === 0 ? null : Math.round(sum / won.length),
    medianDays: median(days),
    estimated: won.filter((c) => !c.won_at).length,
  };
}

/** Разпределението на настроенията в живата тръба — температурата на портфейла. */
export function moodMix(contacts: ContactLite[]): Array<{ mood: string; count: number }> {
  const counts = new Map<string, number>();
  for (const c of contacts) {
    if (!c.mood) continue;
    counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1);
  }
  return [...counts.entries()].map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count);
}

// ── Ден по ден: за спарклайна ───────────────────────────────────────────────

/** Брой докосвания по календарен ден в София, най-старият пръв. */
export function perDay(activities: ActivityLite[], from: Date, to: Date, tz: string = TZ): Array<{ day: string; n: number }> {
  const counts = new Map<string, number>();
  for (let t = from.getTime(); t <= to.getTime(); t += 86_400_000) {
    counts.set(dayKey(new Date(t), tz), 0);
  }
  for (const a of activities) {
    const k = dayKey(a.occurred_at, tz);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].map(([day, n]) => ({ day, n }));
}

/** Работни дни в периода — за „средно на работен ден“. */
export function workdaysBetween(from: Date, to: Date, tz: string = TZ): number {
  let n = 0;
  for (let t = from.getTime(); t <= to.getTime(); t += 86_400_000) {
    const d = new Date(t);
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(d);
    if (weekday !== "Sat" && weekday !== "Sun") n += 1;
  }
  return n;
}
