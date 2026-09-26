import { createServiceClient } from "@/lib/supabase/service";
import { fmtSofia } from "./time";
import {
  LIVE_STATUSES,
  phoneKey,
  prospectNotes,
  splitProspectQueue,
  type ImportRow,
  type Prospect,
  type ProspectPatch,
  type ProspectQueue,
  type ProspectStatus,
} from "./prospects-rules";

/**
 * Студените обаждания — базата. Правилата са в prospects-rules.ts.
 *
 * Човекът от екипа вижда само фирмите, дадени на него (Ивайло ги раздава от
 * /admin/studeni). Собственикът в /ekip вижда всичко раздадено; в админа — всичко.
 */

const COLS =
  "id, company, city, area, phone, email, website, sector, opener, offer, gaps, email_subject, email_draft, decision_maker, buying_signal, score, tier, batch, priority, assigned_to, status, attempts, no_answers, last_called_at, next_call_at, last_note, contact_id";

/** Колко нови карти да има на екрана наведнъж — останалите чакат, числото ги казва. */
export const FRESH_ON_SCREEN = 40;

export interface ProspectQueueView extends ProspectQueue {
  /** всички нови за човека (на екрана са първите FRESH_ON_SCREEN) */
  freshTotal: number;
}

const EMPTY: ProspectQueueView = { due: [], fresh: [], later: 0, freshTotal: 0 };

export async function loadProspectQueue(viewerId: string | null, now: Date = new Date()): Promise<ProspectQueueView> {
  const sb = createServiceClient();
  // Човекът — неговите; собственикът (null) — всичко раздадено на екипа.
  const op = viewerId ? "eq" : "not.is";
  const who = viewerId ?? null;
  const [again, fresh, total] = await Promise.all([
    sb
      .from("prospects")
      .select(COLS)
      .in("status", ["no_answer", "callback"])
      .not("phone", "is", null)
      .filter("assigned_to", op, who)
      .order("next_call_at", { ascending: true })
      .limit(300),
    sb
      .from("prospects")
      .select(COLS)
      .eq("status", "new")
      .not("phone", "is", null)
      .filter("assigned_to", op, who)
      .order("priority", { ascending: true })
      .order("score", { ascending: false, nullsFirst: false })
      .limit(FRESH_ON_SCREEN),
    sb.from("prospects").select("id", { count: "exact", head: true }).eq("status", "new").not("phone", "is", null).filter("assigned_to", op, who),
  ]);
  // Без таблицата (миграцията още не е пусната) — празен раздел, не счупена страница.
  if (again.error || fresh.error) return EMPTY;
  const q = splitProspectQueue([...((again.data ?? []) as Prospect[]), ...((fresh.data ?? []) as Prospect[])], now);
  return { ...q, freshTotal: total.count ?? q.fresh.length };
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const sb = createServiceClient();
  const { data } = await sb.from("prospects").select(COLS).eq("id", id).maybeSingle();
  return (data as Prospect | null) ?? null;
}

export async function saveProspectCall(args: {
  prospect: Prospect;
  patch: ProspectPatch;
  contactId?: string | null;
  memberId: string | null;
  caller: string;
  outcome: string;
  note: string | null;
}): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("prospects")
    .update({ ...args.patch, contact_id: args.contactId ?? args.prospect.contact_id, updated_at: new Date().toISOString() })
    .eq("id", args.prospect.id);
  if (error) return { error: error.message };
  const { error: logError } = await sb.from("prospect_calls").insert({
    prospect_id: args.prospect.id,
    member_id: args.memberId,
    caller: args.caller,
    outcome: args.outcome,
    note: args.note,
  });
  return { error: logError?.message ?? null };
}

/**
 * Фирмата става картон в CRM-а — при „говорихме“ или „среща“. Ако вече е там
 * (писала ни е, звъняла е) — същият картон, по телефон или имейл, не дубликат.
 * Картонът е на човека, който е звънял (ротацията го показва в неговата опашка).
 */
export async function promoteProspect(p: Prospect, memberId: string | null): Promise<{ contactId: string | null; error: string | null }> {
  if (p.contact_id) return { contactId: p.contact_id, error: null };
  const sb = createServiceClient();
  const key = phoneKey(p.phone);
  const email = p.email?.trim().toLowerCase() || null;

  // Сравнението е по нормализиран телефон — в картоните номерата са записани
  // по всякакъв начин (+359…, 08…, с интервали), затова не става с филтър в базата.
  const { data: existing } = await sb.from("contacts").select("id, phone, email").not("phone", "is", null).limit(10000);
  const hit = ((existing ?? []) as Array<{ id: string; phone: string | null; email: string | null }>).find(
    (c) => (key && phoneKey(c.phone) === key) || (email && c.email?.toLowerCase() === email)
  );
  if (hit) return { contactId: hit.id, error: null };
  if (email) {
    const { data: byEmail } = await sb.from("contacts").select("id").eq("email", email).maybeSingle();
    if (byEmail) return { contactId: byEmail.id as string, error: null };
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("contacts")
    .insert({
      full_name: p.decision_maker?.trim() || p.company,
      company: p.company,
      phone: key ? `+${key}` : p.phone,
      email,
      business: p.sector,
      source: "cold_call",
      source_ref: p.id,
      stage: "lead",
      notes: prospectNotes(p, fmtSofia(nowIso)),
      routed_to: memberId,
      routed_at: memberId ? nowIso : null,
    })
    .select("id")
    .single();
  if (error || !data) return { contactId: null, error: error?.message ?? "Картонът не се записа" };
  return { contactId: data.id as string, error: null };
}

// ── Админът ───────────────────────────────────────────────────────────────────

export interface ProspectStats {
  total: number;
  withPhone: number;
  byStatus: Record<string, number>;
  /** градовете по брой, с колко са още свободни (нераздадени нови) */
  byCity: Array<{ city: string; total: number; free: number }>;
  /** по човек: колко има дадени, колко звъннати, колко станаха картон */
  byMember: Array<{ member_id: string; assigned: number; open: number; converted: number }>;
  batches: Array<{ batch: string; total: number }>;
}

export async function prospectStats(): Promise<ProspectStats | null> {
  const sb = createServiceClient();
  const { data, error } = await sb.from("prospects").select("city, phone_key, status, assigned_to, batch").limit(20000);
  if (error) return null;
  const rows = (data ?? []) as Array<{ city: string | null; phone_key: string | null; status: ProspectStatus; assigned_to: string | null; batch: string }>;
  const byStatus: Record<string, number> = {};
  const cities = new Map<string, { total: number; free: number }>();
  const members = new Map<string, { assigned: number; open: number; converted: number }>();
  const batches = new Map<string, number>();
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    batches.set(r.batch, (batches.get(r.batch) ?? 0) + 1);
    const c = cities.get(r.city ?? "—") ?? { total: 0, free: 0 };
    c.total += 1;
    if (!r.assigned_to && r.status === "new" && r.phone_key) c.free += 1;
    cities.set(r.city ?? "—", c);
    if (r.assigned_to) {
      const m = members.get(r.assigned_to) ?? { assigned: 0, open: 0, converted: 0 };
      m.assigned += 1;
      if (LIVE_STATUSES.includes(r.status)) m.open += 1;
      if (r.status === "converted") m.converted += 1;
      members.set(r.assigned_to, m);
    }
  }
  return {
    total: rows.length,
    withPhone: rows.filter((r) => r.phone_key).length,
    byStatus,
    byCity: [...cities.entries()].map(([city, v]) => ({ city, ...v })).sort((a, b) => b.total - a.total),
    byMember: [...members.entries()].map(([member_id, v]) => ({ member_id, ...v })),
    batches: [...batches.entries()].map(([batch, total]) => ({ batch, total })),
  };
}

/**
 * Раздаването: следващите `count` свободни фирми (нови, с телефон, по реда —
 * София първа) отиват при човека. Само град по избор.
 */
export async function assignProspects(args: { memberId: string; count: number; city?: string | null }): Promise<{ assigned: number; error: string | null }> {
  const sb = createServiceClient();
  let q = sb
    .from("prospects")
    .select("id")
    .eq("status", "new")
    .is("assigned_to", null)
    .not("phone_key", "is", null)
    .order("priority", { ascending: true })
    .order("score", { ascending: false, nullsFirst: false })
    .limit(Math.max(1, Math.min(args.count, 500)));
  if (args.city) q = q.eq("city", args.city);
  const { data, error } = await q;
  if (error) return { assigned: 0, error: error.message };
  const ids = ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (ids.length === 0) return { assigned: 0, error: null };
  const { error: upError } = await sb
    .from("prospects")
    .update({ assigned_to: args.memberId, assigned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .in("id", ids);
  return { assigned: upError ? 0 : ids.length, error: upError?.message ?? null };
}

/** Връщане: неизвъртените нови на човека стават пак свободни. */
export async function unassignFresh(memberId: string): Promise<{ released: number; error: string | null }> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("prospects")
    .update({ assigned_to: null, assigned_at: null, updated_at: new Date().toISOString() })
    .eq("assigned_to", memberId)
    .eq("status", "new")
    .select("id");
  return { released: (data ?? []).length, error: error?.message ?? null };
}

export interface ProspectCallRow {
  id: string;
  prospect_id: string;
  caller: string;
  outcome: string;
  note: string | null;
  created_at: string;
  company: string;
  city: string | null;
  contact_id: string | null;
}

export async function recentProspectCalls(limit = 40): Promise<ProspectCallRow[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("prospect_calls")
    .select("id, prospect_id, caller, outcome, note, created_at, prospects(company, city, contact_id)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => {
    const pr = (Array.isArray(r.prospects) ? r.prospects[0] : r.prospects) as { company?: string; city?: string | null; contact_id?: string | null } | null;
    return {
      id: String(r.id),
      prospect_id: String(r.prospect_id),
      caller: String(r.caller),
      outcome: String(r.outcome),
      note: (r.note as string | null) ?? null,
      created_at: String(r.created_at),
      company: pr?.company ?? "—",
      city: pr?.city ?? null,
      contact_id: pr?.contact_id ?? null,
    };
  });
}

/** Списъкът в админа — филтър по град, състояние и човек; най-много 200 реда. */
export async function listProspects(f: { city?: string; status?: string; memberId?: string }): Promise<Prospect[]> {
  const sb = createServiceClient();
  let q = sb.from("prospects").select(COLS).order("priority", { ascending: true }).order("company").limit(200);
  if (f.city) q = q.eq("city", f.city);
  if (f.status) q = q.eq("status", f.status);
  if (f.memberId === "none") q = q.is("assigned_to", null);
  else if (f.memberId) q = q.eq("assigned_to", f.memberId);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as Prospect[];
}

/** Картонът е направен, но действието след него не мина — пазим връзката, за да няма втори. */
export async function linkProspectContact(id: string, contactId: string): Promise<void> {
  const sb = createServiceClient();
  await sb.from("prospects").update({ contact_id: contactId, updated_at: new Date().toISOString() }).eq("id", id);
}

/** Пакетът в базата на порции — новите се добавят, познатите само се допълват. */
export async function importProspectRows(rows: ImportRow[]): Promise<{ inserted: number; merged: number; error: string | null }> {
  const sb = createServiceClient();
  let inserted = 0;
  let merged = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const { data, error } = await sb.rpc("import_prospects", { p_rows: rows.slice(i, i + 500) });
    if (error) return { inserted, merged, error: error.message };
    const r = (data ?? {}) as { inserted?: number; merged?: number };
    inserted += r.inserted ?? 0;
    merged += r.merged ?? 0;
  }
  return { inserted, merged, error: null };
}
