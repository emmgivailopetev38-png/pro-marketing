import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { amountFor, dedupeKey, monthlyDue, monthlyRuleFor, periodOf, ruleFor, totalsFor, type CommissionLite, type CommissionRule } from "./commissions-rules";

/**
 * Комисионните — четене и писане. Сметката е в commissions-rules.ts.
 * Начисление се прави при „Спечелен“ (еднократните) и при „Начисли месеца“
 * (месечните за реклами/поддръжка). Ключът за дублиране пази от второ начисление.
 */

const RULE_COLS = "id, service_type, label, kind, value, basis, role, active, notes";
const COLS = "id, member_id, contact_id, project_id, rule_id, service_type, label, base_amount, amount, currency, period, status, note, dedupe_key, created_by, created_at, paid_at";

export interface CommissionRow extends CommissionLite {
  id: string;
  contact_id: string | null;
  project_id: string | null;
  rule_id: string | null;
  service_type: string;
  label: string;
  base_amount: number | null;
  currency: string;
  note: string | null;
  created_by: string | null;
  paid_at: string | null;
  member_name?: string;
  contact_name?: string | null;
}

export async function loadRules(): Promise<CommissionRule[]> {
  const sb = createServiceClient();
  const { data } = await sb.from("commission_rules").select(RULE_COLS).order("service_type");
  return ((data ?? []) as Array<CommissionRule & { value: number | string }>).map((r) => ({ ...r, value: Number(r.value) }));
}

export async function updateRule(id: string, patch: { value?: number; active?: boolean; label?: string }): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("commission_rules").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}

export async function listCommissions(memberId?: string | null): Promise<CommissionRow[]> {
  const sb = createServiceClient();
  let q = sb.from("commissions").select(COLS).order("created_at", { ascending: false }).limit(500);
  if (memberId) q = q.eq("member_id", memberId);
  const { data } = await q;
  const rows = (data ?? []) as CommissionRow[];
  const contactIds = [...new Set(rows.map((r) => r.contact_id).filter((v): v is string => !!v))];
  const [{ data: members }, { data: contacts }] = await Promise.all([
    sb.from("team_members").select("id, full_name"),
    contactIds.length ? sb.from("contacts").select("id, full_name, company").in("id", contactIds) : Promise.resolve({ data: [] }),
  ]);
  const mn = new Map(((members ?? []) as Array<{ id: string; full_name: string }>).map((m) => [m.id, m.full_name]));
  const cn = new Map(((contacts ?? []) as Array<{ id: string; full_name: string | null; company: string | null }>).map((c) => [c.id, c.full_name ?? c.company ?? null]));
  return rows.map((r) => ({ ...r, amount: Number(r.amount), member_name: mn.get(r.member_id) ?? "—", contact_name: r.contact_id ? cn.get(r.contact_id) ?? null : null }));
}

export function totals(rows: CommissionLite[]) {
  return totalsFor(rows);
}

/**
 * Еднократна комисионна при затворена сделка. Повторно извикване за същия
 * човек/картон/вид не прави второ начисление.
 */
export async function commissionForDeal(args: {
  memberId: string;
  memberRole?: string | null;
  contactId: string | null;
  projectId?: string | null;
  serviceType: string;
  dealAmount: number | null;
  createdBy: string;
  note?: string | null;
}): Promise<{ id: string | null; amount: number | null; created: boolean; error: string | null }> {
  const rules = await loadRules();
  const rule = ruleFor(rules, args.serviceType, args.memberRole);
  if (!rule) return { id: null, amount: null, created: false, error: `Няма правило за „${args.serviceType}“` };
  const period = rule.basis === "monthly_fee" ? periodOf() : null;
  const amount = amountFor(rule, args.dealAmount);
  const key = dedupeKey({ memberId: args.memberId, contactId: args.contactId, serviceType: args.serviceType, period });
  const sb = createServiceClient();
  const { data: existing } = await sb.from("commissions").select("id, amount").eq("dedupe_key", key).maybeSingle();
  if (existing) return { id: existing.id as string, amount: Number(existing.amount), created: false, error: null };
  const { data, error } = await sb
    .from("commissions")
    .insert({
      member_id: args.memberId,
      contact_id: args.contactId,
      project_id: args.projectId ?? null,
      rule_id: rule.id,
      service_type: args.serviceType,
      label: rule.label,
      base_amount: args.dealAmount,
      amount,
      period,
      status: "due",
      note: args.note ?? null,
      dedupe_key: key,
      created_by: args.createdBy,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, amount: null, created: false, error: error?.message ?? "insert failed" };
  return { id: data.id as string, amount, created: true, error: null };
}

/** Ръчно начисление от Ивайло — без правило, със свободна сума. */
export async function manualCommission(args: {
  memberId: string;
  contactId: string | null;
  serviceType: string;
  label: string;
  amount: number;
  period?: string | null;
  note?: string | null;
  createdBy: string;
}): Promise<{ id: string | null; error: string | null }> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("commissions")
    .insert({
      member_id: args.memberId,
      contact_id: args.contactId,
      service_type: args.serviceType,
      label: args.label,
      amount: args.amount,
      period: args.period ?? null,
      status: "due",
      note: args.note ?? null,
      dedupe_key: `manual:${args.memberId}:${Date.now()}`,
      created_by: args.createdBy,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "insert failed" };
  return { id: data.id as string, error: null };
}

export async function setCommissionStatus(id: string, status: "due" | "approved" | "paid" | "cancelled"): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("commissions")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id);
  return { error: error?.message ?? null };
}

/**
 * Месечните: за всяка активна услуга реклами/поддръжка с отговорник по картона
 * — 10 % за месеца. Безопасно за повторно пускане.
 */
export async function runMonthly(period: string, createdBy: string): Promise<{ created: number; skipped: number; error: string | null }> {
  const sb = createServiceClient();
  const rules = await loadRules();
  const [{ data: services }, { data: contacts }, { data: members }] = await Promise.all([
    sb.from("recurring_services").select("id, contact_id, service_type, amount, active, started_at, ended_at"),
    sb.from("contacts").select("id, owner_id").not("owner_id", "is", null),
    sb.from("team_members").select("id, role"),
  ]);
  const ownerByContact = new Map(((contacts ?? []) as Array<{ id: string; owner_id: string | null }>).map((c) => [c.id, c.owner_id]));
  const roleOf = new Map(((members ?? []) as Array<{ id: string; role: string }>).map((m) => [m.id, m.role]));
  const due = monthlyDue(
    ((services ?? []) as Array<{ id: string; contact_id: string | null; service_type: string; amount: number; active: boolean; started_at: string | null; ended_at: string | null }>).map((s) => ({ ...s, amount: Number(s.amount) })),
    ownerByContact,
    period
  );
  let created = 0;
  let skipped = 0;
  for (const d of due) {
    // Роля с правило „от сделката“ (продавачът) няма месечна комисионна.
    const rule = monthlyRuleFor(rules, d.serviceType, roleOf.get(d.memberId));
    if (!rule) {
      skipped += 1;
      continue;
    }
    const key = dedupeKey({ memberId: d.memberId, contactId: d.contactId, serviceType: d.serviceType, period });
    const { data: existing } = await sb.from("commissions").select("id").eq("dedupe_key", key).maybeSingle();
    if (existing) {
      skipped += 1;
      continue;
    }
    const { error } = await sb.from("commissions").insert({
      member_id: d.memberId,
      contact_id: d.contactId,
      rule_id: rule.id,
      service_type: d.serviceType,
      label: `${rule.label} · ${period}`,
      base_amount: d.base,
      amount: amountFor(rule, d.base),
      period,
      status: "due",
      dedupe_key: key,
      created_by: createdBy,
    });
    if (error) return { created, skipped, error: error.message };
    created += 1;
  }
  return { created, skipped, error: null };
}
