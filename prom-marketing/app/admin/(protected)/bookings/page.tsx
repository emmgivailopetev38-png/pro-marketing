import { createServiceClient } from "@/lib/supabase/service";
import { BookingsTable, type BookingRow } from "@/components/admin/BookingsTable";

export const dynamic = "force-dynamic";

const SELECT_COLS =
  "id, cal_booking_id, attendee_name, attendee_email, attendee_phone, scheduled_at, duration_minutes, status, created_at, business, automation_goal, services_interested, timeline, meeting_url";

export default async function BookingsPage() {
  const supabase = createServiceClient();
  const nowIso = new Date().toISOString();

  // Auto-promote any stale 'confirmed' booking in the past → 'completed'. This
  // runs on every dashboard load — cheap with current volumes and keeps the UI
  // clean without a separate cron.
  await supabase
    .from("bookings")
    .update({ status: "completed", updated_at: nowIso })
    .eq("status", "confirmed")
    .lt("scheduled_at", nowIso);

  const { data } = await supabase
    .from("bookings")
    .select(SELECT_COLS)
    .order("scheduled_at", { ascending: false });

  const rows = (data ?? []) as BookingRow[];

  const upcoming = rows
    .filter((r) => new Date(r.scheduled_at) >= new Date(nowIso) && r.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = rows.filter((r) => new Date(r.scheduled_at) < new Date(nowIso) || r.status === "cancelled");

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8 cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Срещи</p>
        <h1 className="cc-title mt-2 font-display text-3xl font-bold">Срещи</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Заявки от Cal.com webhook · {upcoming.length} предстоящи · {past.length} приключени
        </p>
      </header>
      <BookingsTable upcoming={upcoming} past={past} />
    </div>
  );
}
