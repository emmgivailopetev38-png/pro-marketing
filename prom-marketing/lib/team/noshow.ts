import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { nextWorkingDayAt } from "@/lib/contacts/followup";
import { fmtSofia } from "./time";
import { findContactByEmailOrPhone } from "./cancelled";
import { notifyNoShowBooking } from "./notify";
import { getMemberById } from "./repository";
import { giveToTeam } from "./assign";
import { readSwitch } from "@/lib/voice/auto-call";

/**
 * Човекът не се е явил на срещата — от таблото на Ивайло, от /ekip (Георги,
 * който води срещите), от API-то (проверката на Claude по календара) или от
 * Хермес. Последицата е една (Ивайло, 06.11.2026: „които не се явят — Георги
 * ги отбелязва и Ели пак им звъни, да не ги пуска“):
 *
 *   1. срещата става `no_show` (прави го викащият, преди да стигне тук);
 *   2. бележка `kind: noshow` в картона — по нея Ели звъни за нов час още
 *      до минути (кронът voice-auto, lib/voice/auto-call-rules.ts: до 4 опита
 *      за 7 дни, докато запише час или човекът каже „не“);
 *   3. чуване за човека, който води срещата, на следващата сутрин — ако Ели
 *      дотогава не е записала нов час;
 *   4. Ивайло получава известие.
 *
 * Странично действие: не хвърля.
 */
export async function handleNoShowBooking(input: { bookingId: string; by: string }): Promise<{
  ok: boolean;
  memberName: string | null;
  contactId: string | null;
  error: string | null;
  /** звъни ли Ели сама (ключът ѝ е включен); false = звъни човек от екипа */
  eli?: boolean;
  /** при изключена Ели: в чия опашка излезе човекът */
  callerName?: string | null;
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

    // С кого е била срещата: водещият на картона (клоузърът), иначе Ивайло.
    // Ели го казва в първото изречение („за срещата с Георги…“).
    let memberName: string | null = null;
    let memberFirst = "Ивайло";
    if (contact?.id) {
      const { data: c } = await sb.from("contacts").select("owner_id").eq("id", contact.id).maybeSingle();
      const ownerId = (c as { owner_id?: string | null } | null)?.owner_id ?? null;
      const member = ownerId ? await getMemberById(ownerId).catch(() => null) : null;
      if (member?.full_name) {
        memberName = member.full_name;
        memberFirst = member.full_name.trim().split(/\s+/)[0] || member.full_name;
      }
    }

    // Ели изключена (24.11.2026, Ивайло: „без Ели“) → неявилият се излиза в „🙈 Не се яви“ в
    // опашката за звънене на човека, при когото е лийдът (сетъра), и той записва новия час.
    const eli = (await readSwitch().catch(() => ({ on: true }))).on;
    let callerName: string | null = null;
    if (contact?.id) {
      const now = new Date();
      const nextIso = nextWorkingDayAt(now, 10).toISOString();
      await sb.from("contacts").update({ followup_status: "needs_call", next_followup_at: nextIso }).eq("id", contact.id);
      if (!eli) {
        const given = await giveToTeam({
          contactId: contact.id,
          kind: "noshow",
          reason: `Не се яви на срещата с ${memberFirst} (${fmtSofia(at)}) — звънни и запиши нов час`,
          createdBy: input.by,
          extra: { missed_at: at, missed_url: (b.meeting_url as string | null) ?? null, missed_booking_id: String(b.id) },
        }).catch(() => null);
        callerName = given?.ok ? given.memberName : null;
      }
      await sb.from("contact_activities").insert({
        contact_id: contact.id,
        activity_type: "note",
        title: eli
          ? `🙈 Не се яви на срещата · ${fmtSofia(at)} · Ели звъни за нов час`
          : `🙈 Не се яви на срещата · ${fmtSofia(at)} · ${callerName ?? "екипът"} звъни за нов час`,
        body: eli
          ? `Срещата с ${memberFirst} за ${fmtSofia(at)} е отбелязана „не се яви“ (${input.by}). Ели му звъни за нов час още до минути — и пак на другия ден, после през два дни (до 4 опита за 7 дни), докато запише час или човекът каже „не“. Ако дотогава няма нов час, е в списъка на ${memberFirst} за ${fmtSofia(nextIso)}. Говорил ли е по телефона с него — срещата не е „не се яви“: оправи я на „проведена“.`
          : `Срещата с ${memberFirst} за ${fmtSofia(at)} е отбелязана „не се яви“ (${input.by}). Излиза в „🙈 Не се яви“ в опашката за звънене${callerName ? ` на ${callerName}` : ""} — звъни се за нов час. Няма ли нов час, е в списъка на ${memberFirst} за ${fmtSofia(nextIso)}. Говорил ли е по телефона с него — срещата не е „не се яви“: оправи я на „проведена“.`,
        occurred_at: now.toISOString(),
        created_by: input.by,
        metadata: {
          kind: "noshow",
          missed_at: at,
          missed_url: (b.meeting_url as string | null) ?? null,
          missed_booking_id: String(b.id),
          missed_with: memberFirst,
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
      eli,
      callerName,
    }).catch(() => {});

    return { ok: true, memberName, contactId: contact?.id ?? null, error: null, eli, callerName };
  } catch (e) {
    return { ok: false, memberName: null, contactId: null, error: e instanceof Error ? e.message : "unknown" };
  }
}
