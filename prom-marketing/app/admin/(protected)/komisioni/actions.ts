"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isChecked } from "@/lib/form-data";
import { manualCommission, runMonthly, setCommissionStatus, updateRule } from "@/lib/team/commissions";
import { periodOf } from "@/lib/team/commissions-rules";
import type { EkipActionResult } from "@/lib/team/types";

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function revalidate() {
  revalidatePath("/admin/komisioni");
  revalidatePath("/ekip/komisioni");
  revalidatePath("/admin/konversii");
}

export async function setCommissionStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData, "id");
  const status = s(formData, "status");
  if (!id || !["due", "approved", "paid", "cancelled"].includes(status)) return;
  await setCommissionStatus(id, status as "due" | "approved" | "paid" | "cancelled");
  revalidate();
}

export async function manualCommissionAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const by = await requireAdmin();
  const amount = Number(s(formData, "amount").replace(",", "."));
  const memberId = s(formData, "member_id");
  if (!memberId) return { ok: false, error: "Избери човек." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Напиши сума." };
  const res = await manualCommission({
    memberId,
    contactId: s(formData, "contact_id") || null,
    serviceType: s(formData, "service_type") || "other",
    label: s(formData, "label") || "Ръчно начисление",
    amount: Math.round(amount * 100) / 100,
    period: s(formData, "period") || null,
    note: s(formData, "note") || null,
    createdBy: by,
  });
  if (res.error) return { ok: false, error: res.error };
  revalidate();
  return { ok: true, message: "Начислено." };
}

export async function runMonthlyAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  const by = await requireAdmin();
  const period = s(formData, "period") || periodOf();
  if (!/^\d{4}-\d{2}$/.test(period)) return { ok: false, error: "Месецът е във вид 2026-09." };
  const res = await runMonthly(period, by);
  if (res.error) return { ok: false, error: res.error };
  revalidate();
  return { ok: true, message: `${period}: ${res.created} нови начисления, ${res.skipped} вече бяха или без правило.` };
}

export async function updateRuleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData, "id");
  if (!id) return;
  const value = Number(s(formData, "value").replace(",", "."));
  // Скрито „0“ + отметка „1“: с `s()` (FormData.get) всяка редакция изключваше правилото.
  const active = isChecked(formData, "active");
  await updateRule(id, { ...(Number.isFinite(value) && value >= 0 ? { value } : {}), active });
  revalidate();
}
