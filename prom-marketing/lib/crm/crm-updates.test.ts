import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeSupabase, resetFakeIds, type FakeSupabase } from "./fake-supabase";

const h = vi.hoisted(() => ({ fake: null as unknown as FakeSupabase }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => h.fake,
}));

import { updateContact, setInvoiceStatus, updateRecurringService } from "./repository";

beforeEach(() => {
  resetFakeIds();
  h.fake = createFakeSupabase();
});

describe("updateContact (PATCH ръката на агентите)", () => {
  it("обновява само подадените полета и пази останалите", async () => {
    h.fake = createFakeSupabase({
      contacts: [{ id: "c1", full_name: "Иван", company: null, phone: "+359888111222", notes: "стара бележка", stage: "lead" }],
    });
    const r = await updateContact({ id: "c1", company: "Иванови ООД", deal_value_eur: 1500 });
    expect(r.error).toBeNull();
    const c = h.fake.store.contacts[0] as Record<string, unknown>;
    expect(c.company).toBe("Иванови ООД");
    expect(c.deal_value_eur).toBe(1500);
    expect(c.full_name).toBe("Иван"); // непипнато
    expect(c.phone).toBe("+359888111222"); // непипнато
  });

  it("нормализира имейла до lowercase", async () => {
    h.fake = createFakeSupabase({ contacts: [{ id: "c1", email: "old@x.bg" }] });
    await updateContact({ id: "c1", email: "NEW@Firma.BG" });
    expect((h.fake.store.contacts[0] as { email: string }).email).toBe("new@firma.bg");
  });

  it("логва активност за одитната следа", async () => {
    h.fake = createFakeSupabase({ contacts: [{ id: "c1", full_name: "Иван" }] });
    await updateContact({ id: "c1", stage: "client" });
    expect(h.fake.store.contact_activities).toHaveLength(1);
    expect((h.fake.store.contact_activities[0] as { title: string }).title).toContain("stage");
  });

  it("връща грешка при липсващ контакт", async () => {
    const r = await updateContact({ id: "ghost", company: "X" });
    expect(r.error).toBe("contact not found");
  });
});

describe("setInvoiceStatus (корекции по фактури)", () => {
  it("сменя статуса и логва automation event", async () => {
    h.fake = createFakeSupabase({
      invoices: [{ id: "i1", invoice_number: "F-1", status: "sent", contact_id: "c1" }],
    });
    const r = await setInvoiceStatus({ id: "i1", status: "cancelled", reason: "дубликат на F-2" });
    expect(r.error).toBeNull();
    const inv = h.fake.store.invoices[0] as Record<string, unknown>;
    expect(inv.status).toBe("cancelled");
    expect(String(inv.notes)).toContain("дубликат на F-2");
    expect(h.fake.store.automation_events).toHaveLength(1);
  });

  it("отказва невалиден статус", async () => {
    h.fake = createFakeSupabase({ invoices: [{ id: "i1", status: "sent" }] });
    const r = await setInvoiceStatus({ id: "i1", status: "kaboom" as never });
    expect(r.error).toBe("invalid status");
  });

  it("връща грешка при липсваща фактура", async () => {
    const r = await setInvoiceStatus({ id: "ghost", status: "cancelled" });
    expect(r.error).toBe("invoice not found");
  });
});

describe("updateRecurringService (пауза/изключване на абонамент)", () => {
  it("сменя active и excluded_from_auto_send", async () => {
    h.fake = createFakeSupabase({
      recurring_services: [{ id: "r1", contact_id: "c1", service_type: "gps", active: true, excluded_from_auto_send: false }],
    });
    const r = await updateRecurringService({ id: "r1", active: false, excluded_from_auto_send: true, excluded_reason: "клиентът приключи" });
    expect(r.error).toBeNull();
    const row = h.fake.store.recurring_services[0] as Record<string, unknown>;
    expect(row.active).toBe(false);
    expect(row.excluded_from_auto_send).toBe(true);
    expect(row.excluded_reason).toBe("клиентът приключи");
  });

  it("обновява сумата без да пипа флаговете", async () => {
    h.fake = createFakeSupabase({
      recurring_services: [{ id: "r1", service_type: "gps", active: true, amount: 40 }],
    });
    await updateRecurringService({ id: "r1", amount: 48 });
    const row = h.fake.store.recurring_services[0] as Record<string, unknown>;
    expect(row.amount).toBe(48);
    expect(row.active).toBe(true);
  });

  it("връща грешка при липсващ абонамент", async () => {
    const r = await updateRecurringService({ id: "ghost", active: false });
    expect(r.error).toBe("recurring service not found");
  });
});
