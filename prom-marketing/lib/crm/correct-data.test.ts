import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeSupabase, resetFakeIds, type FakeSupabase } from "./fake-supabase";

const h = vi.hoisted(() => ({ fake: null as unknown as FakeSupabase }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => h.fake,
}));

import { markOfferViewed, setOfferStatus, mergeContacts, upsertOffer } from "./repository";

beforeEach(() => {
  resetFakeIds();
  h.fake = createFakeSupabase();
});

// ── офертата сама става „Видяна" ────────────────────────────────────────────

describe("markOfferViewed (view beacon)", () => {
  it("маркира изпратена оферта като видяна по path от URL-а", async () => {
    h.fake = createFakeSupabase({
      offers: [
        { id: "o1", title: "Теодор", url: "https://promarketing.pw/oferta/teodor", status: "sent", contact_id: "c1" },
      ],
      contacts: [{ id: "c1", full_name: "Теодор" }],
    });
    const r = await markOfferViewed("/oferta/teodor");
    expect(r.marked).toBe(true);
    expect((h.fake.store.offers[0] as { status: string }).status).toBe("viewed");
    // одитна следа в профила
    expect(h.fake.store.contact_activities).toHaveLength(1);
  });

  it("НЕ деградира приета оферта обратно към видяна", async () => {
    h.fake = createFakeSupabase({
      offers: [{ id: "o1", title: "X", url: "https://promarketing.pw/oferta/teodor", status: "accepted", contact_id: null }],
    });
    const r = await markOfferViewed("/oferta/teodor");
    expect(r.marked).toBe(false);
    expect((h.fake.store.offers[0] as { status: string }).status).toBe("accepted");
  });

  it("нищо не прави при непознат path", async () => {
    const r = await markOfferViewed("/oferta/nqma-takava");
    expect(r.marked).toBe(false);
  });
});

// ── приета оферта → проект + ЧЕРНОВА фактура ───────────────────────────────

describe("setOfferStatus accepted → чернова фактура", () => {
  it("създава draft фактура с връзки offer_id/project_id и сумите от офертата", async () => {
    h.fake = createFakeSupabase({ contacts: [{ id: "c1", email: "client@firma.bg" }] });
    await upsertOffer({
      client_email: "client@firma.bg",
      title: "AI пакет",
      amount_net: 1000,
      vat_amount: 200,
      amount_gross: 1200,
      currency: "EUR",
      source: "manual",
      dedupe_key: "off-1",
    });
    const offerId = (h.fake.store.offers[0] as { id: string }).id;

    const r = await setOfferStatus({ id: offerId, status: "accepted" });
    expect(r.error).toBeNull();
    expect(r.project_id).toBeTruthy();
    expect(r.invoice_id).toBeTruthy();

    const inv = h.fake.store.invoices[0] as Record<string, unknown>;
    expect(inv.status).toBe("draft");
    expect(inv.contact_id).toBe("c1");
    expect(inv.offer_id).toBe(offerId);
    expect(inv.project_id).toBe(r.project_id);
    expect(inv.amount_gross).toBe(1200);
  });

  it("повторно приемане НЕ прави втора чернова", async () => {
    await upsertOffer({ title: "X", currency: "EUR", source: "manual", dedupe_key: "off-2" });
    const offerId = (h.fake.store.offers[0] as { id: string }).id;
    await setOfferStatus({ id: offerId, status: "accepted" });
    await setOfferStatus({ id: offerId, status: "accepted" });
    expect(h.fake.store.invoices).toHaveLength(1);
    expect(h.fake.store.projects).toHaveLength(1);
  });
});

// ── merge на дубликати ──────────────────────────────────────────────────────

describe("mergeContacts", () => {
  function seedDup() {
    h.fake = createFakeSupabase({
      contacts: [
        { id: "keep", full_name: "Иван Иванов", email: "ivan@a.bg", phone: null, company: null, notes: "оригинал" },
        { id: "dup", full_name: "Ivan I.", email: "ivan.dup@a.bg", phone: "+359888111222", company: "Иванови ООД", notes: "дубъл" },
      ],
      invoices: [{ id: "i1", contact_id: "dup", status: "sent" }],
      payments: [{ id: "p1", contact_id: "dup", amount: 100, match_status: "matched" }],
      contact_activities: [{ id: "a1", contact_id: "dup", activity_type: "note", title: "стара" }],
      offers: [{ id: "o1", contact_id: "dup", title: "Оферта", status: "sent" }],
      manual_review_items: [{ id: "m1", related_contact_id: "dup", type: "missing_contact", title: "x", status: "open" }],
    });
  }

  it("премества всички връзки към оцеляващия и трие дубликата", async () => {
    seedDup();
    const r = await mergeContacts({ survivor_id: "keep", duplicate_id: "dup" });
    expect(r.error).toBeNull();
    expect((h.fake.store.invoices[0] as { contact_id: string }).contact_id).toBe("keep");
    expect((h.fake.store.payments[0] as { contact_id: string }).contact_id).toBe("keep");
    expect((h.fake.store.offers[0] as { contact_id: string }).contact_id).toBe("keep");
    expect((h.fake.store.manual_review_items[0] as { related_contact_id: string }).related_contact_id).toBe("keep");
    // дубликатът е изтрит, оцеляващият остава
    expect(h.fake.store.contacts).toHaveLength(1);
    expect((h.fake.store.contacts[0] as { id: string }).id).toBe("keep");
  });

  it("попълва празните полета на оцеляващия от дубликата (без да трие неговите)", async () => {
    seedDup();
    await mergeContacts({ survivor_id: "keep", duplicate_id: "dup" });
    const keep = h.fake.store.contacts[0] as Record<string, unknown>;
    expect(keep.phone).toBe("+359888111222"); // взет от дубликата
    expect(keep.company).toBe("Иванови ООД"); // взет от дубликата
    expect(keep.full_name).toBe("Иван Иванов"); // НЕ е презаписан
    expect(keep.notes).toBe("оригинал"); // НЕ е презаписан
  });

  it("оставя одитна следа като активност на оцеляващия", async () => {
    seedDup();
    await mergeContacts({ survivor_id: "keep", duplicate_id: "dup" });
    const merged = (h.fake.store.contact_activities as Array<{ contact_id: string; title: string }>).filter(
      (a) => a.contact_id === "keep"
    );
    // старата активност на дубликата е преместена + новата merge бележка
    expect(merged.length).toBe(2);
    expect(merged.some((a) => a.title.includes("Слят"))).toBe(true);
  });

  it("отказва merge на контакт със самия себе си и липсващи записи", async () => {
    seedDup();
    expect((await mergeContacts({ survivor_id: "keep", duplicate_id: "keep" })).error).toBe("cannot merge into self");
    expect((await mergeContacts({ survivor_id: "ghost", duplicate_id: "dup" })).error).toBe("survivor not found");
    expect((await mergeContacts({ survivor_id: "keep", duplicate_id: "ghost" })).error).toBe("duplicate not found");
  });
});
