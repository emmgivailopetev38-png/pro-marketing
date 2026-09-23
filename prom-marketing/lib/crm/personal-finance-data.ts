import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { isBillableInvoice, signedAmount } from "./accounting-metrics";
import { lastMonths, monthTotals, parseImport, type ImportedRow, type MonthTotals, type PfRow } from "./personal-finance";

/**
 * Личните финанси — четене/писане + фирмата за същите месеци, за да стоят
 * една до друга. Правилата са в personal-finance.ts.
 */

export interface CompanyMonth {
  month: string;
  invoiced: number;
  received: number;
  expenses: number;
  personalViaCompany: number;
  net: number;
}

export interface FinanceOverview {
  months: string[];
  personal: MonthTotals[];
  company: CompanyMonth[];
  rows: PfRow[];
  recurring: PfRow[];
}

export async function loadFinance(monthsBack = 6, now: Date = new Date()): Promise<FinanceOverview> {
  const sb = createServiceClient();
  const months = lastMonths(monthsBack, now);
  const since = `${months[0]}-01`;
  const [{ data: pf }, { data: inv }, { data: pay }, { data: exp }] = await Promise.all([
    sb.from("personal_finance").select("*").gte("occurred_on", since).order("occurred_on", { ascending: false }).limit(2000),
    sb.from("invoices").select("issue_date, amount_gross, status, invoice_type").gte("issue_date", since),
    sb.from("payments").select("paid_at, created_at, amount, match_status").gte("created_at", since),
    sb.from("expenses").select("expense_date, created_at, amount_gross, status, is_personal").gte("expense_date", since),
  ]);
  const rows = ((pf ?? []) as PfRow[]).map((r) => ({ ...r, amount: Number(r.amount) }));
  const personal = months.map((m) => monthTotals(rows, m));
  const company: CompanyMonth[] = months.map((month) => {
    const invoiced = ((inv ?? []) as Array<{ issue_date: string | null; amount_gross: number | null; status: string; invoice_type: string }>)
      .filter((i) => i.issue_date?.slice(0, 7) === month && isBillableInvoice(i))
      .reduce((s, i) => s + signedAmount(i, i.amount_gross), 0);
    const received = ((pay ?? []) as Array<{ paid_at: string | null; created_at: string; amount: number | null; match_status: string }>)
      .filter((p) => (p.paid_at ?? p.created_at).slice(0, 7) === month && p.match_status !== "ignored")
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const list = ((exp ?? []) as Array<{ expense_date: string | null; created_at: string; amount_gross: number | null; status: string; is_personal: boolean }>).filter(
      (e) => (e.expense_date ?? e.created_at).slice(0, 7) === month && e.status !== "cancelled"
    );
    const expenses = list.filter((e) => !e.is_personal).reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);
    const personalViaCompany = list.filter((e) => e.is_personal).reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);
    return { month, invoiced: r2(invoiced), received: r2(received), expenses: r2(expenses), personalViaCompany: r2(personalViaCompany), net: r2(received - expenses) };
  });
  return { months, personal, company, rows, recurring: rows.filter((r) => r.recurring) };
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function addFinanceRow(input: Omit<PfRow, "id" | "currency"> & { currency?: string }): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("personal_finance").insert({
    kind: input.kind,
    category: input.category || "other",
    description: input.description?.trim() || null,
    amount: input.amount,
    currency: input.currency ?? "EUR",
    occurred_on: input.occurred_on,
    recurring: input.recurring,
    note: input.note?.trim() || null,
    source: "manual",
  });
  return { error: error?.message ?? null };
}

export async function importFinanceText(text: string): Promise<{ inserted: number; error: string | null; rows: ImportedRow[] }> {
  const rows = parseImport(text);
  if (rows.length === 0) return { inserted: 0, error: "Не разпознах нито един ред със сума.", rows };
  const sb = createServiceClient();
  const { error } = await sb.from("personal_finance").insert(rows.map((r) => ({ ...r, source: "import" })));
  return { inserted: error ? 0 : rows.length, error: error?.message ?? null, rows };
}

export async function deleteFinanceRow(id: string): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("personal_finance").delete().eq("id", id);
  return { error: error?.message ?? null };
}
