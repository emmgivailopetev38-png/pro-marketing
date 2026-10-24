import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { findContactByEmailOrPhone } from "@/lib/team/cancelled";
import { fmtSofia } from "@/lib/team/time";
import { planFollowupAt } from "./offer-reminders-rules";
import { decidePhoneBooking, phoneBookingKey, LOOKBACK_MS, SETTLE_AFTER_MS, type PhoneBookingLike, type TraceLike } from "./phone-bookings-rules";

export interface PhoneBookingsResult {
  checked: number;
  completed: number;
  /** Останали „accepted" без следа — „❓ Срещи без статус". */
  unclear: number;
  notes_written: number;
  errors: string[];
}

interface BookingRowLite extends PhoneBookingLike {
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
}

/**
 * Затваря телефонните срещи 2 ч след края им: следа (обаждане/среща в картона
 * от час преди началото) → `completed`; без следа → остава `accepted`, контактът
 * получава „да се обади" + напомняне за следващата работна сутрин и бележка
 * (веднъж, dedupe_key). Върви от сутрешния крон и от `lead-reminders` (на 30 мин).
 * Нищо към клиента. Правилата са в `phone-bookings-rules.ts`.
 */
export async function settlePhoneBookings(now: Date = new Date(), opts: { dry?: boolean } = {}): Promise<PhoneBookingsResult> {
  const sb = createServiceClient();
  const out: PhoneBookingsResult = { checked: 0, completed: 0, unclear: 0, notes_written: 0, errors: [] };

  const { data: rows, error } = await sb
    .from("bookings")
    .select("id, status, scheduled_at, duration_minutes, meeting_url, attendee_name, attendee_email, attendee_phone")
    .in("status", ["accepted", "pending", "confirmed"])
    .gte("scheduled_at", new Date(now.getTime() - LOOKBACK_MS).toISOString())
    .lte("scheduled_at", new Date(now.getTime() - SETTLE_AFTER_MS).toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(200);
  if (error) {
    out.errors.push(`bookings: ${error.message}`);
    return out;
  }
  const bookings = ((rows ?? []) as BookingRowLite[]).filter((b) => !(b.meeting_url ?? "").trim());
  if (bookings.length === 0) return out;

  const { data: notesRaw } = await sb
    .from("contact_activities")
    .select("metadata")
    .like("metadata->>dedupe_key", "phone-booking:%")
    .limit(2000);
  const existing = new Set<string>();
  for (const n of (notesRaw ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
    const k = n.metadata?.dedupe_key;
    if (typeof k === "string") existing.add(k);
  }

  for (const b of bookings) {
    out.checked++;
    try {
      const contact = await findContactByEmailOrPhone(b.attendee_email, b.attendee_phone);
      let acts: TraceLike[] = [];
      if (contact) {
        const { data } = await sb
          .from("contact_activities")
          .select("activity_type, occurred_at")
          .eq("contact_id", contact.id)
          .in("activity_type", ["call", "meeting"])
          .gte("occurred_at", new Date(new Date(b.scheduled_at).getTime() - 3_600_000).toISOString())
          .limit(50);
        acts = (data ?? []) as TraceLike[];
      }
      const decision = decidePhoneBooking(b, acts, now);
      if (decision === "skip") continue;

      const who = b.attendee_name?.trim() || b.attendee_phone || b.attendee_email || "Без име";
      if (decision === "completed") {
        out.completed++;
        if (opts.dry) continue;
        const { error: uErr } = await sb.from("bookings").update({ status: "completed", updated_at: now.toISOString() }).eq("id", b.id);
        if (uErr) throw new Error(uErr.message);
        const key = phoneBookingKey(b.id, "completed");
        if (contact && !existing.has(key)) {
          await sb.from("contact_activities").insert({
            contact_id: contact.id,
            activity_type: "note",
            title: `✅ Телефонна среща · ${fmtSofia(b.scheduled_at)} · проведена`,
            body: `Срещата по телефона с ${who} е отбелязана „проведена" автоматично — в картона има обаждане/среща около часа ѝ.`,
            occurred_at: now.toISOString(),
            created_by: "auto-bookings",
            metadata: { dedupe_key: key, kind: "phone_booking", booking_id: b.id, result: "completed" },
          });
          existing.add(key);
          out.notes_written++;
        }
        continue;
      }

      // unclear: остава accepted, Ивайло да провери.
      out.unclear++;
      if (opts.dry) continue;
      const key = phoneBookingKey(b.id, "check");
      if (!contact || existing.has(key)) continue;
      const { error: nErr } = await sb.from("contact_activities").insert({
        contact_id: contact.id,
        activity_type: "note",
        title: `📞 Телефонна среща без следа — провери · ${fmtSofia(b.scheduled_at)}`,
        body: `Срещата по телефона с ${who} за ${fmtSofia(b.scheduled_at)} е минала, а в картона няма обаждане или среща около часа ѝ. Остава „accepted" — отбележи я в /admin/bookings (✅ Проведена / 🙈 Не се яви) или звънни. Към клиента не е пращано нищо.`,
        occurred_at: now.toISOString(),
        created_by: "auto-bookings",
        metadata: { dedupe_key: key, kind: "phone_booking", booking_id: b.id, result: "unclear" },
      });
      if (nErr) throw new Error(nErr.message);
      existing.add(key);
      out.notes_written++;
      const { data: c } = await sb.from("contacts").select("next_followup_at, stage").eq("id", contact.id).maybeSingle();
      if (c && c.stage !== "won" && c.stage !== "lost") {
        const nextAt = planFollowupAt((c as { next_followup_at: string | null }).next_followup_at, now);
        const patch: Record<string, unknown> = { followup_status: "needs_call" };
        if (nextAt) patch.next_followup_at = nextAt;
        await sb.from("contacts").update(patch).eq("id", contact.id);
      }
    } catch (e) {
      out.errors.push(`${b.id.slice(0, 8)}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return out;
}
