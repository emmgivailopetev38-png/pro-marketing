import { describe, it, expect } from "vitest";
import { toEur, convertWith, fxColumns, EUR_BGN_RATE } from "./fx";

describe("toEur", () => {
  it("passes EUR through unchanged", () => {
    const r = toEur(100, "EUR");
    expect(r.amount_eur).toBe(100);
    expect(r.original_currency).toBe("EUR");
    expect(r.fx_rate).toBe(1);
    expect(r.fx_source).toBe("none");
  });

  it("converts BGN at the fixed peg 1.95583", () => {
    const r = toEur(100, "BGN");
    expect(r.amount_eur).toBe(51.13); // 100 / 1.95583
    expect(r.fx_rate).toBe(EUR_BGN_RATE);
    expect(r.fx_source).toBe("fixed_eur_bgn_1.95583");
    expect(r.original_amount).toBe(100);
    expect(r.original_currency).toBe("BGN");
  });

  it("treats one euro's worth of BGN as 1.00 EUR", () => {
    expect(toEur(1.95583, "BGN").amount_eur).toBe(1);
  });

  it("is case-insensitive on the currency code", () => {
    expect(toEur(100, "bgn").fx_source).toBe("fixed_eur_bgn_1.95583");
  });

  it("uses an explicit rate override for floating currencies", () => {
    const r = toEur(100, "USD", 1.08);
    expect(r.amount_eur).toBe(92.59); // 100 / 1.08
    expect(r.fx_source).toBe("provided");
  });

  it("flags an unknown currency as unconverted instead of mislabeling it", () => {
    const r = toEur(100, "USD");
    expect(r.fx_source).toBe("unconverted");
    expect(r.fx_rate).toBe(1);
    expect(r.original_currency).toBe("USD");
  });

  it("returns null EUR for a missing amount", () => {
    expect(toEur(null, "BGN").amount_eur).toBeNull();
    expect(toEur(undefined, "EUR").amount_eur).toBeNull();
  });
});

describe("convertWith", () => {
  it("converts a secondary amount with the same rate", () => {
    expect(convertWith(20, EUR_BGN_RATE)).toBe(10.23); // 20 / 1.95583
  });
  it("returns null for absent input", () => {
    expect(convertWith(null, EUR_BGN_RATE)).toBeNull();
    expect(convertWith(undefined, 1)).toBeNull();
  });
});

describe("fxColumns", () => {
  it("stores nothing extra when the source was already EUR", () => {
    expect(fxColumns(toEur(100, "EUR"))).toEqual({
      original_amount: null,
      original_currency: null,
      fx_rate: null,
      fx_source: null,
    });
  });

  it("preserves the original for a converted currency", () => {
    expect(fxColumns(toEur(100, "BGN"))).toEqual({
      original_amount: 100,
      original_currency: "BGN",
      fx_rate: EUR_BGN_RATE,
      fx_source: "fixed_eur_bgn_1.95583",
    });
  });
});
