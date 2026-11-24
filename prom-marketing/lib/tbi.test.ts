import { describe, expect, it } from "vitest";
import { TBI_HIGH, TBI_LOW, round2, tbiMonthly, tbiSchemeFor, tbiTable } from "./tbi";

describe("TBI вноски", () => {
  it("съвпада с калкулатора в портала до стотинка", () => {
    expect(round2(tbiMonthly(3900, 6, 19.47))).toBe(684.4);
    expect(round2(tbiMonthly(2000, 12, 23.79))).toBe(186.74);
    expect(round2(tbiMonthly(9900, 24, 19.47))).toBe(493.88);
  });

  it("избира по-евтината схема, когато важи", () => {
    expect(tbiSchemeFor(3900, 48)).toBe(TBI_LOW);
    expect(tbiSchemeFor(3900, 60)).toBe(TBI_HIGH);
    expect(tbiSchemeFor(1500, 12)).toBe(TBI_HIGH);
  });

  it("таблицата за 3 900 € е 684 / 357 / 195 / 141 / 114 €", () => {
    const t = tbiTable(3900);
    expect(t.map((r) => Math.round(r.monthly))).toEqual([684, 357, 195, 141, 114]);
    expect(t[0].total).toBe(4106.4);
  });

  it("нулева сума или срок → 0", () => {
    expect(tbiMonthly(0, 12, 19.47)).toBe(0);
    expect(tbiMonthly(1000, 0, 19.47)).toBe(0);
  });
});
