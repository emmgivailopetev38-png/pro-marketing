import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { recordActivity, type ActivityResult } from "@/lib/crm/repository";
import type { ContactStage, FollowupStatus } from "@/lib/contacts/types";
import { KINO } from "./config";
import { ticketToken } from "./token";
import { moneyKey, uniqueBy } from "./analytics";

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
export function kinoLinks(contactId: string): { token: string; ticket: string; hall: string; short: string; ics: string; image: string } | null {
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
 * Колко капаро е платил човекът за тази прожекция. Чете от CRM-а (там пише
 * webhook-ът на Stripe), не от kino_events — така работи и без миграцията.
 */
export async function depositPaidEur(contactId: string): Promise<number> {
  if (!isDbConfigured()) return 0;
  try {
    const { data } = await createServiceClient()
      .from("contact_activities")
      .select("id, metadata")
      .eq("contact_id", contactId)
      .eq("activity_type", "kino_deposit");
    const rows = (data ?? []) as Array<{ id: string; metadata: Record<string, unknown> | null }>;
    // по едно на сесия в Stripe — двоен запис не удвоява капарото
    return uniqueBy(
      rows.filter((r) => (r.metadata ?? {}).screening === SCREENING),
      moneyKey,
    ).reduce((sum, r) => sum + (Number((r.metadata ?? {}).amount_eur) || 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Покана след разговор. След затварянето (нд 23:59) плащането остава отворено
 * само за хората, с които има истински разговор: записан час (kino_booking),
 * анкета „първо да поговорим“ (kino_precall) или дадени на екипа от
 * /admin/kino (team_assigned). Платилите капаро минават отделно. Решава
 * сървърът по CRM-а — не линкът, от който идва заявката.
 */
export async function hasKinoInvite(contactId: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const { data } = await createServiceClient()
      .from("contact_activities")
      .select("activity_type, metadata")
      .eq("contact_id", contactId)
      .in("activity_type", ["kino_booking", "kino_precall", "team_assigned"])
      .limit(100);
    return (data ?? []).some((r) => {
      const m = (r.metadata ?? {}) as Record<string, unknown>;
      return r.activity_type === "team_assigned" ? m.kino_screening === SCREENING : m.screening === SCREENING;
    });
  } catch {
    return false;
  }
}

/** Платил ли е вече потока (изцяло или първа вноска). */
export async function hasBoughtProgram(contactId: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const { data } = await createServiceClient()
      .from("contact_activities")
      .select("metadata")
      .eq("contact_id", contactId)
      .eq("activity_type", "kino_payment")
      .limit(20);
    return (data ?? []).some((r) => ((r.metadata ?? {}) as Record<string, unknown>).screening === SCREENING);
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
  offerSeen: boolean;
  bonusUnlocked: boolean;
  depositPaid: number;
  bought: boolean;
}

/**
 * Какво вече е станало с човека в залата — за да не се крие поканата от
 * някой, който я е видял на премиерата и се връща в повторението, и за да
 * не му се предлага капаро, ако вече го е платил. Едно четене от CRM-а.
 */
export async function hallState(contactId: string): Promise<HallState> {
  const empty: HallState = { offerSeen: false, bonusUnlocked: false, depositPaid: 0, bought: false };
  if (!isDbConfigured()) return empty;
  try {
    const { data } = await createServiceClient()
      .from("contact_activities")
      .select("activity_type, metadata")
      .eq("contact_id", contactId)
      .in("activity_type", ["kino_watch", "kino_bonus", "kino_deposit", "kino_payment", "kino_click"]);
    const st = { ...empty };
    for (const r of data ?? []) {
      const m = (r.metadata ?? {}) as Record<string, unknown>;
      if (m.screening !== SCREENING) continue;
      if (r.activity_type === "kino_watch" && m.milestone === "end") st.offerSeen = true;
      if (r.activity_type === "kino_click") st.offerSeen = true;
      if (r.activity_type === "kino_bonus") st.bonusUnlocked = true;
      if (r.activity_type === "kino_deposit") st.depositPaid += Number(m.amount_eur) || 0;
      if (r.activity_type === "kino_payment") st.bought = true;
    }
    return st;
  } catch {
    return empty;
  }
}
