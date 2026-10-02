"use server";
import { revalidatePath } from "next/cache";
import { requireTeamActor } from "@/lib/team/session";
import { cancelMeetingByTeam, markMessageSent } from "@/lib/team/sreshti";
import { fmtSofia } from "@/lib/team/time";
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

/**
 * „❌ Отказа срещата“ до напомнянето: човекът каза (по телефона, във Viber), че
 * няма да дойде. Срещата става „отменена“ — напомнянията за нея спират сами, —
 * картонът влиза в „❌ Отказаха срещата“ за нов час, Ивайло научава.
 */
export async function meetingCancelAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  let actor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  if (!bookingId) return { ok: false, error: "Няма коя среща да се отмени." };
  const r = await cancelMeetingByTeam(actor, bookingId);
  if (!r.ok) return { ok: false, error: r.error ?? "Не се отмени" };
  revalidatePath("/ekip");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Срещата${r.whenIso ? ` за ${fmtSofia(r.whenIso)}` : ""} е отменена — напомнянията за нея спряха. ${
      r.hasCard
        ? "Картата е в „❌ Отказаха срещата“ (За повторно): запиши нов час, когато се разберете."
        : "Картон с телефон в CRM-а няма — Ивайло е уведомен; нов час уговаряте с него."
    }`,
  };
}
