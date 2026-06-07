import { createServiceClient } from "@/lib/supabase/service";
import type { InvoiceRow } from "@/lib/crm/types";
import { InvoicesTable } from "@/components/admin/InvoicesTable";
import { formatMoney } from "@/lib/crm/labels";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const sb = createServiceClient();
  const { data } = await sb.from("invoices").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as InvoiceRow[];

  const unpaid = rows.filter((r) =>
    ["sent", "awaiting_payment", "partially_paid", "overdue"].includes(r.status)
  );
  const unpaidTotal = unpaid.reduce((s, r) => s + (Number(r.amount_gross) || 0), 0);

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Счетоводство</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Фактури</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {rows.length} общо · {unpaid.length} неплатени ({formatMoney(unpaidTotal)})
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        {'💡 Hermes автоматично добавя тук фактури от Gmail и от счетоводителя. Ти можеш да добавиш ръчно с „+ Нова фактура", да смениш статуса от падащото меню на реда, или да запишеш плащане с „💰 Плащане".'}
      </p>

      <InvoicesTable rows={rows} />
    </div>
  );
}
