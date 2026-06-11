import { createServiceClient } from "@/lib/supabase/service";
import type { OfferRow } from "@/lib/crm/types";
import { OffersManager, type ContactLite } from "@/components/admin/OffersManager";
import { formatMoney } from "@/lib/crm/labels";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const sb = createServiceClient();
  const [{ data: offersData }, { data: contactsData }] = await Promise.all([
    sb.from("offers").select("*").order("created_at", { ascending: false }),
    sb.from("contacts").select("id, full_name, email, company"),
  ]);
  const offers = (offersData ?? []) as OfferRow[];
  const contacts = (contactsData ?? []) as ContactLite[];

  const open = offers.filter((o) => o.status === "sent" || o.status === "viewed");
  const openSum = open.reduce((s, o) => s + (Number(o.amount_gross) || 0), 0);
  const accepted = offers.filter((o) => o.status === "accepted");
  const acceptedSum = accepted.reduce((s, o) => s + (Number(o.amount_gross) || 0), 0);

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Продажби</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Оферти</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {offers.length} общо · отворени {open.length} ({formatMoney(openSum)}) · приети {accepted.length} (
          {formatMoney(acceptedSum)})
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        💡 Пътеката: Чернова → Изпратена → Видяна → <b className="text-emerald-300">Приета</b> (създава проект автоматично) /
        Отказана. Всичко се записва в профила на контакта.
      </p>

      <OffersManager rows={offers} contacts={contacts} />
    </div>
  );
}
