import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { fmtSofia } from "./time";
import { findContactByEmailOrPhone } from "./cancelled";
import { notifyNoShowBooking } from "./notify";

/**
 * Човекът не се е явил на срещата — от таблото на Ивайло, от API-то (проверката
 * на Claude по Fathom и календара) или от Хермес. Последицата е една:
 *
 *   1. срещата става `no_show`;
 *   2. картонът отива в списъка на Ивайло за звънене — чуване „сега“, бележка
 *      в картона с пропуснатия час;
 *   3. Ивайло получава известие.
 *
 * До 06.10.2026 картонът отиваше при Димитър („🙈 Не се явиха“). Правилото на
 * Ивайло оттогава: „има ли записана среща и ми е била в календара — човекът
 * приключва за Димитър“ (ivailo-rules.ts). А проверката по Fathom бърка
 * разговора по телефона с неявяване — на 02.10 Subay излезе „не се яви“,
 * макар Ивайло вече да му беше дал оферта, и Димитър му звъня. Ако Ивайло
 * иска точно този човек да го звънне екипът — „🤝 Дай на екипа“ от картона.
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

    // Никой от екипа не получава картона: срещата е стояла в календара на Ивайло.
    const memberName: string | null = null;
    if (contact?.id) {
      const nowIso = new Date().toISOString();
      await sb.from("contacts").update({ followup_status: "needs_call", next_followup_at: nowIso }).eq("id", contact.id);
      await sb.from("contact_activities").insert({
        contact_id: contact.id,
        activity_type: "note",
        title: `🙈 Не се яви на срещата · ${fmtSofia(at)} · за Ивайло`,
        body: `Срещата за ${fmtSofia(at)} е отбелязана „не се яви“ (${input.by}). Чуването е за днес в списъка на Ивайло — срещата е била в календара му, затова не отива при Димитър (правило от 06.10.2026). Ако е говорил с човека по телефона, срещата не е „не се яви“ — оправи я на „проведена“ от /admin/bookings.`,
        occurred_at: nowIso,
        created_by: input.by,
        metadata: {
          kind: "noshow",
          missed_at: at,
          missed_url: (b.meeting_url as string | null) ?? null,
          missed_booking_id: String(b.id),
        },
      });
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
