import { createServiceClient } from "@/lib/supabase/service";
import type { RecurringServiceRow } from "@/lib/crm/types";
import { RecurringManager, type EnrichedService } from "@/components/admin/RecurringManager";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("recurring_services")
    .select("*")
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as RecurringServiceRow[];
  const contactIds = Array.from(new Set(rows.map((r) => r.contact_id).filter(Boolean))) as string[];

  const { data: contacts } = contactIds.length
    ? await sb.from("contacts").select("id, full_name, email").in("id", contactIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string | null }> };

  const contactName = new Map((contacts ?? []).map((c) => [c.id, c.full_name || c.email || "контакт"]));

  const services: EnrichedService[] = rows.map((r) => ({
    ...r,
    contact_name: contactName.get(r.contact_id) ?? null,
  }));

  const active = services.filter((s) => s.active).length;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Счетоводство</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Абонаменти</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {active} активни от {services.length} · GPS, CRM, поддръжка и др.
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        {'💡 „Авто-фактури: ВКЛ" значи Hermes праща месечните фактури автоматично. За приключени клиенти (напр. Borima Trans след май 2026) сложи „ИЗКЛ" — историята остава, но нови фактури не се пращат.'}
      </p>

      <RecurringManager services={services} />
    </div>
  );
}
