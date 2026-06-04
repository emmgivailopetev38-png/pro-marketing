import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeSupabase, resetFakeIds, type FakeSupabase } from "./fake-supabase";

// Holder is hoisted so the mock factory can read the per-test fake client.
const h = vi.hoisted(() => ({ fake: null as unknown as FakeSupabase }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => h.fake,
}));

import {
  recordActivity,
  upsertInvoice,
  upsertPayment,
  createManualReviewItem,
  upsertRecurringService,
  matchPayment,
  upsertExpense,
  upsertDocument,
  upsertMetaAdsReport,
  recordAutomationEvent,
} from "./repository";

beforeEach(() => {
  resetFakeIds();
  h.fake = createFakeSupabase();
});

describe("recordActivity", () => {
  it("creates a contact and logs an activity", async () => {
    const r = await recordActivity({
      email: "new@client.bg",
      activity_type: "email_sent",
      title: "Изпратен имейл",
      followup_status: "sent_email",
    });
    expect(r.error).toBeNull();
    expect(r.created).toBe(true);
    expect(h.fake.store.contacts).toHaveLength(1);
    expect(h.fake.store.contact_activities).toHaveLength(1);
    expect((h.fake.store.contacts[0] as { followup_status?: string }).followup_status).toBe("sent_email");
  });

  it("is idempotent on dedupe_key (no double activity)", async () => {
    const args = {
      email: "dup@client.bg",
      activity_type: "email_sent",
      title: "Имейл",
      dedupe_key: "gmail:msg-123",
    };
    const first = await recordActivity(args);
    const second = await recordActivity(args);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(h.fake.store.contact_activities).toHaveLength(1);
  });

  it("marks the contact as heard when mark_heard is set", async () => {
    await recordActivity({ email: "heard@client.bg", mark_heard: true });
    const c = h.fake.store.contacts[0] as { last_heard_from_at?: string };
    expect(c.last_heard_from_at).toBeTruthy();
  });
});

describe("upsertInvoice", () => {
  it("links the invoice to a contact by client_email and logs it", async () => {
    h.fake = createFakeSupabase({ contacts: [{ id: "c1", email: "client@firma.bg" }] });
    const r = await upsertInvoice({
      client_email: "client@firma.bg",
      invoice_number: "F-100",
      invoice_type: "invoice",
      amount_gross: 240,
      currency: "BGN",
      source: "gmail_sent",
    });
    expect(r.created).toBe(true);
    expect(r.contact_id).toBe("c1");
    expect(h.fake.store.invoices[0]).toMatchObject({ contact_id: "c1", invoice_number: "F-100" });
    expect(h.fake.store.contact_activities).toHaveLength(1);
  });

  it("is idempotent on source_email_id", async () => {
    const args = {
      client_email: "x@firma.bg",
      invoice_number: "F-1",
      invoice_type: "invoice" as const,
      amount_gross: 100,
      currency: "BGN",
      source: "gmail_sent" as const,
      source_email_id: "msg-1",
    };
    const a = await upsertInvoice(args);
    const b = await upsertInvoice(args);
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.id).toBe(a.id);
    expect(h.fake.store.invoices).toHaveLength(1);
  });

  it("is idempotent on invoice_number + invoice_type", async () => {
    const base = {
      invoice_number: "F-77",
      invoice_type: "proforma" as const,
      amount_gross: 100,
      currency: "BGN",
      source: "hermes" as const,
    };
    const a = await upsertInvoice(base);
    const b = await upsertInvoice({ ...base, source_pdf_name: "second.pdf" });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(h.fake.store.invoices).toHaveLength(1);
  });

  it("flags missing_contact when no contact matches", async () => {
    const r = await upsertInvoice({
      client_name: "Непознат ООД",
      client_email: "unknown@firma.bg",
      invoice_number: "F-9",
      invoice_type: "invoice",
      amount_gross: 50,
      currency: "BGN",
      source: "accountant_email",
    });
    expect(r.created).toBe(true);
    expect(r.contact_id).toBeNull();
    expect(h.fake.store.manual_review_items).toHaveLength(1);
    expect((h.fake.store.manual_review_items[0] as { type: string }).type).toBe("missing_contact");
  });
});

describe("upsertPayment", () => {
  it("creates a payment and is idempotent on source_email_id", async () => {
    const args = {
      amount: 120,
      currency: "BGN",
      match_status: "unmatched" as const,
      source: "payment_email" as const,
      source_email_id: "pay-msg-1",
    };
    const a = await upsertPayment(args);
    const b = await upsertPayment(args);
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(h.fake.store.payments).toHaveLength(1);
  });
});

describe("createManualReviewItem", () => {
  it("does not create a second OPEN item for the same issue", async () => {
    const args = {
      type: "duplicate_invoice" as const,
      title: "Дубликат?",
      related_invoice_id: "00000000-0000-0000-0000-000000000001",
      severity: "medium" as const,
    };
    const a = await createManualReviewItem(args);
    const b = await createManualReviewItem(args);
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(h.fake.store.manual_review_items).toHaveLength(1);
  });
});

describe("upsertRecurringService", () => {
  it("inserts then updates the same row without resetting currency", async () => {
    const a = await upsertRecurringService({
      contact_id: "11111111-1111-1111-1111-111111111111",
      service_type: "gps",
      amount: 30,
      currency: "EUR",
      billing_period: "monthly",
    });
    expect(a.created).toBe(true);

    // Borima-Trans style: deactivate + exclude from auto-send, omit currency.
    const b = await upsertRecurringService({
      contact_id: "11111111-1111-1111-1111-111111111111",
      service_type: "gps",
      active: false,
      excluded_from_auto_send: true,
      excluded_reason: "Край на отношенията след май 2026",
    });
    expect(b.created).toBe(false);
    expect(b.id).toBe(a.id);
    expect(h.fake.store.recurring_services).toHaveLength(1);
    const row = h.fake.store.recurring_services[0] as {
      currency: string;
      active: boolean;
      excluded_from_auto_send: boolean;
    };
    expect(row.currency).toBe("EUR"); // not reset to BGN
    expect(row.active).toBe(false);
    expect(row.excluded_from_auto_send).toBe(true);
  });
});

describe("matchPayment", () => {
  it("auto-matches with two signals and marks the invoice paid", async () => {
    h.fake = createFakeSupabase({
      payments: [{ id: "pay_1", amount: 120, currency: "BGN", contact_id: "c1", match_status: "unmatched" }],
      invoices: [{ id: "inv_1", amount_gross: 120, contact_id: "c1", invoice_number: "F-1", status: "awaiting_payment" }],
    });
    const r = await matchPayment({
      payment_id: "pay_1",
      invoice_id: "inv_1",
      signals: { name_match: true, exact_amount_match: true },
    });
    expect(r.decision).toBe("auto_match");
    expect(r.invoice_status).toBe("paid");
    expect((h.fake.store.invoices[0] as { status: string }).status).toBe("paid");
    expect((h.fake.store.payments[0] as { match_status: string }).match_status).toBe("matched");
  });

  it("sends amount-only matches to manual review and leaves the invoice untouched", async () => {
    h.fake = createFakeSupabase({
      payments: [{ id: "pay_2", amount: 120, currency: "BGN", contact_id: null, match_status: "unmatched" }],
      invoices: [{ id: "inv_2", amount_gross: 120, contact_id: "c2", invoice_number: "F-2", status: "awaiting_payment" }],
    });
    const r = await matchPayment({
      payment_id: "pay_2",
      invoice_id: "inv_2",
      signals: { exact_amount_match: true },
    });
    expect(r.decision).toBe("manual_review");
    expect((h.fake.store.invoices[0] as { status: string }).status).toBe("awaiting_payment");
    expect((h.fake.store.payments[0] as { match_status: string }).match_status).toBe("unmatched");
    expect(h.fake.store.manual_review_items).toHaveLength(1);
  });

  it("flags ambiguous candidates and marks the payment ambiguous", async () => {
    h.fake = createFakeSupabase({
      payments: [{ id: "pay_3", amount: 120, currency: "BGN", contact_id: null, match_status: "unmatched" }],
      invoices: [{ id: "inv_3", amount_gross: 120, contact_id: "c3", invoice_number: "F-3", status: "awaiting_payment" }],
    });
    const r = await matchPayment({
      payment_id: "pay_3",
      invoice_id: "inv_3",
      signals: { name_match: true, invoice_number_match: true, exact_amount_match: true },
      candidate_invoice_count: 2,
    });
    expect(r.decision).toBe("manual_review");
    expect(r.blockers).toContain("ambiguous_candidates");
    expect((h.fake.store.payments[0] as { match_status: string }).match_status).toBe("ambiguous");
    expect((h.fake.store.invoices[0] as { status: string }).status).toBe("awaiting_payment");
  });
});

describe("upsertExpense", () => {
  it("creates an expense and is idempotent on source_email_id", async () => {
    const args = {
      supplier_name: "Кръстьо счетоводител",
      category: "accountant" as const,
      amount_gross: 120,
      currency: "EUR",
      status: "unpaid" as const,
      source: "accountant_email" as const,
      source_email_id: "exp-msg-1",
    };
    const a = await upsertExpense(args);
    const b = await upsertExpense(args);
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(h.fake.store.expenses).toHaveLength(1);
  });
});

describe("upsertDocument", () => {
  it("links a document to a contact by client_email", async () => {
    h.fake = createFakeSupabase({ contacts: [{ id: "c1", email: "client@firma.bg" }] });
    const r = await upsertDocument({
      client_email: "client@firma.bg",
      doc_type: "invoice",
      title: "Фактура PDF",
      source: "hermes",
      storage_path: "crm-documents/x.pdf",
    });
    expect(r.created).toBe(true);
    expect(r.contact_id).toBe("c1");
    expect((h.fake.store.documents[0] as { match_status: string }).match_status).toBe("matched");
  });

  it("flags an unlinked document for manual review", async () => {
    const r = await upsertDocument({ doc_type: "bank_statement", title: "Извлечение", source: "hermes" });
    expect(r.created).toBe(true);
    expect(r.contact_id).toBeNull();
    expect((h.fake.store.documents[0] as { match_status: string }).match_status).toBe("unmatched");
    expect(h.fake.store.manual_review_items).toHaveLength(1);
  });
});

describe("upsertMetaAdsReport", () => {
  it("upserts per (report_date, campaign) and computes CPL", async () => {
    const a = await upsertMetaAdsReport({
      report_date: "2026-06-04",
      campaign: "Лийдове Юни",
      spend: 100,
      leads: 20,
      currency: "EUR",
      source: "hermes",
    });
    expect(a.created).toBe(true);
    expect((h.fake.store.meta_ads_reports[0] as { cpl: number }).cpl).toBe(5);

    const b = await upsertMetaAdsReport({
      report_date: "2026-06-04",
      campaign: "Лийдове Юни",
      spend: 120,
      leads: 20,
      currency: "EUR",
      source: "hermes",
    });
    expect(b.created).toBe(false);
    expect(h.fake.store.meta_ads_reports).toHaveLength(1);
  });
});

describe("recordAutomationEvent", () => {
  it("is idempotent on idempotency_key", async () => {
    const a = await recordAutomationEvent({ event_type: "test", idempotency_key: "k1" });
    const b = await recordAutomationEvent({ event_type: "test", idempotency_key: "k1" });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(h.fake.store.automation_events).toHaveLength(1);
  });
});
