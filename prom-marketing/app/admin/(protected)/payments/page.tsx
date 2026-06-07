import { createServiceClient } from "@/lib/supabase/service";
import type { PaymentRow, InvoiceRow } from "@/lib/crm/types";
import { PaymentsManager, type EnrichedPayment, type InvoiceOption } from "@/components/admin/PaymentsManager";
import { formatMoney } from "@/lib/crm/labels";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["sent", "awaiting_payment", "partially_paid", "overdue"];

export default async function PaymentsPage() {
  const sb = createServiceClient();
  const [{ data: pays }, { data: invs }] = await Promise.all([
    sb.from("payments").select("*").order("created_at", { ascending: false }),
    sb.from("invoices").select("*").in("status", OPEN_STATUSES).order("created_at", { ascending: false }),
  ]);

  const payments = (pays ?? []) as PaymentRow[];
  const openInvoiceRows = (invs ?? []) as InvoiceRow[];

  const contactIds = Array.from(new Set(payments.map((p) => p.contact_id).filter(Boolean))) as string[];
  const invoiceIds = Array.from(new Set(payments.map((p) => p.invoice_id).filter(Boolean))) as string[];

  const [{ data: contacts }, { data: linkedInvoices }] = await Promise.all([
    contactIds.length
      ? sb.from("contacts").select("id, full_name, email").in("id", contactIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string | null }> }),
    invoiceIds.length
      ? sb.from("invoices").select("id, invoice_number").in("id", invoiceIds)
      : Promise.resolve({ data: [] as Array<{ id: string; invoice_number: string | null }> }),
  ]);

  const contactName = new Map((contacts ?? []).map((c) => [c.id, c.full_name || c.email || "контакт"]));
  const invoiceNo = new Map((linkedInvoices ?? []).map((i) => [i.id, i.invoice_number]));

  const enriched: EnrichedPayment[] = payments.map((p) => ({
    ...p,
    contact_name: p.contact_id ? contactName.get(p.contact_id) ?? null : null,
    invoice_number: p.invoice_id ? invoiceNo.get(p.invoice_id) ?? null : null,
  }));

  const openInvoices: InvoiceOption[] = openInvoiceRows.map((i) => ({
    id: i.id,
    label: `${i.invoice_number ?? "(без номер)"} · ${formatMoney(i.amount_gross, i.currency)} · ${
      i.client_name ?? i.client_email ?? "—"
    }`,
  }));

  const unmatched = enriched.filter((p) => p.match_status === "unmatched" || p.match_status === "ambiguous").length;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Счетоводство</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Плащания</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {enriched.length} общо · {unmatched} незасечени
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        {'💡 Hermes добавя плащания от банковите извлечения и имейли, но маркира фактура като платена само при сигурно съвпадение (≥2 сигнала). Несигурните идват тук като „незасечени" — свържи ги ръчно с фактура с един клик.'}
      </p>

      <PaymentsManager payments={enriched} openInvoices={openInvoices} />
    </div>
  );
}
