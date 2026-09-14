import { createServiceClient } from "@/lib/supabase/service";
import type { InvoiceRow } from "@/lib/crm/types";
import { InvoicesTable } from "@/components/admin/InvoicesTable";
import { formatMoney } from "@/lib/crm/labels";
import { isUnpaidInvoice, paidByInvoice, invoiceOutstanding } from "@/lib/crm/accounting-metrics";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const sb = createServiceClient();
  const [{ data }, { data: pay }] = await Promise.all([
    sb.from("invoices").select("*").order("created_at", { ascending: false }),
    sb.from("payments").select("invoice_id, amount, match_status"),
  ]);
  const rows = (data ?? []) as InvoiceRow[];
  const paid = paidByInvoice(
    (pay ?? []) as Array<{ invoice_id: string | null; amount: number | null; match_status: string }>
  );

  // Проформи и кредитни известия не са дълг; частично платените дължат остатъка.
  const unpaid = rows.filter(isUnpaidInvoice);
  const unpaidTotal = unpaid.reduce((s, r) => s + invoiceOutstanding(r, paid), 0);

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
