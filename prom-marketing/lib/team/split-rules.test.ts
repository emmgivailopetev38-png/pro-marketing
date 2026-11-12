import { describe, expect, it } from "vitest";
import { ivailoShare, nextToIvailo } from "./split-rules";

describe("50/50 Ивайло ↔ клоузъра", () => {
  it("редува се: 1-ви Ивайло, 2-ри екипът, 3-ти Ивайло…", () => {
    let mine = 0;
    const out: boolean[] = [];
    for (let n = 1; n <= 6; n++) {
      const me = nextToIvailo(n, mine, 0.5);
      if (me) mine++;
      out.push(me);
    }
    expect(out).toEqual([true, false, true, false, true, false]);
  });

  it("делът от средата: 0 спира, 1 = всички при Ивайло, грешна стойност = 50 %", () => {
    expect(ivailoShare("0")).toBe(0);
    expect(nextToIvailo(1, 0, 0)).toBe(false);
    expect(nextToIvailo(5, 4, 1)).toBe(true);
    expect(ivailoShare(undefined)).toBe(0.5);
    expect(ivailoShare("abc")).toBe(0.5);
    expect(ivailoShare("2")).toBe(1);
  });
});
