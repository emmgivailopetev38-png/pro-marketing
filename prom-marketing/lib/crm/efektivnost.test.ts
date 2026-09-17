import { describe, it, expect } from "vitest";
import {
  deltaPct,
  followupSnapshot,
  funnelOf,
  moodMix,
  normalizeActor,
  perDay,
  promiseStats,
  speedOf,
  volumeOf,
  wonDate,
  wonStats,
  workdaysBetween,
  type ActivityLite,
  type ContactLite,
} from "./efektivnost";
import type { PromiseRow } from "@/lib/contacts/dnevnik";

const TEAM = ["Димитър"];

describe("кой е свършил работата", () => {
  it("Ивайло се разпознава под всичките си имена", () => {
    for (const v of ["ivailo", "Ивайло", "emmgivailopetev38@gmail.com", "  Ивайло Петев "]) {
      expect(normalizeActor(v, TEAM)).toEqual({ kind: "owner", name: "Ивайло" });
    }
  });

  it("човек от екипа се разпознава по име", () => {
    expect(normalizeActor("Димитър", TEAM)).toEqual({ kind: "team", name: "Димитър" });
  });

  it("всичко останало е автоматика, включително непознато име", () => {
    for (const v of ["hermes", "lead_sequence", "meta_webhook", "claude", null, "", "нов-бот-2027"]) {
      expect(normalizeActor(v, TEAM).kind).toBe("auto");
    }
  });
});

describe("обем", () => {
  const acts: ActivityLite[] = [
    { contact_id: "a", activity_type: "call", occurred_at: "2026-09-15T08:00:00Z", created_by: "Ивайло" },
    { contact_id: "a", activity_type: "call", occurred_at: "2026-09-15T09:00:00Z", created_by: "Ивайло", metadata: { kind: "dnevnik" } },
    { contact_id: "b", activity_type: "meeting", occurred_at: "2026-09-15T10:00:00Z", created_by: "Ивайло" },
    { contact_id: "c", activity_type: "viber_sent", occurred_at: "2026-09-15T11:00:00Z", created_by: "Ивайло" },
    { contact_id: "d", activity_type: "email_sent", occurred_at: "2026-09-15T12:00:00Z", created_by: "Ивайло" },
    { contact_id: "e", activity_type: "note", occurred_at: "2026-09-15T13:00:00Z", created_by: "Ивайло" },
  ];

  it("брои разговори, срещи, изпратено и различни ДОКОСНАТИ хора", () => {
    // „d“ е получил само имейл — изпратено писмо не е чуване, затова хората са 3.
    expect(volumeOf(acts)).toEqual({ calls: 3, meetings: 1, sent: 1, diary: 1, people: 3 });
  });

  it("промяната спрямо предходния период", () => {
    expect(deltaPct(12, 8)).toBe(50);
    expect(deltaPct(6, 12)).toBe(-50);
    expect(deltaPct(5, 0)).toBeNull();
    expect(deltaPct(0, 0)).toBe(0);
  });
});

describe("скорост до първо докосване", () => {
  const leads: ContactLite[] = ["a", "b", "c", "d"].map((id) => ({
    id,
    stage: "lead",
    created_at: "2026-09-15T08:00:00Z",
    updated_at: "2026-09-15T08:00:00Z",
    deal_value_eur: null,
    next_followup_at: null,
    last_heard_from_at: null,
  }));

  it("медиана, до час и до денонощие; недокоснатите се броят отделно", () => {
    const touches = new Map([
      ["a", "2026-09-15T08:30:00Z"], // 30 мин
      ["b", "2026-09-15T12:00:00Z"], // 4 ч
      ["c", "2026-09-17T08:00:00Z"], // 48 ч
    ]);
    expect(speedOf(leads, touches)).toEqual({
      leads: 4,
      touched: 3,
      untouched: 1,
      within1h: 1,
      within24h: 2,
      medianMinutes: 240,
    });
  });

  it("без нито едно докосване медианата е null, не нула", () => {
    expect(speedOf(leads, new Map()).medianMinutes).toBeNull();
  });
});

describe("обещания", () => {
  const p = (over: Partial<PromiseRow>): PromiseRow => ({
    id: Math.random().toString(),
    contact_id: "c",
    who: "us",
    text: "оферта",
    due_at: null,
    done_at: null,
    activity_id: null,
    created_by: "Ивайло",
    created_at: "2026-09-10T08:00:00Z",
    ...over,
  });
  const now = new Date("2026-09-17T09:00:00Z");

  it("навреме е по календарен ден — обещано за петък, направено в петък вечер, е навреме", () => {
    const s = promiseStats(
      [
        p({ due_at: "2026-09-12T07:00:00Z", done_at: "2026-09-12T18:30:00Z" }),
        p({ due_at: "2026-09-12T07:00:00Z", done_at: "2026-09-15T08:00:00Z" }),
        p({ due_at: "2026-09-16T07:00:00Z" }),
        p({ due_at: "2026-09-25T07:00:00Z" }),
        p({ done_at: "2026-09-13T08:00:00Z" }),
      ],
      now
    );
    expect(s).toEqual({ total: 5, done: 3, onTime: 1, late: 1, open: 2, overdue: 1, onTimePct: 50 });
  });

  it("без приключени със срок няма процент", () => {
    expect(promiseStats([p({ due_at: "2026-09-25T07:00:00Z" })], now).onTimePct).toBeNull();
  });
});

describe("напомнянията в момента", () => {
  const c = (over: Partial<ContactLite>): ContactLite => ({
    id: Math.random().toString(),
    stage: "contacted",
    created_at: "2026-09-01T08:00:00Z",
    updated_at: "2026-09-01T08:00:00Z",
    deal_value_eur: null,
    next_followup_at: null,
    last_heard_from_at: null,
    ...over,
  });
  const now = new Date("2026-09-17T09:00:00Z");

  it("чут след деня на напомнянето не е просрочен; спечелените и загубените не се броят", () => {
    const s = followupSnapshot(
      [
        c({ next_followup_at: "2026-09-10T07:00:00Z" }),
        c({ next_followup_at: "2026-09-10T07:00:00Z", last_heard_from_at: "2026-09-11T10:00:00Z" }),
        c({ next_followup_at: "2026-09-17T07:00:00Z" }),
        c({ next_followup_at: "2026-09-20T07:00:00Z" }),
        c({ next_followup_at: "2026-09-01T07:00:00Z", stage: "won" }),
        c({ next_followup_at: "2026-09-01T07:00:00Z", stage: "lost" }),
      ],
      now
    );
    expect(s).toEqual({ dueToday: 1, overdue: 1, future: 1 });
  });
});

describe("фуния и резултат", () => {
  it("брои се докъде е стигнал човекът, не къде седи сега", () => {
    const f = funnelOf([
      { stage: "lead" },
      { stage: "contacted" },
      { stage: "won" },
      { stage: "lost", maxStage: "offer_sent" },
    ]);
    const by = Object.fromEntries(f.map((s) => [s.stage, s.reached]));
    expect(by).toMatchObject({ lead: 4, contacted: 3, discovery: 2, offer_sent: 2, negotiating: 1, won: 1 });
    expect(f.find((s) => s.stage === "contacted")?.fromPrev).toBe(75);
    expect(f[0].fromPrev).toBeNull();
  });

  it("спечелените: брой, сума, средно и медиана дни", () => {
    const won: ContactLite[] = [
      { id: "1", stage: "won", created_at: "2026-08-01T00:00:00Z", updated_at: "2026-08-11T00:00:00Z", deal_value_eur: 1000, next_followup_at: null, last_heard_from_at: null },
      { id: "2", stage: "won", created_at: "2026-08-01T00:00:00Z", updated_at: "2026-08-21T00:00:00Z", deal_value_eur: 500, next_followup_at: null, last_heard_from_at: null },
      { id: "3", stage: "won", created_at: "2026-08-01T00:00:00Z", updated_at: "2026-08-31T00:00:00Z", deal_value_eur: null, next_followup_at: null, last_heard_from_at: null },
    ];
    // без won_at дните не се броят — остава само сумата и броят
    expect(wonStats(won)).toEqual({ count: 3, sumEur: 1500, avgEur: 500, medianDays: null, estimated: 3 });
    expect(wonStats(won.map((c) => ({ ...c, won_at: c.updated_at })))).toMatchObject({ medianDays: 20, estimated: 0 });
    expect(wonStats([])).toEqual({ count: 0, sumEur: 0, avgEur: null, medianDays: null, estimated: 0 });
  });

  it("настроенията се подреждат по брой", () => {
    const mk = (mood: string | null): ContactLite => ({
      id: Math.random().toString(),
      stage: "contacted",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
      deal_value_eur: null,
      mood,
      next_followup_at: null,
      last_heard_from_at: null,
    });
    expect(moodMix([mk("pozitiven"), mk("zapalen"), mk("pozitiven"), mk(null)])).toEqual([
      { mood: "pozitiven", count: 2 },
      { mood: "zapalen", count: 1 },
    ]);
  });
});

describe("календар", () => {
  it("всеки ден от периода е в редицата, дори празният", () => {
    const days = perDay(
      [{ contact_id: "a", activity_type: "call", occurred_at: "2026-09-15T09:00:00Z", created_by: "Ивайло" }],
      new Date("2026-09-14T09:00:00Z"),
      new Date("2026-09-16T09:00:00Z")
    );
    expect(days).toEqual([
      { day: "2026-09-14", n: 0 },
      { day: "2026-09-15", n: 1 },
      { day: "2026-09-16", n: 0 },
    ]);
  });

  it("работните дни без събота и неделя", () => {
    // понеделник 14.09 → неделя 20.09 = 5 работни
    expect(workdaysBetween(new Date("2026-09-14T09:00:00Z"), new Date("2026-09-20T09:00:00Z"))).toBe(5);
  });
});

describe("кога наистина е спечелен", () => {
  const a = (type: string, at: string, meta?: Record<string, unknown>): ActivityLite => ({
    contact_id: "c",
    activity_type: type,
    occurred_at: at,
    created_by: "Ивайло",
    metadata: meta ?? null,
  });

  it("взима най-ранното от смяна на етапа, договор или плащане", () => {
    expect(
      wonDate([a("note", "2026-08-01T00:00:00Z"), a("payment_received", "2026-09-05T00:00:00Z"), a("contract_signed", "2026-09-01T00:00:00Z")])
    ).toBe("2026-09-01T00:00:00Z");
    expect(wonDate([a("stage_change", "2026-08-20T00:00:00Z", { to: "won" })])).toBe("2026-08-20T00:00:00Z");
  });

  it("без следа връща null — контактът не се брои за периода", () => {
    expect(wonDate([a("note", "2026-08-01T00:00:00Z"), a("call", "2026-08-02T00:00:00Z")])).toBeNull();
    expect(wonDate([])).toBeNull();
  });

  it("дните до клиент се мерят от won_at, не от updated_at", () => {
    const c = {
      id: "1",
      stage: "won",
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-09-17T00:00:00Z",
      deal_value_eur: 800,
      next_followup_at: null,
      last_heard_from_at: null,
      won_at: "2026-08-21T00:00:00Z",
    };
    expect(wonStats([c]).medianDays).toBe(20);
  });
});
