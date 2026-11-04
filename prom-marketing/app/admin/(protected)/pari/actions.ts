"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { addDebt, addMovement, markDebtPaid, updateDebt } from "@/lib/crm/pari-data";
import { MOVEMENT_CATEGORIES, type DebtKind } from "@/lib/crm/pari";
import type { EkipActionResult } from "@/lib/team/types";

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function money(fd: FormData, k: string): number | null {
  const raw = s(fd, k).replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function done(): void {
  revalidatePath("/admin/pari");
  revalidatePath("/admin");
}

export async function addMovementAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  await requireAdmin();
  const direction = s(formData, "direction") === "in" ? "in" : "out";
  const amount = money(formData, "amount");
  if (!amount || amount <= 0) return { ok: false, error: "Напиши сума." };
  const category = s(formData, "category");
  const res = await addMovement({
    occurred_on: s(formData, "occurred_on") || today(),
    owner: s(formData, "owner") === "personal" ? "personal" : "company",
    account: s(formData, "account") || "УниКредит BG30…4143",
    account_type: s(formData, "account_type") === "card" ? "card" : "bank",
    direction,
    amount,
    category: (MOVEMENT_CATEGORIES as readonly string[]).includes(category) ? category : "other",
    counterparty: s(formData, "counterparty") || null,
    description: s(formData, "description") || null,
  });
  if (res.error) return { ok: false, error: res.error };
  done();
  return { ok: true, message: "Записано." };
}

export async function markPaidAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData, "id");
  const amount = money(formData, "amount");
  if (id && amount && amount > 0) await markDebtPaid(id, amount, today());
  done();
}

export async function updateDebtAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  await requireAdmin();
  const id = s(formData, "id");
  if (!id) return { ok: false, error: "Няма кой." };
  const patch: Parameters<typeof updateDebt>[1] = {};
  const balance = money(formData, "balance");
  if (balance != null) {
    patch.balance = balance;
    patch.balance_as_of = today();
  }
  const installment = money(formData, "installment");
  if (installment != null) patch.installment = installment;
  const next = s(formData, "next_due_date");
  if (next) patch.next_due_date = next;
  if (s(formData, "close") === "1") patch.status = "closed";
  const res = await updateDebt(id, patch);
  if (res.error) return { ok: false, error: res.error };
  done();
  return { ok: true, message: "Обновено." };
}

const KINDS: DebtKind[] = ["loan", "revolving", "credit_card", "leasing", "supplier", "contract", "other"];

export async function addDebtAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  await requireAdmin();
  const name = s(formData, "name");
  if (!name) return { ok: false, error: "Напиши име." };
  const kind = s(formData, "kind") as DebtKind;
  const dueDay = Number(s(formData, "due_day"));
  const res = await addDebt({
    direction: s(formData, "direction") === "receivable" ? "receivable" : "payable",
    owner: s(formData, "owner") === "personal" ? "personal" : "company",
    kind: KINDS.includes(kind) ? kind : "other",
    status: s(formData, "potential") === "1" ? "potential" : "active",
    name,
    counterparty: s(formData, "counterparty") || null,
    balance: money(formData, "balance"),
    installment: money(formData, "installment"),
    due_day: Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 31 ? dueDay : null,
    next_due_date: s(formData, "next_due_date") || null,
    note: s(formData, "note") || null,
  });
  if (res.error) return { ok: false, error: res.error };
  done();
  return { ok: true, message: "Добавено." };
}
