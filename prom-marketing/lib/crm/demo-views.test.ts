import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeSupabase, resetFakeIds, type FakeSupabase } from "./fake-supabase";

const h = vi.hoisted(() => ({ fake: null as unknown as FakeSupabase, tg: [] as unknown[][] }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => h.fake }));
vi.mock("@/lib/notifications/telegram", () => ({
  tgNotify: {
    demoViewed: (...a: unknown[]) => {
      h.tg.push(a);
      return Promise.resolve(true);
    },
  },
}));

import { demoKeyRange, demoPageLabel, isDemoPath, recordDemoView } from "./demo-views";

const ID = "27b44907-5643-4674-bda0-93ebf7fdacdf";
const MORNING = new Date("2026-10-20T07:00:00Z");

beforeEach(() => {
  resetFakeIds();
  h.tg = [];
  h.fake = createFakeSupabase({ contacts: [{ id: ID, full_name: "Стефан Христов" }, { id: "9f000000-0000-0000-0000-000000000001" }] });
});

const views = () => h.fake.store.contact_activities?.filter((a) => a.activity_type === "demo_view") ?? [];

describe("ключът и страниците", () => {
  it("8 hex знака → граници на uuid-а; друго → нищо", () => {
    expect(demoKeyRange("27B44907")).toEqual({
      lo: "27b44907-0000-0000-0000-000000000000",
      hi: "27b44907-ffff-ffff-ffff-ffffffffffff",
    });
    expect(demoKeyRange("27b4490")).toBeNull();
    expect(demoKeyRange("27b4490g")).toBeNull();
  });

  it("имената на страниците", () => {
    expect(demoPageLabel("/demo")).toBe("голямото демо");
    expect(demoPageLabel("/demo/b2b")).toBe("B2B и фирми");
    expect(demoPageLabel("/demo/hotel")).toBe("Хотел / СПА");
    expect(isDemoPath("/demo/b2b")).toBe(true);
    expect(isDemoPath("/admin")).toBe(false);
    expect(isDemoPath("/demo/../admin")).toBe(false);
  });
});

describe("recordDemoView", () => {
  it("първото влизане за деня → „👀 Отвори демото“ в картона + Telegram", async () => {
    const r = await recordDemoView("27b44907", "/demo", MORNING);
    expect(r.logged).toBe(true);
    expect(views()).toHaveLength(1);
    const v = views()[0] as Record<string, unknown>;
    expect(v.contact_id).toBe(ID);
    expect(v.title).toBe("👀 Отвори демото от писмото (голямото демо)");
    expect((v.metadata as Record<string, unknown>).day).toBe("2026-10-20");
    expect(h.tg).toEqual([["Стефан Христов", "голямото демо", ID]]);
  });

  it("същият ден: нова страница се добавя към същия ред, същата — нищо", async () => {
    await recordDemoView("27b44907", "/demo", MORNING);
    await recordDemoView("27b44907", "/demo/b2b", new Date("2026-10-20T09:00:00Z"));
    const again = await recordDemoView("27b44907", "/demo/b2b", new Date("2026-10-20T10:00:00Z"));
    expect(again.reason).toBe("already_today");
    expect(views()).toHaveLength(1);
    expect((views()[0].metadata as { pages: string[] }).pages).toEqual(["голямото демо", "B2B и фирми"]);
    expect(h.tg).toHaveLength(1);
  });

  it("на следващия ден — нов ред", async () => {
    await recordDemoView("27b44907", "/demo", MORNING);
    await recordDemoView("27b44907", "/demo", new Date("2026-10-21T07:00:00Z"));
    expect(views()).toHaveLength(2);
  });

  it("непознат ключ или два картона с едно начало — нищо не се пише", async () => {
    expect((await recordDemoView("deadbeef", "/demo", MORNING)).reason).toBe("unknown_key");
    h.fake.store.contacts.push({ id: "27b44907-0000-0000-0000-000000000002" });
    expect((await recordDemoView("27b44907", "/demo", MORNING)).reason).toBe("ambiguous");
    expect(views()).toHaveLength(0);
  });
});
