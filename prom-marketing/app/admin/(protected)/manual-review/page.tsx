import { createServiceClient } from "@/lib/supabase/service";
import type { ManualReviewRow } from "@/lib/crm/types";
import { ManualReviewQueue, type ReviewItem } from "@/components/admin/ManualReviewQueue";

export const dynamic = "force-dynamic";

export default async function ManualReviewPage() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("manual_review_items")
    .select("*")
    .in("status", ["open", "needs_user", "blocked"])
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as ManualReviewRow[];

  // Enrich with contact names + invoice numbers for display.
  const contactIds = Array.from(new Set(rows.map((r) => r.related_contact_id).filter(Boolean))) as string[];
  const invoiceIds = Array.from(new Set(rows.map((r) => r.related_invoice_id).filter(Boolean))) as string[];

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

  const items: ReviewItem[] = rows.map((r) => ({
    ...r,
    contact_name: r.related_contact_id ? contactName.get(r.related_contact_id) ?? null : null,
    invoice_number: r.related_invoice_id ? invoiceNo.get(r.related_invoice_id) ?? null : null,
  }));

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Счетоводство</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Ръчна проверка</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {items.length} активни · неща, за които Hermes не е сигурен.
        </p>
      </header>

      <ManualReviewQueue items={items} />
    </div>
  );
}
