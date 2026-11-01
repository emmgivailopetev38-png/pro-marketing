import { describe, it, expect } from "vitest";
import { chunks } from "./array";
import { escapeHtml } from "./text/escape";
import { ago } from "./team/time";

describe("chunks", () => {
  it("реже на парчета и пази остатъка", () => {
    expect(chunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunks([], 3)).toEqual([]);
  });
});

describe("escapeHtml", () => {
  it("екранира знаците и понася null", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
    expect(escapeHtml(null)).toBe("");
  });
});

describe("ago", () => {
  const before = (ms: number) => new Date(Date.now() - ms).toISOString();
  it("минути, часове, дни", () => {
    expect(ago(before(5 * 60_000))).toBe("преди 5 мин");
    expect(ago(before(3 * 3_600_000))).toBe("преди 3 ч");
    expect(ago(before(2 * 86_400_000))).toBe("преди 2 дни");
  });
  it("след седмица с флага връща дата", () => {
    expect(ago(before(10 * 86_400_000))).toBe("преди 10 дни");
    expect(ago(before(10 * 86_400_000), true)).not.toContain("преди");
  });
});
