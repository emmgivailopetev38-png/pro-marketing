import { createServiceClient } from "@/lib/supabase/service";
import { evaluatePaymentMatch, invoiceStatusAfterPayment, type MatchConfidence } from "./match";
import { toEur, convertWith, fxColumns } from "./fx";
import { INVOICE_STATUSES, type InvoiceStatus } from "./types";
import { tgNotify } from "@/lib/notifications/telegram";
import {
  resolvePeriod,
  computeAccountingMetrics,
  type InvoiceLike,
  type PaymentLike,
  type ExpenseLike,
} from "./accounting-metrics";
import type {
  ActivityInput,
  InvoiceInput,
  PaymentInput,
  ManualReviewInput,
  RecurringServiceInput,
  MatchPaymentInput,
  UpsertResult,
  ExpenseInput,
  DocumentInput,
  MetaAdsReportInput,
  OfferInput,
  ProjectInput,
  OfferStatus,
  ProjectStatus,
  ProjectTaskStatus,
} from "./types";

type Sb = ReturnType<typeof createServiceClient>;

// ── shared helper ──────────────────────────────────────────────────────────
async function logActivity(
  sb: Sb,
  args: {
    contact_id: string;
    type: string;
    title: string;
    body?: string | null;
    occurred_at?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await sb.from("contact_activities").insert({
    contact_id: args.contact_id,
    activity_type: args.type,
    title: args.title,
    body: args.body ?? null,
    occurred_at: args.occurred_at ?? new Date().toISOString(),
    metadata: args.metadata ?? null,
    created_by: "hermes",
  });
}

// ── activity (unified Gmail→CRM / manual write) ─────────────────────────────
export interface ActivityResult {
  contact_id: string | null;
  activity_id: string | null;
  created: boolean;
  error: string | null;
}

export async function recordActivity(input: ActivityInput): Promise<ActivityResult> {
  const sb = createServiceClient();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;
  if (!email && !phone && !input.contact_id) {
    return { contact_id: null, activity_id: null, created: false, error: "email, phone or contact_id required" };
  }

  // Resolve the contact: an explicit contact_id wins (Hermes set-stage / set-followup /
  // add-note); otherwise find-or-create by email, then phone.
  let existing: { id: string } | null = null;
  if (input.contact_id) {
    const { data } = await sb.from("contacts").select("id").eq("id", input.contact_id).maybeSingle();
    if (!data) {
      return { contact_id: null, activity_id: null, created: false, error: "contact_id not found" };
    }
    existing = data;
  }
  if (!existing && email) {
    const { data } = await sb.from("contacts").select("id").eq("email", email).maybeSingle();
    existing = data;
  }
  if (!existing && phone) {
    const { data } = await sb.from("contacts").select("id").eq("phone", phone).is("email", null).maybeSingle();
    existing = data;
  }

  let contactId: string;
  if (existing) {
    contactId = existing.id;
  } else {
    const { data, error } = await sb
      .from("contacts")
      .insert({
        full_name: input.full_name ?? null,
        email,
        phone,
        company: input.company ?? null,
        stage: input.stage ?? "lead",
        source: "hermes",
      })
      .select("id")
      .single();
    if (error || !data) {
      return { contact_id: null, activity_id: null, created: false, error: error?.message ?? "insert failed" };
    }
    contactId = data.id;
  }

  // Explicit patches (Hermes overrides; only fields actually provided).
  const patch: Record<string, unknown> = {};
  if (input.full_name) patch.full_name = input.full_name;
  if (input.company !== undefined) patch.company = input.company;
  if (input.stage) patch.stage = input.stage;
  if (input.followup_status) patch.followup_status = input.followup_status;
  if (input.next_followup_at) patch.next_followup_at = input.next_followup_at;
  if (input.mark_heard) patch.last_heard_from_at = new Date().toISOString();
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.deal_value_eur !== undefined) patch.deal_value_eur = input.deal_value_eur;
  if (Object.keys(patch).length > 0) {
    await sb.from("contacts").update(patch).eq("id", contactId);
  }

  // Optionally log an activity (idempotent on dedupe_key).
  if (!input.activity_type || !input.title) {
    return { contact_id: contactId, activity_id: null, created: false, error: null };
  }
  if (input.dedupe_key) {
    const { data: dup } = await sb
      .from("contact_activities")
      .select("id")
      .eq("contact_id", contactId)
      .eq("activity_type", input.activity_type)
      .contains("metadata", { dedupe_key: input.dedupe_key })
      .maybeSingle();
    if (dup) return { contact_id: contactId, activity_id: dup.id, created: false, error: null };
  }
  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.dedupe_key ? { dedupe_key: input.dedupe_key } : {}),
  };
  const { data: act, error: actErr } = await sb
    .from("contact_activities")
    .insert({
      contact_id: contactId,
      activity_type: input.activity_type,
      title: input.title,
      body: input.body ?? null,
      occurred_at: input.occurred_at ?? new Date().toISOString(),
      metadata,
      created_by: input.created_by ?? "hermes",
    })
    .select("id")
    .single();
  if (actErr) return { contact_id: contactId, activity_id: null, created: false, error: actErr.message };
  return { contact_id: contactId, activity_id: act?.id ?? null, created: true, error: null };
}

// ── invoices ────────────────────────────────────────────────────────────────
async function findExistingInvoice(sb: Sb, input: InvoiceInput): Promise<{ id: string } | null> {
  if (input.source_email_id) {
    const { data } = await sb.from("invoices").select("id").eq("source_email_id", input.source_email_id).maybeSingle();
    if (data) return data;
  }
  if (input.invoice_number) {
    const { data } = await sb
      .from("invoices")
      .select("id")
      .eq("invoice_number", input.invoice_number)
      .eq("invoice_type", input.invoice_type)
      .maybeSingle();
    if (data) return data;
  }
  if (input.dedupe_key) {
    const { data } = await sb.from("invoices").select("id").eq("dedupe_key", input.dedupe_key).maybeSingle();
    if (data) return data;
  }
  return null;
}

export interface InvoiceAudit {
  currency: string;
  amount_gross: number | null;
  original_amount: number | null;
  original_currency: string | null;
  fx_rate: number | null;
  fx_source: string | null;
}

export async function upsertInvoice(
  input: InvoiceInput
): Promise<UpsertResult & { contact_id: string | null; audit: InvoiceAudit | null }> {
  const sb = createServiceClient();

  // Resolve the contact so the invoice shows up on the contact profile.
  let contactId = input.contact_id ?? null;
  if (!contactId && input.client_email) {
    const { data } = await sb.from("contacts").select("id").eq("email", input.client_email.toLowerCase()).maybeSingle();
    if (data) contactId = data.id;
  }

  const existing = await findExistingInvoice(sb, input);
  if (existing) return { id: existing.id, created: false, error: null, contact_id: contactId, audit: null };

  const status = input.status ?? (input.source === "manual" ? "draft" : "awaiting_payment");
  // Everything is stored in EUR; the original currency/amount/rate is preserved.
  const fx = toEur(input.amount_gross, input.currency, input.fx_rate);
  const fxCols = fxColumns(fx);
  const row = {
    contact_id: contactId,
    client_name: input.client_name ?? null,
    client_email: input.client_email ?? null,
    invoice_number: input.invoice_number ?? null,
    invoice_type: input.invoice_type,
    issue_date: input.issue_date ?? null,
    due_date: input.due_date ?? null,
    amount_net: convertWith(input.amount_net, fx.fx_rate),
    amount_gross: fx.amount_eur,
    vat_amount: convertWith(input.vat_amount, fx.fx_rate),
    currency: "EUR",
    ...fxCols,
    service_type: input.service_type ?? null,
    status,
    source: input.source,
    source_email_id: input.source_email_id ?? null,
    source_pdf_name: input.source_pdf_name ?? null,
    recurring_service_id: input.recurring_service_id ?? null,
    notes: input.notes ?? null,
    dedupe_key: input.dedupe_key ?? null,
  };

  const { data, error } = await sb.from("invoices").insert(row).select("id").single();
  if (error || !data) {
    const again = await findExistingInvoice(sb, input);
    if (again) return { id: again.id, created: false, error: null, contact_id: contactId, audit: null };
    return { id: null, created: false, error: error?.message ?? "insert failed", contact_id: contactId, audit: null };
  }

  if (contactId) {
    const label = `Фактура ${input.invoice_number ?? ""}`.trim() + ` · ${input.invoice_type}`;
    await logActivity(sb, {
      contact_id: contactId,
      type: "invoice",
      title: label,
      body: input.notes ?? null,
      metadata: { dedupe_key: `invoice:${data.id}`, invoice_id: data.id, amount_gross: fx.amount_eur, currency: "EUR", status },
    }).catch(() => {});
  } else if (input.client_email || input.client_name) {
    // Surface unlinked invoices so they get attached to a profile.
    await createManualReviewItem({
      type: "missing_contact",
      title: `Фактура без контакт: ${input.client_name ?? input.client_email ?? input.invoice_number ?? "?"}`,
      description: `Свържи фактура ${input.invoice_number ?? data.id} към контакт в CRM.`,
      related_invoice_id: data.id,
      severity: "low",
    }).catch(() => {});
  }

  return {
    id: data.id,
    created: true,
    error: null,
    contact_id: contactId,
    audit: { currency: "EUR", amount_gross: fx.amount_eur, ...fxCols },
  };
}

// ── payments ──────────────────────────────────────────────────────────────
async function findExistingPayment(sb: Sb, input: PaymentInput): Promise<{ id: string } | null> {
  if (input.source_email_id) {
    const { data } = await sb.from("payments").select("id").eq("source_email_id", input.source_email_id).maybeSingle();
    if (data) return data;
  }
  if (input.dedupe_key) {
    const { data } = await sb.from("payments").select("id").eq("dedupe_key", input.dedupe_key).maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function upsertPayment(input: PaymentInput): Promise<UpsertResult> {
  const sb = createServiceClient();

  const existing = await findExistingPayment(sb, input);
  if (existing) return { id: existing.id, created: false, error: null };

  const fx = toEur(input.amount, input.currency, input.fx_rate);
  const row = {
    contact_id: input.contact_id ?? null,
    invoice_id: input.invoice_id ?? null,
    amount: fx.amount_eur ?? input.amount,
    currency: "EUR",
    ...fxColumns(fx),
    paid_at: input.paid_at ?? null,
    counterparty_name: input.counterparty_name ?? null,
    payment_reference_redacted: input.payment_reference_redacted ?? null,
    bank_statement_file: input.bank_statement_file ?? null,
    match_confidence: input.match_confidence ?? null,
    match_status: input.match_status,
    source: input.source,
    source_email_id: input.source_email_id ?? null,
    notes: input.notes ?? null,
    dedupe_key: input.dedupe_key ?? null,
  };

  const { data, error } = await sb.from("payments").insert(row).select("id").single();
  if (error || !data) {
    const again = await findExistingPayment(sb, input);
    if (again) return { id: again.id, created: false, error: null };
    return { id: null, created: false, error: error?.message ?? "insert failed" };
  }

  if (input.contact_id) {
    await logActivity(sb, {
      contact_id: input.contact_id,
      type: "payment_received",
      title: `Плащане ${fx.amount_eur ?? input.amount} EUR`,
      metadata: { dedupe_key: `payment:${data.id}`, payment_id: data.id, match_status: input.match_status },
    }).catch(() => {});
  }

  return { id: data.id, created: true, error: null };
}

// ── manual review ───────────────────────────────────────────────────────────
export async function createManualReviewItem(input: ManualReviewInput): Promise<UpsertResult> {
  const sb = createServiceClient();
  const dedupe =
    input.dedupe_key ??
    `mr:${input.type}:${input.related_invoice_id ?? "-"}:${input.related_payment_id ?? "-"}:${input.related_contact_id ?? "-"}`;

  const { data: existing } = await sb
    .from("manual_review_items")
    .select("id")
    .eq("dedupe_key", dedupe)
    .in("status", ["open", "needs_user", "blocked"])
    .maybeSingle();
  if (existing) return { id: existing.id, created: false, error: null };

  const { data, error } = await sb
    .from("manual_review_items")
    .insert({
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      related_contact_id: input.related_contact_id ?? null,
      related_invoice_id: input.related_invoice_id ?? null,
      related_payment_id: input.related_payment_id ?? null,
      severity: input.severity,
      status: "open",
      dedupe_key: dedupe,
    })
    .select("id")
    .single();
  if (error || !data) {
    const { data: again } = await sb
      .from("manual_review_items")
      .select("id")
      .eq("dedupe_key", dedupe)
      .in("status", ["open", "needs_user", "blocked"])
      .maybeSingle();
    if (again) return { id: again.id, created: false, error: null };
    return { id: null, created: false, error: error?.message ?? "insert failed" };
  }
  if (input.severity === "high") void tgNotify.reviewNeeded(input.title);
  return { id: data.id, created: true, error: null };
}

// ── recurring services ──────────────────────────────────────────────────────
export async function upsertRecurringService(input: RecurringServiceInput): Promise<UpsertResult> {
  const sb = createServiceClient();

  const { data: existing } = await sb
    .from("recurring_services")
    .select("id")
    .eq("contact_id", input.contact_id)
    .eq("service_type", input.service_type)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (input.amount !== undefined) patch.amount = input.amount;
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.billing_period !== undefined) patch.billing_period = input.billing_period;
    if (input.billing_day !== undefined) patch.billing_day = input.billing_day;
    if (input.active !== undefined) patch.active = input.active;
    if (input.excluded_from_auto_send !== undefined) patch.excluded_from_auto_send = input.excluded_from_auto_send;
    if (input.excluded_reason !== undefined) patch.excluded_reason = input.excluded_reason;
    if (input.started_at !== undefined) patch.started_at = input.started_at;
    if (input.ended_at !== undefined) patch.ended_at = input.ended_at;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (Object.keys(patch).length > 0) {
      await sb.from("recurring_services").update(patch).eq("id", existing.id);
    }
    return { id: existing.id, created: false, error: null };
  }

  const { data, error } = await sb
    .from("recurring_services")
    .insert({
      contact_id: input.contact_id,
      service_type: input.service_type,
      amount: input.amount ?? null,
      currency: input.currency ?? "EUR",
      billing_period: input.billing_period ?? "monthly",
      billing_day: input.billing_day ?? null,
      active: input.active ?? true,
      excluded_from_auto_send: input.excluded_from_auto_send ?? false,
      excluded_reason: input.excluded_reason ?? null,
      started_at: input.started_at ?? null,
      ended_at: input.ended_at ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, created: false, error: error?.message ?? "insert failed" };
  return { id: data.id, created: true, error: null };
}

// ── match payment → invoice ─────────────────────────────────────────────────
export interface MatchPaymentResult {
  ok: boolean;
  decision: "auto_match" | "manual_review";
  confidence: MatchConfidence;
  signal_count: number;
  reasons: string[];
  blockers: string[];
  payment_id: string;
  invoice_id?: string;
  invoice_status?: "paid" | "partially_paid";
  manual_review_id?: string;
  error?: string;
}

export async function matchPayment(input: MatchPaymentInput): Promise<MatchPaymentResult> {
  const sb = createServiceClient();

  const { data: payment } = await sb.from("payments").select("*").eq("id", input.payment_id).maybeSingle();
  if (!payment) {
    return {
      ok: false,
      decision: "manual_review",
      confidence: "low",
      signal_count: 0,
      reasons: [],
      blockers: ["payment_not_found"],
      payment_id: input.payment_id,
      error: "payment not found",
    };
  }

  let invoice: Record<string, unknown> | null = null;
  if (input.invoice_id) {
    const { data } = await sb.from("invoices").select("*").eq("id", input.invoice_id).maybeSingle();
    invoice = data;
  }

  const candidateCount = input.candidate_invoice_count ?? (invoice ? 1 : undefined);
  const result = evaluatePaymentMatch(input.signals, { candidateInvoiceCount: candidateCount });

  // Auto-match: only when confident AND we have a concrete invoice to settle.
  if (result.decision === "auto_match" && invoice) {
    const invoiceId = invoice.id as string;
    const newStatus = invoiceStatusAfterPayment(payment.amount as number, invoice.amount_gross as number | null);
    await sb.from("invoices").update({ status: newStatus }).eq("id", invoiceId);

    const contactId = (payment.contact_id as string | null) ?? (invoice.contact_id as string | null) ?? null;
    await sb
      .from("payments")
      .update({
        match_status: "matched",
        match_confidence: result.confidence,
        invoice_id: invoiceId,
        contact_id: contactId,
      })
      .eq("id", payment.id);
    void tgNotify.paymentMatched(
      `${payment.amount} ${(payment.currency as string) ?? "EUR"}`,
      (invoice.invoice_number as string | null) ?? invoiceId
    );

    if (contactId) {
      await logActivity(sb, {
        contact_id: contactId,
        type: "payment_received",
        title: `Плащане засечено към фактура ${invoice.invoice_number ?? invoiceId}`,
        body: `${payment.amount} ${payment.currency} · увереност: ${result.confidence}`,
        metadata: {
          dedupe_key: `match:${payment.id}:${invoiceId}`,
          payment_id: payment.id,
          invoice_id: invoiceId,
          confidence: result.confidence,
        },
      }).catch(() => {});
    }

    return {
      ok: true,
      decision: "auto_match",
      confidence: result.confidence,
      signal_count: result.signalCount,
      reasons: result.reasons,
      blockers: [],
      payment_id: payment.id as string,
      invoice_id: invoiceId,
      invoice_status: newStatus,
    };
  }

  // Manual review path — invoice status is NEVER changed here.
  const blockers =
    result.decision === "auto_match" && !invoice ? [...result.blockers, "no_invoice_provided"] : result.blockers;
  const contactId = (payment.contact_id as string | null) ?? (invoice?.contact_id as string | null) ?? null;
  const ambiguous = candidateCount !== undefined && candidateCount > 1;

  const mr = await createManualReviewItem({
    type: ambiguous ? "ambiguous_pdf" : "payment_match",
    title: `Плащане за ръчна проверка: ${payment.amount} ${payment.currency}${payment.counterparty_name ? " · " + payment.counterparty_name : ""}`,
    description: `Сигнали: ${result.reasons.join(", ") || "няма"}. Причина за ръчна проверка: ${blockers.join(", ") || "—"}.`,
    related_payment_id: payment.id as string,
    related_invoice_id: (invoice?.id as string | undefined) ?? undefined,
    related_contact_id: contactId ?? undefined,
    severity: result.confidence === "medium" ? "medium" : "low",
  });

  if (ambiguous) {
    await sb.from("payments").update({ match_status: "ambiguous" }).eq("id", payment.id);
  }

  return {
    ok: true,
    decision: "manual_review",
    confidence: result.confidence,
    signal_count: result.signalCount,
    reasons: result.reasons,
    blockers,
    payment_id: payment.id as string,
    invoice_id: invoice?.id as string | undefined,
    manual_review_id: mr.id ?? undefined,
  };
}

// ── automation events (audit log) ───────────────────────────────────────────
export async function recordAutomationEvent(input: {
  event_type: string;
  status?: "success" | "failed" | "skipped";
  related_contact_id?: string | null;
  related_invoice_id?: string | null;
  related_payment_id?: string | null;
  related_document_id?: string | null;
  summary?: string;
  detail?: Record<string, unknown>;
  idempotency_key?: string;
}): Promise<{ id: string | null; created: boolean }> {
  const sb = createServiceClient();
  if (input.idempotency_key) {
    const { data } = await sb
      .from("automation_events")
      .select("id")
      .eq("idempotency_key", input.idempotency_key)
      .maybeSingle();
    if (data) return { id: data.id, created: false };
  }
  const { data, error } = await sb
    .from("automation_events")
    .insert({
      event_type: input.event_type,
      status: input.status ?? "success",
      related_contact_id: input.related_contact_id ?? null,
      related_invoice_id: input.related_invoice_id ?? null,
      related_payment_id: input.related_payment_id ?? null,
      related_document_id: input.related_document_id ?? null,
      summary: input.summary ?? null,
      detail: input.detail ?? null,
      idempotency_key: input.idempotency_key ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, created: false };
  return { id: data.id, created: true };
}

// ── expenses ────────────────────────────────────────────────────────────────
async function findExistingExpense(sb: Sb, input: ExpenseInput): Promise<{ id: string } | null> {
  if (input.source_email_id) {
    const { data } = await sb.from("expenses").select("id").eq("source_email_id", input.source_email_id).maybeSingle();
    if (data) return data;
  }
  if (input.dedupe_key) {
    const { data } = await sb.from("expenses").select("id").eq("dedupe_key", input.dedupe_key).maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function upsertExpense(input: ExpenseInput): Promise<UpsertResult> {
  const sb = createServiceClient();
  const existing = await findExistingExpense(sb, input);
  if (existing) return { id: existing.id, created: false, error: null };

  const fx = toEur(input.amount_gross, input.currency, input.fx_rate);
  const { data, error } = await sb
    .from("expenses")
    .insert({
      contact_id: input.contact_id ?? null,
      supplier_name: input.supplier_name ?? null,
      category: input.category,
      description: input.description ?? null,
      invoice_number: input.invoice_number ?? null,
      amount_net: convertWith(input.amount_net, fx.fx_rate),
      amount_gross: fx.amount_eur,
      vat_amount: convertWith(input.vat_amount, fx.fx_rate),
      currency: "EUR",
      ...fxColumns(fx),
      expense_date: input.expense_date ?? null,
      due_date: input.due_date ?? null,
      status: input.status,
      source: input.source,
      source_email_id: input.source_email_id ?? null,
      document_id: input.document_id ?? null,
      notes: input.notes ?? null,
      dedupe_key: input.dedupe_key ?? null,
      is_personal: input.is_personal ?? false,
      paid_by: input.paid_by ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    const again = await findExistingExpense(sb, input);
    if (again) return { id: again.id, created: false, error: null };
    return { id: null, created: false, error: error?.message ?? "insert failed" };
  }
  await recordAutomationEvent({
    event_type: "expense_recorded",
    related_contact_id: input.contact_id ?? null,
    summary: `${input.is_personal ? "Лична покупка" : "Разход"} ${fx.amount_eur ?? "?"} EUR · ${input.supplier_name ?? input.category}`,
    idempotency_key: `expense:${data.id}`,
  }).catch(() => {});
  return { id: data.id, created: true, error: null };
}

// ── documents ────────────────────────────────────────────────────────────────
export async function upsertDocument(input: DocumentInput): Promise<UpsertResult & { contact_id: string | null }> {
  const sb = createServiceClient();

  let contactId = input.contact_id ?? null;
  if (!contactId && input.client_email) {
    const { data } = await sb.from("contacts").select("id").eq("email", input.client_email.toLowerCase()).maybeSingle();
    if (data) contactId = data.id;
  }

  if (input.source_email_id) {
    const { data } = await sb.from("documents").select("id").eq("source_email_id", input.source_email_id).maybeSingle();
    if (data) return { id: data.id, created: false, error: null, contact_id: contactId };
  }
  if (input.dedupe_key) {
    const { data } = await sb.from("documents").select("id").eq("dedupe_key", input.dedupe_key).maybeSingle();
    if (data) return { id: data.id, created: false, error: null, contact_id: contactId };
  }

  const linked = !!(contactId || input.invoice_id || input.payment_id || input.expense_id);
  const matchStatus = input.match_status ?? (linked ? "matched" : "unmatched");

  const { data, error } = await sb
    .from("documents")
    .insert({
      contact_id: contactId,
      invoice_id: input.invoice_id ?? null,
      payment_id: input.payment_id ?? null,
      expense_id: input.expense_id ?? null,
      doc_type: input.doc_type,
      title: input.title ?? null,
      file_name: input.file_name ?? null,
      storage_path: input.storage_path ?? null,
      mime_type: input.mime_type ?? null,
      size_bytes: input.size_bytes ?? null,
      ocr_text: input.ocr_text ?? null,
      extracted: input.extracted ?? null,
      match_status: matchStatus,
      match_confidence: input.match_confidence ?? null,
      source: input.source,
      source_email_id: input.source_email_id ?? null,
      notes: input.notes ?? null,
      dedupe_key: input.dedupe_key ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { id: null, created: false, error: error?.message ?? "insert failed", contact_id: contactId };
  }

  if (!linked) {
    await createManualReviewItem({
      type: "ambiguous_pdf",
      title: `Документ за свързване: ${input.title ?? input.file_name ?? input.doc_type}`,
      description: `Документ без връзка към контакт/фактура/плащане. Тип: ${input.doc_type}.`,
      related_contact_id: contactId ?? undefined,
      severity: "low",
      dedupe_key: `mr:doc:${data.id}`,
    }).catch(() => {});
  }
  await recordAutomationEvent({
    event_type: "document_ingested",
    related_contact_id: contactId,
    related_document_id: data.id,
    related_invoice_id: input.invoice_id ?? null,
    summary: `Документ (${input.doc_type}) от ${input.source}`,
    idempotency_key: `doc:${data.id}`,
  }).catch(() => {});

  return { id: data.id, created: true, error: null, contact_id: contactId };
}

// ── meta ads reports ─────────────────────────────────────────────────────────
export async function upsertMetaAdsReport(input: MetaAdsReportInput): Promise<UpsertResult> {
  const sb = createServiceClient();
  const campaign = input.campaign ?? null;
  const cpl =
    input.cpl ?? (input.spend != null && input.leads ? Number((input.spend / input.leads).toFixed(2)) : null);

  const row = {
    report_date: input.report_date,
    campaign,
    spend: input.spend ?? null,
    leads: input.leads ?? null,
    cpl,
    impressions: input.impressions ?? null,
    clicks: input.clicks ?? null,
    ctr: input.ctr ?? null,
    currency: input.currency,
    quality_notes: input.quality_notes ?? null,
    recommendations: input.recommendations ?? null,
    raw: input.raw ?? null,
    source: input.source,
    source_email_id: input.source_email_id ?? null,
    dedupe_key: input.dedupe_key ?? null,
  };

  // Upsert by (report_date, campaign) — re-ingesting the morning report refreshes it.
  let finder = sb.from("meta_ads_reports").select("id").eq("report_date", input.report_date);
  finder = campaign === null ? finder.is("campaign", null) : finder.eq("campaign", campaign);
  const { data: existing } = await finder.maybeSingle();
  if (existing) {
    await sb.from("meta_ads_reports").update(row).eq("id", existing.id);
    return { id: existing.id, created: false, error: null };
  }

  const { data, error } = await sb.from("meta_ads_reports").insert(row).select("id").single();
  if (error || !data) return { id: null, created: false, error: error?.message ?? "insert failed" };
  await recordAutomationEvent({
    event_type: "meta_report_ingested",
    summary: `Meta справка ${input.report_date}${campaign ? " · " + campaign : ""}`,
    idempotency_key: `metareport:${data.id}`,
  }).catch(() => {});
  return { id: data.id, created: true, error: null };
}

// ── корекции (PATCH ръцете на агентите) ─────────────────────────────────────

const CONTACT_PATCH_FIELDS = [
  "full_name",
  "company",
  "phone",
  "email",
  "notes",
  "deal_value_eur",
  "stage",
  "followup_status",
  "next_followup_at",
] as const;

/**
 * Частична корекция на контакт (Hermes/админ). Пипа САМО подадените полета,
 * нормализира имейла и оставя активност като одитна следа.
 */
export async function updateContact(args: {
  id: string;
  full_name?: string;
  company?: string;
  phone?: string;
  email?: string;
  notes?: string;
  deal_value_eur?: number;
  stage?: string;
  followup_status?: string;
  next_followup_at?: string;
}): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { data: contact } = await sb.from("contacts").select("id").eq("id", args.id).maybeSingle();
  if (!contact) return { error: "contact not found" };

  const patch: Record<string, unknown> = {};
  for (const key of CONTACT_PATCH_FIELDS) {
    if (args[key] !== undefined) patch[key] = key === "email" ? String(args[key]).toLowerCase() : args[key];
  }
  if (Object.keys(patch).length === 0) return { error: null };

  const { error } = await sb.from("contacts").update(patch).eq("id", args.id);
  if (error) return { error: error.message ?? "update failed" };

  await logActivity(sb, {
    contact_id: args.id,
    type: "note",
    title: `Корекция: ${Object.keys(patch).join(", ")}`,
  }).catch(() => {});
  return { error: null };
}

/**
 * Корекция на статус на фактура (анулиране на дубликат, връщане в чернова…).
 * ЗАБЕЛЕЖКА: „платена" по правило става през match-payment; този PATCH е за
 * административни корекции и затова логва automation event + бележка защо.
 */
export async function setInvoiceStatus(args: {
  id: string;
  status: InvoiceStatus;
  reason?: string;
}): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  if (!INVOICE_STATUSES.includes(args.status)) return { error: "invalid status" };
  const { data: invoice } = await sb.from("invoices").select("id, invoice_number, notes, contact_id").eq("id", args.id).maybeSingle();
  if (!invoice) return { error: "invoice not found" };

  const patch: Record<string, unknown> = { status: args.status };
  if (args.reason?.trim()) {
    const existing = (invoice as { notes?: string | null }).notes;
    patch.notes = `${existing ? existing + "\n\n" : ""}Статус → ${args.status}: ${args.reason.trim()}`;
  }
  const { error } = await sb.from("invoices").update(patch).eq("id", args.id);
  if (error) return { error: error.message ?? "update failed" };

  await recordAutomationEvent({
    event_type: "invoice_status_corrected",
    related_invoice_id: args.id,
    related_contact_id: ((invoice as { contact_id?: string | null }).contact_id as string | null) ?? null,
    summary: `Фактура ${(invoice as { invoice_number?: string | null }).invoice_number ?? args.id} → ${args.status}${args.reason ? ` (${args.reason})` : ""}`,
    idempotency_key: `invoice-status:${args.id}:${args.status}:${new Date().toISOString().slice(0, 10)}`,
  }).catch(() => {});
  return { error: null };
}

/** Пауза/изключване/корекция на абонамент (GPS и др.). */
export async function updateRecurringService(args: {
  id: string;
  active?: boolean;
  excluded_from_auto_send?: boolean;
  excluded_reason?: string;
  amount?: number;
  billing_day?: number;
  notes?: string;
  ended_at?: string;
}): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { data: row } = await sb.from("recurring_services").select("id").eq("id", args.id).maybeSingle();
  if (!row) return { error: "recurring service not found" };

  const patch: Record<string, unknown> = {};
  for (const key of ["active", "excluded_from_auto_send", "excluded_reason", "amount", "billing_day", "notes", "ended_at"] as const) {
    if (args[key] !== undefined) patch[key] = args[key];
  }
  if (Object.keys(patch).length === 0) return { error: null };

  const { error } = await sb.from("recurring_services").update(patch).eq("id", args.id);
  if (error) return { error: error.message ?? "update failed" };
  return { error: null };
}

// ── правилни данни: view beacon + merge на дубликати ────────────────────────

/**
 * View beacon от /oferta/* страниците: изпратена оферта сама минава „viewed".
 * Никога не деградира по-напреднал статус (accepted/rejected остават).
 */
export async function markOfferViewed(path: string): Promise<{ marked: boolean }> {
  const sb = createServiceClient();
  const needle = path.toLowerCase().replace(/\/+$/, "");
  if (!needle.startsWith("/oferta/")) return { marked: false };

  const { data } = await sb.from("offers").select("*");
  const offers = (data ?? []) as Array<{ id: string; url: string | null; status: string; contact_id: string | null; title: string }>;
  const hit = offers.find((o) => o.url && o.url.toLowerCase().replace(/\/+$/, "").endsWith(needle) && o.status === "sent");
  if (!hit) return { marked: false };

  await sb.from("offers").update({ status: "viewed" }).eq("id", hit.id);
  let contactName: string | null = null;
  if (hit.contact_id) {
    const { data: c } = await sb.from("contacts").select("full_name, company").eq("id", hit.contact_id).maybeSingle();
    contactName = (c?.full_name as string | null) ?? (c?.company as string | null) ?? null;
    await logActivity(sb, {
      contact_id: hit.contact_id,
      type: "note",
      title: `Офертата „${hit.title}" е отворена 👀`,
    }).catch(() => {});
  }
  await recordAutomationEvent({
    event_type: "offer_viewed",
    related_contact_id: hit.contact_id ?? null,
    summary: `Оферта „${hit.title}" видяна (${path})`,
    idempotency_key: `offer-viewed:${hit.id}`,
  }).catch(() => {});
  void tgNotify.offerViewed(hit.title, contactName, hit.contact_id);
  return { marked: true };
}

/** Таблици с връзка към contacts — пълният списък за merge. */
const CONTACT_FK_TABLES: Array<{ table: string; column: string }> = [
  { table: "contact_activities", column: "contact_id" },
  { table: "contact_files", column: "contact_id" },
  { table: "invoices", column: "contact_id" },
  { table: "payments", column: "contact_id" },
  { table: "expenses", column: "contact_id" },
  { table: "documents", column: "contact_id" },
  { table: "recurring_services", column: "contact_id" },
  { table: "offers", column: "contact_id" },
  { table: "projects", column: "contact_id" },
  { table: "gps_devices", column: "contact_id" },
  { table: "gps_events", column: "contact_id" },
  { table: "manual_review_items", column: "related_contact_id" },
  { table: "automation_events", column: "related_contact_id" },
];

/** Полета, които се попълват от дубликата САМО ако оцеляващият ги няма. */
const CONTACT_FILL_FIELDS = ["full_name", "phone", "company", "notes", "deal_value_eur", "next_followup_at"] as const;

/**
 * Слива дубликат в оцеляващ контакт: премества всички 13 връзки, попълва
 * празните полета на оцеляващия, трие дубликата и оставя одитна следа.
 * Имейлът на оцеляващия НЕ се пипа (уникален ключ) — този на дубликата се
 * записва в merge бележката, за да не се губи информация.
 */
export async function mergeContacts(args: {
  survivor_id: string;
  duplicate_id: string;
}): Promise<{ error: string | null }> {
  if (args.survivor_id === args.duplicate_id) return { error: "cannot merge into self" };
  const sb = createServiceClient();

  const { data: survivor } = await sb.from("contacts").select("*").eq("id", args.survivor_id).maybeSingle();
  if (!survivor) return { error: "survivor not found" };
  const { data: dup } = await sb.from("contacts").select("*").eq("id", args.duplicate_id).maybeSingle();
  if (!dup) return { error: "duplicate not found" };

  // 1) Премести всички връзки.
  for (const fk of CONTACT_FK_TABLES) {
    await sb.from(fk.table).update({ [fk.column]: args.survivor_id }).eq(fk.column, args.duplicate_id);
  }

  // 2) Попълни празните полета на оцеляващия от дубликата.
  const fills: Record<string, unknown> = {};
  for (const f of CONTACT_FILL_FIELDS) {
    const sv = (survivor as Record<string, unknown>)[f];
    const dv = (dup as Record<string, unknown>)[f];
    if ((sv === null || sv === undefined || sv === "") && dv !== null && dv !== undefined && dv !== "") fills[f] = dv;
  }

  // 3) Изтрий дубликата (преди update-а — заради уникалния email).
  await sb.from("contacts").delete().eq("id", args.duplicate_id);
  if (Object.keys(fills).length > 0) {
    await sb.from("contacts").update(fills).eq("id", args.survivor_id);
  }

  // 4) Одитна следа.
  const dupRec = dup as { full_name?: string | null; email?: string | null; phone?: string | null };
  await logActivity(sb, {
    contact_id: args.survivor_id,
    type: "note",
    title: `Слят дубликат: ${dupRec.full_name ?? dupRec.email ?? args.duplicate_id}`,
    body: [dupRec.email && `имейл на дубликата: ${dupRec.email}`, dupRec.phone && `телефон: ${dupRec.phone}`]
      .filter(Boolean)
      .join("\n") || null,
  }).catch(() => {});
  await recordAutomationEvent({
    event_type: "contact_merged",
    related_contact_id: args.survivor_id,
    summary: `Слят дубликат ${dupRec.email ?? args.duplicate_id} → ${args.survivor_id}`,
    idempotency_key: `merge:${args.duplicate_id}`,
  }).catch(() => {});
  return { error: null };
}

// ── offers → projects (ERP Фаза 3) ──────────────────────────────────────────

async function resolveContactId(sb: Sb, contactId?: string, email?: string): Promise<string | null> {
  if (contactId) return contactId;
  if (!email) return null;
  const { data } = await sb.from("contacts").select("id").eq("email", email.toLowerCase()).maybeSingle();
  return data ? (data.id as string) : null;
}

export async function upsertOffer(input: OfferInput): Promise<UpsertResult & { contact_id: string | null }> {
  const sb = createServiceClient();
  const contactId = await resolveContactId(sb, input.contact_id, input.client_email);

  if (input.dedupe_key) {
    const { data } = await sb.from("offers").select("id, contact_id").eq("dedupe_key", input.dedupe_key).maybeSingle();
    if (data) return { id: data.id as string, created: false, error: null, contact_id: (data.contact_id as string | null) ?? null };
  }

  const fx = toEur(input.amount_gross, input.currency, input.fx_rate);
  const { data, error } = await sb
    .from("offers")
    .insert({
      contact_id: contactId,
      title: input.title,
      description: input.description ?? null,
      amount_net: convertWith(input.amount_net, fx.fx_rate),
      amount_gross: fx.amount_eur,
      vat_amount: convertWith(input.vat_amount, fx.fx_rate),
      currency: "EUR",
      ...fxColumns(fx),
      status: input.status ?? "draft",
      sent_at: input.sent_at ?? null,
      valid_until: input.valid_until ?? null,
      url: input.url ?? null,
      source: input.source,
      notes: input.notes ?? null,
      dedupe_key: input.dedupe_key ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (input.dedupe_key) {
      const { data: again } = await sb.from("offers").select("id").eq("dedupe_key", input.dedupe_key).maybeSingle();
      if (again) return { id: again.id as string, created: false, error: null, contact_id: contactId };
    }
    return { id: null, created: false, error: error?.message ?? "insert failed", contact_id: contactId };
  }
  if (contactId) {
    await logActivity(sb, { contact_id: contactId, type: "offer_created", title: `Оферта: ${input.title}` }).catch(() => {});
  }
  await recordAutomationEvent({
    event_type: "offer_created",
    related_contact_id: contactId,
    summary: `Оферта „${input.title}" · ${fx.amount_eur ?? "?"} EUR`,
    idempotency_key: `offer:${data.id}`,
  }).catch(() => {});
  return { id: data.id as string, created: true, error: null, contact_id: contactId };
}

/**
 * Смяна на статус на оферта. „accepted" автоматично създава проект И чернова
 * фактура от офертата (веднъж — повторно приемане връща съществуващите).
 * Черновата носи offer_id/project_id, за да е затворен кръгът пари↔доставка.
 */
export async function setOfferStatus(args: {
  id: string;
  status: OfferStatus;
}): Promise<{ error: string | null; project_id: string | null; invoice_id: string | null }> {
  const sb = createServiceClient();
  const { data: offer } = await sb.from("offers").select("*").eq("id", args.id).maybeSingle();
  if (!offer) return { error: "offer not found", project_id: null, invoice_id: null };

  const patch: Record<string, unknown> = { status: args.status };
  if (args.status === "sent" && !offer.sent_at) patch.sent_at = new Date().toISOString();

  let projectId: string | null = null;
  let invoiceId: string | null = null;
  if (args.status === "accepted") {
    patch.accepted_at = (offer.accepted_at as string | null) ?? new Date().toISOString();
    const { data: existing } = await sb.from("projects").select("id").eq("offer_id", args.id).maybeSingle();
    if (existing) {
      projectId = existing.id as string;
    } else {
      const { data: proj } = await sb
        .from("projects")
        .insert({
          contact_id: (offer.contact_id as string | null) ?? null,
          offer_id: args.id,
          title: offer.title as string,
          description: (offer.description as string | null) ?? null,
          status: "planned",
          amount_gross: (offer.amount_gross as number | null) ?? null,
          currency: (offer.currency as string) ?? "EUR",
          dedupe_key: `from-offer:${args.id}`,
        })
        .select("id")
        .single();
      projectId = (proj?.id as string | undefined) ?? null;
      await recordAutomationEvent({
        event_type: "offer_accepted",
        related_contact_id: (offer.contact_id as string | null) ?? null,
        summary: `Приета оферта „${offer.title}" → проект + чернова фактура`,
        idempotency_key: `offer-accept:${args.id}`,
      }).catch(() => {});
      void tgNotify.offerAccepted(offer.title as string, (offer.contact_id as string | null) ?? null);
    }

    // Чернова фактура (веднъж) — Ивайло/Счетоводителят само я преглежда и праща.
    const { data: existingInv } = await sb.from("invoices").select("id").eq("offer_id", args.id).maybeSingle();
    if (existingInv) {
      invoiceId = existingInv.id as string;
    } else {
      const { data: inv } = await sb
        .from("invoices")
        .insert({
          contact_id: (offer.contact_id as string | null) ?? null,
          offer_id: args.id,
          project_id: projectId,
          invoice_type: "invoice",
          status: "draft",
          amount_net: (offer.amount_net as number | null) ?? null,
          vat_amount: (offer.vat_amount as number | null) ?? null,
          amount_gross: (offer.amount_gross as number | null) ?? null,
          currency: (offer.currency as string) ?? "EUR",
          service_type: null,
          source: "hermes",
          notes: `Чернова от приета оферта „${offer.title}"`,
          dedupe_key: `from-offer:${args.id}`,
        })
        .select("id")
        .single();
      invoiceId = (inv?.id as string | undefined) ?? null;
    }
  }

  await sb.from("offers").update(patch).eq("id", args.id);
  return { error: null, project_id: projectId, invoice_id: invoiceId };
}

export async function upsertProject(input: ProjectInput): Promise<UpsertResult & { contact_id: string | null }> {
  const sb = createServiceClient();
  const contactId = await resolveContactId(sb, input.contact_id, input.client_email);

  if (input.dedupe_key) {
    const { data } = await sb.from("projects").select("id, contact_id").eq("dedupe_key", input.dedupe_key).maybeSingle();
    if (data) return { id: data.id as string, created: false, error: null, contact_id: (data.contact_id as string | null) ?? null };
  }

  const fx = toEur(input.amount_gross, input.currency);
  const { data, error } = await sb
    .from("projects")
    .insert({
      contact_id: contactId,
      offer_id: input.offer_id ?? null,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "planned",
      amount_gross: fx.amount_eur,
      currency: "EUR",
      started_at: input.started_at ?? null,
      due_date: input.due_date ?? null,
      notes: input.notes ?? null,
      dedupe_key: input.dedupe_key ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (input.dedupe_key) {
      const { data: again } = await sb.from("projects").select("id").eq("dedupe_key", input.dedupe_key).maybeSingle();
      if (again) return { id: again.id as string, created: false, error: null, contact_id: contactId };
    }
    return { id: null, created: false, error: error?.message ?? "insert failed", contact_id: contactId };
  }

  const tasks = input.tasks ?? [];
  for (let i = 0; i < tasks.length; i++) {
    await sb.from("project_tasks").insert({
      project_id: data.id as string,
      title: tasks[i].title,
      status: "todo",
      due_date: tasks[i].due_date ?? null,
      sort_order: i,
    });
  }

  if (contactId) {
    await logActivity(sb, { contact_id: contactId, type: "project_created", title: `Проект: ${input.title}` }).catch(() => {});
  }
  await recordAutomationEvent({
    event_type: "project_created",
    related_contact_id: contactId,
    summary: `Проект „${input.title}"${tasks.length ? ` · ${tasks.length} задачи` : ""}`,
    idempotency_key: `project:${data.id}`,
  }).catch(() => {});
  return { id: data.id as string, created: true, error: null, contact_id: contactId };
}

export async function setProjectStatus(args: {
  id: string;
  status: ProjectStatus;
}): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { data: project } = await sb.from("projects").select("id, done_at").eq("id", args.id).maybeSingle();
  if (!project) return { error: "project not found" };
  const patch: Record<string, unknown> = { status: args.status };
  if (args.status === "done") patch.done_at = (project.done_at as string | null) ?? new Date().toISOString();
  await sb.from("projects").update(patch).eq("id", args.id);
  return { error: null };
}

export async function addProjectTask(args: {
  project_id: string;
  title: string;
  due_date?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const sb = createServiceClient();
  const { data: project } = await sb.from("projects").select("id").eq("id", args.project_id).maybeSingle();
  if (!project) return { id: null, error: "project not found" };
  const { data: existing } = await sb.from("project_tasks").select("sort_order").eq("project_id", args.project_id);
  const next = ((existing ?? []) as Array<{ sort_order: number }>).reduce((m, t) => Math.max(m, Number(t.sort_order) + 1), 0);
  const { data, error } = await sb
    .from("project_tasks")
    .insert({
      project_id: args.project_id,
      title: args.title,
      status: "todo",
      due_date: args.due_date ?? null,
      sort_order: next,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "insert failed" };
  return { id: data.id as string, error: null };
}

export async function setProjectTaskStatus(args: {
  id: string;
  status: ProjectTaskStatus;
}): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { data: task } = await sb.from("project_tasks").select("id, done_at").eq("id", args.id).maybeSingle();
  if (!task) return { error: "task not found" };
  const patch: Record<string, unknown> = { status: args.status };
  if (args.status === "done") patch.done_at = (task.done_at as string | null) ?? new Date().toISOString();
  await sb.from("project_tasks").update(patch).eq("id", args.id);
  return { error: null };
}

// ── read summaries (for Hermes / daily reports) ──────────────────────────────

/**
 * Счетоводно резюме за период (подразбиране: текущ месец). Агрегатите идват
 * от lib/crm/accounting-metrics (единственият източник на истина) — ДДС,
 * касова/начислена печалба, лични покупки и разбивка по категории.
 * Старите ключове (revenue_expected, expenses, profit…) остават като алиаси,
 * за да не се чупят съществуващите Hermes отчети.
 */
export async function getAccountingSummary(opts?: {
  period?: string;
  from?: string;
  to?: string;
}): Promise<Record<string, unknown>> {
  const sb = createServiceClient();
  const now = new Date();

  const [{ data: inv }, { data: pay }, { data: exp }] = await Promise.all([
    sb.from("invoices").select("status, amount_gross, amount_net, vat_amount, issue_date, due_date"),
    sb.from("payments").select("amount, paid_at, created_at, match_status"),
    sb.from("expenses").select("amount_gross, amount_net, vat_amount, category, status, expense_date, created_at, is_personal"),
  ]);

  const period = resolvePeriod({ period: opts?.period, from: opts?.from, to: opts?.to, now });
  const m = computeAccountingMetrics({
    invoices: (inv ?? []) as InvoiceLike[],
    payments: (pay ?? []) as PaymentLike[],
    expenses: (exp ?? []) as ExpenseLike[],
    period,
    now,
  });

  return {
    ...m,
    // ── легаси алиаси (Hermes дневни отчети) ──
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    revenue_expected: m.revenue_accrued,
    expenses: m.business_expenses_gross,
    profit: m.profit_cash,
    unpaid_invoices_count: m.unpaid.count,
    unpaid_invoices_total: m.unpaid.gross_total,
    overdue_invoices_count: m.unpaid.overdue_count,
    currency: "EUR",
  };
}

export async function getSalesSummary(): Promise<Record<string, unknown>> {
  const sb = createServiceClient();
  const now = Date.now();
  const { data } = await sb
    .from("contacts")
    .select("stage, followup_status, next_followup_at, last_heard_from_at");
  const contacts = (data ?? []) as Array<{
    stage: string;
    followup_status: string | null;
    next_followup_at: string | null;
    last_heard_from_at: string | null;
  }>;

  const byStage: Record<string, number> = {};
  for (const c of contacts) byStage[c.stage] = (byStage[c.stage] ?? 0) + 1;

  const heardSince = (c: { next_followup_at: string | null; last_heard_from_at: string | null }) =>
    !!c.last_heard_from_at && !!c.next_followup_at && c.last_heard_from_at >= c.next_followup_at;
  const overdueNotHeard = contacts.filter(
    (c) => c.next_followup_at && new Date(c.next_followup_at).getTime() < now && !heardSince(c)
  ).length;

  return {
    total_contacts: contacts.length,
    by_stage: byStage,
    offer_sent: contacts.filter((c) => c.stage === "offer_sent" || c.followup_status === "sent_offer").length,
    negotiating: byStage["negotiating"] ?? 0,
    overdue_followups: overdueNotHeard,
    ready_to_close: contacts.filter((c) => c.followup_status === "ready_to_close").length,
  };
}
