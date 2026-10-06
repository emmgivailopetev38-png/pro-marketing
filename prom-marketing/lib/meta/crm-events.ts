import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { buildCapiEvent, isCapiConfigured, postCapiEvents, type CapiResult } from "@/lib/meta/conversions-api";
import { sendTelegram } from "@/lib/notifications/telegram";
import {
  LOOKBACK_MS,
  MAX_EVENT_AGE_MS,
  SIGNAL_ACTIVITY_TYPES,
  cronStages,
  eventIdFromLedgerKey,
  ledgerKey,
  planCrmEvents,
  rawLeadServerEvent,
  retryCandidates,
  stageServerEvent,
  stalePending,
  validLeadId,
  type ActivityRow,
  type BookingRow,
  type ContactInfo,
  type CrmStage,
  type LeadRef,
  type LedgerRow,
  type LedgerState,
  type PlannedEvent,
  type SkipReason,
} from "@/lib/meta/crm-events-rules";

/**
 * CRM събития към Meta („Conversion leads“) — четенето, дневникът и пращането.
 * Правилата (кое, кога, с какво време) са в crm-events-rules.ts.
 *
 * Дневникът е automation_events (event_type `meta_capi_crm`): преди пращане
 * се записва ред с уникален idempotency_key `capi-crm:<event_id>`. Meta НЕ
 * отсява две еднакви сървърни събития, затова тази уникалност е единствената
 * защита от двойно пращане: ако редът вече го има, събитието не тръгва.
 * Няма нова таблица и няма миграция.
 */

type Sb = ReturnType<typeof createServiceClient>;

export const LEDGER_EVENT_TYPE = "meta_capi_crm";

/** Колко нови събития най-много на едно пускане (Meta приема и 1000 — това пази времето на функцията). */
const MAX_EVENTS_PER_RUN = 60;
const MAX_RETRIES_PER_RUN = 30;
const ID_CHUNK = 100;

export interface SendMeta {
  eventId: string;
  stage: CrmStage;
  eventName: string;
  metaLeadId: string;
  contactId: string | null;
  eventTime: number;
}

export type SendOutcome =
  | "sent"
  | "rejected"
  | "unknown"
  | "duplicate"
  | "ledger_error"
  | "sent_unrecorded"
  | "failed_unrecorded";

type Claim = { kind: "claimed"; id: string } | { kind: "duplicate" } | { kind: "ledger_error"; error: string };

type DoneState = Exclude<LedgerState, "pending">;

function stateOf(r: CapiResult): DoneState {
  if (r.ok) return "sent";
  return r.network ? "unknown" : "rejected";
}

function summaryOf(meta: SendMeta, state: LedgerState): string {
  const word = { pending: "праща се", sent: "прието от Meta", rejected: "отказано от Meta", unknown: "без отговор от Meta" }[state];
  return `Meta CRM · ${meta.eventName} · лийд ${meta.metaLeadId} · ${word}`;
}

/** Записва реда ПРЕДИ пращането. Вече го има → събитието е пратено (или се праща) и не тръгва пак. */
async function claim(sb: Sb, meta: SendMeta, payload: Record<string, unknown>): Promise<Claim> {
  const { data, error } = await sb
    .from("automation_events")
    .insert({
      event_type: LEDGER_EVENT_TYPE,
      // В таблицата има само success/failed/skipped; „в движение“ е failed + detail.state
      // = pending, докато Meta не отговори — прекъснато пращане остава видимо, не „успешно“.
      status: "failed",
      related_contact_id: meta.contactId,
      summary: summaryOf(meta, "pending"),
      detail: {
        state: "pending",
        event_id: meta.eventId,
        stage: meta.stage,
        event_name: meta.eventName,
        meta_lead_id: meta.metaLeadId,
        event_time: meta.eventTime,
        payload,
        attempts: 0,
      },
      idempotency_key: ledgerKey(meta.eventId),
    })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") return { kind: "duplicate" };
    return { kind: "ledger_error", error: error?.message ?? "insert failed" };
  }
  return { kind: "claimed", id: String((data as { id: string }).id) };
}

async function finish(
  sb: Sb,
  id: string,
  meta: SendMeta,
  base: Record<string, unknown>,
  result: CapiResult,
  now: Date
): Promise<DoneState> {
  const state = stateOf(result);
  const response = result.ok ? result.data : undefined;
  await sb
    .from("automation_events")
    .update({
      status: state === "sent" ? "success" : "failed",
      summary: summaryOf(meta, state),
      detail: {
        ...base,
        state,
        attempts: (Number(base.attempts) || 0) + 1,
        last_attempt_at: now.toISOString(),
        http_status: result.status ?? null,
        error: result.ok ? null : (result.error ?? "unknown error"),
        response: response ?? null,
      },
    })
    .eq("id", id)
    .then(
      () => null,
      () => null
    );
  return state;
}

/** Едно събитие, точно веднъж: запис → пращане → резултатът в записа. */
export async function sendOnce(
  sb: Sb,
  meta: SendMeta,
  event: Record<string, unknown>,
  now: Date = new Date()
): Promise<{ outcome: SendOutcome; error?: string }> {
  const c = await claim(sb, meta, event);
  if (c.kind === "duplicate") return { outcome: "duplicate" };
  if (c.kind === "ledger_error") return { outcome: "ledger_error", error: c.error };
  const result = await postCapiEvents([event], { numericLeadId: true });
  const base = {
    event_id: meta.eventId,
    stage: meta.stage,
    event_name: meta.eventName,
    meta_lead_id: meta.metaLeadId,
    event_time: meta.eventTime,
    payload: event,
    attempts: 0,
  };
  const state = await finish(sb, c.id, meta, base, result, now);
  return { outcome: state, error: result.error };
}

/**
 * Webhook-ът, режим „live“: суровият лийд като CRM събитие „Lead“ (същото име
 * и id като досега, плюс event_source: crm) и записан в дневника. Не се ли
 * чете дневникът — праща веднъж без запис, за да не се изгуби лийдът за Meta.
 */
export async function sendRawLeadCrmEvent(input: {
  leadgenId: string;
  createdTime: string | null | undefined;
  contactId: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  adId?: string | null;
  campaignId?: string | null;
}): Promise<{ outcome: SendOutcome; error?: string }> {
  if (!isCapiConfigured()) return { outcome: "failed_unrecorded", error: "capi_not_configured" };
  if (!validLeadId(input.leadgenId)) return { outcome: "failed_unrecorded", error: "invalid_lead_id" };
  const server = rawLeadServerEvent(input);
  const event = buildCapiEvent(server);
  const meta: SendMeta = {
    eventId: String(server.event_id),
    stage: "lead",
    eventName: server.event_name,
    metaLeadId: input.leadgenId,
    contactId: input.contactId,
    eventTime: Number(event.event_time),
  };
  const sb = createServiceClient();
  const res = await sendOnce(sb, meta, event);
  if (res.outcome !== "ledger_error") return res;
  const direct = await postCapiEvents([event], { numericLeadId: true });
  return { outcome: direct.ok ? "sent_unrecorded" : "failed_unrecorded", error: direct.error ?? res.error };
}

// ── Кронът ──────────────────────────────────────────────────────────────────

export type RunMode = "dry" | "test" | "live";

export interface RunReport {
  ok: boolean;
  mode: RunMode;
  stages: CrmStage[];
  since: string;
  leads: number;
  planned: number;
  sent: number;
  rejected: number;
  unknown: number;
  duplicates: number;
  alreadySent: number;
  skipped: Partial<Record<SkipReason, number>>;
  retried: { tried: number; sent: number };
  stalePending: number;
  events: Array<{
    stage: string;
    event_name: string;
    event_time: string;
    meta_lead_id: string;
    contact_id: string;
    source: string;
    result?: string;
    error?: string;
  }>;
  errors: string[];
}

function chunks<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function loadContacts(sb: Sb, ids: string[]): Promise<{ rows: ContactInfo[]; error: string | null }> {
  const rows: ContactInfo[] = [];
  for (const part of chunks(ids, ID_CHUNK)) {
    const { data, error } = await sb.from("contacts").select("id, stage, email, phone, full_name").in("id", part);
    if (error) return { rows, error: error.message };
    rows.push(...((data ?? []) as ContactInfo[]));
  }
  return { rows, error: null };
}

/**
 * Едно пускане: чете лийдовете от Meta формите за последните 35 дни, следите
 * им (срещи, разговори, плащания) и резервациите, смята кои етапи са нови и
 * в „live“ ги праща — всяко точно веднъж. После опитва пак отказаните.
 *
 * dry  — само смята и връща списъка; нищо не праща, нищо не записва.
 * test — праща до 3 събития с тестовия код от Events Manager, БЕЗ запис в
 *        дневника (истинското пращане после не е засегнато).
 * live — праща и записва.
 */
export async function runCrmEvents(opts: {
  mode: RunMode;
  testEventCode?: string | null;
  now?: Date;
  stages?: CrmStage[];
}): Promise<RunReport> {
  const now = opts.now ?? new Date();
  const stages = opts.stages ?? cronStages();
  const since = new Date(now.getTime() - LOOKBACK_MS).toISOString();
  const report: RunReport = {
    ok: true,
    mode: opts.mode,
    stages,
    since,
    leads: 0,
    planned: 0,
    sent: 0,
    rejected: 0,
    unknown: 0,
    duplicates: 0,
    alreadySent: 0,
    skipped: {},
    retried: { tried: 0, sent: 0 },
    stalePending: 0,
    events: [],
    errors: [],
  };
  const sb = createServiceClient();

  // 1. Лийдовете от формите (webhook-ът пише meta_lead с leadgen id-то в metadata).
  const leadRes = await allRows<{ contact_id: string; occurred_at: string; metadata: Record<string, unknown> | null }>((from, to) =>
    sb
      .from("contact_activities")
      .select("contact_id, occurred_at, metadata")
      .eq("activity_type", "meta_lead")
      .gte("occurred_at", since)
      .order("id")
      .range(from, to)
  );
  if (leadRes.error) return { ...report, ok: false, errors: [`meta_lead: ${leadRes.error}`] };
  const leads: LeadRef[] = leadRes.rows
    .map((r) => ({ contactId: r.contact_id, metaLeadId: String(r.metadata?.meta_lead_id ?? ""), leadTime: r.occurred_at }))
    .filter((l) => l.contactId && l.metaLeadId);
  report.leads = new Set(leads.map((l) => l.metaLeadId)).size;

  // 2. Дневникът — какво вече е пратено. Без него не се праща нищо (иначе двойно).
  const ledgerSince = new Date(now.getTime() - LOOKBACK_MS - MAX_EVENT_AGE_MS).toISOString();
  const ledgerRes = await allRows<LedgerRow>((from, to) =>
    sb
      .from("automation_events")
      .select("id, idempotency_key, status, created_at, detail")
      .eq("event_type", LEDGER_EVENT_TYPE)
      .gte("created_at", ledgerSince)
      .order("id")
      .range(from, to)
  );
  if (ledgerRes.error) {
    report.errors.push(`automation_events: ${ledgerRes.error}`);
    if (opts.mode === "live") return { ...report, ok: false };
  }
  const ledger = ledgerRes.rows;
  const claimed = new Set(ledger.map((r) => eventIdFromLedgerKey(r.idempotency_key)).filter((x): x is string => !!x));
  report.stalePending = stalePending(ledger, now);

  // 3. Картоните, следите им и резервациите.
  const contactIds = Array.from(new Set(leads.map((l) => l.contactId)));
  const contactRes = await loadContacts(sb, contactIds);
  if (contactRes.error) return { ...report, ok: false, errors: [...report.errors, `contacts: ${contactRes.error}`] };
  const leadContacts = new Set(contactIds);
  const actRes = await allRows<ActivityRow>((from, to) =>
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, title, created_at, created_by, metadata")
      .in("activity_type", [...SIGNAL_ACTIVITY_TYPES])
      .gte("created_at", since)
      .order("id")
      .range(from, to)
  );
  if (actRes.error) return { ...report, ok: false, errors: [...report.errors, `contact_activities: ${actRes.error}`] };
  const bookRes = await allRows<BookingRow>((from, to) =>
    sb.from("bookings").select("attendee_email, attendee_phone, status, created_at").gte("created_at", since).order("id").range(from, to)
  );
  if (bookRes.error) return { ...report, ok: false, errors: [...report.errors, `bookings: ${bookRes.error}`] };

  const plan = planCrmEvents({
    leads,
    contacts: contactRes.rows,
    activities: actRes.rows.filter((a) => leadContacts.has(a.contact_id)),
    bookings: bookRes.rows,
    alreadyClaimed: claimed,
    stages,
    now,
  });
  report.planned = plan.events.length;
  report.alreadySent = plan.alreadySent;
  for (const s of plan.skipped) report.skipped[s.reason] = (report.skipped[s.reason] ?? 0) + 1;

  const contacts = new Map(contactRes.rows.map((c) => [c.id, c]));
  const row = (e: PlannedEvent, result?: string, error?: string) => ({
    stage: e.stage,
    event_name: e.eventName,
    event_time: new Date(e.eventTime * 1000).toISOString(),
    meta_lead_id: e.metaLeadId,
    contact_id: e.contactId,
    source: e.source,
    ...(result ? { result } : {}),
    ...(error ? { error } : {}),
  });

  if (opts.mode === "dry") {
    report.events = plan.events.map((e) => row(e));
    return report;
  }

  if (opts.mode === "test") {
    // Тестовите събития отиват само в „Test events“ и НЕ се записват — истинското
    // пращане после не е засегнато. Последният лийд тръгва като „Lead“, плюс до два
    // нови етапа, ако има такива.
    const picks: Array<{ row: RunReport["events"][number]; event: Record<string, unknown> }> = [];
    const latest = [...leads].filter((l) => validLeadId(l.metaLeadId)).sort((a, b) => b.leadTime.localeCompare(a.leadTime))[0];
    const lc = latest ? contacts.get(latest.contactId) : undefined;
    if (latest && lc) {
      const server = rawLeadServerEvent({
        leadgenId: latest.metaLeadId,
        createdTime: latest.leadTime,
        contactId: lc.id,
        email: lc.email,
        phone: lc.phone,
        fullName: lc.full_name,
      });
      const event = buildCapiEvent(server);
      picks.push({
        event,
        row: {
          stage: "lead",
          event_name: server.event_name,
          event_time: new Date(Number(event.event_time) * 1000).toISOString(),
          meta_lead_id: latest.metaLeadId,
          contact_id: lc.id,
          source: "последният лийд",
        },
      });
    }
    for (const e of plan.events.slice(-2)) {
      const c = contacts.get(e.contactId);
      if (c) picks.push({ event: buildCapiEvent(stageServerEvent(e, c)), row: row(e) });
    }
    for (const p of picks) {
      const r = await postCapiEvents([p.event], { numericLeadId: true, testEventCode: opts.testEventCode ?? null });
      if (r.ok) report.sent += 1;
      else report.rejected += 1;
      report.events.push({ ...p.row, result: r.ok ? "test_sent" : "test_failed", ...(r.error ? { error: r.error } : {}) });
    }
    report.ok = report.rejected === 0;
    return report;
  }

  // live
  const newErrors: string[] = [];
  for (const e of plan.events.slice(0, MAX_EVENTS_PER_RUN)) {
    const c = contacts.get(e.contactId);
    if (!c) continue;
    const event = buildCapiEvent(stageServerEvent(e, c));
    const res = await sendOnce(
      sb,
      { eventId: e.eventId, stage: e.stage, eventName: e.eventName, metaLeadId: e.metaLeadId, contactId: e.contactId, eventTime: e.eventTime },
      event,
      now
    );
    if (res.outcome === "sent") report.sent += 1;
    else if (res.outcome === "rejected") {
      report.rejected += 1;
      if (res.error) newErrors.push(`${e.eventName} · ${res.error}`);
    } else if (res.outcome === "unknown") report.unknown += 1;
    else if (res.outcome === "duplicate") report.duplicates += 1;
    else if (res.outcome === "ledger_error") report.errors.push(`дневник: ${res.error ?? "?"}`);
    report.events.push(row(e, res.outcome, res.error));
  }

  // Отказаните от Meta (напр. изтекъл токен) — пак, докато са в 7-дневния прозорец.
  for (const r of retryCandidates(ledger, now).slice(0, MAX_RETRIES_PER_RUN)) {
    const d = (r.detail ?? {}) as Record<string, unknown>;
    report.retried.tried += 1;
    const result = await postCapiEvents([d.payload as Record<string, unknown>], { numericLeadId: true });
    const meta: SendMeta = {
      eventId: String(d.event_id ?? ""),
      stage: (d.stage as CrmStage) ?? "meeting",
      eventName: String(d.event_name ?? ""),
      metaLeadId: String(d.meta_lead_id ?? ""),
      contactId: null,
      eventTime: Number(d.event_time),
    };
    const state = await finish(sb, r.id, meta, d, result, now);
    if (state === "sent") report.retried.sent += 1;
  }

  if (newErrors.length) {
    report.ok = false;
    await sendTelegram(
      `⚠️ <b>Meta не прие ${newErrors.length} CRM ${newErrors.length === 1 ? "събитие" : "събития"}</b>\n` +
        `${escapeTg(newErrors[0].slice(0, 300))}\n` +
        `Пращат се пак на всеки 6 ч до 7 дни. Списъкът: automation_events, event_type = ${LEDGER_EVENT_TYPE}.`
    ).catch(() => false);
  }
  return report;
}

function escapeTg(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
