// ─────────────────────────────────────────────────────────────────────────
// Read слой за Hermes-facing /api/crm/* GET endpoints.
//
// Идиомът е същият като счетоводството: широк select от Supabase + чисто
// TypeScript филтриране/сортиране/странициране. Таблиците са малки (стотици
// редове), а това прави всичко тестваемо с fake-supabase без ilike/range.
//
// Конвенции за параметрите:
//   • limit ∈ [1, 200], подразбиране 50; offset ≥ 0.
//   • csv филтри ("status=paid,sent") — невалидните стойности отпадат;
//     ако НИЩО не оцелее → [] и route-ът връща 400.
//   • Дати: from е ВКЛЮЧВАЩО, to е ИЗКЛЮЧВАЩО ([from, to)) — същата
//     семантика като счетоводните периоди.
// ─────────────────────────────────────────────────────────────────────────

import { createServiceClient } from "@/lib/supabase/service";

export type CrmRow = { id: string } & Record<string, unknown>;

export interface ListResult<T = CrmRow> {
  items: T[];
  total: number;
  error: string | null;
}

// ── чисти помощни (parse на query параметри) ───────────────────────────────

/** limit: подразбиране 50, клампнат в [1, 200]; 0/NaN → подразбиране. */
export function clampLimit(raw: string | null | undefined, def = 50, max = 200): number {
  return Math.min(Math.max(Number(raw) || def, 1), max);
}

/** offset: подразбиране 0, никога отрицателен. */
export function parseOffset(raw: string | null | undefined): number {
  return Math.max(Number(raw) || 0, 0);
}

/**
 * csv филтър срещу allowed списък. Липсващ параметър → null (без филтър).
 * Подадени, но изцяло невалидни стойности → [] (route-ът връща 400).
 */
export function parseCsv<T extends string>(
  raw: string | null | undefined,
  allowed: readonly T[]
): T[] | null {
  if (raw === null || raw === undefined) return null;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
}

/** "true"/"1" → true, "false"/"0" → false, иначе undefined (без филтър). */
export function parseBoolParam(raw: string | null | undefined): boolean | undefined {
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return undefined;
}

// ── вътрешни помощни ───────────────────────────────────────────────────────

function ts(iso: unknown): number | null {
  if (typeof iso !== "string" || !iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/** [from, to) — невалидна/липсваща дата на реда → извън диапазона. */
function inRange(dateISO: unknown, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const t = ts(dateISO);
  if (t === null) return false;
  const f = from ? ts(from) : null;
  if (f !== null && t < f) return false;
  const e = to ? ts(to) : null;
  if (e !== null && t >= e) return false;
  return true;
}

function textMatches(q: string, fields: unknown[]): boolean {
  const needle = q.toLowerCase();
  return fields.some((f) => typeof f === "string" && f.toLowerCase().includes(needle));
}

/**
 * Телефонно търсене: сравнява само цифрите, а локалното "0888…" се пробва и
 * като канонично "359888…" (телефоните в базата са нормализирани на +359).
 */
function phoneMatches(q: string, phone: unknown): boolean {
  if (typeof phone !== "string") return false;
  const qd = q.replace(/\D/g, "");
  if (qd.length < 5) return false;
  const pd = phone.replace(/\D/g, "");
  if (pd.includes(qd)) return true;
  if (qd.startsWith("0") && pd.includes("359" + qd.slice(1))) return true;
  return false;
}

function sortByDateDesc(rows: CrmRow[], dateOf: (r: CrmRow) => unknown): CrmRow[] {
  return [...rows].sort((a, b) => (ts(dateOf(b)) ?? 0) - (ts(dateOf(a)) ?? 0));
}

function paginate(rows: CrmRow[], limit: number, offset: number): { items: CrmRow[]; total: number } {
  return { total: rows.length, items: rows.slice(offset, offset + limit) };
}

async function fetchAll(table: string): Promise<{ rows: CrmRow[]; error: string | null }> {
  const sb = createServiceClient();
  const { data, error } = await sb.from(table).select("*");
  if (error) return { rows: [], error: error.message ?? "select failed" };
  return { rows: (data ?? []) as CrmRow[], error: null };
}

interface PageOpts {
  limit: number;
  offset: number;
}

// ── фактури ────────────────────────────────────────────────────────────────

export async function listInvoices(
  opts: PageOpts & { status?: string[]; contact_id?: string; q?: string; from?: string; to?: string }
): Promise<ListResult> {
  const { rows, error } = await fetchAll("invoices");
  if (error) return { items: [], total: 0, error };
  const dateOf = (r: CrmRow) => r.issue_date ?? r.created_at;
  const filtered = rows.filter((r) => {
    if (opts.status && !opts.status.includes(String(r.status))) return false;
    if (opts.contact_id && r.contact_id !== opts.contact_id) return false;
    if (opts.q && !textMatches(opts.q, [r.invoice_number, r.client_name, r.client_email])) return false;
    return inRange(dateOf(r), opts.from, opts.to);
  });
  return { ...paginate(sortByDateDesc(filtered, dateOf), opts.limit, opts.offset), error: null };
}

// ── плащания ───────────────────────────────────────────────────────────────

export async function listPayments(
  opts: PageOpts & {
    match_status?: string[];
    contact_id?: string;
    invoice_id?: string;
    q?: string;
    from?: string;
    to?: string;
  }
): Promise<ListResult> {
  const { rows, error } = await fetchAll("payments");
  if (error) return { items: [], total: 0, error };
  const dateOf = (r: CrmRow) => r.paid_at ?? r.created_at;
  const filtered = rows.filter((r) => {
    if (opts.match_status && !opts.match_status.includes(String(r.match_status))) return false;
    if (opts.contact_id && r.contact_id !== opts.contact_id) return false;
    if (opts.invoice_id && r.invoice_id !== opts.invoice_id) return false;
    if (opts.q && !textMatches(opts.q, [r.counterparty_name, r.payment_reference_redacted])) return false;
    return inRange(dateOf(r), opts.from, opts.to);
  });
  return { ...paginate(sortByDateDesc(filtered, dateOf), opts.limit, opts.offset), error: null };
}

// ── разходи ────────────────────────────────────────────────────────────────

export async function listExpenses(
  opts: PageOpts & {
    category?: string[];
    status?: string[];
    is_personal?: boolean;
    q?: string;
    from?: string;
    to?: string;
  }
): Promise<ListResult> {
  const { rows, error } = await fetchAll("expenses");
  if (error) return { items: [], total: 0, error };
  const dateOf = (r: CrmRow) => r.expense_date ?? r.created_at;
  const filtered = rows.filter((r) => {
    if (opts.category && !opts.category.includes(String(r.category))) return false;
    if (opts.status && !opts.status.includes(String(r.status))) return false;
    if (opts.is_personal !== undefined && Boolean(r.is_personal) !== opts.is_personal) return false;
    if (opts.q && !textMatches(opts.q, [r.supplier_name, r.description, r.invoice_number])) return false;
    return inRange(dateOf(r), opts.from, opts.to);
  });
  return { ...paginate(sortByDateDesc(filtered, dateOf), opts.limit, opts.offset), error: null };
}

// ── контакти ───────────────────────────────────────────────────────────────

export async function listContacts(
  opts: PageOpts & { q?: string; stage?: string[]; followup_status?: string[] }
): Promise<ListResult> {
  const { rows, error } = await fetchAll("contacts");
  if (error) return { items: [], total: 0, error };
  const filtered = rows.filter((r) => {
    if (opts.stage && !opts.stage.includes(String(r.stage))) return false;
    if (opts.followup_status && !opts.followup_status.includes(String(r.followup_status))) return false;
    if (opts.q && !textMatches(opts.q, [r.full_name, r.email, r.phone, r.company]) && !phoneMatches(opts.q, r.phone)) {
      return false;
    }
    return true;
  });
  return {
    ...paginate(sortByDateDesc(filtered, (r) => r.updated_at ?? r.created_at), opts.limit, opts.offset),
    error: null,
  };
}

export interface ContactProfile {
  contact: CrmRow | null;
  activities: CrmRow[];
  invoices: CrmRow[];
  payments: CrmRow[];
  recurring_services: CrmRow[];
  error: string | null;
}

/** Пълен профил — всичко вързано към contact_id (философията на CRM-а). */
export async function getContactProfile(id: string, activityLimit = 30): Promise<ContactProfile> {
  const sb = createServiceClient();
  const empty = { activities: [], invoices: [], payments: [], recurring_services: [] };
  const { data: contact } = await sb.from("contacts").select("*").eq("id", id).maybeSingle();
  if (!contact) return { contact: null, ...empty, error: "contact not found" };

  const [{ data: acts }, { data: inv }, { data: pay }, { data: rec }] = await Promise.all([
    sb.from("contact_activities").select("*").eq("contact_id", id),
    sb.from("invoices").select("*").eq("contact_id", id),
    sb.from("payments").select("*").eq("contact_id", id),
    sb.from("recurring_services").select("*").eq("contact_id", id),
  ]);
  return {
    contact: contact as CrmRow,
    activities: sortByDateDesc((acts ?? []) as CrmRow[], (r) => r.occurred_at ?? r.created_at).slice(0, activityLimit),
    invoices: sortByDateDesc((inv ?? []) as CrmRow[], (r) => r.issue_date ?? r.created_at),
    payments: sortByDateDesc((pay ?? []) as CrmRow[], (r) => r.paid_at ?? r.created_at),
    recurring_services: sortByDateDesc((rec ?? []) as CrmRow[], (r) => r.created_at),
    error: null,
  };
}

// ── журнал на автоматизациите ──────────────────────────────────────────────

export async function listAutomationEvents(
  opts: PageOpts & { event_type?: string[]; status?: string[]; since?: string }
): Promise<ListResult> {
  const { rows, error } = await fetchAll("automation_events");
  if (error) return { items: [], total: 0, error };
  const filtered = rows.filter((r) => {
    if (opts.event_type && !opts.event_type.includes(String(r.event_type))) return false;
    if (opts.status && !opts.status.includes(String(r.status))) return false;
    if (opts.since) {
      const t = ts(r.created_at);
      const s = ts(opts.since);
      if (t === null || (s !== null && t < s)) return false;
    }
    return true;
  });
  return {
    ...paginate(sortByDateDesc(filtered, (r) => r.created_at), opts.limit, opts.offset),
    error: null,
  };
}

// ── абонаменти (GPS и др.) ─────────────────────────────────────────────────

export async function listRecurringServices(
  opts: PageOpts & { service_type?: string[]; active?: boolean; contact_id?: string }
): Promise<ListResult> {
  const { rows, error } = await fetchAll("recurring_services");
  if (error) return { items: [], total: 0, error };
  const filtered = rows.filter((r) => {
    if (opts.service_type && !opts.service_type.includes(String(r.service_type))) return false;
    if (opts.active !== undefined && Boolean(r.active) !== opts.active) return false;
    if (opts.contact_id && r.contact_id !== opts.contact_id) return false;
    return true;
  });
  return {
    ...paginate(sortByDateDesc(filtered, (r) => r.created_at), opts.limit, opts.offset),
    error: null,
  };
}

// ── resolve на ръчна проверка ──────────────────────────────────────────────

/**
 * Затваря manual_review item (resolved/ignored), маркира resolved_at и
 * добавя бележката към описанието — така решението остава видимо в админа.
 */
export async function resolveManualReviewItem(args: {
  id: string;
  status: "resolved" | "ignored";
  note?: string;
}): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { data: item } = await sb
    .from("manual_review_items")
    .select("id, description")
    .eq("id", args.id)
    .maybeSingle();
  if (!item) return { error: "item not found" };

  const patch: Record<string, unknown> = {
    status: args.status,
    resolved_at: new Date().toISOString(),
  };
  if (args.note?.trim()) {
    const stamp = new Date().toISOString().slice(0, 10);
    const existing = (item as { description?: string | null }).description;
    patch.description = `${existing ? existing + "\n\n" : ""}Резолюция (${stamp}): ${args.note.trim()}`;
  }
  const { error } = await sb.from("manual_review_items").update(patch).eq("id", args.id);
  if (error) return { error: error.message ?? "update failed" };
  return { error: null };
}
