"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { updateBooking } from "@/lib/crm/repository";
import { handleCancelledBooking } from "@/lib/team/cancelled";
import { handleNoShowBooking } from "@/lib/team/noshow";

const ALLOWED = new Set(["completed", "no_show", "cancelled", "accepted"]);

/**
 * Резултатът от срещата, с едно натискане от таблото: проведена, не се яви,
 * отказана. „Не се яви“ и „отказана“ пращат картона при човека за срещите.
 */
export async function bookingStatusAction(formData: FormData): Promise<void> {
  const by = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !ALLOWED.has(status)) return;

  const r = await updateBooking({ id, status });
  if (r.error) return;

  if (status === "no_show") {
    await handleNoShowBooking({ bookingId: id, by });
  } else if (status === "cancelled") {
    const sb = createServiceClient();
    const { data } = await sb
      .from("bookings")
      .select("attendee_name, attendee_email, attendee_phone, scheduled_at")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      await handleCancelledBooking({
        attendeeName: (data.attendee_name as string | null) ?? null,
        attendeeEmail: (data.attendee_email as string | null) ?? null,
        attendeePhone: (data.attendee_phone as string | null) ?? null,
        scheduledAtIso: String(data.scheduled_at),
        by,
      });
    }
  }
  revalidatePath("/admin/bookings");
  revalidatePath("/ekip");
  revalidatePath("/admin");
}
