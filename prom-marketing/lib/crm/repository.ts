import { createServiceClient } from "@/lib/supabase/service";
import { evaluatePaymentMatch, invoiceStatusAfterPayment, type MatchConfidence } from "./match";
import { toEur, convertWith, fxColumns } from "./fx";
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
    summary: `Разход ${fx.amount_eur ?? "?"} EUR · ${input.supplier_name ?? input.category}`,
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

// ── read summaries (for Hermes / daily reports) ──────────────────────────────
function monthIndex(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.getFullYear() * 12 + d.getMonth();
}

export async function getAccountingSummary(): Promise<Record<string, unknown>> {
  const sb = createServiceClient();
  const now = new Date();
  const cur = now.getFullYear() * 12 + now.getMonth();
  const UNPAID = ["sent", "awaiting_payment", "partially_paid", "overdue"];

  const [{ data: inv }, { data: pay }, { data: exp }] = await Promise.all([
    sb.from("invoices").select("status, amount_gross, issue_date, due_date"),
    sb.from("payments").select("amount, paid_at, created_at, match_status"),
    sb.from("expenses").select("amount_gross, status, expense_date"),
  ]);
  const invoices = (inv ?? []) as Array<{ status: string; amount_gross: number | null; issue_date: string | null; due_date: string | null }>;
  const payments = (pay ?? []) as Array<{ amount: number | null; paid_at: string | null; created_at: string; match_status: string }>;
  const expenses = (exp ?? []) as Array<{ amount_gross: number | null; status: string; expense_date: string | null }>;

  const revenueExpected = invoices
    .filter((i) => monthIndex(i.issue_date) === cur && !["cancelled", "excluded"].includes(i.status))
    .reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const paymentsReceived = payments
    .filter((p) => p.match_status !== "ignored" && monthIndex(p.paid_at ?? p.created_at) === cur)
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const unpaidList = invoices.filter((i) => UNPAID.includes(i.status));
  const unpaidTotal = unpaidList.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const overdueCount = unpaidList.filter((i) => i.due_date && new Date(i.due_date) < now).length;
  const expensesThisMonth = expenses
    .filter((e) => monthIndex(e.expense_date) === cur && e.status !== "cancelled")
    .reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);

  return {
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    revenue_expected: revenueExpected,
    payments_received: paymentsReceived,
    expenses: expensesThisMonth,
    profit: Number((paymentsReceived - expensesThisMonth).toFixed(2)),
    unpaid_invoices_count: unpaidList.length,
    unpaid_invoices_total: unpaidTotal,
    overdue_invoices_count: overdueCount,
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
