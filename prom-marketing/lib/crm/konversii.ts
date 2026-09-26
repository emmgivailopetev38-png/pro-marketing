/**
 * Конверсиите — чистите правила. Отговарят на въпроса на Ивайло:
 * „колко лийда влизат, колко Димитър чува, колко срещи правим и от тях колко
 * човека затваряме“ — по източник, по седмица и по човек.
 *
 * Стъпките на фунията се мерят по СЛЕДИ (активности), не по етапа на
 * картона: човек може да е „lead“ като етап и да е имал среща. Загубеният се
 * брои до стъпката, до която е стигнал.
 */
import { TZ, dayKey } from "@/lib/contacts/followup";

export interface KLead {
  id: string;
  source: string;
  created_at: string;
  stage: string;
  owner_id: string | null;
}

export interface KActivity {
  contact_id: string;
  activity_type: string;
  occurred_at: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

export interface KBooking {
  contact_id: string | null;
  scheduled_at: string;
  status: string;
}

/** Изходите на разговор, които значат „говорихме с човека“ (не само набрахме). */
const TALKED_OUTCOMES = new Set(["callback", "talked", "will_call", "meeting", "handoff"]);
const AUTO = new Set([
  "hermes",
  "lead_sequence",
  "warm_sequence",
  "meta_webhook",
  "claude",
  "claude-code",
  "crm_consistency",
  "voice",
  "elevenlabs",
  "website",
  "fathom",
  "auto-reminder",
  "unsubscribe",
  "система",
  "",
]);

export function isHuman(createdBy: string | null | undefined): boolean {
  return !AUTO.has((createdBy ?? "").trim().toLowerCase());
}

/**
 * Значи ли това обаждане „говорихме“: изход от бутоните на екипа (говорихме /
 * среща / предаден), запис в дневника, или обаждане без изход от Ивайло —
 * той записва обаждане само когато е имало разговор (сетърът записва и „не вдигна“).
 */
export function callMeansTalked(a: Pick<KActivity, "activity_type" | "created_by" | "metadata">): boolean {
  if (a.activity_type === "meeting") return true;
  if (a.activity_type !== "call") return false;
  const outcome = typeof a.metadata?.outcome === "string" ? (a.metadata.outcome as string) : null;
  if (outcome) return TALKED_OUTCOMES.has(outcome);
  if (a.metadata?.kind === "dnevnik") return true;
  // Обаждане от бутоните на екипа без изход не значи разговор — сетърът и
  // продавачите записват и „не вдигна“. Името остава за старите записи отпреди флага.
  if (a.metadata?.team === true) return false;
  return !!a.created_by && a.created_by !== "Димитър";
}

export interface FunnelCounts {
  leads: number;
  /** поне едно човешко обаждане/среща */
  touched: number;
  /** разговор, който е стигнал до човека (говорихме / записана среща / предаден / дневник) */
  talked: number;
  /** записана среща (booking или активност meeting) */
  meetings: number;
  /** проведена среща (минала, неотменена) */
  held: number;
  /** оферта изпратена/създадена или етап ≥ оферта */
  offers: number;
  won: number;
  lost: number;
}

export interface LeadTrace {
  id: string;
  source: string;
  created_at: string;
  stage: string;
  owner_id: string | null;
  touched: boolean;
  talked: boolean;
  meeting: boolean;
  held: boolean;
  offer: boolean;
  won: boolean;
  lost: boolean;
  firstTouchAt: string | null;
  /** кой е направил първото човешко докосване */
  firstTouchBy: string | null;
}

const OFFER_STAGES = new Set(["offer_sent", "negotiating", "won"]);
const MEETING_STAGES = new Set(["discovery", "presentation_sent", "offer_sent", "negotiating", "won"]);

/** Следата на всеки лийд: докъде е стигнал и кой го е докоснал първи. */
export function traceLeads(
  leads: KLead[],
  activities: KActivity[],
  bookings: KBooking[],
  now: Date = new Date()
): LeadTrace[] {
  const acts = new Map<string, KActivity[]>();
  for (const a of activities) {
    const list = acts.get(a.contact_id) ?? [];
    list.push(a);
    acts.set(a.contact_id, list);
  }
  const books = new Map<string, KBooking[]>();
  for (const b of bookings) {
    if (!b.contact_id) continue;
    const list = books.get(b.contact_id) ?? [];
    list.push(b);
    books.set(b.contact_id, list);
  }
  const nowIso = now.toISOString();
  return leads.map((l) => {
    const list = (acts.get(l.id) ?? []).slice().sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
    const myBookings = books.get(l.id) ?? [];
    let firstTouchAt: string | null = null;
    let firstTouchBy: string | null = null;
    let talked = false;
    let meeting = myBookings.some((b) => b.status !== "cancelled" && b.status !== "rejected");
    let held = myBookings.some((b) => b.status === "completed" || (b.scheduled_at < nowIso && b.status !== "cancelled" && b.status !== "rejected"));
    let offer = OFFER_STAGES.has(l.stage);
    for (const a of list) {
      const human = isHuman(a.created_by);
      if ((a.activity_type === "call" || a.activity_type === "meeting") && human) {
        if (!firstTouchAt) {
          firstTouchAt = a.occurred_at;
          firstTouchBy = a.created_by;
        }
        if (a.activity_type === "meeting") {
          meeting = true;
          if (a.occurred_at < nowIso) held = true;
        }
        if (callMeansTalked(a)) talked = true;
      }
      if (a.activity_type === "offer_sent" || a.activity_type === "offer_created" || a.activity_type === "presentation_sent") offer = true;
    }
    if (MEETING_STAGES.has(l.stage) && !meeting && list.some((a) => a.activity_type === "meeting")) meeting = true;
    return {
      id: l.id,
      source: l.source,
      created_at: l.created_at,
      stage: l.stage,
      owner_id: l.owner_id,
      touched: firstTouchAt !== null,
      talked,
      meeting,
      held,
      offer,
      won: l.stage === "won",
      lost: l.stage === "lost",
      firstTouchAt,
      firstTouchBy,
    };
  });
}

export function countFunnel(traces: LeadTrace[]): FunnelCounts {
  const c: FunnelCounts = { leads: 0, touched: 0, talked: 0, meetings: 0, held: 0, offers: 0, won: 0, lost: 0 };
  for (const t of traces) {
    c.leads += 1;
    if (t.touched) c.touched += 1;
    if (t.talked) c.talked += 1;
    if (t.meeting) c.meetings += 1;
    if (t.held) c.held += 1;
    if (t.offer) c.offers += 1;
    if (t.won) c.won += 1;
    if (t.lost) c.lost += 1;
  }
  return c;
}

export function pct(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return Math.round((part / whole) * 100);
}

/** По групи (източник, седмица, отговорник) — една фуния на група. */
export function groupFunnel(traces: LeadTrace[], keyOf: (t: LeadTrace) => string): Array<{ key: string; funnel: FunnelCounts }> {
  const by = new Map<string, LeadTrace[]>();
  for (const t of traces) {
    const k = keyOf(t);
    const list = by.get(k) ?? [];
    list.push(t);
    by.set(k, list);
  }
  return [...by.entries()].map(([key, list]) => ({ key, funnel: countFunnel(list) })).sort((a, b) => b.funnel.leads - a.funnel.leads);
}

/** Понеделникът на седмицата в София, като „ГГГГ-ММ-ДД“. */
export function weekKey(iso: string, tz: string = TZ): string {
  const day = dayKey(iso, tz);
  const d = new Date(`${day}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // пон = 0
  return new Date(d.getTime() - dow * 86_400_000).toISOString().slice(0, 10);
}

export interface PersonCounts {
  name: string;
  calls: number;
  talked: number;
  meetingsBooked: number;
  /** лийдове, които този човек е докоснал първи */
  firstTouches: number;
  medianMinutesToTouch: number | null;
}

/** Кой колко е свършил по лийдовете за периода. */
export function perPerson(traces: LeadTrace[], activities: KActivity[], leadIds: Set<string>): PersonCounts[] {
  const rows = new Map<string, PersonCounts & { minutes: number[] }>();
  const get = (name: string) => {
    const r = rows.get(name) ?? { name, calls: 0, talked: 0, meetingsBooked: 0, firstTouches: 0, medianMinutesToTouch: null, minutes: [] };
    rows.set(name, r);
    return r;
  };
  for (const a of activities) {
    if (!leadIds.has(a.contact_id)) continue;
    if (!isHuman(a.created_by)) continue;
    if (a.activity_type !== "call" && a.activity_type !== "meeting") continue;
    const r = get(a.created_by ?? "—");
    if (a.activity_type === "call") r.calls += 1;
    if (a.activity_type === "meeting") r.meetingsBooked += 1;
    if (callMeansTalked(a)) r.talked += 1;
  }
  for (const t of traces) {
    if (!t.firstTouchBy || !t.firstTouchAt) continue;
    const r = get(t.firstTouchBy);
    r.firstTouches += 1;
    const min = Math.round((new Date(t.firstTouchAt).getTime() - new Date(t.created_at).getTime()) / 60_000);
    if (min >= 0) r.minutes.push(min);
  }
  return [...rows.values()]
    .map((r) => {
      const s = [...r.minutes].sort((a, b) => a - b);
      const med = s.length === 0 ? null : s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2);
      const { minutes: _m, ...rest } = r;
      void _m;
      return { ...rest, medianMinutesToTouch: med };
    })
    .sort((a, b) => b.calls + b.meetingsBooked - (a.calls + a.meetingsBooked));
}

/** Цена на лийд и на среща от рекламния разход за периода. */
export function costPer(spend: number, funnel: FunnelCounts) {
  const per = (n: number) => (n > 0 && spend > 0 ? Math.round((spend / n) * 100) / 100 : null);
  return { lead: per(funnel.leads), talked: per(funnel.talked), meeting: per(funnel.meetings), won: per(funnel.won) };
}
