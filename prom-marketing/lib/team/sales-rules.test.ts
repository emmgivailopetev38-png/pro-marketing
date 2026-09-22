import { describe, expect, it } from "vitest";
import { byFollowup, pipelineOf, salesBucket, salesScore } from "./sales-rules";

const NOW = new Date("2026-09-22T07:00:00Z");
const SINCE = "2026-08-23T00:00:00Z";

describe("sales-rules", () => {
  it("днес / просрочен / изпълнен по календарен ден в София", () => {
    const base = { stage: "contacted", last_heard_from_at: null, updated_at: "2026-09-20T00:00:00Z" };
    expect(salesBucket({ ...base, next_followup_at: "2026-09-22T07:00:00Z" }, NOW, SINCE)).toBe("today");
    expect(salesBucket({ ...base, next_followup_at: "2026-09-18T07:00:00Z" }, NOW, SINCE)).toBe("overdue");
    expect(salesBucket({ ...base, next_followup_at: "2026-09-18T07:00:00Z", last_heard_from_at: "2026-09-19T07:00:00Z" }, NOW, SINCE)).toBe(
      "pipeline"
    );
    expect(salesBucket({ ...base, next_followup_at: "2026-09-30T07:00:00Z" }, NOW, SINCE)).toBe("pipeline");
  });

  it("спечелените и загубените се показват само за периода", () => {
    expect(salesBucket({ stage: "won", next_followup_at: null, last_heard_from_at: null, updated_at: "2026-09-10T00:00:00Z" }, NOW, SINCE)).toBe("won");
    expect(salesBucket({ stage: "lost", next_followup_at: null, last_heard_from_at: null, updated_at: "2026-07-10T00:00:00Z" }, NOW, SINCE)).toBeNull();
  });

  it("тръбата брои и стойност по етап", () => {
    const p = pipelineOf([
      { stage: "offer_sent", deal_value_eur: 1000 },
      { stage: "offer_sent", deal_value_eur: null },
      { stage: "negotiating", deal_value_eur: 500 },
      { stage: "lead", deal_value_eur: 5 },
    ]);
    expect(p.find((s) => s.stage === "offer_sent")).toEqual({ stage: "offer_sent", count: 2, value: 1000 });
    expect(p.find((s) => s.stage === "negotiating")?.value).toBe(500);
  });

  it("най-старото обещание е първо", () => {
    const list = [
      { id: "b", next_followup_at: "2026-09-21T07:00:00Z", updated_at: "" },
      { id: "c", next_followup_at: null, updated_at: "2026-09-20T00:00:00Z" },
      { id: "a", next_followup_at: "2026-09-18T07:00:00Z", updated_at: "" },
    ].sort(byFollowup);
    expect(list.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("резултатът: затваряне от срещи", () => {
    const s = salesScore({ won: [{ deal_value_eur: 800 }, { deal_value_eur: 1440 }], calls: 30, meetings: 8, offers: 5 });
    expect(s).toEqual({ won: 2, value: 2240, calls: 30, meetings: 8, offers: 5, closeRate: 25 });
    expect(salesScore({ won: [], calls: 0, meetings: 0, offers: 0 }).closeRate).toBeNull();
  });
});
