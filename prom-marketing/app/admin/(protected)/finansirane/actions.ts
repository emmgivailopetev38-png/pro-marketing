"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { matchStatusSchema } from "@/lib/finansirane/finansirane-rules";
import { setMatchStatus } from "@/lib/finansirane/repository";

/** Смяна на статуса на съвпадение (бутоните под програмата и в картона). Само Ивайло. */
export async function setMatchStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = z.guid().safeParse(String(formData.get("id") ?? ""));
  const status = matchStatusSchema.safeParse(String(formData.get("status") ?? ""));
  if (!id.success || !status.success) return;
  const r = await setMatchStatus(id.data, status.data);
  revalidatePath("/admin/finansirane");
  if (r.contact_id) revalidatePath(`/admin/clients/${r.contact_id}`);
}
