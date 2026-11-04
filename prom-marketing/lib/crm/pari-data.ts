import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { lastMonths } from "./personal-finance";
import {
  advanceDue,
  debtTotals,
  monthSummary,
  optimizationSignals,
  upcomingPayments,
  type Debt,
  type DebtTotals,
  type MonthSummary,
  type Movement,
  type Signal,
  type Upcoming,
} from "./pari";

/**
 * „Пари · равносметка“ — четене/писане. Правилата са в pari.ts.
 */

export interface PariOverview {
  today: string;
  months: string[];
  summaries: MonthSummary[];
  debts: Debt[];
  totals: DebtTotals;
  upcoming: Upcoming[];
  signals: Signal[];
  movements: Movement[];
}

const NUM_DEBT = ["original_amount", "balance", "credit_limit", "installment", "interest_rate"] as const;

function toDebt(r: Record<string, unknown>): Debt {
  const d = { ...r } as unknown as Debt;
  for (const k of NUM_DEBT) (d as unknown as Record<string, number | null>)[k] = r[k] == null ? null : Number(r[k]);
  return d;
}

export async function loadPari(monthsBack = 6, now: Date = new Date()): Promise<PariOverview> {
  const sb = createServiceClient();
  const today = now.toISOString().slice(0, 10);
  const months = lastMonths(monthsBack, now);
  const [{ data: debts }, { data: mov }] = await Promise.all([
    sb.from("debts").select("*").neq("status", "closed").order("direction").order("owner").order("balance", { ascending: false, nullsFirst: false }),
    sb.from("cash_movements").select("*").gte("occurred_on", `${months[0]}-01`).order("occurred_on", { ascending: false }).limit(5000),
  ]);
  const debtRows = ((debts ?? []) as Record<string, unknown>[]).map(toDebt);
  const movements = ((mov ?? []) as Movement[]).map((m) => ({ ...m, amount: Number(m.amount) }));
  return {
    today,
    months,
    summaries: months.map((m) => monthSummary(movements, m)),
    debts: debtRows,
    totals: debtTotals(debtRows),
    upcoming: upcomingPayments(debtRows, today, 31),
    signals: optimizationSignals(debtRows, movements, today),
    movements,
  };
}

export async function addMovement(input: Omit<Movement, "id"> & { debt_id?: string | null; source?: string }): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("cash_movements").insert({
    occurred_on: input.occurred_on,
    owner: input.owner,
    account: input.account,
    account_type: input.account_type,
    direction: input.direction,
    amount: input.amount,
    category: input.category,
    counterparty: input.counterparty,
    description: input.description,
    debt_id: input.debt_id ?? null,
    source: input.source ?? "manual",
  });
  return { error: error?.message ?? null };
}

/** „Платено“: записва изходящото движение и мести падежа с месец напред. При вземане — входящо и намалява остатъка. */
export async function markDebtPaid(id: string, amount: number, today: string): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { data, error } = await sb.from("debts").select("*").eq("id", id).maybeSingle();
  if (error || !data) return { error: error?.message ?? "Няма го." };
  const d = toDebt(data as Record<string, unknown>);
  const receivable = d.direction === "receivable";
  const mv = await addMovement({
    occurred_on: today,
    owner: d.owner,
    account: d.account ?? d.name,
    account_type: "bank",
    direction: receivable ? "in" : "out",
    amount,
    category: receivable ? "client" : d.kind === "credit_card" ? "card_repayment" : d.kind === "supplier" ? "supplier" : "loan_payment",
    counterparty: d.counterparty ?? d.name,
    description: `${receivable ? "Получено" : "Платено"} · ${d.name}`,
    debt_id: d.id,
    source: "pari",
  });
  if (mv.error) return mv;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (d.next_due_date || d.due_day) patch.next_due_date = advanceDue(d, today);
  // Остатъкът намалява сам само там, където цялата сума е главница (вземане, доставчик).
  // При кредит вноската е главница + лихва — остатъкът се сверява с банката („Обнови“).
  if ((receivable || d.kind === "supplier") && d.balance != null) {
    patch.balance = Math.max(0, Math.round((d.balance - amount) * 100) / 100);
    patch.balance_as_of = today;
    if (patch.balance === 0) patch.status = "closed";
  }
  const { error: upErr } = await sb.from("debts").update(patch).eq("id", id);
  return { error: upErr?.message ?? null };
}

export async function updateDebt(id: string, patch: Partial<Pick<Debt, "balance" | "balance_as_of" | "installment" | "next_due_date" | "status" | "note">>): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("debts").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function addDebt(input: Omit<Debt, "id" | "contact_id" | "counterparty" | "account" | "original_amount" | "credit_limit" | "interest_rate" | "ends_on" | "balance_as_of"> & Partial<Debt>): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("debts").insert({
    direction: input.direction,
    owner: input.owner,
    kind: input.kind,
    status: input.status,
    name: input.name,
    counterparty: input.counterparty ?? null,
    account: input.account ?? null,
    balance: input.balance,
    balance_as_of: input.balance != null ? new Date().toISOString().slice(0, 10) : null,
    installment: input.installment,
    due_day: input.due_day,
    next_due_date: input.next_due_date,
    interest_rate: input.interest_rate ?? null,
    note: input.note,
  });
  return { error: error?.message ?? null };
}
