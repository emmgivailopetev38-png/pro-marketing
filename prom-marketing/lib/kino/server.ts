import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { recordActivity, type ActivityResult } from "@/lib/crm/repository";
import type { ContactStage, FollowupStatus } from "@/lib/contacts/types";
import { KINO } from "./config";
import { ticketToken } from "./token";
import { moneyKey, uniqueBy } from "./analytics";
import { allRows } from "@/lib/supabase/all-rows";
import { cohortForBuyer, cohortView, seatsByCohort, type KinoCohortView } from "./cohorts";

/**
 * Сървърната страна на залата: CRM-ът, таблиците kino_* и линковете.
 *
 * Пише се САМО през съществуващите помощници на CRM-а (recordActivity →
 * contact_activities) с изричен contact_id — както изисква паметта за CRM API:
 * без contact_id find-or-create прави дубликат. Таблиците kino_watch/kino_events
 * идват с миграцията 20261006120000_kino_valnata.sql — докато не е приложена,
 * всичко тук мълчи и нищо не се чупи (записването и плащането вървят и без нея).
 */

export const SCREENING = KINO.screening.id;

export function isDbConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export interface KinoContact {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export async function getContact(contactId: string): Promise<KinoContact | null> {
  if (!isDbConfigured()) return null;
  try {
    const { data } = await createServiceClient()
      .from("contacts")
      .select("id, full_name, email, phone")
      .eq("id", contactId)
      .maybeSingle();
    return (data as KinoContact | null) ?? null;
  } catch {
    return null;
  }
}

export function firstName(fullName: string | null | undefined): string {
  const n = (fullName ?? "").trim().split(/\s+/)[0];
  return n || "приятелю";
}

/** Всички лични адреси на човека — от едно място. */
export function kinoLinks(
  contactId: string,
): { token: string; ticket: string; hall: string; short: string; ics: string; image: string; pay: string } | null {
  const token = ticketToken(contactId);
  if (!token) return null;
  const site = KINO.site;
  return {
    token,
    ticket: `${site}/kino/bilet?t=${token}`,
    hall: `${site}/kino/zala?t=${token}`,
    short: `${site}/k/${token}`,
    ics: `${site}/api/kino/ics?t=${token}`,
    image: `${site}/api/kino/ticket?t=${token}`,
    /** личната страница за плащане — „доплати“ след капарото, или след разговор */
    pay: `${site}/kino/plashtane?t=${token}`,
  };
}

/**
 * Активност в картона на човека. activity_type е винаги с префикс kino_,
 * а dedupe_key пази от двойни записи (повторен пулс, повторен webhook).
 */
export async function kinoLog(args: {
  contactId: string;
  type: string;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  stage?: ContactStage;
  followupStatus?: FollowupStatus;
  dealValueEur?: number;
  occurredAt?: string;
}): Promise<ActivityResult> {
  if (!isDbConfigured()) return { contact_id: null, activity_id: null, created: false, error: "db not configured" };
  try {
    return await recordActivity({
      contact_id: args.contactId,
      activity_type: args.type,
      title: args.title,
      body: args.body ?? undefined,
      metadata: { funnel: "kino", screening: SCREENING, ...(args.metadata ?? {}) },
      dedupe_key: args.dedupeKey,
      created_by: "kino",
      stage: args.stage,
      followup_status: args.followupStatus,
      deal_value_eur: args.dealValueEur,
      occurred_at: args.occurredAt,
    });
  } catch (e) {
    return { contact_id: null, activity_id: null, created: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export type KinoEventType =
  | "reaction"
  | "question"
  | "click"
  | "checkout"
  | "payment"
  | "deposit"
  | "booking"
  | "bonus"
  | "calc"
  | "survey"
  | "waitlist";

/** Ред в kino_events. Мълчи, ако таблицата я няма (миграцията не е приложена). */
export async function kinoEvent(args: {
  contactId: string | null;
  type: KinoEventType;
  value?: string | null;
  pos?: number | null;
  amountEur?: number | null;
  meta?: Record<string, unknown> | null;
}): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const pos = args.pos != null && Number.isFinite(args.pos) ? Math.max(0, Math.round(args.pos)) : null;
    const { error } = await createServiceClient()
      .from("kino_events")
      .insert({
        screening_id: SCREENING,
        contact_id: args.contactId,
        type: args.type,
        value: args.value ? String(args.value).slice(0, 2000) : null,
        pos,
        minute: pos != null ? Math.floor(pos / 60) : null,
        amount_eur: args.amountEur ?? null,
        meta: args.meta ?? null,
      });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Покана след разговор. След затварянето (нд 23:59) плащането остава отворено
 * само за хората с разговор: записан час (kino_booking) или дадени на екипа
 * от /admin/kino (team_assigned). Самата заявка (kino_precall) не отваря —
 * тя е пътят към часа. Платилите капаро минават отделно. Решава сървърът по
 * CRM-а — не линкът, от който идва заявката.
 */
export async function hasKinoInvite(contactId: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const { data } = await createServiceClient()
      .from("contact_activities")
      .select("activity_type, metadata")
      .eq("contact_id", contactId)
      .in("activity_type", ["kino_booking", "team_assigned"])
      .limit(100);
    return (data ?? []).some((r) => {
      const m = (r.metadata ?? {}) as Record<string, unknown>;
      return r.activity_type === "team_assigned" ? m.kino_screening === SCREENING : m.screening === SCREENING;
    });
  } catch {
    return false;
  }
}

export function clientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

/** Грешка от Supabase, която значи „таблицата/функцията още я няма“. */
export function isMissingSchema(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42883" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    /does not exist|could not find/i.test(error.message ?? "")
  );
}

/** Часът на сървъра — отделна функция, за да е ясно, че страницата е динамична. */
export function serverNow(): number {
  return Date.now();
}

export interface HallState {
  /** гледал е филма (поне минута) */
  entered: boolean;
  bonusUnlocked: boolean;
  depositPaid: number;
  /** потокът, в който е капарото му (там е мястото му) */
  depositCohort: string | null;
  bought: boolean;
  /** „Твоето число“ — часовете седмично в повтаряща се работа (последният отговор) */
  hours: number | null;
}

export const EMPTY_HALL_STATE: HallState = {
  entered: false,
  bonusUnlocked: false,
  depositPaid: 0,
  depositCohort: null,
  bought: false,
  hours: null,
};

/**
 * Какво вече е станало с човека — гледал ли е, отключил ли е подаръка,
 * платил ли е капаро (и за кой поток) или потока. Едно четене от CRM-а.
 */
export async function hallState(contactId: string): Promise<HallState> {
  const empty: HallState = { ...EMPTY_HALL_STATE };
  if (!isDbConfigured()) return empty;
  try {
    const { data } = await createServiceClient()
      .from("contact_activities")
      .select("id, activity_type, metadata, occurred_at")
      .eq("contact_id", contactId)
      .in("activity_type", ["kino_watch", "kino_bonus", "kino_deposit", "kino_payment", "kino_number"])
      .order("occurred_at", { ascending: true });
    const st = { ...empty };
    const deposits: Array<{ id: string; metadata: Record<string, unknown> }> = [];
    for (const r of (data ?? []) as Array<{ id: string; activity_type: string; metadata: Record<string, unknown> | null }>) {
      const m = r.metadata ?? {};
      if (m.screening !== SCREENING) continue;
      if (r.activity_type === "kino_watch" && m.milestone === "entered") st.entered = true;
      if (r.activity_type === "kino_bonus") st.bonusUnlocked = true;
      if (r.activity_type === "kino_deposit") {
        deposits.push({ id: r.id, metadata: m });
        if (typeof m.cohort === "string" && m.cohort) st.depositCohort = m.cohort;
      }
      if (r.activity_type === "kino_payment") st.bought = true;
      if (r.activity_type === "kino_number" && typeof m.hours === "number") st.hours = m.hours; // последният отговор
    }
    // по едно на сесия в Stripe — двоен запис не удвоява капарото
    st.depositPaid = uniqueBy(deposits, moneyKey).reduce((sum, r) => sum + (Number(r.metadata.amount_eur) || 0), 0);
    if (st.depositPaid > 0 && !st.depositCohort) st.depositCohort = cohortForBuyer({ nowMs: 0 }).id; // стари записи — първият поток
    return st;
  } catch {
    return empty;
  }
}

/** Заетите места по потоци — различни хора с плащане или капаро за прожекцията. */
export async function seatsTaken(): Promise<Map<string, number> | null> {
  if (!isDbConfigured()) return null;
  const res = await allRows<{ id: string; contact_id: string; metadata: Record<string, unknown> | null }>((from, to) =>
    createServiceClient()
      .from("contact_activities")
      .select("id, contact_id, metadata")
      .in("activity_type", ["kino_payment", "kino_deposit"])
      .order("id")
      .range(from, to),
  );
  if (res.error) return null;
  return seatsByCohort(res.rows.filter((r) => (r.metadata ?? {}).screening === SCREENING));
}

/**
 * Потокът, който човекът вижда в поканата: с капаро — неговият; иначе първият,
 * който още записва и има места. С броя на свободните места (ако се знае).
 */
export async function cohortFor(nowMs: number, depositCohort: string | null): Promise<KinoCohortView> {
  const taken = await seatsTaken();
  const c = cohortForBuyer({ nowMs, depositCohortId: depositCohort, takenOf: (id) => taken?.get(id) ?? 0 });
  return cohortView(c, taken ? (taken.get(c.id) ?? 0) : null);
}
