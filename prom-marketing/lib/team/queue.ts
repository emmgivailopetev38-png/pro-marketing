import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { decodeFormAnswers } from "@/lib/leads/form-labels";
import type { BookedRow, QueueLead } from "./types";
import { todayEndIso } from "./time";
import {
  ASSIGN_TYPE,
  looksLikePhone,
  phoneDigits,
  pickGiven,
  safeTextQuery,
  splitTeamDue,
  summarizeAttempts,
  type AttemptRow,
  type AttemptSummary,
} from "./queue-rules";

/**
 * Опашката за звънене на човека за срещите.
 *
 * „Нови“ = картон в етап lead, с телефон, от последните 90 дни, без нито
 * един опит за контакт (call / meeting / viber_sent). Мери се по активности,
 * не по next_followup_at — иначе тъмната опашка е невидима (виж
 * crm-tumnata-opashka-liidove). Най-новите най-горе: топлият лийд е този
 * отпреди пет минути.
 *
 * „От Ивайло“ = картони, които Ивайло изрично е дал на екипа (не вдигат,
 * разбрали сте се да се чуете и не се обадиха, контактът е бил съвсем лек).
 * Стоят там, докато екипът не ги докосне веднъж — после текат по общите
 * правила. Датата за чуване няма значение: в списъка са, защото са дадени.
 *
 * „За повторно“ = хора, на които САМИЯТ екип е звънял и е насрочил ново
 * чуване, чийто ден е дошъл. Обещанията на Ивайло („ти обеща да звъннеш“)
 * остават в неговия сутрешен списък, не тук.
 *
 * „Чакат обратно обаждане“ = „Не вдигна“ / „чуване пак“ за друг ден. Картата
 * остава на екрана, защото хората връщат обаждане десет минути по-късно и
 * срещата трябва да се запише от нея (16.09.2026: два такива случая за един
 * следобед). Изчезва само когато човекът я скрие или часът ѝ дойде.
 * Правилата са в queue-rules.ts, за да се тестват без база.
 */

const COLS =
  "id, full_name, phone, email, company, business, source, source_ref, stage, followup_status, next_followup_at, created_at, notes";
const ATTEMPT_TYPES = ["call", "meeting", "viber_sent"];
const WINDOW_DAYS = 90;
const MAX_FRESH = 200;
const MAX_SEARCH = 20;
const MAX_ASSIGNED = 400;

interface ContactLite {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  business: string | null;
  source: string;
  source_ref: string | null;
  stage: string;
  followup_status: string | null;
  next_followup_at: string | null;
  created_at: string;
  notes: string | null;
}

type Sb = ReturnType<typeof createServiceClient>;
type FormInfo = { ad_name: string | null; field_data: unknown };

export interface SetterQueue {
  fresh: QueueLead[];
  /** Дадени от Ивайло и още недокоснати от екипа. */
  given: QueueLead[];
  retry: QueueLead[];
  /** Не вдигнаха / чуване по-късно — може да върнат обаждане, картата е под ръка. */
  waiting: QueueLead[];
  /** Насрочени от екипа за по-нататък — само брой, за да се знае, че не са изгубени. */
  later: number;
  booked: BookedRow[];
}

async function loadAttempts(sb: Sb, ids: string[]): Promise<Map<string, AttemptSummary>> {
  if (ids.length === 0) return new Map();
  const { data } = await sb
    .from("contact_activities")
    .select("contact_id, activity_type, title, occurred_at, created_by, metadata")
    .in("contact_id", ids)
    .in("activity_type", [...ATTEMPT_TYPES, ASSIGN_TYPE])
    .order("occurred_at", { ascending: false });
  return summarizeAttempts((data ?? []) as AttemptRow[]);
}

/** Отговорите от формата — по meta_lead_id (source_ref на картона). */
async function loadForms(sb: Sb, contacts: ContactLite[]): Promise<Map<string, FormInfo>> {
  const forms = new Map<string, FormInfo>();
  const refs = contacts.filter((c) => c.source === "meta_lead" && c.source_ref).map((c) => c.source_ref as string);
  if (refs.length === 0) return forms;
  const { data } = await sb.from("meta_leads").select("meta_lead_id, ad_name, field_data").in("meta_lead_id", refs);
  for (const m of (data ?? []) as Array<{ meta_lead_id: string; ad_name: string | null; field_data: unknown }>) {
    forms.set(m.meta_lead_id, { ad_name: m.ad_name, field_data: m.field_data });
  }
  return forms;
}

function toLead(c: ContactLite, attempts: Map<string, AttemptSummary>, forms: Map<string, FormInfo>): QueueLead {
  const form = c.source_ref ? forms.get(c.source_ref) : undefined;
  const att = attempts.get(c.id);
  return {
    id: c.id,
    full_name: c.full_name,
    phone: c.phone as string,
    email: c.email,
    company: c.company,
    business: c.business,
    source: c.source,
    stage: c.stage,
    followup_status: c.followup_status,
    next_followup_at: c.next_followup_at,
    created_at: c.created_at,
    notes: c.notes,
    ad_name: form?.ad_name ?? null,
    form_answers: form ? decodeFormAnswers(form.field_data) : [],
    attempts: att?.count ?? 0,
    last_attempt: att?.last ?? null,
    given_reason: att?.given?.reason ?? null,
  };
}

/** Картоните с маркер „дадено на екипа“ — id-тата идват от активностите. */
async function loadAssigned(sb: Sb): Promise<ContactLite[]> {
  const { data: marks } = await sb
    .from("contact_activities")
    .select("contact_id")
    .eq("activity_type", ASSIGN_TYPE)
    .order("occurred_at", { ascending: false })
    .limit(MAX_ASSIGNED);
  const ids = [...new Set((marks ?? []).map((m) => m.contact_id as string))];
  if (ids.length === 0) return [];
  const { data } = await sb
    .from("contacts")
    .select(COLS)
    .in("id", ids)
    .not("phone", "is", null)
    .not("stage", "in", "(won,lost)");
  return (data ?? []) as ContactLite[];
}

export async function loadSetterQueue(now: Date = new Date()): Promise<SetterQueue> {
  const sb = createServiceClient();
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000).toISOString();
  const todayEnd = todayEndIso(now);

  const [{ data: leadRows }, { data: dueRows }, { data: bookedRows }, assigned] = await Promise.all([
    sb
      .from("contacts")
      .select(COLS)
      .eq("stage", "lead")
      .not("phone", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_FRESH),
    sb
      .from("contacts")
      .select(COLS)
      .eq("followup_status", "needs_call")
      .not("phone", "is", null)
      .not("next_followup_at", "is", null)
      .in("stage", ["lead", "contacted"])
      .order("next_followup_at", { ascending: true })
      .limit(150),
    sb
      .from("bookings")
      .select("id, attendee_name, attendee_phone, scheduled_at, business, status, raw_payload")
      .eq("raw_payload->>source", "ekip")
      .gte("scheduled_at", new Date(now.getTime() - 3_600_000).toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(30),
    loadAssigned(sb),
  ]);

  const leads = (leadRows ?? []) as ContactLite[];
  const due = (dueRows ?? []) as ContactLite[];
  const attempts = await loadAttempts(sb, [...new Set([...leads, ...due, ...assigned].map((c) => c.id))]);

  const givenContacts = pickGiven(assigned, attempts);
  const givenIds = new Set(givenContacts.map((c) => c.id));
  const freshContacts = leads.filter((c) => !attempts.has(c.id));
  const split = splitTeamDue(due, attempts, todayEnd);
  const retry = split.retry.filter((c) => !givenIds.has(c.id));
  const waiting = split.waiting.filter((c) => !givenIds.has(c.id));
  const later = split.later;
  const forms = await loadForms(sb, [...freshContacts, ...givenContacts, ...retry, ...waiting]);
  const lead = (c: ContactLite) => toLead(c, attempts, forms);

  const booked: BookedRow[] = ((bookedRows ?? []) as Array<Record<string, unknown>>).map((b) => ({
    id: String(b.id),
    attendee_name: String(b.attendee_name ?? ""),
    attendee_phone: (b.attendee_phone as string | null) ?? null,
    scheduled_at: String(b.scheduled_at),
    business: (b.business as string | null) ?? null,
    status: String(b.status ?? ""),
    notes: ((b.raw_payload as Record<string, unknown> | null)?.notes as string | null) ?? null,
  }));

  return {
    fresh: freshContacts.map(lead),
    given: givenContacts.map(lead),
    retry: retry.map(lead),
    waiting: waiting.map(lead),
    later,
    booked,
  };
}

/**
 * Търсачката: „върна ми обаждане, кой беше?“. Цифри → по телефона (както е
 * изписан на екрана на телефона му: с +359, с 0 или само последните цифри);
 * букви → по име, имейл или фирма. Всеки етап, всяко състояние — картата
 * излиза с всичките си бутони, за да се запише срещата от нея.
 */
export async function searchLeads(raw: string): Promise<QueueLead[]> {
  const q = safeTextQuery(raw);
  if (q.length < 2) return [];
  const sb = createServiceClient();
  const base = () =>
    sb.from("contacts").select(COLS).not("phone", "is", null).order("created_at", { ascending: false }).limit(MAX_SEARCH);
  const { data } = looksLikePhone(q)
    ? await base().ilike("phone", `%${phoneDigits(q)}%`)
    : await base().or(`full_name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`);
  const found = (data ?? []) as ContactLite[];
  if (found.length === 0) return [];
  const [attempts, forms] = await Promise.all([loadAttempts(sb, found.map((c) => c.id)), loadForms(sb, found)]);
  return found.map((c) => toLead(c, attempts, forms));
}
