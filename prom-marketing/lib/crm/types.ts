import { z } from "zod";
import {
  CONTACT_STAGES,
  FOLLOWUP_STATUSES,
  FOLLOWUP_STATUS_LABEL,
  type FollowupStatus,
} from "@/lib/contacts/types";

// Re-exported for callers that import follow-up constants from the CRM module.
export { FOLLOWUP_STATUSES, FOLLOWUP_STATUS_LABEL };
export type { FollowupStatus };

// ─────────────────────────────────────────────────────────────────────────
// Enums — kept in sync with the DB CHECK constraints in
// supabase/migrations/20260604120000_crm_hermes_backend.sql
// ─────────────────────────────────────────────────────────────────────────

export const INVOICE_TYPES = [
  "invoice",
  "proforma",
  "credit_note",
  "gps_fee",
  "demo_fee",
  "service_fee",
  "other",
] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "awaiting_payment",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "disputed",
  "excluded",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_SOURCES = [
  "manual",
  "gmail_sent",
  "accountant_email",
  "hermes",
  "uploaded_pdf",
] as const;

export const PAYMENT_SOURCES = ["bank_statement", "payment_email", "manual", "hermes"] as const;
export const MATCH_STATUSES = ["matched", "unmatched", "ambiguous", "ignored"] as const;
export const MATCH_CONFIDENCES = ["low", "medium", "high"] as const;

export const RECURRING_SERVICE_TYPES = [
  "gps",
  "crm",
  "automation",
  "hosting",
  "maintenance",
  "ads",
  "other",
] as const;
export const BILLING_PERIODS = ["monthly", "yearly", "one_time"] as const;

export const MANUAL_REVIEW_TYPES = [
  "invoice_match",
  "payment_match",
  "missing_contact",
  "ambiguous_pdf",
  "email_parse_error",
  "bank_statement_error",
  "duplicate_invoice",
  "recurring_billing_issue",
] as const;
export const SEVERITIES = ["low", "medium", "high"] as const;
export const MANUAL_REVIEW_STATUSES = ["open", "resolved", "ignored", "needs_user", "blocked"] as const;
export type ManualReviewStatus = (typeof MANUAL_REVIEW_STATUSES)[number];

// ─────────────────────────────────────────────────────────────────────────
// Shared zod helpers
// ─────────────────────────────────────────────────────────────────────────

/** Accept number or numeric string ("123.45" / "123,45"); "" / null → absent. */
const moneyOptional = z
  .preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "string") return v.replace(",", ".");
    return v;
  }, z.coerce.number().finite())
  .optional();

const moneyRequired = z.preprocess((v) => {
  if (typeof v === "string") return v.replace(",", ".");
  return v;
}, z.coerce.number().finite());

const isoDate = z.string().trim().min(1).optional();
const contactRef = z.string().uuid().optional();

// ─────────────────────────────────────────────────────────────────────────
// Activity (unified Gmail→CRM / manual write)
// ─────────────────────────────────────────────────────────────────────────

export const activityInputSchema = z
  .object({
    /** Patch a known contact directly (Hermes set-stage / set-followup / add-note). */
    contact_id: contactRef,
    email: z.string().email().optional(),
    phone: z.string().trim().min(3).optional(),
    full_name: z.string().trim().optional(),
    company: z.string().trim().optional(),
    deal_value_eur: z.coerce.number().int().optional(),
    // Activity to log (optional — you can call this just to patch a contact).
    activity_type: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    body: z.string().optional(),
    occurred_at: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    dedupe_key: z.string().trim().min(1).optional(),
    // Sales follow-up patches.
    stage: z.enum(CONTACT_STAGES).optional(),
    followup_status: z.enum(FOLLOWUP_STATUSES).optional(),
    next_followup_at: z.string().optional(),
    /** Set last_heard_from_at = now() — used by "Mark called" etc. */
    mark_heard: z.boolean().optional(),
    notes: z.string().optional(),
    created_by: z.string().optional(),
  })
  .refine((v) => v.email || v.phone || v.contact_id, {
    message: "email, phone or contact_id required",
  });
export type ActivityInput = z.infer<typeof activityInputSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Invoice
// ─────────────────────────────────────────────────────────────────────────

export const invoiceInputSchema = z.object({
  contact_id: contactRef,
  client_name: z.string().trim().optional(),
  client_email: z.string().email().optional(),
  invoice_number: z.string().trim().optional(),
  invoice_type: z.enum(INVOICE_TYPES).default("invoice"),
  issue_date: isoDate,
  due_date: isoDate,
  amount_net: moneyOptional,
  amount_gross: moneyOptional,
  vat_amount: moneyOptional,
  currency: z.string().trim().default("EUR"),
  /** Units of `currency` per 1 EUR (for non-pegged currencies). BGN auto-uses 1.95583. */
  fx_rate: moneyOptional,
  service_type: z.string().trim().optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  source: z.enum(INVOICE_SOURCES).default("hermes"),
  source_email_id: z.string().trim().optional(),
  source_pdf_name: z.string().trim().optional(),
  recurring_service_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  dedupe_key: z.string().trim().optional(),
});
export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Payment
// ─────────────────────────────────────────────────────────────────────────

export const paymentInputSchema = z.object({
  contact_id: contactRef,
  invoice_id: z.string().uuid().optional(),
  amount: moneyRequired,
  currency: z.string().trim().default("EUR"),
  /** Units of `currency` per 1 EUR (for non-pegged currencies). BGN auto-uses 1.95583. */
  fx_rate: moneyOptional,
  paid_at: z.string().optional(),
  counterparty_name: z.string().trim().optional(),
  payment_reference_redacted: z.string().trim().optional(),
  bank_statement_file: z.string().trim().optional(),
  match_confidence: z.enum(MATCH_CONFIDENCES).optional(),
  match_status: z.enum(MATCH_STATUSES).default("unmatched"),
  source: z.enum(PAYMENT_SOURCES).default("hermes"),
  source_email_id: z.string().trim().optional(),
  notes: z.string().optional(),
  dedupe_key: z.string().trim().optional(),
});
export type PaymentInput = z.infer<typeof paymentInputSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Manual review
// ─────────────────────────────────────────────────────────────────────────

export const manualReviewInputSchema = z.object({
  type: z.enum(MANUAL_REVIEW_TYPES),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  related_contact_id: z.string().uuid().optional(),
  related_invoice_id: z.string().uuid().optional(),
  related_payment_id: z.string().uuid().optional(),
  severity: z.enum(SEVERITIES).default("medium"),
  dedupe_key: z.string().trim().optional(),
});
export type ManualReviewInput = z.infer<typeof manualReviewInputSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Recurring service
// ─────────────────────────────────────────────────────────────────────────

export const recurringServiceInputSchema = z.object({
  contact_id: z.string().uuid(),
  service_type: z.enum(RECURRING_SERVICE_TYPES),
  amount: moneyOptional,
  currency: z.string().trim().optional(),
  billing_period: z.enum(BILLING_PERIODS).optional(),
  billing_day: z.coerce.number().int().min(1).max(31).optional(),
  active: z.boolean().optional(),
  excluded_from_auto_send: z.boolean().optional(),
  excluded_reason: z.string().optional(),
  started_at: isoDate,
  ended_at: isoDate,
  notes: z.string().optional(),
});
export type RecurringServiceInput = z.infer<typeof recurringServiceInputSchema>;

// ─────────────────────────────────────────────────────────────────────────
// Match payment
// ─────────────────────────────────────────────────────────────────────────

export const matchPaymentInputSchema = z.object({
  payment_id: z.string().uuid(),
  /** Candidate invoice to match against (when known). */
  invoice_id: z.string().uuid().optional(),
  signals: z
    .object({
      name_match: z.boolean().optional(),
      invoice_number_match: z.boolean().optional(),
      exact_amount_match: z.boolean().optional(),
      description_match: z.boolean().optional(),
      contact_match: z.boolean().optional(),
    })
    .default({}),
  /** How many invoices plausibly match (1 = unambiguous). */
  candidate_invoice_count: z.coerce.number().int().min(0).optional(),
});
export type MatchPaymentInput = z.infer<typeof matchPaymentInputSchema>;

// ─────────────────────────────────────────────────────────────────────────
// DB row shapes
// ─────────────────────────────────────────────────────────────────────────

export interface InvoiceRow {
  id: string;
  contact_id: string | null;
  client_name: string | null;
  client_email: string | null;
  invoice_number: string | null;
  invoice_type: InvoiceType;
  issue_date: string | null;
  due_date: string | null;
  amount_net: number | null;
  amount_gross: number | null;
  vat_amount: number | null;
  currency: string;
  original_amount: number | null;
  original_currency: string | null;
  fx_rate: number | null;
  fx_source: string | null;
  service_type: string | null;
  status: InvoiceStatus;
  source: string;
  source_email_id: string | null;
  source_pdf_name: string | null;
  recurring_service_id: string | null;
  notes: string | null;
  dedupe_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  contact_id: string | null;
  invoice_id: string | null;
  amount: number;
  currency: string;
  original_amount: number | null;
  original_currency: string | null;
  fx_rate: number | null;
  fx_source: string | null;
  paid_at: string | null;
  counterparty_name: string | null;
  payment_reference_redacted: string | null;
  bank_statement_file: string | null;
  match_confidence: (typeof MATCH_CONFIDENCES)[number] | null;
  match_status: (typeof MATCH_STATUSES)[number];
  source: string;
  source_email_id: string | null;
  notes: string | null;
  dedupe_key: string | null;
  created_at: string;
}

export interface ManualReviewRow {
  id: string;
  type: (typeof MANUAL_REVIEW_TYPES)[number];
  title: string;
  description: string | null;
  related_contact_id: string | null;
  related_invoice_id: string | null;
  related_payment_id: string | null;
  severity: (typeof SEVERITIES)[number];
  status: ManualReviewStatus;
  dedupe_key: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface RecurringServiceRow {
  id: string;
  contact_id: string;
  service_type: (typeof RECURRING_SERVICE_TYPES)[number];
  amount: number | null;
  currency: string;
  billing_period: (typeof BILLING_PERIODS)[number];
  billing_day: number | null;
  active: boolean;
  excluded_from_auto_send: boolean;
  excluded_reason: string | null;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertResult {
  id: string | null;
  created: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Expenses (разходи към доставчици)
// ─────────────────────────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = [
  "accountant",
  "hosting",
  "ads",
  "gps_hardware",
  "software",
  "office",
  "salary",
  "tax",
  "bank_fee",
  "other",
] as const;
export const EXPENSE_STATUSES = ["unpaid", "paid", "partially_paid", "cancelled"] as const;
export const EXPENSE_SOURCES = [
  "manual",
  "gmail",
  "accountant_email",
  "hermes",
  "uploaded_pdf",
  "bank_statement",
] as const;

export const expenseInputSchema = z.object({
  contact_id: contactRef,
  supplier_name: z.string().trim().optional(),
  category: z.enum(EXPENSE_CATEGORIES).default("other"),
  description: z.string().optional(),
  invoice_number: z.string().trim().optional(),
  amount_net: moneyOptional,
  amount_gross: moneyOptional,
  vat_amount: moneyOptional,
  currency: z.string().trim().default("EUR"),
  /** Units of `currency` per 1 EUR (for non-pegged currencies). BGN auto-uses 1.95583. */
  fx_rate: moneyOptional,
  expense_date: isoDate,
  due_date: isoDate,
  status: z.enum(EXPENSE_STATUSES).default("unpaid"),
  source: z.enum(EXPENSE_SOURCES).default("hermes"),
  source_email_id: z.string().trim().optional(),
  document_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  dedupe_key: z.string().trim().optional(),
  /** Лична покупка на собственика през фирмата — не е бизнес разход, не влиза в печалба/ДДС. */
  is_personal: z.boolean().optional(),
  /** С какво е платено (банка/карта/кеш) — само за справка. */
  paid_by: z.string().trim().optional(),
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export interface ExpenseRow {
  id: string;
  contact_id: string | null;
  supplier_name: string | null;
  category: (typeof EXPENSE_CATEGORIES)[number];
  description: string | null;
  invoice_number: string | null;
  amount_net: number | null;
  amount_gross: number | null;
  vat_amount: number | null;
  currency: string;
  original_amount: number | null;
  original_currency: string | null;
  fx_rate: number | null;
  fx_source: string | null;
  expense_date: string | null;
  due_date: string | null;
  status: (typeof EXPENSE_STATUSES)[number];
  source: string;
  source_email_id: string | null;
  document_id: string | null;
  notes: string | null;
  dedupe_key: string | null;
  is_personal: boolean;
  paid_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Documents (PDF/снимки/талони/извлечения + OCR данни от Hermes)
// ─────────────────────────────────────────────────────────────────────────
export const DOC_TYPES = [
  "invoice",
  "proforma",
  "receipt",
  "bank_statement",
  "contract",
  "photo",
  "gps_protocol",
  "other",
] as const;
export const DOC_SOURCES = ["hermes", "upload", "gmail", "accountant_email", "bank_statement"] as const;

export const documentInputSchema = z.object({
  contact_id: contactRef,
  client_email: z.string().email().optional(),
  invoice_id: z.string().uuid().optional(),
  payment_id: z.string().uuid().optional(),
  expense_id: z.string().uuid().optional(),
  doc_type: z.enum(DOC_TYPES).default("other"),
  title: z.string().trim().optional(),
  file_name: z.string().trim().optional(),
  storage_path: z.string().trim().optional(),
  mime_type: z.string().trim().optional(),
  size_bytes: z.coerce.number().int().optional(),
  ocr_text: z.string().optional(),
  extracted: z.record(z.string(), z.unknown()).optional(),
  match_status: z.enum(MATCH_STATUSES).optional(),
  match_confidence: z.enum(MATCH_CONFIDENCES).optional(),
  source: z.enum(DOC_SOURCES).default("hermes"),
  source_email_id: z.string().trim().optional(),
  notes: z.string().optional(),
  dedupe_key: z.string().trim().optional(),
});
export type DocumentInput = z.infer<typeof documentInputSchema>;

export interface DocumentRow {
  id: string;
  contact_id: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  expense_id: string | null;
  doc_type: (typeof DOC_TYPES)[number];
  title: string | null;
  file_name: string | null;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  ocr_text: string | null;
  extracted: Record<string, unknown> | null;
  match_status: (typeof MATCH_STATUSES)[number];
  match_confidence: (typeof MATCH_CONFIDENCES)[number] | null;
  source: string;
  source_email_id: string | null;
  notes: string | null;
  dedupe_key: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Meta ads reports (сутрешният анализ от Hermes)
// ─────────────────────────────────────────────────────────────────────────
export const metaAdsReportInputSchema = z.object({
  report_date: z.string().trim().min(1),
  campaign: z.string().trim().optional(),
  spend: moneyOptional,
  leads: z.coerce.number().int().optional(),
  cpl: moneyOptional,
  impressions: z.coerce.number().int().optional(),
  clicks: z.coerce.number().int().optional(),
  ctr: z.coerce.number().optional(),
  currency: z.string().trim().default("EUR"),
  quality_notes: z.string().optional(),
  recommendations: z.string().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
  source: z.enum(["hermes", "email", "manual"]).default("hermes"),
  source_email_id: z.string().trim().optional(),
  dedupe_key: z.string().trim().optional(),
});
export type MetaAdsReportInput = z.infer<typeof metaAdsReportInputSchema>;

export interface MetaAdsReportRow {
  id: string;
  report_date: string;
  campaign: string | null;
  spend: number | null;
  leads: number | null;
  cpl: number | null;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  currency: string;
  quality_notes: string | null;
  recommendations: string | null;
  raw: Record<string, unknown> | null;
  source: string;
  source_email_id: string | null;
  dedupe_key: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// GPS module (operations)
// ─────────────────────────────────────────────────────────────────────────
export const GPS_DEVICE_STATUSES = ["active", "paused", "removed", "moved"] as const;
export const GPS_EVENT_TYPES = [
  "install",
  "uninstall",
  "move",
  "swap",
  "service",
  "pause",
  "resume",
  "other",
] as const;

export interface GpsDeviceRow {
  id: string;
  contact_id: string;
  recurring_service_id: string | null;
  label: string | null;
  imei: string | null;
  sim: string | null;
  vehicle_plate: string | null;
  vehicle_model: string | null;
  monthly_fee: number | null;
  currency: string;
  status: (typeof GPS_DEVICE_STATUSES)[number];
  installed_at: string | null;
  removed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GpsEventRow {
  id: string;
  device_id: string;
  contact_id: string | null;
  event_type: (typeof GPS_EVENT_TYPES)[number];
  event_date: string | null;
  from_vehicle: string | null;
  to_vehicle: string | null;
  price: number | null;
  currency: string;
  technician: string | null;
  notes: string | null;
  created_at: string;
}
