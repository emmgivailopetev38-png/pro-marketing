"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { updateBooking } from "@/lib/crm/repository";
import { isLiveBooking } from "@/lib/crm/booking-status";
import { requireTeamActor } from "@/lib/team/session";
import { cancelMeetingByTeam, markMessageSent } from "@/lib/team/sreshti";
import { findContactByEmailOrPhone } from "@/lib/team/cancelled";
import { handleNoShowBooking } from "@/lib/team/noshow";
import { fmtSofia } from "@/lib/team/time";
import { MEETING_MSG_KINDS, type MeetingMsgKind } from "@/lib/team/sreshta-saobshtenia";
import type { EkipActionResult } from "@/lib/team/types";

const OUTCOMES = new Set(["completed", "no_show"]);

/**
 * Резултатът от минала среща, от водещия ѝ (Ивайло, 06.11.2026: „които не се
 * явят — Георги ги отбелязва и Ели пак им звъни“): ✅ проведена или 🙈 не се
 * яви. „Не се яви“ пуска Ели за нов час до минути (lib/team/noshow.ts).
 * Член на екипа отбелязва само срещи на свои картони; Ивайло — всички.
 */
export async function meetingOutcomeAction(_prev: EkipActionResult | null, formData: FormData): Promise<EkipActionResult> {
  let actor;
  try {
    actor = await requireTeamActor();
  } catch {
    return { ok: false, error: "Сесията е изтекла — влез отново." };
  }
  const bookingId = String(formData.get("booking_id") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "").trim();
  if (!bookingId || !OUTCOMES.has(outcome)) return { ok: false, error: "Непознат резултат." };

  const sb = createServiceClient();
  const { data: b } = await sb
    .from("bookings")
    .select("id, status, scheduled_at, attendee_email, attendee_phone")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) return { ok: false, error: "Срещата не е намерена." };
  if (!isLiveBooking(b.status as string | null)) return { ok: false, error: "Срещата вече има резултат — опресни страницата." };
  if (new Date(String(b.scheduled_at)).getTime() > Date.now()) return { ok: false, error: "Срещата още не е минала." };

  const contact = await findContactByEmailOrPhone(b.attendee_email as string | null, b.attendee_phone as string | null);
  if (actor.kind === "member") {
    const { data: c } = contact ? await sb.from("contacts").select("owner_id").eq("id", contact.id).maybeSingle() : { data: null };
    if (!contact || (c as { owner_id?: string | null } | null)?.owner_id !== actor.member.id) {
      return { ok: false, error: "Тази среща не е на твой картон." };
    }
  }

  const r = await updateBooking({ id: bookingId, status: outcome });
  if (r.error) return { ok: false, error: `Не се записа: ${r.error}` };

  let message: string;
  if (outcome === "no_show") {
    const n = await handleNoShowBooking({ bookingId, by: actor.name });
    message = n.contactId
      ? "Записано: не се яви. Ели му звъни за нов час до минути — и пак на другия ден, до 4 опита за 7 дни. Запише ли час, ще го видиш тук."
      : "Записано: не се яви. ⚠️ Картон с телефон в CRM-а няма — Ели няма на кого да звъни.";
  } else {
    if (contact) {
      await sb.from("contact_activities").insert({
        contact_id: contact.id,
        activity_type: "meeting_outcome",
        title: `✅ Срещата се проведе · ${fmtSofia(String(b.scheduled_at))}`,
        body: null,
        occurred_at: new Date().toISOString(),
        created_by: actor.name,
        metadata: { team: true, team_member_id: actor.member?.id ?? null, booking_id: bookingId, outcome: "completed" },
      });
    }
    message = "Записано: проведена. Отбележи и какво следва на картата — оферта, чуване или спечелен.";
  }
  revalidatePath("/ekip/prodazhbi");
  revalidatePath("/ekip");
  revalidatePath("/admin/bookings");
  if (contact) revalidatePath(`/admin/clients/${contact.id}`);
  return { ok: true, message };
}

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
