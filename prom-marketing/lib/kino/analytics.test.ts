import { describe, it, expect } from "vitest";
import { KINO } from "./config";
import {
  totalMinutes,
  watchedRatio,
  reachedMilestones,
  freshMilestones,
  milestoneTitle,
  retentionByMinute,
  retentionByChapter,
  reactionsByMinute,
  callLists,
  moneyKey,
  uniqueBy,
  findAbandoned,
  byHoursFirst,
  type WatchRow,
} from "./analytics";

const row = (contact_id: string, minutes: number[], max_pos = Math.max(0, ...minutes) * 60): WatchRow => ({
  contact_id,
  minutes,
  max_pos,
  watched_seconds: minutes.length * 60,
  first_mode: "premiere",
  modes: ["premiere"],
  milestones: [],
  first_seen_at: null,
  last_seen_at: null,
});

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe("процентът е по изгледани минути, не по позиция", () => {
  it("файлът (филмът + въпросите + подаръкът) е 47 минути (46:35)", () => {
    expect(totalMinutes(KINO.film.durationSec)).toBe(47);
  });

  it("закъснелият с 30 минути, гледал до края, не е „изгледал 70 %“", () => {
    const late = { minutes: 14, maxPos: KINO.film.durationSec };
    expect(watchedRatio(late.minutes)).toBeLessThan(0.5);
    const m = reachedMilestones(late);
    expect(m).toContain("end");
    expect(m).not.toContain("p50");
  });

  it("гледалият половината стига p25 и p50, но не p75", () => {
    const m = reachedMilestones({ minutes: 26, maxPos: 26 * 60 });
    expect(m).toEqual(["entered", "p25", "p50"]);
  });

  it("поканата и краят са по най-далечната позиция", () => {
    const offerStart = KINO.film.chapters[11].startSec;
    expect(reachedMilestones({ minutes: 40, maxPos: offerStart })).toContain("offer_chapter");
    expect(reachedMilestones({ minutes: 40, maxPos: offerStart })).not.toContain("end");
    // бутоните (11.4) още не са краят — краят е „Не бързайте“ (againAt)
    expect(reachedMilestones({ minutes: 42, maxPos: KINO.film.offerAtSec })).not.toContain("end");
    expect(reachedMilestones({ minutes: 44, maxPos: KINO.film.againAtSec })).toContain("end");
  });
});

describe("freshMilestones", () => {
  it("връща само недописаните — и само познатите", () => {
    expect(freshMilestones(["entered", "p25", "p50"], ["entered"])).toEqual(["p25", "p50"]);
    expect(freshMilestones(["entered", "нещо"], [])).toEqual(["entered"]);
    expect(freshMilestones(["entered"], ["entered"])).toEqual([]);
  });

  it("заглавията за CRM-а", () => {
    expect(milestoneTitle("entered")).toContain("Влезе в залата");
    expect(milestoneTitle("end")).toContain("целия филм");
  });

  it("само отворена страница (без изгледана минута) не е „влезе“", () => {
    expect(reachedMilestones({ minutes: 0, maxPos: 0 })).toEqual([]);
    expect(reachedMilestones({ minutes: 1, maxPos: 30 })).toContain("entered");
  });
});

describe("retentionByMinute", () => {
  it("брои всеки човек веднъж на минута, без излизане извън филма", () => {
    const out = retentionByMinute([row("a", [0, 1, 1, 2]), row("b", [1, 2, 99, -1])], 4 * 60);
    expect(out).toEqual([1, 2, 2, 0]);
  });
});

describe("retentionByChapter", () => {
  it("всяка глава — колко от влезлите са видели поне минута от нея", () => {
    const rows = [row("a", range(0, 43)), row("b", range(0, 9)), row("c", [])];
    const ch = retentionByChapter(rows);
    expect(ch).toHaveLength(12);
    expect(ch[0]).toMatchObject({ n: 0, viewers: 2, pct: 1 });
    // „Правец“ започва в 9:30 → минута 9 е и в нея: „b“ още е там.
    expect(ch[3]).toMatchObject({ n: 3, viewers: 2 });
    expect(ch[11]).toMatchObject({ n: 11, viewers: 1, pct: 0.5 });
  });
});

describe("reactionsByMinute", () => {
  it("групира по минути и пропуска непознатото", () => {
    const out = reactionsByMinute([
      { minute: 3, value: "🍿" },
      { minute: 3, value: "😂" },
      { minute: 3, value: "😂" },
      { minute: 1, value: "🔥" },
      { minute: 2, value: "👎" },
      { minute: null, value: "🍿" },
    ]);
    expect(out.map((r) => r.minute)).toEqual([1, 3]);
    expect(out[1]).toMatchObject({ total: 3, counts: { "🍿": 1, "😂": 2, "😢": 0, "🔥": 0 } });
  });
});

describe("callLists", () => {
  it("ден −1: собствениците и управителите, без купилите и без повторения", () => {
    const { dayBefore } = callLists({
      registrations: [
        { contact_id: "a", role: "owner" },
        { contact_id: "a", role: "owner" },
        { contact_id: "b", role: "employee" },
        { contact_id: "c", role: "manager" },
        { contact_id: "d", role: "owner" },
      ],
      watches: [],
      buyers: new Set(["d"]),
    });
    expect(dayBefore.map((p) => p.contact_id)).toEqual(["a", "c"]);
  });

  it("след филма: изгледалите ≥ 50 % без покупка, най-гледалите първи", () => {
    const { warm } = callLists({
      registrations: [],
      watches: [row("a", range(0, 25)), row("b", range(0, 51)), row("c", range(0, 10)), row("d", range(0, 51))],
      buyers: new Set(["d"]),
    });
    expect(warm.map((p) => p.contact_id)).toEqual(["b", "a"]);
    expect(warm[0].ratio).toBe(1);
  });
});

describe("парите — по едно на сесия/фактура", () => {
  it("вноската се познава по фактурата, капарото/плащането по сесията", () => {
    expect(moneyKey({ id: "a", metadata: { invoice_id: "in_1", session_id: "cs_1" } })).toBe("inv:in_1");
    expect(moneyKey({ id: "b", metadata: { session_id: "cs_2" } })).toBe("ses:cs_2");
    expect(moneyKey({ id: "c", metadata: null })).toBe("act:c");
  });

  it("двоен запис за същата сесия не удвоява сумата", () => {
    const rows = [
      { id: "1", metadata: { session_id: "cs_1", amount_eur: 100 } },
      { id: "2", metadata: { session_id: "cs_1", amount_eur: 100 } },
      { id: "3", metadata: { session_id: "cs_2", amount_eur: 100 } },
    ];
    const sum = uniqueBy(rows, moneyKey).reduce((s, r) => s + r.metadata.amount_eur, 0);
    expect(sum).toBe(200);
  });
});

describe("изоставеното плащане", () => {
  const T0 = Date.parse("2026-10-16T20:15:00+03:00");
  const at = (min: number) => new Date(T0 + min * 60_000).toISOString();
  const act = (contact_id: string, activity_type: string, min: number, metadata: Record<string, unknown> = {}) => ({
    contact_id,
    activity_type,
    occurred_at: at(min),
    metadata,
  });

  it("натисна „Влизам в потока“, 15 минути без плащане → обаждане", () => {
    const rows = [act("a", "kino_click", 0, { button: "stream" })];
    expect(findAbandoned(rows, T0 + 14 * 60_000)).toEqual([]);
    const r = findAbandoned(rows, T0 + 15 * 60_000);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ contactId: "a", wants: "stream", flagged: false });
  });

  it("капарото (бутон 2) и отвореното плащане също броят; платилите — не", () => {
    const rows = [
      act("b", "kino_click", 0, { button: "deposit" }),
      act("c", "kino_checkout", 0, { plan: "full" }),
      act("c", "kino_payment", 5, { amount_eur: 1900 }),
      act("d", "kino_click", 0, { button: "call" }),
    ];
    const r = findAbandoned(rows, T0 + 30 * 60_000);
    expect(r.map((x) => x.contactId)).toEqual(["b"]);
    expect(r[0].wants).toBe("deposit");
  });

  it("ново натискане отлага сигнала; вдигнатият сигнал се помни", () => {
    const rows = [act("e", "kino_click", 0, { button: "stream" }), act("e", "kino_checkout", 20, { plan: "installments" })];
    expect(findAbandoned(rows, T0 + 30 * 60_000)).toEqual([]);
    const flagged = [...rows, act("e", "kino_abandoned", 36)];
    expect(findAbandoned(flagged, T0 + 40 * 60_000)[0]).toMatchObject({ contactId: "e", flagged: true });
  });
});

describe("„Твоето число“ първо", () => {
  it("с число — първи, по-голямото по-горе; без число — в досегашния ред", () => {
    const people = [
      { id: "x", h: null },
      { id: "y", h: 5 },
      { id: "z", h: null },
      { id: "w", h: 20 },
    ];
    expect(byHoursFirst(people, (p) => p.h).map((p) => p.id)).toEqual(["w", "y", "x", "z"]);
  });
});
