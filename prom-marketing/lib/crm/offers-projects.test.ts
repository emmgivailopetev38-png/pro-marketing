import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeSupabase, resetFakeIds, type FakeSupabase } from "./fake-supabase";

const h = vi.hoisted(() => ({ fake: null as unknown as FakeSupabase }));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => h.fake,
}));

import {
  upsertOffer,
  setOfferStatus,
  upsertProject,
  setProjectStatus,
  setProjectTaskStatus,
  addProjectTask,
} from "./repository";
import { listOffers, listProjects } from "./list-read";

beforeEach(() => {
  resetFakeIds();
  h.fake = createFakeSupabase();
});

describe("upsertOffer", () => {
  it("links the offer to a contact by client_email and logs an activity", async () => {
    h.fake = createFakeSupabase({ contacts: [{ id: "c1", email: "client@firma.bg" }] });
    const r = await upsertOffer({
      client_email: "client@firma.bg",
      title: "AI автоматизация пакет",
      amount_gross: 1200,
      currency: "EUR",
      source: "manual",
    });
    expect(r.error).toBeNull();
    expect(r.created).toBe(true);
    expect(r.contact_id).toBe("c1");
    expect(h.fake.store.offers[0]).toMatchObject({ contact_id: "c1", title: "AI автоматизация пакет", status: "draft" });
    expect(h.fake.store.contact_activities).toHaveLength(1);
  });

  it("is idempotent on dedupe_key", async () => {
    const input = { title: "Оферта X", currency: "EUR", source: "hermes", dedupe_key: "offer:x" };
    const first = await upsertOffer(input);
    const second = await upsertOffer(input);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(h.fake.store.offers).toHaveLength(1);
  });

  it("converts BGN to EUR and preserves the original amount", async () => {
    const r = await upsertOffer({ title: "BGN оферта", amount_gross: 240, currency: "BGN", source: "manual" });
    expect(r.created).toBe(true);
    const o = h.fake.store.offers[0] as { currency: string; amount_gross: number; original_amount: number; original_currency: string };
    expect(o.currency).toBe("EUR");
    expect(o.amount_gross).toBeCloseTo(122.71, 2);
    expect(o.original_amount).toBe(240);
    expect(o.original_currency).toBe("BGN");
  });
});

describe("setOfferStatus", () => {
  it("stamps sent_at when the offer is sent", async () => {
    await upsertOffer({ title: "О", currency: "EUR", source: "manual", dedupe_key: "o1" });
    const id = (h.fake.store.offers[0] as { id: string }).id;
    const r = await setOfferStatus({ id, status: "sent" });
    expect(r.error).toBeNull();
    const o = h.fake.store.offers[0] as { status: string; sent_at: string | null };
    expect(o.status).toBe("sent");
    expect(o.sent_at).toBeTruthy();
  });

  it("creates a project automatically when the offer is accepted", async () => {
    h.fake = createFakeSupabase({ contacts: [{ id: "c1", email: "client@firma.bg" }] });
    await upsertOffer({
      client_email: "client@firma.bg",
      title: "Чатбот за сайта",
      amount_gross: 800,
      currency: "EUR",
      source: "manual",
      dedupe_key: "o2",
    });
    const id = (h.fake.store.offers[0] as { id: string }).id;
    const r = await setOfferStatus({ id, status: "accepted" });
    expect(r.error).toBeNull();
    expect(r.project_id).toBeTruthy();
    const p = h.fake.store.projects[0] as { contact_id: string; offer_id: string; title: string; amount_gross: number; status: string };
    expect(p).toMatchObject({ contact_id: "c1", offer_id: id, title: "Чатбот за сайта", amount_gross: 800, status: "planned" });
    const o = h.fake.store.offers[0] as { accepted_at: string | null };
    expect(o.accepted_at).toBeTruthy();
  });

  it("does not create a second project when accepted twice", async () => {
    await upsertOffer({ title: "О", currency: "EUR", source: "manual", dedupe_key: "o3" });
    const id = (h.fake.store.offers[0] as { id: string }).id;
    const first = await setOfferStatus({ id, status: "accepted" });
    const second = await setOfferStatus({ id, status: "accepted" });
    expect(h.fake.store.projects).toHaveLength(1);
    expect(second.project_id).toBe(first.project_id);
  });

  it("errors when the offer is missing", async () => {
    const r = await setOfferStatus({ id: "ghost", status: "sent" });
    expect(r.error).toBe("offer not found");
  });
});

describe("upsertProject", () => {
  it("creates a project with initial tasks in order", async () => {
    h.fake = createFakeSupabase({ contacts: [{ id: "c1", email: "client@firma.bg" }] });
    const r = await upsertProject({
      client_email: "client@firma.bg",
      title: "Сайт 2050",
      currency: "EUR",
      tasks: [{ title: "Дизайн" }, { title: "Билд" }, { title: "Деплой" }],
    });
    expect(r.error).toBeNull();
    expect(r.created).toBe(true);
    expect(h.fake.store.projects[0]).toMatchObject({ contact_id: "c1", title: "Сайт 2050", status: "planned" });
    const tasks = h.fake.store.project_tasks as Array<{ title: string; sort_order: number; status: string }>;
    expect(tasks.map((t) => t.title)).toEqual(["Дизайн", "Билд", "Деплой"]);
    expect(tasks.map((t) => t.sort_order)).toEqual([0, 1, 2]);
  });

  it("is idempotent on dedupe_key (no duplicate tasks)", async () => {
    const input = { title: "П", currency: "EUR", dedupe_key: "p1", tasks: [{ title: "Т1" }] };
    await upsertProject(input);
    await upsertProject(input);
    expect(h.fake.store.projects).toHaveLength(1);
    expect(h.fake.store.project_tasks).toHaveLength(1);
  });
});

describe("project & task statuses", () => {
  it("stamps done_at on project done and task done", async () => {
    await upsertProject({ title: "П", currency: "EUR", dedupe_key: "p2", tasks: [{ title: "Т" }] });
    const projectId = (h.fake.store.projects[0] as { id: string }).id;
    const taskId = (h.fake.store.project_tasks[0] as { id: string }).id;

    const t = await setProjectTaskStatus({ id: taskId, status: "done" });
    expect(t.error).toBeNull();
    expect((h.fake.store.project_tasks[0] as { done_at: string | null }).done_at).toBeTruthy();

    const p = await setProjectStatus({ id: projectId, status: "done" });
    expect(p.error).toBeNull();
    expect((h.fake.store.projects[0] as { done_at: string | null }).done_at).toBeTruthy();
  });
});

describe("addProjectTask", () => {
  it("appends a task with the next sort_order", async () => {
    await upsertProject({ title: "П", currency: "EUR", dedupe_key: "p3", tasks: [{ title: "Първа" }] });
    const projectId = (h.fake.store.projects[0] as { id: string }).id;
    const r = await addProjectTask({ project_id: projectId, title: "Втора" });
    expect(r.error).toBeNull();
    const tasks = h.fake.store.project_tasks as Array<{ title: string; sort_order: number }>;
    expect(tasks.map((t) => t.title)).toEqual(["Първа", "Втора"]);
    expect(tasks[1].sort_order).toBe(1);
  });

  it("errors when the project is missing", async () => {
    const r = await addProjectTask({ project_id: "11111111-1111-4111-8111-111111111111", title: "X" });
    expect(r.error).toBe("project not found");
  });
});

describe("listOffers / listProjects", () => {
  it("filters offers by status and searches the title", async () => {
    h.fake = createFakeSupabase({
      offers: [
        { id: "o1", title: "Чатбот", status: "sent", contact_id: "c1", created_at: "2026-06-01T00:00:00Z" },
        { id: "o2", title: "GPS пакет", status: "accepted", contact_id: "c2", created_at: "2026-06-05T00:00:00Z" },
      ],
    });
    const sent = await listOffers({ status: ["sent"], limit: 50, offset: 0 });
    expect(sent.items.map((o) => o.id)).toEqual(["o1"]);
    const byTitle = await listOffers({ q: "gps", limit: 50, offset: 0 });
    expect(byTitle.items.map((o) => o.id)).toEqual(["o2"]);
  });

  it("filters projects by status and contact", async () => {
    h.fake = createFakeSupabase({
      projects: [
        { id: "p1", title: "Сайт", status: "in_progress", contact_id: "c1", created_at: "2026-06-01T00:00:00Z" },
        { id: "p2", title: "CRM", status: "done", contact_id: "c1", created_at: "2026-06-03T00:00:00Z" },
      ],
    });
    const active = await listProjects({ status: ["in_progress"], contact_id: "c1", limit: 50, offset: 0 });
    expect(active.items.map((p) => p.id)).toEqual(["p1"]);
  });
});
