/**
 * Meta „Conversion leads“ — чистите правила (без база и без мрежа).
 *
 * Целта: Meta да спре да учи само от „оставен телефон“ и да вижда кои лийдове
 * от формата стават срещи и клиенти. По спецификацията на Meta за CRM събития
 * (Conversions API → Conversion Leads integration) всяко събитие е:
 *   action_source: "system_generated"
 *   user_data.lead_id = leadgen id-то от формата (+ хеширани em/ph)
 *   custom_data: { event_source: "crm", lead_event_source: "Pro Marketing CRM" }
 *   event_name = етапът в CRM-а; event_time = кога лийдът е стигнал етапа —
 *   след времето на лийда и не по-стар от 7 дни (иначе Meta го изхвърля).
 *
 * Етапите тук се мерят по СЛЕДИ (активности, срещи), както в
 * lib/crm/konversii.ts — същата „записана среща“ и същото „говорихме“, които
 * Ивайло вижда в /admin/konversii, а не по полето stage на картона.
 */
import { callMeansTalked, isHuman } from "@/lib/crm/konversii";
import { phoneKey } from "@/lib/team/prospects-rules";
import type { ServerEvent, UserData } from "@/lib/meta/conversions-api";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Meta приема събитие до 7 дни назад; час резерва за закъснение по пътя. */
export const MAX_EVENT_AGE_MS = 7 * DAY - HOUR;
/** Етапът трябва да е до 28 дни след лийда — прозорецът на Conversion leads. */
export const CONVERSION_WINDOW_MS = 28 * DAY;
/** Колко назад се четат лийдовете: 28 дни прозорец + 7 дни, в които още може да се прати. */
export const LOOKBACK_MS = CONVERSION_WINDOW_MS + 7 * DAY;
/** Отхвърлено от Meta събитие се праща пак най-рано след толкова време… */
export const RETRY_EVERY_MS = 6 * HOUR;
/** …и най-много толкова пъти (6 ч × 28 ≈ 7 дни — колкото Meta позволява назад). */
export const MAX_ATTEMPTS = 28;
/** Запис „в движение“, по-стар от това, значи прекъснато пращане — не се повтаря само. */
export const STALE_PENDING_MS = 15 * 60_000;

// ── Режим и етапи ───────────────────────────────────────────────────────────

export type CrmEventsMode = "off" | "dry" | "live";

/**
 * `CAPI_CRM_EVENTS`: празно/0 → изключено (по подразбиране), `dry` → само
 * смята и логва, `1`/`on`/`live` → праща. Чете се при всяко извикване.
 */
export function crmEventsMode(raw: string | undefined = process.env.CAPI_CRM_EVENTS): CrmEventsMode {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "dry") return "dry";
  if (v === "1" || v === "on" || v === "true" || v === "live" || v === "yes") return "live";
  return "off";
}

export type CrmStage = "lead" | "qualified" | "meeting" | "won";

/**
 * Имената, които Meta вижда като етапи на фунията (Events Manager → CRM →
 * „Configure your sales funnel“). Латиница, защото са имена на събития.
 * „Lead“ е същото име, което webhook-ът праща от 27.08 — историята остава една.
 */
export const STAGE_EVENT_NAME: Record<CrmStage, string> = {
  lead: "Lead",
  qualified: "Qualified Lead",
  meeting: "Meeting Booked",
  won: "Won",
};

export const LEAD_EVENT_SOURCE = "Pro Marketing CRM";

export const CRM_CUSTOM_DATA = { event_source: "crm", lead_event_source: LEAD_EVENT_SOURCE } as const;

const CRON_STAGE_KEYS: CrmStage[] = ["qualified", "meeting", "won"];
/** Кронът праща тези етапи. „lead“ го праща webhook-ът в момента на лийда. */
export const DEFAULT_CRON_STAGES: CrmStage[] = ["meeting", "won"];

/** `CAPI_CRM_STAGES=qualified,meeting,won` — кои етапи да праща кронът. */
export function cronStages(raw: string | undefined = process.env.CAPI_CRM_STAGES): CrmStage[] {
  if (!raw || !raw.trim()) return DEFAULT_CRON_STAGES;
  const picked = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is CrmStage => (CRON_STAGE_KEYS as string[]).includes(s));
  return picked.length ? Array.from(new Set(picked)) : DEFAULT_CRON_STAGES;
}

/** Стабилното id на събитието — едно на лийд и етап. „Lead“ пази id-то на webhook-а. */
export function crmEventId(stage: CrmStage, metaLeadId: string): string {
  return stage === "lead" ? `metalead_${metaLeadId}` : `crm_${stage}_${metaLeadId}`;
}

/** Ключът в automation_events.idempotency_key — уникален, затова второ пращане няма. */
export function ledgerKey(eventId: string): string {
  return `capi-crm:${eventId}`;
}

export function eventIdFromLedgerKey(key: string | null | undefined): string | null {
  return key && key.startsWith("capi-crm:") ? key.slice("capi-crm:".length) : null;
}

/**
 * Meta отхвърля събитие с невалиден lead_id (днес 15–17 цифри от leadgen_id).
 * Проверката тук само пази от боклук (празно, букви) — границите са по-широки,
 * за да не спре истински лийд, ако Meta удължи id-тата.
 */
export function validLeadId(id: string | null | undefined): boolean {
  return /^\d{12,20}$/.test(String(id ?? ""));
}

// ── Хората: имейл, телефон, име ─────────────────────────────────────────────

const PLACEHOLDER_EMAIL = /^(bez-imeil@promarketing\.pw|unknown@unknown)$/i;

export function realEmail(raw: string | null | undefined): string | null {
  const e = String(raw ?? "").trim().toLowerCase();
  if (!e || !e.includes("@") || PLACEHOLDER_EMAIL.test(e)) return null;
  return e;
}

/**
 * Телефонът така, както Meta го хешира: само цифри, с кода на страната, без
 * водещи нули. Българските номера („08…“, „+359…“, „00359…“) → 359…;
 * чуждите се приемат само ако са записани с „+“ или „00“.
 */
export function metaPhone(raw: string | null | undefined): string | null {
  const bg = phoneKey(raw);
  if (bg) return bg;
  const s = String(raw ?? "").trim();
  const d = s.replace(/\D/g, "");
  if ((s.startsWith("+") || s.startsWith("00")) && d.length >= 8) return d.startsWith("00") ? d.slice(2) : d;
  return null;
}

function phone9(raw: string | null | undefined): string | null {
  const d = String(raw ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : null;
}

export interface ContactInfo {
  id: string;
  stage: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
}

/** user_data на CRM събитие: lead_id е ключът; имейл/телефон/име — за по-сигурно съвпадение. */
export function crmUserData(contact: Pick<ContactInfo, "id" | "email" | "phone" | "full_name">, metaLeadId: string): UserData {
  const [firstName, ...rest] = (contact.full_name ?? "").trim().split(/\s+/);
  return {
    email: realEmail(contact.email),
    phone: metaPhone(contact.phone),
    firstName: firstName || null,
    lastName: rest.join(" ") || null,
    country: "bg",
    external_id: contact.id,
    lead_id: metaLeadId,
  };
}

// ── Следите в CRM-а ─────────────────────────────────────────────────────────

export interface LeadRef {
  contactId: string;
  metaLeadId: string;
  /** кога Meta е създала лийда (meta_lead.occurred_at = created_time) */
  leadTime: string;
}

export interface ActivityRow {
  contact_id: string;
  activity_type: string;
  title: string | null;
  /** кога CRM-ът е научил — това е времето на етапа (occurred_at при срещите е часът НА срещата) */
  created_at: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

export interface BookingRow {
  attendee_email: string | null;
  attendee_phone: string | null;
  status: string | null;
  created_at: string;
}

/** Типовете активности, които носят етап — само тях чете кронът. */
export const SIGNAL_ACTIVITY_TYPES = [
  "meeting",
  "booking",
  "booking_voice",
  "call",
  "stage_change",
  "contract_signed",
  "payment_received",
  "invoice",
] as const;

const CANCELLED = new Set(["cancelled", "canceled", "rejected"]);

interface Signal {
  stage: Exclude<CrmStage, "lead">;
  at: number;
  source: string;
}

/** Следа, че човекът е станал клиент: смяна на етапа към „won“, договор, плащане, фактура. */
export function isWonTrace(a: Pick<ActivityRow, "activity_type" | "title" | "metadata">): boolean {
  if (a.activity_type === "contract_signed" || a.activity_type === "payment_received" || a.activity_type === "invoice") return true;
  if (a.activity_type !== "stage_change") return false;
  return String(a.metadata?.to ?? "") === "won" || /→\s*won\b/i.test(a.title ?? "");
}

/** Записана среща: активност „среща“ (екипът, Хермес, синхронът, Fathom) или неотменена резервация. */
function isMeetingActivity(a: ActivityRow): boolean {
  if (a.activity_type === "meeting") return true;
  if (a.activity_type !== "booking" && a.activity_type !== "booking_voice") return false;
  const status = String(a.metadata?.status ?? "").toLowerCase();
  return !CANCELLED.has(status) && a.metadata?.trigger !== "BOOKING_CANCELLED";
}

function signalsFor(acts: ActivityRow[], bookings: BookingRow[]): Signal[] {
  const out: Signal[] = [];
  const meeting = (at: number, source: string) => {
    out.push({ stage: "meeting", at, source });
    // Записана среща значи и разговор — както в konversii (callMeansTalked).
    out.push({ stage: "qualified", at, source });
  };
  for (const a of acts) {
    const at = Date.parse(a.created_at);
    if (Number.isNaN(at)) continue;
    if (isMeetingActivity(a)) meeting(at, `${a.activity_type} · ${a.created_by ?? "?"}`);
    else if (a.activity_type === "call" && isHuman(a.created_by) && callMeansTalked(a)) {
      out.push({ stage: "qualified", at, source: `call · ${a.created_by ?? "?"}` });
    }
    if (isWonTrace(a)) out.push({ stage: "won", at, source: `${a.activity_type} · ${a.created_by ?? "?"}` });
  }
  for (const b of bookings) {
    const at = Date.parse(b.created_at);
    if (Number.isNaN(at) || CANCELLED.has(String(b.status ?? "").toLowerCase())) continue;
    meeting(at, `booking · ${b.status ?? "?"}`);
  }
  return out.sort((x, y) => x.at - y.at);
}

/** Резервациите към картоните — по имейл, после по последните 9 цифри на телефона (както konversii-data). */
export function matchBookings(contacts: ContactInfo[], bookings: BookingRow[]): Map<string, BookingRow[]> {
  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  for (const c of contacts) {
    const e = realEmail(c.email);
    if (e) byEmail.set(e, c.id);
    const p = phone9(c.phone);
    if (p) byPhone.set(p, c.id);
  }
  const out = new Map<string, BookingRow[]>();
  for (const b of bookings) {
    const e = realEmail(b.attendee_email);
    const p = phone9(b.attendee_phone);
    const id = (e && byEmail.get(e)) || (p && byPhone.get(p)) || null;
    if (!id) continue;
    out.set(id, [...(out.get(id) ?? []), b]);
  }
  return out;
}

// ── Планът: кои събития са за пращане сега ──────────────────────────────────

export interface PlannedEvent {
  stage: Exclude<CrmStage, "lead">;
  eventId: string;
  eventName: string;
  /** unix секунди */
  eventTime: number;
  contactId: string;
  metaLeadId: string;
  leadTime: string;
  /** откъде е следата — за отчета */
  source: string;
}

export type SkipReason = "too_old" | "after_window" | "won_no_date" | "invalid_lead_id" | "no_contact";

export interface SkippedEvent {
  stage: CrmStage;
  contactId: string;
  metaLeadId: string;
  reason: SkipReason;
}

export interface CrmPlan {
  events: PlannedEvent[];
  skipped: SkippedEvent[];
  /** вече пратени (или в движение) според automation_events */
  alreadySent: number;
}

/**
 * Кои CRM събития да тръгнат сега. Правилата:
 *  - Етапът се брои за ПОСЛЕДНИЯ лийд преди следата (попълнил формата втори
 *    път → новият лийд получава следващата среща, старият — не).
 *  - Едно събитие на лийд и етап — първата следа; следващите не са нов етап.
 *  - Следата трябва да е до 28 дни след лийда и не по-стара от 7 дни.
 *  - „Спечелен“ иска картонът да е won И следа с дата (плащане, фактура,
 *    договор, смяна на етапа). Без следа датата не е известна → не се праща
 *    (по-добре без събитие, отколкото с измислено време).
 */
export function planCrmEvents(input: {
  leads: LeadRef[];
  contacts: ContactInfo[];
  activities: ActivityRow[];
  bookings: BookingRow[];
  alreadyClaimed: Set<string>;
  stages: CrmStage[];
  now: Date;
}): CrmPlan {
  const nowMs = input.now.getTime();
  const stages = input.stages.filter((s): s is Exclude<CrmStage, "lead"> => s !== "lead");
  const contacts = new Map(input.contacts.map((c) => [c.id, c]));
  const acts = new Map<string, ActivityRow[]>();
  for (const a of input.activities) acts.set(a.contact_id, [...(acts.get(a.contact_id) ?? []), a]);
  const bookings = matchBookings(input.contacts, input.bookings);

  // Лийдовете по картон, без повторения на едно и също leadgen id.
  const leadsByContact = new Map<string, Map<string, LeadRef>>();
  for (const l of input.leads) {
    const m = leadsByContact.get(l.contactId) ?? new Map<string, LeadRef>();
    const prev = m.get(l.metaLeadId);
    if (!prev || l.leadTime < prev.leadTime) m.set(l.metaLeadId, l);
    leadsByContact.set(l.contactId, m);
  }

  const events: PlannedEvent[] = [];
  const skipped: SkippedEvent[] = [];
  let alreadySent = 0;

  for (const [contactId, leadMap] of leadsByContact) {
    const all = [...leadMap.values()].sort((a, b) => Date.parse(a.leadTime) - Date.parse(b.leadTime));
    const contact = contacts.get(contactId);
    if (!contact) {
      for (const l of all) for (const stage of stages) skipped.push({ stage, contactId, metaLeadId: l.metaLeadId, reason: "no_contact" });
      continue;
    }
    for (const l of all) {
      if (!validLeadId(l.metaLeadId)) for (const stage of stages) skipped.push({ stage, contactId, metaLeadId: l.metaLeadId, reason: "invalid_lead_id" });
    }
    const leads = all.filter((l) => validLeadId(l.metaLeadId) && !Number.isNaN(Date.parse(l.leadTime)));
    if (!leads.length) continue;
    const signals = signalsFor(acts.get(contactId) ?? [], bookings.get(contactId) ?? []);

    for (const stage of stages) {
      if (stage === "won" && contact.stage !== "won") continue;
      const own = signals.filter((s) => s.stage === stage);
      leads.forEach((lead, i) => {
        const start = Date.parse(lead.leadTime);
        const end = i + 1 < leads.length ? Date.parse(leads[i + 1].leadTime) : Number.POSITIVE_INFINITY;
        const first = own.find((s) => s.at > start && s.at < end);
        if (!first) {
          // Клиент без следа с дата — казва се в отчета, за да се запише плащане/фактура.
          if (stage === "won" && i === leads.length - 1 && !own.some((s) => s.at <= start)) {
            skipped.push({ stage, contactId, metaLeadId: lead.metaLeadId, reason: "won_no_date" });
          }
          return;
        }
        const eventId = crmEventId(stage, lead.metaLeadId);
        if (input.alreadyClaimed.has(eventId)) {
          alreadySent += 1;
          return;
        }
        if (first.at - start > CONVERSION_WINDOW_MS) {
          skipped.push({ stage, contactId, metaLeadId: lead.metaLeadId, reason: "after_window" });
          return;
        }
        if (nowMs - first.at > MAX_EVENT_AGE_MS) {
          skipped.push({ stage, contactId, metaLeadId: lead.metaLeadId, reason: "too_old" });
          return;
        }
        // Meta изхвърля събитие, което не е СЛЕД лийда, и такова от бъдещето.
        const eventTime = Math.max(Math.floor(Math.min(first.at, nowMs) / 1000), Math.floor(start / 1000) + 1);
        events.push({
          stage,
          eventId,
          eventName: STAGE_EVENT_NAME[stage],
          eventTime,
          contactId,
          metaLeadId: lead.metaLeadId,
          leadTime: lead.leadTime,
          source: first.source,
        });
      });
    }
  }

  events.sort((a, b) => a.eventTime - b.eventTime || a.eventId.localeCompare(b.eventId));
  return { events, skipped, alreadySent };
}

/** Събитието за етап, готово за buildCapiEvent. */
export function stageServerEvent(e: PlannedEvent, contact: ContactInfo): ServerEvent {
  return {
    event_name: e.eventName,
    event_time: e.eventTime,
    event_id: e.eventId,
    action_source: "system_generated",
    user_data: crmUserData(contact, e.metaLeadId),
    custom_data: { ...CRM_CUSTOM_DATA },
  };
}

/** Суровият лийд („Lead“) като CRM събитие — праща го webhook-ът в момента на лийда. */
export function rawLeadServerEvent(input: {
  leadgenId: string;
  createdTime: string | null | undefined;
  contactId: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  adId?: string | null;
  campaignId?: string | null;
}): ServerEvent {
  const t = input.createdTime ? Date.parse(input.createdTime) : Number.NaN;
  return {
    event_name: STAGE_EVENT_NAME.lead,
    event_id: crmEventId("lead", input.leadgenId),
    action_source: "system_generated",
    event_time: Number.isNaN(t) ? undefined : Math.floor(t / 1000),
    user_data: crmUserData({ id: input.contactId, email: input.email, phone: input.phone, full_name: input.fullName }, input.leadgenId),
    custom_data: {
      lead_source: "meta_instant_form",
      ad_id: input.adId ?? null,
      campaign_id: input.campaignId ?? null,
      ...CRM_CUSTOM_DATA,
    },
  };
}

// ── Дневникът (automation_events) ───────────────────────────────────────────

export type LedgerState = "pending" | "sent" | "rejected" | "unknown";

export interface LedgerRow {
  id: string;
  idempotency_key: string | null;
  status: string;
  created_at: string;
  detail: Record<string, unknown> | null;
}

/**
 * Кои отхвърлени от Meta събития да се пратят пак: само изрично отхвърлените
 * (Meta е отговорила с грешка → не е записала нищо), не по-често от 6 ч и
 * докато са в 7-дневния прозорец. „unknown“ (без отговор) и „pending“
 * (прекъснато) не се повтарят — може вече да са стигнали и ще станат две.
 */
export function retryCandidates(rows: LedgerRow[], now: Date): LedgerRow[] {
  const nowMs = now.getTime();
  return rows.filter((r) => {
    const d = r.detail ?? {};
    if (r.status !== "failed" || d.state !== "rejected") return false;
    if (!d.payload || typeof d.payload !== "object") return false;
    const eventTime = Number(d.event_time);
    if (!Number.isFinite(eventTime) || nowMs - eventTime * 1000 > MAX_EVENT_AGE_MS) return false;
    if ((Number(d.attempts) || 0) >= MAX_ATTEMPTS) return false;
    const last = typeof d.last_attempt_at === "string" ? Date.parse(d.last_attempt_at) : Number.NaN;
    return Number.isNaN(last) || nowMs - last >= RETRY_EVERY_MS;
  });
}

/** Записи „в движение“ отдавна — пращането е прекъснато; за ръчна проверка. */
export function stalePending(rows: LedgerRow[], now: Date): number {
  const nowMs = now.getTime();
  return rows.filter((r) => r.detail?.state === "pending" && nowMs - Date.parse(r.created_at) > STALE_PENDING_MS).length;
}
