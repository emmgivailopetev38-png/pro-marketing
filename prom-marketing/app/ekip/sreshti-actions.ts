"use server";
import { revalidatePath } from "next/cache";
import { requireTeamActor } from "@/lib/team/session";
import { markMessageSent } from "@/lib/team/sreshti";
import { MEETING_MSG_KINDS, type MeetingMsgKind } from "@/lib/team/sreshta-saobshtenia";
import type { EkipActionResult } from "@/lib/team/types";

/** „Изпратих“ под готовото съобщение за срещата — записва, че е пратено, и къде. */
export async function viberSentAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  let actor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }
  const kind = String(formData.get("kind") ?? "") as MeetingMsgKind;
  if (!(MEETING_MSG_KINDS as readonly string[]).includes(kind)) return { ok: false, error: "Непознато съобщение" };
  const bookingId = String(formData.get("booking_id") ?? "").trim() || null;
  const contactId = String(formData.get("contact_id") ?? "").trim() || null;
  if (!bookingId && !contactId) return { ok: false, error: "Няма към коя среща да се запише." };
  const text = String(formData.get("text") ?? "");
  const r = await markMessageSent({ actor, bookingId, contactId, kind, text });
  if (!r.ok) return { ok: false, error: r.error ?? "Не се записа" };
  revalidatePath("/ekip");
  if (contactId) revalidatePath(`/admin/clients/${contactId}`);
  return { ok: true, message: "Записано като изпратено." };
}
