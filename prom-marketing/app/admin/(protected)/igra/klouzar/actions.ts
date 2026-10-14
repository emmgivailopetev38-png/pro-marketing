"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

const STATUSES = ["kandidat", "zadacha", "grupa", "nayet", "otkaz"] as const;

/**
 * Местене на кандидат за клоузър между стъпките (sg_klouzar.status) + бележка.
 * Кандидатът вижда новия статус на своята страница със задачата
 * (igra.promarketing.pw/klouzar/zadacha/<token>) — никакво писмо не тръгва само.
 */
export async function setKlouzarStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) throw new Error("Невалиден статус");

  const { error } = await createServiceClient()
    .from("sg_klouzar")
    .update({ status, admin_note: note || null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/igra/klouzar");
}
