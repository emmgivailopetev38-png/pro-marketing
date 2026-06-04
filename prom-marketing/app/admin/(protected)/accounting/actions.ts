"use server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/require-admin";
import { upsertInvoice, upsertPayment, upsertRecurringService, upsertExpense } from "@/lib/crm/repository";
import { invoiceStatusAfterPayment } from "@/lib/crm/match";
import {
  INVOICE_TYPES,
  INVOICE_STATUSES,
  RECURRING_SERVICE_TYPES,
  BILLING_PERIODS,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  type InvoiceType,
  type InvoiceStatus,
} from "@/lib/crm/types";

function str(v: FormDataEntryValue | null): string | undefined {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : undefined;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function revalidateAccounting(contactId?: string | null) {
  revalidatePath("/admin/accounting");
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/recurring");
  revalidatePath("/admin");
  if (contactId) revalidatePath(`/admin/clients/${contactId}`);
}

/** Manually add an invoice from the UI. */
export async function createInvoiceAction(formData: FormData) {
  await requireAdmin();
  const invoice_type = (str(formData.get("invoice_type")) ?? "invoice") as InvoiceType;
  if (!INVOICE_TYPES.includes(invoice_type)) throw new Error("Невалиден тип");
  const statusRaw = str(formData.get("status"));
  const status = statusRaw && INVOICE_STATUSES.includes(statusRaw as InvoiceStatus) ? (statusRaw as InvoiceStatus) : undefined;

  const res = await upsertInvoice({
    client_name: str(formData.get("client_name")),
    client_email: str(formData.get("client_email")),
    invoice_number: str(formData.get("invoice_number")),
    invoice_type,
    issue_date: str(formData.get("issue_date")),
    due_date: str(formData.get("due_date")),
    amount_net: num(formData.get("amount_net")),
    amount_gross: num(formData.get("amount_gross")),
    vat_amount: num(formData.get("vat_amount")),
    currency: str(formData.get("currency")) ?? "BGN",
    service_type: str(formData.get("service_type")),
    status,
    source: "manual",
    notes: str(formData.get("notes")),
  });
  if (res.error) throw new Error(res.error);
  revalidateAccounting(res.contact_id);
}

/** Quick status change from the invoices list. */
export async function updateInvoiceStatusAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("invoice_id"));
  const status = str(formData.get("status"));
  if (!id || !status || !INVOICE_STATUSES.includes(status as InvoiceStatus)) throw new Error("Invalid input");
  const svc = createServiceClient();
  await svc.from("invoices").update({ status }).eq("id", id);
  revalidateAccounting();
}

/**
 * Record a payment manually and (optionally) settle an invoice. This is a
 * deliberate human action, so it bypasses the ≥2-signal auto-match guard that
 * protects Hermes from marking invoices paid on weak evidence.
 */
export async function recordPaymentAction(formData: FormData) {
  await requireAdmin();
  const amount = num(formData.get("amount"));
  if (amount == null) throw new Error("Сума е задължителна");
  const invoiceId = str(formData.get("invoice_id"));

  const svc = createServiceClient();
  let contactId = str(formData.get("contact_id"));
  let invoiceGross: number | null = null;
  if (invoiceId) {
    const { data: inv } = await svc
      .from("invoices")
      .select("contact_id, amount_gross")
      .eq("id", invoiceId)
      .maybeSingle();
    if (inv) {
      contactId = contactId ?? (inv.contact_id as string | null) ?? undefined;
      invoiceGross = inv.amount_gross as number | null;
    }
  }

  const res = await upsertPayment({
    amount,
    currency: str(formData.get("currency")) ?? "BGN",
    paid_at: str(formData.get("paid_at")),
    counterparty_name: str(formData.get("counterparty_name")),
    payment_reference_redacted: str(formData.get("reference")),
    notes: str(formData.get("notes")),
    source: "manual",
    match_status: invoiceId ? "matched" : "unmatched",
    match_confidence: invoiceId ? "high" : undefined,
    invoice_id: invoiceId,
    contact_id: contactId,
  });
  if (res.error) throw new Error(res.error);

  if (invoiceId) {
    const newStatus = invoiceStatusAfterPayment(amount, invoiceGross);
    await svc.from("invoices").update({ status: newStatus }).eq("id", invoiceId);
  }
  revalidateAccounting(contactId);
}

/** Link an existing payment to an invoice (human match → settle the invoice). */
export async function matchPaymentManualAction(formData: FormData) {
  await requireAdmin();
  const paymentId = str(formData.get("payment_id"));
  const invoiceId = str(formData.get("invoice_id"));
  if (!paymentId || !invoiceId) throw new Error("Invalid input");

  const svc = createServiceClient();
  const [{ data: pay }, { data: inv }] = await Promise.all([
    svc.from("payments").select("amount, contact_id").eq("id", paymentId).maybeSingle(),
    svc.from("invoices").select("amount_gross, contact_id").eq("id", invoiceId).maybeSingle(),
  ]);
  if (!pay || !inv) throw new Error("Плащане или фактура не е намерено");

  const contactId = (pay.contact_id as string | null) ?? (inv.contact_id as string | null) ?? null;
  await svc
    .from("payments")
    .update({ match_status: "matched", match_confidence: "high", invoice_id: invoiceId, contact_id: contactId })
    .eq("id", paymentId);
  await svc
    .from("invoices")
    .update({ status: invoiceStatusAfterPayment(pay.amount as number, inv.amount_gross as number | null) })
    .eq("id", invoiceId);
  revalidateAccounting(contactId);
}

/** Add or edit a recurring service (GPS/CRM subscription). */
export async function upsertRecurringServiceAction(formData: FormData) {
  await requireAdmin();
  const service_type = str(formData.get("service_type"));
  if (!service_type || !RECURRING_SERVICE_TYPES.includes(service_type as (typeof RECURRING_SERVICE_TYPES)[number])) {
    throw new Error("Невалидна услуга");
  }
  const billingRaw = str(formData.get("billing_period"));
  const billing_period =
    billingRaw && BILLING_PERIODS.includes(billingRaw as (typeof BILLING_PERIODS)[number])
      ? (billingRaw as (typeof BILLING_PERIODS)[number])
      : undefined;

  const svc = createServiceClient();
  let contactId = str(formData.get("contact_id"));
  const email = str(formData.get("client_email"));
  if (!contactId && email) {
    const { data } = await svc.from("contacts").select("id").eq("email", email.toLowerCase()).maybeSingle();
    if (!data) throw new Error("Няма контакт с този имейл");
    contactId = data.id;
  }
  if (!contactId) throw new Error("Избери контакт (имейл)");

  const res = await upsertRecurringService({
    contact_id: contactId,
    service_type: service_type as (typeof RECURRING_SERVICE_TYPES)[number],
    amount: num(formData.get("amount")),
    currency: str(formData.get("currency")),
    billing_period,
    billing_day: num(formData.get("billing_day")),
    active: formData.has("active"),
    excluded_from_auto_send: formData.has("excluded_from_auto_send"),
    excluded_reason: str(formData.get("excluded_reason")),
    started_at: str(formData.get("started_at")),
    ended_at: str(formData.get("ended_at")),
    notes: str(formData.get("notes")),
  });
  if (res.error) throw new Error(res.error);
  revalidateAccounting(contactId);
}

/** Toggle active / excluded_from_auto_send on a recurring service. */
export async function toggleRecurringAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("id"));
  const field = str(formData.get("field"));
  const value = String(formData.get("value") ?? "") === "true";
  if (!id || !field || !["active", "excluded_from_auto_send"].includes(field)) throw new Error("Invalid input");
  const svc = createServiceClient();
  await svc
    .from("recurring_services")
    .update({ [field]: value })
    .eq("id", id);
  revalidateAccounting();
}

/** Add an expense manually (разход към доставчик). */
export async function createExpenseAction(formData: FormData) {
  await requireAdmin();
  const categoryRaw = str(formData.get("category"));
  const category =
    categoryRaw && EXPENSE_CATEGORIES.includes(categoryRaw as (typeof EXPENSE_CATEGORIES)[number])
      ? (categoryRaw as (typeof EXPENSE_CATEGORIES)[number])
      : "other";
  const statusRaw = str(formData.get("status"));
  const status =
    statusRaw && EXPENSE_STATUSES.includes(statusRaw as (typeof EXPENSE_STATUSES)[number])
      ? (statusRaw as (typeof EXPENSE_STATUSES)[number])
      : "unpaid";

  const res = await upsertExpense({
    supplier_name: str(formData.get("supplier_name")),
    category,
    description: str(formData.get("description")),
    invoice_number: str(formData.get("invoice_number")),
    amount_net: num(formData.get("amount_net")),
    amount_gross: num(formData.get("amount_gross")),
    vat_amount: num(formData.get("vat_amount")),
    currency: str(formData.get("currency")) ?? "EUR",
    expense_date: str(formData.get("expense_date")),
    due_date: str(formData.get("due_date")),
    status,
    source: "manual",
  });
  if (res.error) throw new Error(res.error);
  revalidateAccounting();
}

/** Quick status change on an expense. */
export async function setExpenseStatusAction(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("expense_id"));
  const status = str(formData.get("status"));
  if (!id || !status || !EXPENSE_STATUSES.includes(status as (typeof EXPENSE_STATUSES)[number])) {
    throw new Error("Invalid input");
  }
  const svc = createServiceClient();
  await svc.from("expenses").update({ status }).eq("id", id);
  revalidateAccounting();
}
