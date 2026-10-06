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
  it("44-минутният филм има 44 минути", () => {
    expect(totalMinutes(KINO.film.durationSec)).toBe(44);
  });

  it("закъснелият с 30 минути, гледал до края, не е „изгледал 70 %“", () => {
    const late = { minutes: 14, maxPos: KINO.film.durationSec };
    expect(watchedRatio(late.minutes)).toBeLessThan(0.5);
    const m = reachedMilestones(late);
    expect(m).toContain("end");
    expect(m).not.toContain("p50");
  });

  it("гледалият половината стига p25 и p50, но не p75", () => {
    const m = reachedMilestones({ minutes: 22, maxPos: 22 * 60 });
    expect(m).toEqual(["entered", "p25", "p50"]);
  });

  it("поканата и краят са по най-далечната позиция", () => {
    const offerStart = KINO.film.chapters[11].startSec;
    expect(reachedMilestones({ minutes: 40, maxPos: offerStart })).toContain("offer_chapter");
    expect(reachedMilestones({ minutes: 40, maxPos: offerStart })).not.toContain("end");
    expect(reachedMilestones({ minutes: 44, maxPos: KINO.film.offerAtSec })).toContain("end");
  });
});

describe("freshMilestones", () => {
  it("връща само недописаните — и само познатите", () => {
    expect(freshMilestones(["entered", "p25", "p50"], ["entered"])).toEqual(["p25", "p50"]);
    expect(freshMilestones(["entered", "нещо"], [])).toEqual(["entered"]);
    expect(freshMilestones(["entered"], ["entered"])).toEqual([]);
  });

  it("заглавията за CRM-а казват как е гледал", () => {
    expect(milestoneTitle("entered", "premiere")).toContain("премиерата на живо");
    expect(milestoneTitle("entered", "replay")).toContain("повторението");
    expect(milestoneTitle("end", "replay")).toContain("надписите");
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
      watches: [row("a", range(0, 21)), row("b", range(0, 43)), row("c", range(0, 10)), row("d", range(0, 43))],
      buyers: new Set(["d"]),
    });
    expect(warm.map((p) => p.contact_id)).toEqual(["b", "a"]);
    expect(warm[0].ratio).toBe(1);
  });
});
