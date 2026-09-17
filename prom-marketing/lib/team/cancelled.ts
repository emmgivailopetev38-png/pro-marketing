import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { phoneVariants } from "@/lib/contacts/repository";
import { fmtSofia } from "./time";
import { giveToTeam } from "./assign";
import { notifyCancelledBooking } from "./notify";

/**
 * Някой се отказа от среща — през Cal.com, по телефона или от таблото.
 * Едно място за всички пътища, защото последицата е една и съща:
 *
 *   1. картонът влиза в списъка на човека за срещите („❌ Отказаха срещата“),
 *      за да звънне и да я премести, вместо срещата да се изпари тихо;
 *   2. и двамата получават известие.
 *
 * Странично действие е — никога не хвърля и никога не блокира отмяната.
 */
export interface CancelledBookingInput {
  attendeeName: string | null;
  attendeeEmail: string | null;
  attendeePhone: string | null;
  scheduledAtIso: string;
  reason?: string | null;
  /** кой я отмени, както ще се чете в изречение: „човекът“ · „Ивайло“ */
  by?: string | null;
}

export async function handleCancelledBooking(input: CancelledBookingInput): Promise<void> {
  try {
    const name = input.attendeeName?.trim() || input.attendeePhone || input.attendeeEmail || "Без име";
    const by = input.by?.trim() || "човекът";
    const contact = await findContact(input.attendeeEmail, input.attendeePhone);

    if (contact?.id && contact.phone) {
      const reason = [
        `❌ Отказа срещата за ${fmtSofia(input.scheduledAtIso)}.`,
        input.reason?.trim() ? `Причина: ${input.reason.trim()}` : null,
        "Звънни днес и я премести — отказът най-често е за часа, не за разговора.",
      ]
        .filter(Boolean)
        .join(" ");
      await giveToTeam({
        contactId: contact.id,
        reason,
        kind: "cancelled",
        createdBy: by === "човекът" ? "Cal.com" : by,
        extra: { cancelled_at: input.scheduledAtIso, cancelled_by: by },
      }).catch(() => null);
    }

    await notifyCancelledBooking({
      contactId: contact?.id ?? null,
      name,
      phone: contact?.phone ?? input.attendeePhone ?? null,
      email: contact?.email ?? input.attendeeEmail ?? null,
      scheduledAtIso: input.scheduledAtIso,
      reason: input.reason?.trim() || null,
      by,
    });
  } catch {
    // известието не бива да вали отмяната
  }
}

/** Първо по имейл, после по телефон — същият ред като в recordActivity. */
async function findContact(
  email: string | null | undefined,
  phone: string | null | undefined
): Promise<{ id: string; phone: string | null; email: string | null } | null> {
  const sb = createServiceClient();
  const clean = email?.trim().toLowerCase();
  if (clean) {
    const { data } = await sb.from("contacts").select("id, phone, email").eq("email", clean).maybeSingle();
    if (data) return data as { id: string; phone: string | null; email: string | null };
  }
  const p = phone?.trim();
  if (p) {
    const { data } = await sb.from("contacts").select("id, phone, email").in("phone", phoneVariants(p)).limit(1);
    if (data && data.length > 0) return data[0] as { id: string; phone: string | null; email: string | null };
  }
  return null;
}
