import { createServiceClient } from "@/lib/supabase/service";
import type { DocumentRow } from "@/lib/crm/types";
import { DocumentsTable, type DocRow } from "@/components/admin/DocumentsTable";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const sb = createServiceClient();
  const { data } = await sb.from("documents").select("*").order("created_at", { ascending: false }).limit(500);
  const rows = (data ?? []) as DocumentRow[];

  const contactIds = Array.from(new Set(rows.map((r) => r.contact_id).filter(Boolean))) as string[];
  const invoiceIds = Array.from(new Set(rows.map((r) => r.invoice_id).filter(Boolean))) as string[];

  const [{ data: contacts }, { data: invoices }] = await Promise.all([
    contactIds.length
      ? sb.from("contacts").select("id, full_name, email").in("id", contactIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string | null }> }),
    invoiceIds.length
      ? sb.from("invoices").select("id, invoice_number").in("id", invoiceIds)
      : Promise.resolve({ data: [] as Array<{ id: string; invoice_number: string | null }> }),
  ]);

  const contactName = new Map((contacts ?? []).map((c) => [c.id, c.full_name || c.email || "контакт"]));
  const invoiceNo = new Map((invoices ?? []).map((i) => [i.id, i.invoice_number]));

  const docs: DocRow[] = rows.map((r) => ({
    ...r,
    contact_name: r.contact_id ? contactName.get(r.contact_id) ?? null : null,
    invoice_number: r.invoice_id ? invoiceNo.get(r.invoice_id) ?? null : null,
  }));

  const unmatched = docs.filter((d) => d.match_status === "unmatched").length;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
          ProMarketing · Счетоводство
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold">Документен център</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {docs.length} документа · {unmatched} за свързване
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        💡 Hermes качва тук фактури, талони, банкови извлечения, договори и снимки от пощата — чете ги с OCR и ги свързва с контакт/фактура/плащане. Несвързаните излизат в „Ръчна проверка".
      </p>

      <DocumentsTable rows={docs} />
    </div>
  );
}
