import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { TZ } from "@/lib/contacts/followup";
import { planInvoiceReminders, type InvoiceForReminder, type OverdueInvoice, type PaymentForReminder } from "./invoice-reminders-rules";

export interface InvoiceRemindersResult {
  overdue: OverdueInvoice[];
  notes_written: number;
  errors: string[];
}

/**
 * Просрочените фактури за сутрешния имейл + бележка в картона на 3-ия / 7-ия /
 * 14-ия ден след падежа (по една на праг, `metadata.dedupe_key`). Без имейл
 * към клиента. Правилата са в `invoice-reminders-rules.ts`.
 */
export async function runInvoiceReminders(now: Date = new Date(), opts: { dry?: boolean } = {}): Promise<InvoiceRemindersResult> {
  const sb = createServiceClient();
  const out: InvoiceRemindersResult = { overdue: [], notes_written: 0, errors: [] };
  const today = now.toISOString().slice(0, 10);

  const { data: invRaw, error } = await sb
    .from("invoices")
    .select("id, contact_id, client_name, invoice_number, invoice_type, issue_date, due_date, amount_gross, amount_net, status")
    .in("status", ["sent", "awaiting_payment", "partially_paid", "overdue"])
    .not("due_date", "is", null)
    .lt("due_date", today)
    .order("due_date", { ascending: true })
    .limit(300);
  if (error) {
    out.errors.push(`invoices: ${error.message}`);
    return out;
  }
  const invoices = (invRaw ?? []) as InvoiceForReminder[];
  if (invoices.length === 0) return out;
  const ids = invoices.map((i) => i.id);

  const [{ data: payRaw }, { data: notesRaw }] = await Promise.all([
    sb.from("payments").select("invoice_id, amount, match_status").in("invoice_id", ids),
    sb
      .from("contact_activities")
      .select("metadata")
      .like("metadata->>dedupe_key", "invoice-overdue:%")
      .limit(3000),
  ]);
  const existing = new Set<string>();
  for (const n of (notesRaw ?? []) as Array<{ metadata: Record<string, unknown> | null }>) {
    const k = n.metadata?.dedupe_key;
    if (typeof k === "string") existing.add(k);
  }

  out.overdue = planInvoiceReminders(invoices, (payRaw ?? []) as PaymentForReminder[], existing, now);

  if (opts.dry) return out;
  for (const o of out.overdue) {
    if (!o.note_due || !o.dedupe_key || !o.invoice.contact_id || !o.milestone) continue;
    const inv = o.invoice;
    const num = inv.invoice_number ? `№${inv.invoice_number}` : "(без номер)";
    const due = inv.due_date ? new Date(inv.due_date).toLocaleDateString("bg-BG", { timeZone: TZ }) : "—";
    const { error: nErr } = await sb.from("contact_activities").insert({
      contact_id: inv.contact_id,
      activity_type: "note",
      title: `🔔 Фактура ${num} просрочена ${o.days_overdue} дни`,
      body: `Падеж ${due} · остават ${o.remaining.toFixed(2)} €${o.paid > 0 ? ` (платени ${o.paid.toFixed(2)} €)` : ""} · статус ${inv.status}. Напомняне към Ивайло на ${o.milestone}-ия ден — към клиента не е пращано нищо.`,
      occurred_at: now.toISOString(),
      created_by: "auto-reminder",
      metadata: { dedupe_key: o.dedupe_key, kind: "invoice_overdue", invoice_id: inv.id, milestone: o.milestone, remaining: o.remaining },
    });
    if (nErr) out.errors.push(`${num}: ${nErr.message}`);
    else {
      out.notes_written++;
      existing.add(o.dedupe_key);
    }
  }
  return out;
}
