import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeSupabase, resetFakeIds, type FakeSupabase } from "./fake-supabase";

const h = vi.hoisted(() => ({ fake: null as unknown as FakeSupabase }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => h.fake,
}));

import {
  clampLimit,
  parseOffset,
  parseCsv,
  parseBoolParam,
  listInvoices,
  listPayments,
  listExpenses,
  listContacts,
  getContactProfile,
  listAutomationEvents,
  listRecurringServices,
  resolveManualReviewItem,
} from "./list-read";

beforeEach(() => {
  resetFakeIds();
  h.fake = createFakeSupabase();
});

// ── чисти помощни ───────────────────────────────────────────────────────────

describe("clampLimit", () => {
  it("defaults to 50 and clamps into [1, 200]", () => {
    expect(clampLimit(null)).toBe(50);
    expect(clampLimit("25")).toBe(25);
    expect(clampLimit("0")).toBe(50); // 0/NaN → default, после clamp
    expect(clampLimit("9999")).toBe(200);
    expect(clampLimit("-5")).toBe(1);
    expect(clampLimit("abc")).toBe(50);
  });
});

describe("parseOffset", () => {
  it("defaults to 0 and never goes negative", () => {
    expect(parseOffset(null)).toBe(0);
    expect(parseOffset("30")).toBe(30);
    expect(parseOffset("-7")).toBe(0);
    expect(parseOffset("x")).toBe(0);
  });
});

describe("parseCsv", () => {
  const ALLOWED = ["paid", "sent", "overdue"] as const;
  it("returns null when the param is absent (no filter)", () => {
    expect(parseCsv(null, ALLOWED)).toBeNull();
  });
  it("keeps only allowed values, trimming whitespace", () => {
    expect(parseCsv(" paid , overdue ", ALLOWED)).toEqual(["paid", "overdue"]);
  });
  it("returns [] when given values are all invalid (route → 400)", () => {
    expect(parseCsv("bogus,nope", ALLOWED)).toEqual([]);
  });
});

describe("parseBoolParam", () => {
  it("parses true/false/1/0 and is undefined otherwise", () => {
    expect(parseBoolParam("true")).toBe(true);
    expect(parseBoolParam("1")).toBe(true);
    expect(parseBoolParam("false")).toBe(false);
    expect(parseBoolParam("0")).toBe(false);
    expect(parseBoolParam(null)).toBeUndefined();
    expect(parseBoolParam("maybe")).toBeUndefined();
  });
});

// ── фактури ────────────────────────────────────────────────────────────────

function seedInvoices() {
  h.fake = createFakeSupabase({
    invoices: [
      { id: "i1", invoice_number: "F-100", client_name: "Иван Иванов", client_email: "ivan@a.bg", status: "paid", contact_id: "c1", issue_date: "2026-05-10", created_at: "2026-05-10T00:00:00Z", amount_gross: 100 },
      { id: "i2", invoice_number: "F-101", client_name: "Мария Петрова", client_email: "maria@b.bg", status: "sent", contact_id: "c2", issue_date: "2026-06-05", created_at: "2026-06-05T00:00:00Z", amount_gross: 200 },
      { id: "i3", invoice_number: "GPS-7", client_name: "Иван Иванов", client_email: "ivan@a.bg", status: "overdue", contact_id: "c1", issue_date: null, created_at: "2026-06-20T00:00:00Z", amount_gross: 50 },
    ],
  });
}

describe("listInvoices", () => {
  it("returns everything sorted newest-first with totals", async () => {
    seedInvoices();
    const r = await listInvoices({ limit: 50, offset: 0 });
    expect(r.error).toBeNull();
    expect(r.total).toBe(3);
    expect(r.items.map((i) => i.id)).toEqual(["i3", "i2", "i1"]); // issue_date ?? created_at desc
  });

  it("filters by status set and contact", async () => {
    seedInvoices();
    const r = await listInvoices({ status: ["paid", "overdue"], contact_id: "c1", limit: 50, offset: 0 });
    expect(r.items.map((i) => i.id)).toEqual(["i3", "i1"]);
  });

  it("searches case-insensitively across number/name/email (кирилица)", async () => {
    seedInvoices();
    const byName = await listInvoices({ q: "иван", limit: 50, offset: 0 });
    expect(byName.items).toHaveLength(2);
    const byNumber = await listInvoices({ q: "gps", limit: 50, offset: 0 });
    expect(byNumber.items.map((i) => i.id)).toEqual(["i3"]);
  });

  it("applies [from, to) date range on issue_date with created_at fallback", async () => {
    seedInvoices();
    const r = await listInvoices({ from: "2026-06-01", to: "2026-07-01", limit: 50, offset: 0 });
    expect(r.items.map((i) => i.id)).toEqual(["i3", "i2"]); // i3 е по created_at fallback
  });

  it("paginates and still reports the full total", async () => {
    seedInvoices();
    const r = await listInvoices({ limit: 1, offset: 1 });
    expect(r.total).toBe(3);
    expect(r.items.map((i) => i.id)).toEqual(["i2"]);
  });
});

// ── плащания ───────────────────────────────────────────────────────────────

describe("listPayments", () => {
  it("filters by match_status and date range on paid_at ?? created_at", async () => {
    h.fake = createFakeSupabase({
      payments: [
        { id: "p1", amount: 100, match_status: "matched", paid_at: "2026-06-02", created_at: "2026-06-02T00:00:00Z", counterparty_name: "Иван" },
        { id: "p2", amount: 50, match_status: "unmatched", paid_at: null, created_at: "2026-06-10T00:00:00Z", counterparty_name: "БАНКА ДСК" },
        { id: "p3", amount: 70, match_status: "ignored", paid_at: "2026-05-01", created_at: "2026-05-01T00:00:00Z", counterparty_name: "Стар" },
      ],
    });
    const r = await listPayments({ match_status: ["matched", "unmatched"], from: "2026-06-01", to: "2026-07-01", limit: 50, offset: 0 });
    expect(r.items.map((p) => p.id)).toEqual(["p2", "p1"]);
    const q = await listPayments({ q: "дск", limit: 50, offset: 0 });
    expect(q.items.map((p) => p.id)).toEqual(["p2"]);
  });
});

// ── разходи ────────────────────────────────────────────────────────────────

describe("listExpenses", () => {
  it("filters by category, status and is_personal", async () => {
    h.fake = createFakeSupabase({
      expenses: [
        { id: "e1", category: "hosting", status: "paid", is_personal: false, supplier_name: "Hostinger", expense_date: "2026-06-01", created_at: "2026-06-01T00:00:00Z", amount_gross: 20 },
        { id: "e2", category: "other", status: "unpaid", is_personal: true, supplier_name: "Емаг", expense_date: "2026-06-05", created_at: "2026-06-05T00:00:00Z", amount_gross: 300 },
        { id: "e3", category: "ads", status: "paid", is_personal: false, supplier_name: "Meta", expense_date: "2026-06-07", created_at: "2026-06-07T00:00:00Z", amount_gross: 90 },
      ],
    });
    const personal = await listExpenses({ is_personal: true, limit: 50, offset: 0 });
    expect(personal.items.map((e) => e.id)).toEqual(["e2"]);
    const ads = await listExpenses({ category: ["ads", "hosting"], status: ["paid"], limit: 50, offset: 0 });
    expect(ads.items.map((e) => e.id)).toEqual(["e3", "e1"]);
  });
});

// ── контакти ───────────────────────────────────────────────────────────────

function seedContacts() {
  h.fake = createFakeSupabase({
    contacts: [
      { id: "c1", full_name: "Иван Иванов", email: "ivan@a.bg", phone: "+359888111222", company: "Иванови ООД", stage: "client", followup_status: null, updated_at: "2026-06-01T00:00:00Z" },
      { id: "c2", full_name: "Мария Петрова", email: "maria@b.bg", phone: null, company: null, stage: "lead", followup_status: "sent_offer", updated_at: "2026-06-09T00:00:00Z" },
    ],
    contact_activities: [
      { id: "a1", contact_id: "c1", activity_type: "note", title: "Бележка", occurred_at: "2026-06-01T00:00:00Z" },
      { id: "a2", contact_id: "c1", activity_type: "email_sent", title: "Имейл", occurred_at: "2026-06-05T00:00:00Z" },
    ],
    invoices: [{ id: "i1", contact_id: "c1", invoice_number: "F-1", status: "paid", issue_date: "2026-06-01", created_at: "2026-06-01T00:00:00Z" }],
    payments: [{ id: "p1", contact_id: "c1", amount: 100, match_status: "matched", paid_at: "2026-06-02", created_at: "2026-06-02T00:00:00Z" }],
    recurring_services: [{ id: "r1", contact_id: "c1", service_type: "gps", active: true, created_at: "2026-06-01T00:00:00Z" }],
  });
}

describe("listContacts", () => {
  it("searches name/email/phone/company and filters by stage", async () => {
    seedContacts();
    const byPhone = await listContacts({ q: "0888111", limit: 50, offset: 0 });
    expect(byPhone.items.map((c) => c.id)).toEqual(["c1"]);
    const leads = await listContacts({ stage: ["lead"], limit: 50, offset: 0 });
    expect(leads.items.map((c) => c.id)).toEqual(["c2"]);
  });

  it("sorts by updated_at descending", async () => {
    seedContacts();
    const r = await listContacts({ limit: 50, offset: 0 });
    expect(r.items.map((c) => c.id)).toEqual(["c2", "c1"]);
  });
});

describe("getContactProfile", () => {
  it("returns the contact with activities, invoices, payments and recurring services", async () => {
    seedContacts();
    const r = await getContactProfile("c1");
    expect(r.error).toBeNull();
    expect(r.contact?.id).toBe("c1");
    expect(r.activities.map((a) => a.id)).toEqual(["a2", "a1"]); // occurred_at desc
    expect(r.invoices).toHaveLength(1);
    expect(r.payments).toHaveLength(1);
    expect(r.recurring_services).toHaveLength(1);
  });

  it("errors cleanly when the contact does not exist", async () => {
    seedContacts();
    const r = await getContactProfile("missing");
    expect(r.contact).toBeNull();
    expect(r.error).toBe("contact not found");
  });
});

// ── журнал на автоматизациите ──────────────────────────────────────────────

describe("listAutomationEvents", () => {
  it("filters by type, status and since", async () => {
    h.fake = createFakeSupabase({
      automation_events: [
        { id: "ev1", event_type: "expense_recorded", status: "success", summary: "x", created_at: "2026-06-01T00:00:00Z" },
        { id: "ev2", event_type: "invoice_upserted", status: "failed", summary: "y", created_at: "2026-06-08T00:00:00Z" },
        { id: "ev3", event_type: "expense_recorded", status: "success", summary: "z", created_at: "2026-06-10T00:00:00Z" },
      ],
    });
    const r = await listAutomationEvents({ event_type: ["expense_recorded"], since: "2026-06-05", limit: 50, offset: 0 });
    expect(r.items.map((e) => e.id)).toEqual(["ev3"]);
    const failed = await listAutomationEvents({ status: ["failed"], limit: 50, offset: 0 });
    expect(failed.items.map((e) => e.id)).toEqual(["ev2"]);
  });
});

// ── абонаменти ─────────────────────────────────────────────────────────────

describe("listRecurringServices", () => {
  it("filters by service_type and active flag", async () => {
    h.fake = createFakeSupabase({
      recurring_services: [
        { id: "r1", contact_id: "c1", service_type: "gps", active: true, excluded_from_auto_send: false, created_at: "2026-06-01T00:00:00Z" },
        { id: "r2", contact_id: "c2", service_type: "gps", active: false, excluded_from_auto_send: false, created_at: "2026-06-02T00:00:00Z" },
        { id: "r3", contact_id: "c3", service_type: "crm", active: true, excluded_from_auto_send: true, created_at: "2026-06-03T00:00:00Z" },
      ],
    });
    const r = await listRecurringServices({ service_type: ["gps"], active: true, limit: 50, offset: 0 });
    expect(r.items.map((s) => s.id)).toEqual(["r1"]);
  });
});

// ── resolve на ръчна проверка ──────────────────────────────────────────────

describe("resolveManualReviewItem", () => {
  it("resolves an item, stamps resolved_at and appends the note", async () => {
    h.fake = createFakeSupabase({
      manual_review_items: [
        { id: "m1", title: "Неясно плащане", description: "Първоначално описание", status: "needs_user", created_at: "2026-06-01T00:00:00Z", resolved_at: null },
      ],
    });
    const r = await resolveManualReviewItem({ id: "m1", status: "resolved", note: "Плащането е от Иван за F-100" });
    expect(r.error).toBeNull();
    const row = h.fake.store.manual_review_items[0] as { status: string; resolved_at: string | null; description: string };
    expect(row.status).toBe("resolved");
    expect(row.resolved_at).toBeTruthy();
    expect(row.description).toContain("Първоначално описание");
    expect(row.description).toContain("Плащането е от Иван за F-100");
  });

  it("accepts ignored as terminal status", async () => {
    h.fake = createFakeSupabase({
      manual_review_items: [{ id: "m2", title: "x", description: null, status: "open", created_at: "2026-06-01T00:00:00Z", resolved_at: null }],
    });
    const r = await resolveManualReviewItem({ id: "m2", status: "ignored" });
    expect(r.error).toBeNull();
    expect((h.fake.store.manual_review_items[0] as { status: string }).status).toBe("ignored");
  });

  it("errors when the item is missing", async () => {
    const r = await resolveManualReviewItem({ id: "ghost", status: "resolved" });
    expect(r.error).toBe("item not found");
  });
});
