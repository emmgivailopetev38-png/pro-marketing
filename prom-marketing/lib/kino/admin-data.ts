import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { KINO } from "./config";
import { isDbConfigured, isMissingSchema, kinoLinks, SCREENING } from "./server";
import {
  callLists,
  retentionByChapter,
  retentionByMinute,
  reactionsByMinute,
  totalMinutes,
  watchedRatio,
  moneyKey,
  uniqueBy,
  findAbandoned,
  byHoursFirst,
  type KinoListId,
  type WatchRow,
} from "./analytics";
import { chapterIndexAt } from "./time";
import { isDecisionMaker, roleLabel, utmLine, type KinoUtm } from "./people";
import { labelOf, WARMUP_LEVELS, WARMUP_START, APP_TEAM, APP_START } from "./questions";

/**
 * Данните за /admin/kino — всичко с едно минаване през базата.
 * CRM активностите (kino_*) работят и без миграцията; kino_watch / kino_events
 * (кривата, реакциите) — само след нея. Липсва ли — таблото го казва.
 */

type Meta = Record<string, unknown>;
interface ActRow {
  id: string;
  contact_id: string;
  activity_type: string;
  title: string;
  body: string | null;
  occurred_at: string;
  metadata: Meta | null;
}
interface ContactRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface KinoPerson {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  roleLabel: string;
  pain: string | null;
  registeredAt: string | null;
  source: string | null;
  warmup: string | null;
  ratio: number | null;
  maxPos: number | null;
  lastChapter: string | null;
  clicks: string[];
  questions: number;
  given: boolean;
  /** „Твоето число“ — часове седмично в повтаряща се работа (последният отговор) */
  hours: number | null;
  /** заявката преди разговора (третият бутон) */
  application: string | null;
  /** изоставено плащане: кога и какво натисна */
  abandonedAt: string | null;
  wants: "stream" | "deposit" | null;
}

export interface KinoDashboard {
  ok: boolean;
  dbReady: boolean;
  trackingReady: boolean;
  error: string | null;
  kpi: {
    registered: number;
    /** влезли с поне една изгледана минута — базата за процентите на кривата */
    entered: number;
    decisionMakers: number;
    cameLive: number;
    watched50: number;
    reachedEnd: number;
    clickers: number;
    questions: number;
    bookings: number;
    deposits: number;
    depositsEur: number;
    buyers: number;
    collectedEur: number;
    dealsEur: number;
    bonus: number;
  };
  retention: number[];
  chapters: Array<{ n: number; title: string; viewers: number; pct: number }>;
  reactions: Array<{ minute: number; counts: Record<string, number>; total: number }>;
  questions: Array<{ id: string; name: string; contactId: string; text: string; minute: number | null; at: string }>;
  clicksByButton: Array<{ button: string; people: number }>;
  sources: Array<{ source: string; count: number }>;
  money: Array<{
    id: string;
    contactId: string;
    name: string;
    title: string;
    amount: number;
    at: string;
    kind: string;
    /** капаро без доплащане — личният линк „доплати“ за срещата */
    payUrl: string | null;
  }>;
  /** натиснаха „купи“ и 15+ мин не платиха — най-горе за Димитър */
  abandoned: KinoPerson[];
  dayBefore: KinoPerson[];
  warm: KinoPerson[];
  /** колко писма / SMS-и е пратил кронът по стъпки: { "doors:email": 120 } */
  sent: Record<string, number>;
}

const empty = (error: string | null, dbReady: boolean): KinoDashboard => ({
  ok: false,
  dbReady,
  trackingReady: false,
  error,
  kpi: {
    registered: 0,
    entered: 0,
    decisionMakers: 0,
    cameLive: 0,
    watched50: 0,
    reachedEnd: 0,
    clickers: 0,
    questions: 0,
    bookings: 0,
    deposits: 0,
    depositsEur: 0,
    buyers: 0,
    collectedEur: 0,
    dealsEur: 0,
    bonus: 0,
  },
  retention: new Array(totalMinutes()).fill(0),
  chapters: retentionByChapter([]),
  reactions: [],
  questions: [],
  clicksByButton: [],
  sources: [],
  money: [],
  abandoned: [],
  dayBefore: [],
  warm: [],
  sent: {},
});

const BUTTON_LABEL: Record<string, string> = {
  stream: "Влизам в потока",
  full: "Плащам наведнъж",
  installments: "3 вноски",
  deposit: "Капаро",
  call: "Да поговорим",
  bonus: "Подаръкът (PDF)",
  formula: "Формулата (PDF)",
  live: "НА ЖИВО",
};

/** Бутоните на поканата — само те са „натиснал бутон“ в таблото. */
const OFFER_BUTTONS = new Set(["stream", "full", "installments", "deposit", "call"]);

export async function loadKinoDashboard(): Promise<KinoDashboard> {
  if (!isDbConfigured()) return empty("Няма Supabase env — таблото е празно (локален преглед).", false);
  const sb = createServiceClient();
  const types = [
    "kino_registration",
    "kino_warmup",
    "kino_watch",
    "kino_click",
    "kino_question",
    "kino_booking",
    "kino_deposit",
    "kino_payment",
    "kino_bonus",
    "kino_checkout",
    "kino_abandoned",
    "kino_number",
    "kino_precall",
    "team_assigned",
  ];
  const acts = await allRows<ActRow>((from, to) =>
    sb
      .from("contact_activities")
      .select("id, contact_id, activity_type, title, body, occurred_at, metadata")
      .in("activity_type", types)
      .order("occurred_at", { ascending: true })
      .order("id", { ascending: true }) // стабилен ред между страниците
      .range(from, to),
  );
  if (acts.error) return empty(acts.error, true);
  const mine = acts.rows.filter((a) => {
    const m = a.metadata ?? {};
    if (a.activity_type === "team_assigned") return m.kino_screening === SCREENING;
    return m.screening === SCREENING;
  });

  const byType = (t: string) => mine.filter((a) => a.activity_type === t);
  const regs = byType("kino_registration");
  const ids = [...new Set(mine.map((a) => a.contact_id))];

  const contacts = new Map<string, ContactRow>();
  for (let i = 0; i < ids.length; i += 300) {
    const { data } = await sb.from("contacts").select("id, full_name, email, phone").in("id", ids.slice(i, i + 300));
    for (const c of (data ?? []) as ContactRow[]) contacts.set(c.id, c);
  }

  // kino_watch / kino_events — само след миграцията
  let trackingReady = true;
  const watch = await allRows<WatchRow & { id: string }>((from, to) =>
    sb
      .from("kino_watch")
      .select("id, contact_id, minutes, max_pos, watched_seconds, first_mode, modes, milestones, first_seen_at, last_seen_at")
      .eq("screening_id", SCREENING)
      .order("id")
      .range(from, to),
  );
  if (watch.error) {
    trackingReady = false;
    if (!isMissingSchema({ message: watch.error })) console.error("[admin/kino] kino_watch", watch.error);
  }
  const reactionsRaw = trackingReady
    ? await allRows<{ id: number; minute: number | null; value: string | null }>((from, to) =>
        sb
          .from("kino_events")
          .select("id, minute, value")
          .eq("screening_id", SCREENING)
          .eq("type", "reaction")
          .order("id")
          .range(from, to),
      )
    : { rows: [], error: null };

  // какво е пратило загряването (активностите kino_email_* / kino_sms_*)
  const sent: Record<string, number> = {};
  for (const ch of ["email", "sms"] as const) {
    const r = await allRows<{ id: string; activity_type: string; metadata: Meta | null }>((from, to) =>
      sb
        .from("contact_activities")
        .select("id, activity_type, metadata")
        .like("activity_type", `kino_${ch}_%`)
        .order("id")
        .range(from, to),
    );
    for (const a of r.rows) {
      if ((a.metadata ?? {}).screening !== SCREENING) continue;
      const stage = a.activity_type.replace(`kino_${ch}_`, "");
      sent[`${stage}:${ch}`] = (sent[`${stage}:${ch}`] ?? 0) + 1;
    }
  }

  const watches = watch.rows;
  const watchBy = new Map(watches.map((w) => [w.contact_id, w]));
  // Парите — по едно на сесия/фактура в Stripe (двоен запис не удвоява сумите).
  const payments = uniqueBy(byType("kino_payment"), moneyKey);
  const depositsPaid = uniqueBy(byType("kino_deposit"), moneyKey);
  const buyers = new Set(payments.map((a) => a.contact_id));
  const depositors = new Set(depositsPaid.map((a) => a.contact_id));
  const buyersOrDeposit = new Set([...buyers, ...depositors]);

  const regMeta = new Map<string, { role: string | null; pain: string | null; at: string; utm: KinoUtm }>();
  for (const r of regs) {
    const m = r.metadata ?? {};
    if (!regMeta.has(r.contact_id)) {
      regMeta.set(r.contact_id, {
        role: typeof m.role === "string" ? m.role : null,
        pain: typeof m.pain === "string" ? m.pain : null,
        at: r.occurred_at,
        utm: (m.utm ?? {}) as KinoUtm,
      });
    }
  }
  const warmupBy = new Map<string, string>();
  for (const w of byType("kino_warmup")) {
    const m = w.metadata ?? {};
    const parts = [
      typeof m.time_eater === "string" && m.time_eater ? `„${m.time_eater}“` : null,
      m.level ? labelOf(WARMUP_LEVELS, String(m.level)).split(" — ")[0] : null,
      m.start ? labelOf(WARMUP_START, String(m.start)) : null,
    ].filter(Boolean);
    warmupBy.set(w.contact_id, parts.join(" · "));
  }
  const clicksBy = new Map<string, Set<string>>();
  for (const c of byType("kino_click")) {
    const b = String((c.metadata ?? {}).button ?? "");
    if (!clicksBy.has(c.contact_id)) clicksBy.set(c.contact_id, new Set());
    clicksBy.get(c.contact_id)!.add(b);
  }
  const questionsBy = new Map<string, number>();
  for (const q of byType("kino_question")) questionsBy.set(q.contact_id, (questionsBy.get(q.contact_id) ?? 0) + 1);
  const givenBy = new Map<string, Set<string>>();
  for (const g of byType("team_assigned")) {
    const list = String((g.metadata ?? {}).kino_list ?? "");
    if (!givenBy.has(g.contact_id)) givenBy.set(g.contact_id, new Set());
    givenBy.get(g.contact_id)!.add(list);
  }

  // „Твоето число“ и заявката — последният отговор на човек (activities са по време).
  const hoursBy = new Map<string, number>();
  for (const n of byType("kino_number")) {
    const h = (n.metadata ?? {}).hours;
    if (typeof h === "number") hoursBy.set(n.contact_id, h);
  }
  const applicationBy = new Map<string, string>();
  for (const a of byType("kino_precall")) {
    const m = a.metadata ?? {};
    const parts = [
      typeof m.business === "string" && m.business ? m.business : null,
      m.team ? labelOf(APP_TEAM, String(m.team)) : null,
      typeof m.time_eater === "string" && m.time_eater ? `„${m.time_eater}“` : null,
      m.start ? `старт: ${labelOf(APP_START, String(m.start)).toLowerCase()}` : null,
    ].filter(Boolean);
    if (parts.length) applicationBy.set(a.contact_id, parts.join(" · "));
  }
  const abandonedList = findAbandoned(mine, Date.now());
  const abandonedBy = new Map(abandonedList.map((a) => [a.contactId, a]));

  const person = (id: string, list: KinoListId): KinoPerson => {
    const c = contacts.get(id);
    const reg = regMeta.get(id);
    const w = watchBy.get(id);
    const ratio = w ? watchedRatio((w.minutes ?? []).length) : null;
    const maxPos = w?.max_pos ?? null;
    return {
      id,
      name: c?.full_name?.trim() || c?.email || "Без име",
      phone: c?.phone ?? null,
      email: c?.email ?? null,
      role: reg?.role ?? null,
      roleLabel: roleLabel(reg?.role),
      pain: reg?.pain ?? null,
      registeredAt: reg?.at ?? null,
      source: reg ? utmLine(reg.utm) : null,
      warmup: warmupBy.get(id) ?? null,
      ratio,
      maxPos,
      lastChapter: maxPos != null ? KINO.film.chapters[chapterIndexAt(maxPos, KINO.film.chapters)].title : null,
      clicks: [...(clicksBy.get(id) ?? [])].map((b) => BUTTON_LABEL[b] ?? b),
      questions: questionsBy.get(id) ?? 0,
      given: givenBy.get(id)?.has(list) ?? false,
      hours: hoursBy.get(id) ?? null,
      application: applicationBy.get(id) ?? null,
      abandonedAt: abandonedBy.get(id)?.intentAt ?? null,
      wants: abandonedBy.get(id)?.wants ?? null,
    };
  };

  const lists = callLists({
    registrations: [...regMeta.entries()].map(([contact_id, r]) => ({ contact_id, role: r.role })),
    watches,
    buyers: buyersOrDeposit,
  });

  const sourcesMap = new Map<string, number>();
  for (const r of regMeta.values()) {
    const key = r.utm.utm_campaign || r.utm.utm_source || "без UTM (директно / органично)";
    sourcesMap.set(key, (sourcesMap.get(key) ?? 0) + 1);
  }

  const clickPeople = new Map<string, number>();
  for (const set of clicksBy.values()) for (const b of set) clickPeople.set(b, (clickPeople.get(b) ?? 0) + 1);

  const money = [...payments, ...depositsPaid]
    .map((a) => ({
      id: a.id,
      contactId: a.contact_id,
      name: contacts.get(a.contact_id)?.full_name ?? "—",
      title: a.title,
      amount: Number((a.metadata ?? {}).amount_eur) || 0,
      at: a.occurred_at,
      kind: a.activity_type === "kino_deposit" ? "капаро" : "плащане",
      payUrl: a.activity_type === "kino_deposit" && !buyers.has(a.contact_id) ? (kinoLinks(a.contact_id)?.pay ?? null) : null,
    }))
    .sort((x, y) => y.at.localeCompare(x.at));

  const dealsEur = [...buyers].reduce((sum, id) => {
    const first = payments.find((a) => a.contact_id === id && Number((a.metadata ?? {}).total_eur) > 0);
    return sum + (Number(first?.metadata?.total_eur) || 0);
  }, 0);

  return {
    ok: true,
    dbReady: true,
    trackingReady,
    error: null,
    kpi: {
      registered: regMeta.size,
      entered: watches.filter((w) => (w.minutes ?? []).length > 0).length,
      decisionMakers: [...regMeta.values()].filter((r) => isDecisionMaker(r.role)).length,
      cameLive: watches.filter((w) => (w.minutes ?? []).length > 0).length,
      watched50: watches.filter((w) => watchedRatio((w.minutes ?? []).length) >= 0.5).length,
      reachedEnd: watches.filter((w) => (w.milestones ?? []).includes("end")).length,
      clickers: [...clicksBy.values()].filter((set) => [...set].some((b) => OFFER_BUTTONS.has(b))).length,
      questions: byType("kino_question").length,
      bookings: new Set(byType("kino_booking").map((a) => a.contact_id)).size,
      deposits: depositors.size,
      depositsEur: depositsPaid.reduce((s, a) => s + (Number((a.metadata ?? {}).amount_eur) || 0), 0),
      buyers: buyers.size,
      collectedEur: money.reduce((s, m) => s + m.amount, 0),
      dealsEur,
      bonus: new Set(byType("kino_bonus").map((a) => a.contact_id)).size,
    },
    retention: retentionByMinute(watches),
    chapters: retentionByChapter(watches),
    reactions: reactionsByMinute(reactionsRaw.rows),
    questions: byType("kino_question")
      .map((q) => ({
        id: q.id,
        contactId: q.contact_id,
        name: contacts.get(q.contact_id)?.full_name ?? "—",
        text: (q.body ?? "").split("\n\n(ще го обсъдим")[0],
        minute: typeof (q.metadata ?? {}).pos === "number" ? Math.floor(Number((q.metadata ?? {}).pos) / 60) + 1 : null,
        at: q.occurred_at,
      }))
      .reverse(),
    clicksByButton: [...clickPeople.entries()].map(([b, n]) => ({ button: BUTTON_LABEL[b] ?? b, people: n })).sort((a, b) => b.people - a.people),
    sources: [...sourcesMap.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    money,
    // Най-горе: натиснаха „купи“ и не платиха (най-новите първи). В другите
    // два списъка — първо хората с „Твоето число“ (по-голямото по-горе).
    abandoned: abandonedList.map((a) => person(a.contactId, "abandoned")),
    dayBefore: byHoursFirst(
      lists.dayBefore.map((p) => person(p.contact_id, "dayBefore")),
      (p) => p.hours,
    ),
    warm: byHoursFirst(
      lists.warm.map((p) => person(p.contact_id, "warm")),
      (p) => p.hours,
    ),
    sent,
  };
}
