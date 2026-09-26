"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { assignProspects, unassignFresh } from "@/lib/team/prospects";
import type { EkipActionResult } from "@/lib/team/types";

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function revalidate() {
  revalidatePath("/admin/studeni");
  revalidatePath("/ekip");
}

/** „Дай N от града на човека“ — следващите свободни по реда (София първа). */
export async function assignProspectsAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  await requireAdmin();
  const memberId = s(formData, "member_id");
  const count = Math.round(Number(s(formData, "count")));
  const city = s(formData, "city") || null;
  if (!memberId) return { ok: false, error: "Избери на кого." };
  if (!Number.isFinite(count) || count < 1) return { ok: false, error: "Колко фирми? Поне 1." };
  const res = await assignProspects({ memberId, count, city });
  if (res.error) return { ok: false, error: res.error };
  revalidate();
  if (res.assigned === 0) return { ok: true, message: city ? `В ${city} няма свободни фирми с телефон.` : "Няма свободни фирми с телефон." };
  return { ok: true, message: `Дадени: ${res.assigned}${city ? ` от ${city}` : ""}. Излизат веднага в „❄️ Студени“ на човека.` };
}

/** Неизвъртените нови на човека стават пак свободни (напускане, смяна на фокуса). */
export async function unassignAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const memberId = s(formData, "member_id");
  if (!memberId) return;
  await unassignFresh(memberId);
  revalidate();
}
