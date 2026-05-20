import { createClient } from "@/lib/supabase/server";
import { StatsCards } from "@/components/admin/StatsCards";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [{ count: weekCount }, { count: monthCount }, { count: upcomingCount }, { data: recent }] =
    await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
      supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", monthAgo.toISOString()),
      supabase.from("bookings").select("*", { count: "exact", head: true }).gte("scheduled_at", now.toISOString()).eq("status", "confirmed"),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(5),
    ]);

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold">Преглед</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Снимка на най-новата активност</p>
      </header>

      <StatsCards
        stats={[
          { label: "Седмица", value: weekCount ?? 0, hint: "нови заявки" },
          { label: "Месец", value: monthCount ?? 0, hint: "нови заявки" },
          { label: "Предстоящи", value: upcomingCount ?? 0, hint: "потвърдени" },
          { label: "Общо", value: (recent?.length ?? 0) > 0 ? "active" : "—", hint: "статус" },
        ]}
      />

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">Последни 5 заявки</h2>
        <div className="glass rounded-xl overflow-hidden">
          <ul className="divide-y divide-[var(--color-border-default)]">
            {(recent ?? []).map((b) => (
              <li key={b.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{b.attendee_name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{b.attendee_email}</p>
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {format(new Date(b.scheduled_at), "d MMM yyyy, HH:mm", { locale: bg })}
                </div>
              </li>
            ))}
            {(!recent || recent.length === 0) && (
              <li className="px-5 py-8 text-center text-sm text-[var(--color-text-tertiary)]">
                Все още няма заявки
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
