"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { addFinanceRow, deleteFinanceRow, importFinanceText } from "@/lib/crm/personal-finance-data";
import { isPfKind } from "@/lib/crm/personal-finance";
import type { EkipActionResult } from "@/lib/team/types";

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

export async function addFinanceAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  await requireAdmin();
  const kind = s(formData, "kind");
  if (!isPfKind(kind)) return { ok: false, error: "Приход или разход?" };
  const amount = Number(s(formData, "amount").replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Напиши сума." };
  const occurred_on = s(formData, "occurred_on") || new Date().toISOString().slice(0, 10);
  const res = await addFinanceRow({
    kind,
    category: s(formData, "category") || "other",
    description: s(formData, "description") || null,
    amount: Math.round(amount * 100) / 100,
    occurred_on,
    recurring: s(formData, "recurring") === "1",
    note: s(formData, "note") || null,
  });
  if (res.error) return { ok: false, error: res.error };
  revalidatePath("/admin/lichni-finansi");
  return { ok: true, message: "Записано." };
}

export async function importFinanceAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  await requireAdmin();
  const text = s(formData, "text");
  if (!text) return { ok: false, error: "Постави редовете от бележките." };
  const res = await importFinanceText(text);
  if (res.error) return { ok: false, error: res.error };
  revalidatePath("/admin/lichni-finansi");
  return { ok: true, message: `Внесени ${res.inserted} реда.` };
}

export async function deleteFinanceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData, "id");
  if (id) await deleteFinanceRow(id);
  revalidatePath("/admin/lichni-finansi");
}
