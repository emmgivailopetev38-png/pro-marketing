import "server-only";
import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchSheetCsv, parseCsv, type CsvRow } from "./google-sheets";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { chunks } from "@/lib/array";

export interface LeadSource {
  id: string;
  label: string;
  csv_url: string;
  form_id: string | null;
}

export interface NormalizedLead {
  meta_lead_id: string;
  form_id: string;
  form_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  field_data: Record<string, string>;
  source: string;
  created_time: string | null;
}

// Column names appear in two flavours:
//  - Meta "Send to Google Sheets" sync → snake_case: id, created_time, full_name, email, phone_number, form_id, form_name, ad_name, campaign_name
//  - Meta Leads Centre CSV export → Title Case BG/EN: Created, Name, Email address, Phone, Source, Form, Channel
function lower(row: CsvRow): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.toLowerCase().trim()] = (v ?? "").trim();
  }
  return out;
}

function pick(r: Record<string, string>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = r[k.toLowerCase()];
    if (v && v.trim().length > 0) return v.trim();
  }
  return null;
}

/** Parse "05/20/2026 1:59am" / ISO / unix-like strings into ISO 8601. */
function parseFlexibleDate(raw: string | null): string | null {
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();
  // Meta Lead Center "05/20/2026 1:59am" format
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (m) {
    let hour = parseInt(m[4], 10);
    const ampm = m[6]?.toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    const d = new Date(
      Date.UTC(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10), hour, parseInt(m[5], 10))
    );
    return d.toISOString();
  }
  return null;
}

function synthesizeId(...parts: Array<string | null | undefined>): string {
  const joined = parts.filter(Boolean).join("|");
  return "syn_" + createHash("sha256").update(joined).digest("hex").slice(0, 24);
}

/**
 * Canonicalise a phone to BG E.164 (+359XXXXXXXXX) so the SAME number written in
 * any format (0877…, 359877…, +359 877…, with spaces/dashes) dedups to one key.
 */
export function canonPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/^p:/i, "").replace(/[^\d]/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2); // intl 00 prefix
  if (/^0\d{8,9}$/.test(d)) d = "359" + d.slice(1); // national 0… → 359…
  else if (d.length === 8 || d.length === 9) d = "359" + d; // bare national → +359
  const e164 = "+" + d;
  return /^\+\d{9,15}$/.test(e164) ? e164 : null;
}

export function normalizeLeadRow(row: CsvRow, sourceLabel: string): NormalizedLead | null {
  const r = lower(row);

  const name = pick(r, "full_name", "full name", "name", "име");
  const emailRaw = pick(r, "email", "email_address", "email address", "имейл");
  const emailValid = emailRaw && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRaw) ? emailRaw : null;
  const email = emailValid ? emailValid.toLowerCase() : null;
  // Meta's "Send to Google Sheets" prefixes phone with "p:" (forces text). Strip
  // it + canonicalise to +359 E.164 so the SAME number in any format dedups to one.
  const phoneRaw = pick(r, "phone_number", "phone number", "phone", "телефон");
  const phone = canonPhone(phoneRaw);
  const createdRaw = pick(r, "created_time", "creation_time", "submit_time", "submitted_at", "created", "date added");
  const created = parseFlexibleDate(createdRaw);

  // Require a real contact channel — skip header-junk / misaligned rows.
  if (!email && !phone) return null;

  const realId = pick(r, "id", "lead_id");
  const formName = pick(r, "form_name", "form name", "form");
  const formId = (pick(r, "form_id", "form id") ?? "").replace(/^f:/i, "") || null;

  // Stable identity: real Meta id if present, else a deterministic hash of the
  // NORMALISED natural key (email | phone | ISO-created). No longer includes the
  // form name or the raw date string — so a re-export (or a "…-copy" form) of the
  // SAME lead yields the SAME id and can't duplicate the row.
  const meta_lead_id = realId ?? synthesizeId(email, phone, created);

  return {
    meta_lead_id,
    form_id: formId ?? formName ?? sourceLabel,
    form_name: formName,
    campaign_id: pick(r, "campaign_id", "campaign id"),
    campaign_name: pick(r, "campaign_name", "campaign name", "source"),
    ad_id: pick(r, "ad_id", "ad id"),
    ad_name: pick(r, "ad_name", "ad name"),
    full_name: name,
    email,
    phone,
    field_data: row,
    source: sourceLabel,
    created_time: created,
  };
}

async function upsertLeads(
  leads: NormalizedLead[]
): Promise<{ inserted: number; error: string | null }> {
  if (leads.length === 0) return { inserted: 0, error: null };

  const supabase = createServiceClient();
  // Dedup by BOTH the lead id AND a normalised natural key (email|phone|created).
  // The natural key is robust to id changes (e.g. Make re-issuing synthetic ids) —
  // that id churn was the root cause of the duplicate-lead cascade.
  const { data: existing } = await supabase
    .from("meta_leads")
    .select("meta_lead_id, email, phone, created_time");
  const naturalKey = (email: string | null, phone: string | null, created: string | null) =>
    `${(email ?? "").toLowerCase().trim()}|${canonPhone(phone) ?? ""}|${created ?? ""}`;
  const seenIds = new Set((existing ?? []).map((r) => r.meta_lead_id));
  const seenKeys = new Set(
    (existing ?? []).map((r) =>
      naturalKey(
        r.email as string | null,
        r.phone as string | null,
        r.created_time as string | null
      )
    )
  );
  const fresh = leads.filter(
    (l) =>
      !seenIds.has(l.meta_lead_id) &&
      !seenKeys.has(naturalKey(l.email, l.phone, l.created_time))
  );
  if (fresh.length === 0) return { inserted: 0, error: null };

  const rows = fresh.map((l) => ({
    meta_lead_id: l.meta_lead_id,
    form_id: l.form_id,
    form_name: l.form_name,
    campaign_id: l.campaign_id,
    campaign_name: l.campaign_name,
    ad_id: l.ad_id,
    ad_name: l.ad_name,
    full_name: l.full_name,
    email: l.email,
    phone: l.phone,
    field_data: l.field_data,
    source: l.source,
    raw_payload: l.field_data,
    created_time: l.created_time,
  }));

  const { error } = await supabase
    .from("meta_leads")
    .upsert(rows, { onConflict: "meta_lead_id" });

  if (error) return { inserted: 0, error: error.message.slice(0, 240) };
  return { inserted: fresh.length, error: null };
}

export async function importCsvBuffer(
  csvText: string,
  sourceLabel: string
): Promise<{ fetched: number; inserted: number; error: string | null; leads: NormalizedLead[] }> {
  try {
    const rows = parseCsv(csvText);
    const leads = rows
      .map((r) => normalizeLeadRow(r, sourceLabel))
      .filter((l): l is NormalizedLead => l !== null);
    const { inserted, error } = await upsertLeads(leads);
    return { fetched: leads.length, inserted, error, leads };
  } catch (e) {
    return {
      fetched: 0,
      inserted: 0,
      error: e instanceof Error ? e.message.slice(0, 240) : String(e),
      leads: [],
    };
  }
}

export interface SyncResult {
  source_id: string;
  label: string;
  fetched: number;
  inserted: number;
  error: string | null;
}

type Sb = ReturnType<typeof createServiceClient>;
type ContactRef = { id: string; full_name: string | null; phone: string | null };
type ContactRow = ContactRef & { email: string | null };

const LOOKUP_CHUNK = 50;

/** Имейл, който може безопасно да влезе в `.or("email.ilike.\"…\"")` (без запетая, скоби, кавички, наклонена). */
function safeForOrFilter(email: string): boolean {
  return !/[",()\\]/.test(email);
}

/**
 * Предварително зарежда съществуващите контакти по имейл (без значение от
 * регистъра) и по телефон — по една заявка на парче вместо по две на лийд.
 * Първият срещнат по `created_at` е „оригиналът“ (най-старият). Имейл, който не
 * може да влезе в филтъра, и парче със заявка с грешка просто не се зареждат —
 * за тях `mirrorLeadsToContacts` пита поотделно, както преди.
 */
async function preloadContacts(
  supabase: Sb,
  emails: string[],
  phones: string[],
): Promise<{ byEmail: Map<string, ContactRef>; byPhone: Map<string, ContactRef>; loadedEmails: Set<string>; loadedPhones: Set<string> }> {
  const byEmail = new Map<string, ContactRef>();
  const byPhone = new Map<string, ContactRef>();
  const loadedEmails = new Set<string>();
  const loadedPhones = new Set<string>();

  for (const part of chunks(emails.filter(safeForOrFilter), LOOKUP_CHUNK)) {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, full_name, phone, email")
      .or(part.map((e) => `email.ilike."${e}"`).join(","))
      .order("created_at", { ascending: true });
    if (error) continue;
    for (const row of (data ?? []) as ContactRow[]) {
      const key = row.email?.toLowerCase();
      // ilike третира „_“ и „%“ като заместители — приемаме само точно съвпадение.
      if (key && part.includes(key) && !byEmail.has(key)) byEmail.set(key, { id: row.id, full_name: row.full_name, phone: row.phone });
    }
    for (const e of part) loadedEmails.add(e);
  }

  for (const part of chunks(phones, LOOKUP_CHUNK)) {
    const { data, error } = await supabase
      .from("contacts")
      .select("id, full_name, phone")
      .in("phone", part)
      .order("created_at", { ascending: true });
    if (error) continue;
    for (const row of (data ?? []) as ContactRef[]) {
      if (row.phone && !byPhone.has(row.phone)) byPhone.set(row.phone, row);
    }
    for (const p of part) loadedPhones.add(p);
  }

  return { byEmail, byPhone, loadedEmails, loadedPhones };
}

/** Кои (контакт, meta_lead_id) двойки вече имат запис „meta_lead“ в хронологията. */
async function preloadMetaLeadActivities(supabase: Sb, contactIds: string[]): Promise<Set<string> | null> {
  const seen = new Set<string>();
  for (const part of chunks(contactIds, LOOKUP_CHUNK)) {
    const { data, error } = await supabase
      .from("contact_activities")
      .select("contact_id, metadata")
      .eq("activity_type", "meta_lead")
      .in("contact_id", part);
    if (error) return null;
    for (const row of (data ?? []) as { contact_id: string; metadata: { meta_lead_id?: string } | null }[]) {
      const id = row.metadata?.meta_lead_id;
      if (id) seen.add(`${row.contact_id}|${id}`);
    }
  }
  return seen;
}

/**
 * Mirror freshly synced Meta leads into the new contacts + activities tables
 * so they appear in /admin/clients automatically (not just /admin/leads).
 * Dedup by email first, then phone. Updates missing fields on existing rows.
 *
 * Заявките са на пакети: контактите по имейл/телефон и съществуващите записи в
 * хронологията се зареждат предварително (по няколко заявки общо, не по 3–5 на
 * лийд); вътре в партидата картите се обновяват в паметта, така че два лийда с
 * един и същ имейл пак водят до един контакт.
 */
export async function mirrorLeadsToContacts(leads: NormalizedLead[]): Promise<number> {
  if (leads.length === 0) return 0;
  const supabase = createServiceClient();
  let count = 0;

  const emails = [...new Set(leads.map((l) => l.email?.toLowerCase()).filter((e): e is string => !!e))];
  const phones = [...new Set(leads.map((l) => l.phone).filter((p): p is string => !!p))];
  const { byEmail, byPhone, loadedEmails, loadedPhones } = await preloadContacts(supabase, emails, phones);

  type NewActivity = {
    contact_id: string;
    activity_type: "meta_lead";
    title: string;
    body: string | null;
    occurred_at: string;
    metadata: Record<string, unknown>;
    created_by: string;
  };
  const activities: NewActivity[] = [];
  const queued = new Set<string>(); // `${contactId}|${meta_lead_id}` — вече сложени в тази партида
  const existingContactIds = new Set<string>();

  const resolved: { lead: NormalizedLead; contactId: string; isNew: boolean }[] = [];

  for (const lead of leads) {
    const email = lead.email?.toLowerCase() ?? null;
    const phone = lead.phone ?? null;
    if (!email && !phone) continue;

    // Lookup existing — case-insensitive email, then phone; take the OLDEST match
    // (the canonical survivor) and tolerate pre-existing duplicates.
    let existing: ContactRef | null = null;
    if (email) {
      existing = byEmail.get(email) ?? null;
      if (!existing && !loadedEmails.has(email)) {
        const { data } = await supabase
          .from("contacts")
          .select("id, full_name, phone")
          .ilike("email", email)
          .order("created_at", { ascending: true })
          .limit(1);
        existing = data?.[0] ?? null;
      }
    }
    if (!existing && phone) {
      existing = byPhone.get(phone) ?? null;
      if (!existing && !loadedPhones.has(phone)) {
        const { data } = await supabase
          .from("contacts")
          .select("id, full_name, phone")
          .eq("phone", phone)
          .order("created_at", { ascending: true })
          .limit(1);
        existing = data?.[0] ?? null;
      }
    }

    let contactId: string;
    let isNew = false;
    if (existing) {
      contactId = existing.id;
      const patch: { full_name?: string; phone?: string } = {};
      if (!existing.full_name && lead.full_name) patch.full_name = lead.full_name;
      if (!existing.phone && phone) patch.phone = phone;
      if (Object.keys(patch).length > 0) {
        await supabase.from("contacts").update(patch).eq("id", contactId);
        existing.full_name = patch.full_name ?? existing.full_name;
        existing.phone = patch.phone ?? existing.phone;
        if (patch.phone && !byPhone.has(patch.phone)) byPhone.set(patch.phone, existing);
      }
    } else {
      const { data: created } = await supabase
        .from("contacts")
        .insert({
          full_name: lead.full_name,
          email: email,
          phone: phone,
          stage: "lead",
          source: "meta_lead",
          source_ref: lead.meta_lead_id,
          created_at: lead.created_time ?? undefined,
        })
        .select("id")
        .single();
      if (!created) continue;
      contactId = created.id;
      isNew = true;
      count++;
      // Следващ лийд със същия имейл/телефон в партидата намира този контакт.
      const ref: ContactRef = { id: contactId, full_name: lead.full_name, phone };
      if (email) byEmail.set(email, ref);
      if (phone && !byPhone.has(phone)) byPhone.set(phone, ref);

      // Auto-welcome за нови лидове от таблицата (същият template като сайт/Meta
      // webhook; idempotent — никой не получава два пъти). Изключва се с
      // META_AUTO_WELCOME=false.
      if (email && process.env.META_AUTO_WELCOME !== "false") {
        await sendWelcomeEmail({
          supabase,
          contactId,
          to: email,
          fullName: lead.full_name,
          source: "meta_lead",
        }).catch(() => {});
      }
    }

    if (!isNew) existingContactIds.add(contactId);
    resolved.push({ lead, contactId, isNew });
  }

  // Activity timeline (idempotent on meta_lead_id). Нов контакт няма как да има
  // стар запис; за съществуващите — една заявка на парче. Ако не успее, пита
  // се поотделно за всеки лийд, както преди.
  const seen = await preloadMetaLeadActivities(supabase, [...existingContactIds]);

  for (const { lead, contactId, isNew } of resolved) {
    const key = `${contactId}|${lead.meta_lead_id}`;
    if (queued.has(key)) continue;
    if (!isNew) {
      if (seen) {
        if (seen.has(key)) continue;
      } else {
        const { data: exists } = await supabase
          .from("contact_activities")
          .select("id")
          .eq("contact_id", contactId)
          .eq("activity_type", "meta_lead")
          .contains("metadata", { meta_lead_id: lead.meta_lead_id })
          .maybeSingle();
        if (exists) continue;
      }
    }
    queued.add(key);
    activities.push({
      contact_id: contactId,
      activity_type: "meta_lead",
      title: `Meta lead · ${lead.form_name ?? lead.campaign_name ?? "Lead Form"}`,
      body: lead.ad_name ? `Реклама: ${lead.ad_name}` : null,
      occurred_at: lead.created_time ?? new Date().toISOString(),
      metadata: {
        meta_lead_id: lead.meta_lead_id,
        form_id: lead.form_id,
        campaign_id: lead.campaign_id,
        ad_id: lead.ad_id,
        source: lead.source,
      },
      created_by: "cron_sync",
    });
  }

  // Записите — на пакети; ако пакет се провали, поотделно (един лош ред не губи останалите).
  for (const part of chunks(activities, 100)) {
    const { error } = await supabase.from("contact_activities").insert(part);
    if (error) {
      for (const row of part) await supabase.from("contact_activities").insert(row);
    }
  }
  return count;
}

export async function syncAllSources(): Promise<{
  results: SyncResult[];
  totalNewLeads: number;
  newLeads: NormalizedLead[];
  mirroredToContacts: number;
}> {
  const supabase = createServiceClient();
  const { data: sources } = await supabase
    .from("meta_lead_sources")
    .select("id, label, csv_url, form_id")
    .eq("enabled", true);

  const results: SyncResult[] = [];
  const newLeads: NormalizedLead[] = [];

  for (const source of (sources ?? []) as LeadSource[]) {
    const result: SyncResult = {
      source_id: source.id,
      label: source.label,
      fetched: 0,
      inserted: 0,
      error: null,
    };
    try {
      const csv = await fetchSheetCsv(source.csv_url);
      const parsed = await importCsvBuffer(csv, `google_sheets:${source.label}`);
      result.fetched = parsed.fetched;
      result.inserted = parsed.inserted;
      result.error = parsed.error;
      newLeads.push(...parsed.leads.slice(0, parsed.inserted));
    } catch (e) {
      result.error = e instanceof Error ? e.message.slice(0, 240) : String(e);
    }

    await supabase
      .from("meta_lead_sources")
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_count: result.inserted,
        last_sync_error: result.error,
      })
      .eq("id", source.id);

    results.push(result);
  }

  // Mirror to contacts/activities after meta_leads upserts
  const mirroredToContacts = await mirrorLeadsToContacts(newLeads);

  return {
    results,
    totalNewLeads: results.reduce((s, r) => s + r.inserted, 0),
    newLeads,
    mirroredToContacts,
  };
}
