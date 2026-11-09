/**
 * 🇪🇺 Евро проекти — базата: програмите (funding_programs) и кой контакт по
 * коя може да кандидатства (funding_matches). Upsert-ите идват от
 * автоматичната задача през /api/crm/finansirane/*; статусът на съвпадението
 * го сменя само Ивайло от /admin/finansirane.
 */
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import {
  countMatches,
  dedupeBy,
  emptyCounts,
  groupByColumns,
  matchKey,
  matchRow,
  programChange,
  programRow,
  sortPrograms,
  todaySofia,
  type MatchCounts,
  type MatchInput,
  type MatchStatus,
  type ProgramChange,
  type ProgramInput,
} from "./finansirane-rules";

type Sb = ReturnType<typeof createServiceClient>;

export type FundingProgram = {
  id: string;
  key: string;
  name: string;
  category: string | null;
  operator: string | null;
  program: string | null;
  url: string | null;
  status: string;
  open_date: string | null;
  deadline: string | null;
  deadline_note: string | null;
  budget_text: string | null;
  grant_text: string | null;
  beneficiaries: string | null;
  eligible_costs: string | null;
  our_role: string | null;
  our_services: string[] | null;
  client_profile: string | null;
  for_us: boolean | null;
  for_us_reason: string | null;
  priority: number | null;
  notes: string | null;
  sources: unknown[] | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchContact = { id: string; full_name: string | null; company: string | null; stage: string | null };

export type FundingMatch = {
  id: string;
  program_id: string;
  contact_id: string;
  fit: number | null;
  role: string | null;
  reason: string | null;
  next_step: string | null;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  contact: MatchContact | null;
};

export type ProgramWithCounts = FundingProgram & { matches: MatchCounts };

const CHUNK = 150;

function chunks<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function contactsByIds(sb: Sb, ids: string[]): Promise<Map<string, MatchContact>> {
  const out = new Map<string, MatchContact>();
  for (const part of chunks(Array.from(new Set(ids)))) {
    const { data } = await sb.from("contacts").select("id, full_name, company, stage").in("id", part);
    for (const c of (data ?? []) as MatchContact[]) out.set(c.id, c);
  }
  return out;
}

// ── четене ──────────────────────────────────────────────────────────────────

export async function listPrograms(filters: { status?: string; category?: string } = {}): Promise<ProgramWithCounts[]> {
  const sb = createServiceClient();
  let q = sb.from("funding_programs").select("*");
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.category) q = q.eq("category", filters.category);
  const [{ data: programs, error }, { data: matches }] = await Promise.all([
    q,
    sb.from("funding_matches").select("program_id, status").limit(10000),
  ]);
  if (error) throw new Error(error.message);
  const counts = countMatches((matches ?? []) as { program_id: string; status: string }[]);
  const rows = ((programs ?? []) as FundingProgram[]).map((p) => ({ ...p, matches: counts.get(p.id) ?? emptyCounts() }));
  return sortPrograms(rows, todaySofia());
}

/** Съвпаденията (с контакта), най-силните първо. */
export async function listMatches(opts: { programIds?: string[]; contactId?: string } = {}): Promise<FundingMatch[]> {
  const sb = createServiceClient();
  let q = sb.from("funding_matches").select("*").order("fit", { ascending: false, nullsFirst: false }).limit(5000);
  if (opts.programIds) {
    if (opts.programIds.length === 0) return [];
    q = q.in("program_id", opts.programIds);
  }
  if (opts.contactId) q = q.eq("contact_id", opts.contactId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Omit<FundingMatch, "contact">[];
  const contacts = await contactsByIds(sb, rows.map((r) => r.contact_id));
  return rows.map((r) => ({ ...r, contact: contacts.get(r.contact_id) ?? null }));
}

export async function getProgramWithMatches(key: string): Promise<{ program: FundingProgram; matches: FundingMatch[] } | null> {
  const sb = createServiceClient();
  const { data, error } = await sb.from("funding_programs").select("*").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const program = data as FundingProgram;
  return { program, matches: await listMatches({ programIds: [program.id] }) };
}

export type ContactFundingRow = {
  id: string;
  fit: number | null;
  role: string | null;
  reason: string | null;
  next_step: string | null;
  status: MatchStatus;
  program: Pick<FundingProgram, "key" | "name" | "status" | "deadline" | "deadline_note" | "grant_text" | "url"> | null;
};

/** За картона: програмите, по които контактът може да кандидатства. */
export async function fundingForContact(contactId: string): Promise<ContactFundingRow[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("funding_matches")
    .select("id, fit, role, reason, next_step, status, program:funding_programs(key, name, status, deadline, deadline_note, grant_text, url)")
    .eq("contact_id", contactId)
    .order("fit", { ascending: false, nullsFirst: false });
  if (error) return [];
  return ((data ?? []) as unknown as ContactFundingRow[]).map((r) => ({
    ...r,
    program: Array.isArray(r.program) ? ((r.program as unknown[])[0] as ContactFundingRow["program"]) ?? null : r.program,
  }));
}

// ── запис ───────────────────────────────────────────────────────────────────

export type ProgramUpsertResult = {
  ok: boolean;
  keys: string[];
  new: string[];
  changed: ProgramChange[];
  errors: { key: string; error: string }[];
};

export async function upsertPrograms(input: ProgramInput[]): Promise<ProgramUpsertResult> {
  const sb = createServiceClient();
  const items = dedupeBy(input, (p) => p.key);
  const keys = items.map((p) => p.key);
  const { data: existing, error: readErr } = await sb.from("funding_programs").select("key, status, deadline").in("key", keys);
  if (readErr) return { ok: false, keys: [], new: [], changed: [], errors: [{ key: "*", error: readErr.message }] };
  const prev = new Map(((existing ?? []) as { key: string; status: string; deadline: string | null }[]).map((r) => [r.key, r]));

  const errors: ProgramUpsertResult["errors"] = [];
  const created: string[] = [];
  const changed: ProgramChange[] = [];
  const rows: Record<string, unknown>[] = [];
  const nowIso = new Date().toISOString();
  for (const p of items) {
    const before = prev.get(p.key);
    if (!before && !p.name) {
      errors.push({ key: p.key, error: "нова програма без name" });
      continue;
    }
    if (before) {
      const ch = programChange(before, p);
      if (ch) changed.push(ch);
    } else created.push(p.key);
    rows.push(programRow(p, nowIso));
  }

  const saved: string[] = [];
  for (const group of groupByColumns(rows)) {
    const { data, error } = await sb.from("funding_programs").upsert(group, { onConflict: "key" }).select("key");
    if (error) {
      for (const r of group) errors.push({ key: String(r.key), error: error.message });
      continue;
    }
    for (const r of (data ?? []) as { key: string }[]) saved.push(r.key);
  }
  const ok = new Set(saved);
  return {
    ok: errors.length === 0,
    keys: saved,
    new: created.filter((k) => ok.has(k)),
    changed: changed.filter((c) => ok.has(c.key)),
    errors,
  };
}

export type MatchUpsertResult = {
  ok: boolean;
  new: number;
  updated: number;
  errors: { program_key: string; contact_id: string; error: string }[];
};

export async function upsertMatches(input: MatchInput[]): Promise<MatchUpsertResult> {
  const sb = createServiceClient();
  const items = dedupeBy(input, (m) => `${m.program_key}:${m.contact_id.toLowerCase()}`);
  const errors: MatchUpsertResult["errors"] = [];

  const programKeys = Array.from(new Set(items.map((m) => m.program_key)));
  const { data: progs, error: pErr } = await sb.from("funding_programs").select("id, key").in("key", programKeys);
  if (pErr) return { ok: false, new: 0, updated: 0, errors: [{ program_key: "*", contact_id: "*", error: pErr.message }] };
  const programId = new Map(((progs ?? []) as { id: string; key: string }[]).map((p) => [p.key, p.id]));

  const contacts = await contactsByIds(sb, items.map((m) => m.contact_id.toLowerCase()));

  const valid: { m: MatchInput; pid: string }[] = [];
  for (const m of items) {
    const pid = programId.get(m.program_key);
    if (!pid) {
      errors.push({ program_key: m.program_key, contact_id: m.contact_id, error: "няма такава програма (първо POST /program)" });
      continue;
    }
    if (!contacts.has(m.contact_id.toLowerCase())) {
      errors.push({ program_key: m.program_key, contact_id: m.contact_id, error: "няма такъв контакт" });
      continue;
    }
    valid.push({ m: { ...m, contact_id: m.contact_id.toLowerCase() }, pid });
  }

  // кои вече ги има — за броя нови/обновени (статусът им остава)
  const have = new Set<string>();
  const pids = Array.from(new Set(valid.map((v) => v.pid)));
  for (const part of chunks(Array.from(new Set(valid.map((v) => v.m.contact_id))))) {
    if (pids.length === 0) break;
    const { data } = await sb.from("funding_matches").select("program_id, contact_id").in("program_id", pids).in("contact_id", part);
    for (const r of (data ?? []) as { program_id: string; contact_id: string }[]) have.add(matchKey(r.program_id, r.contact_id));
  }

  let created = 0;
  let updated = 0;
  const rows = valid.map((v) => matchRow(v.m, v.pid));
  for (const group of groupByColumns(rows)) {
    // `status` не е в колоните → нов ред взима 'nov', стар си пази статуса.
    const { error } = await sb.from("funding_matches").upsert(group, { onConflict: "program_id,contact_id" });
    if (error) {
      for (const r of group) {
        const key = valid.find((v) => v.pid === r.program_id && v.m.contact_id === r.contact_id)?.m.program_key ?? String(r.program_id);
        errors.push({ program_key: key, contact_id: String(r.contact_id), error: error.message });
      }
      continue;
    }
    for (const r of group) {
      if (have.has(matchKey(String(r.program_id), String(r.contact_id)))) updated += 1;
      else created += 1;
    }
  }
  return { ok: errors.length === 0, new: created, updated, errors };
}

export async function setMatchStatus(id: string, status: MatchStatus): Promise<{ ok: boolean; contact_id?: string; error?: string }> {
  const sb = createServiceClient();
  const { data, error } = await sb.from("funding_matches").update({ status }).eq("id", id).select("contact_id").maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "няма такова съвпадение" };
  return { ok: true, contact_id: (data as { contact_id: string }).contact_id };
}
