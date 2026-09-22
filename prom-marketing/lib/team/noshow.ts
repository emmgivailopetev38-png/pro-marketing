import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { fmtSofia } from "./time";
import { giveToTeam } from "./assign";
import { findContactByEmailOrPhone } from "./cancelled";
import { notifyNoShowBooking } from "./notify";

/**
 * Човекът не се е явил на срещата — от таблото на Ивайло, от API-то (проверката
 * на Claude по Fathom и календара) или от Хермес. Последицата е една:
 *
 *   1. срещата става `no_show`;
 *   2. картонът влиза в списъка на човека за срещите („🙈 Не се явиха“) с
 *      готово съобщение за Viber и с пропуснатия час на картата;
 *   3. чуването става „сега“ — да звънне още днес;
 *   4. Ивайло и екипът получават известие.
 *
 * Странично действие: не хвърля.
 */
export async function handleNoShowBooking(input: { bookingId: string; by: string }): Promise<{
  ok: boolean;
  memberName: string | null;
  contactId: string | null;
  error: string | null;
}> {
  try {
    const sb = createServiceClient();
    const { data: b } = await sb
      .from("bookings")
      .select("id, attendee_name, attendee_email, attendee_phone, scheduled_at, meeting_url, status")
      .eq("id", input.bookingId)
      .maybeSingle();
    if (!b) return { ok: false, memberName: null, contactId: null, error: "booking not found" };

    const name = (b.attendee_name as string | null)?.trim() || (b.attendee_phone as string | null) || "Без име";
    const at = String(b.scheduled_at);
    const contact = await findContactByEmailOrPhone(b.attendee_email as string | null, b.attendee_phone as string | null);

    let memberName: string | null = null;
    if (contact?.id && contact.phone) {
      const given = await giveToTeam({
        contactId: contact.id,
        reason: `🙈 Не се яви на срещата за ${fmtSofia(at)}. Звънни, разбери какво е станало и запиши нов час. Готовото съобщение за Viber е на картата.`,
        kind: "noshow",
        createdBy: input.by,
        extra: { missed_at: at, missed_url: (b.meeting_url as string | null) ?? null, missed_booking_id: String(b.id) },
      }).catch(() => ({ ok: false, memberName: null, error: "give failed" }));
      memberName = given.memberName;
      await sb
        .from("contacts")
        .update({ followup_status: "needs_call", next_followup_at: new Date().toISOString() })
        .eq("id", contact.id);
    }

    await notifyNoShowBooking({
      contactId: contact?.id ?? null,
      name,
      phone: contact?.phone ?? (b.attendee_phone as string | null) ?? null,
      email: contact?.email ?? (b.attendee_email as string | null) ?? null,
      scheduledAtIso: at,
      by: input.by,
      memberName,
    }).catch(() => {});

    return { ok: true, memberName, contactId: contact?.id ?? null, error: null };
  } catch (e) {
    return { ok: false, memberName: null, contactId: null, error: e instanceof Error ? e.message : "unknown" };
  }
}
