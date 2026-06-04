import { createServiceClient } from "@/lib/supabase/service";
import type { GpsDeviceRow, GpsEventRow } from "@/lib/crm/types";
import { GpsManager, type GpsDeviceWithContact } from "@/components/admin/GpsManager";

export const dynamic = "force-dynamic";

export default async function GpsPage() {
  const sb = createServiceClient();
  const [{ data: dev }, { data: evt }] = await Promise.all([
    sb.from("gps_devices").select("*").order("created_at", { ascending: false }),
    sb.from("gps_events").select("*").order("created_at", { ascending: false }),
  ]);
  const devices = (dev ?? []) as GpsDeviceRow[];
  const events = (evt ?? []) as GpsEventRow[];

  const contactIds = Array.from(new Set(devices.map((d) => d.contact_id).filter(Boolean))) as string[];
  const { data: contacts } = contactIds.length
    ? await sb.from("contacts").select("id, full_name, email").in("id", contactIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string | null }> };
  const contactName = new Map((contacts ?? []).map((c) => [c.id, c.full_name || c.email || "клиент"]));

  const withContact: GpsDeviceWithContact[] = devices.map((d) => ({
    ...d,
    contact_name: contactName.get(d.contact_id) ?? null,
  }));

  const eventsByDevice: Record<string, GpsEventRow[]> = {};
  for (const e of events) {
    (eventsByDevice[e.device_id] ??= []).push(e);
  }

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
          ProMarketing · Операции
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold">GPS устройства</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Устройства по клиент и автомобил, с история на монтаж/демонтаж/преместване.
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        💡 Това е операционният регистър (отделно от продажбите). Месечното фактуриране е в „Абонаменти". Приключени клиенти (напр. Borima Trans) → сложи устройствата „Демонтирано" и абонамента „Авто-фактури: ИЗКЛ".
      </p>

      <GpsManager devices={withContact} eventsByDevice={eventsByDevice} />
    </div>
  );
}
