import { describe, expect, it } from "vitest";
import { buildSummary, summaryHeadline, summaryText } from "./summary";
import type { AnswerRow, ReviewItem } from "./types";

const items: ReviewItem[] = [
  { code: "Ш01", name: "Един метър", line: "Един метър шоколад.", about: "", video: "", poster: "" },
  { code: "В01", name: "Чекмеджето", line: null, about: "", video: "", poster: "" },
  { code: "Ш03", name: "Тъмният", line: "Тъмен.", about: "", video: "", poster: "" },
];

describe("buildSummary", () => {
  it("дели клиповете по отговор и пази бележките", () => {
    const answers: AnswerRow[] = [
      { item_code: "Ш01", verdict: "approved", comment: "  супер  ", updated_at: "" },
      { item_code: "В01", verdict: "rejected", comment: "чекмеджето е тъмно", updated_at: "" },
    ];
    const s = buildSummary(items, answers);
    expect(s.total).toBe(3);
    expect(s.approved.map((l) => l.code)).toEqual(["Ш01"]);
    expect(s.approved[0].comment).toBe("супер");
    expect(s.rejected.map((l) => l.code)).toEqual(["В01"]);
    expect(s.pending.map((l) => l.code)).toEqual(["Ш03"]);
  });

  it("не брои отговор за код, който не е в пакета", () => {
    const s = buildSummary(items, [{ item_code: "Ш99", verdict: "approved", comment: null, updated_at: "" }]);
    expect(s.approved).toHaveLength(0);
    expect(s.pending).toHaveLength(3);
  });

  it("заглавието и текстът са четими на български", () => {
    const s = buildSummary(items, [
      { item_code: "Ш01", verdict: "approved", comment: null, updated_at: "" },
      { item_code: "В01", verdict: "rejected", comment: "по-светло", updated_at: "" },
    ]);
    expect(summaryHeadline(s, "Биляна")).toBe(`Биляна одобри 1 от 3 видеа`);
    expect(summaryHeadline(s, null)).toBe(`Клиентът одобри 1 от 3 видеа`);
    const t = summaryText(s);
    expect(t).toContain(`✓ Ш01 Един метър`);
    expect(t).toContain(`✗ В01 Чекмеджето — „по-светло“`);
    expect(t).toContain(`Без отговор (1)`);
  });
});
