import { describe, expect, it } from "vitest";
import { compareAnswer } from "./comparison";

describe("compareAnswer", () => {
  it("ignores case, punctuation, quotes and whitespace while retaining the original", () => {
    const original = "„Едно, ДВЕ“ — три!\nЧетири.";
    const result = compareAnswer(original, "  едно две три   четири ");
    expect(result.percent).toBe(100);
    expect(result.ocenka).toBe(2);
    expect(result.words.every((word) => word.matched)).toBe(true);
    expect(result.words.map((word) => word.text).join("")).toBe(original);
  });

  it("highlights only the omitted original word", () => {
    const result = compareAnswer("Едно, две и три.", "едно и три");
    expect(result.percent).toBe(75);
    expect(result.words.filter((word) => !word.matched)).toEqual([{ text: "две", matched: false }]);
  });

  it("does not award one spoken occurrence to multiple repeated original words", () => {
    const result = compareAnswer("пак пак пак", "пак");
    expect(result.percent).toBe(33);
    expect(result.words.filter((word) => !word.matched)).toHaveLength(2);
  });

  it("penalizes extra words and changed word order", () => {
    expect(compareAnswer("едно две", "едно две три четири").percent).toBe(50);
    expect(compareAnswer("едно две три", "три две едно").percent).toBe(33);
  });

  it("uses the specified score boundaries", () => {
    const original = "а б в г д е ж з и й";
    expect(compareAnswer(original, "а б в г д е ж з и").ocenka).toBe(2);
    expect(compareAnswer(original, "а б в г д е").ocenka).toBe(1);
    expect(compareAnswer(original, "а б в г д").ocenka).toBe(0);
  });

  it("normalizes composed Bulgarian characters", () => {
    expect(compareAnswer("й", "и\u0306").percent).toBe(100);
  });

  it("does not round a result below 90 percent up to a perfect score", () => {
    const original = Array.from({ length: 200 }, (_, index) => `дума${index}`);
    const result = compareAnswer(original.join(" "), original.slice(0, 179).join(" "));
    expect(result.percent).toBe(89);
    expect(result.ocenka).toBe(1);
  });

  it("does not treat an empty or punctuation-only answer as correct", () => {
    expect(compareAnswer("едно", "...").ocenka).toBe(0);
    expect(compareAnswer("", "").percent).toBe(0);
  });
});
