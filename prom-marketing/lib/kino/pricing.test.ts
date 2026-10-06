import { describe, it, expect } from "vitest";
import { KINO } from "./config";
import { quotePlan, formatEur, planProductName, isKinoPlan, isCartOpen } from "./pricing";

describe("quotePlan — една цена, без премиерна", () => {
  it("пълно плащане: 1 900 € с ДДС", () => {
    expect(quotePlan("full")).toMatchObject({ mode: "payment", unitEur: 1900, dueNowEur: 1900, totalEur: 1900, count: 1, creditEur: 0 });
  });

  it("3 вноски са абонамент с три плащания по 650 €", () => {
    expect(quotePlan("installments")).toMatchObject({ mode: "subscription", unitEur: 650, count: 3, totalEur: 1950, dueNowEur: 650 });
  });

  it("капарото е 100 €, а сделката — цената на програмата", () => {
    expect(quotePlan("deposit")).toMatchObject({ mode: "payment", dueNowEur: KINO.prices.deposit, totalEur: KINO.prices.full });
  });

  it("платеното капаро се приспада от първото плащане", () => {
    expect(quotePlan("full", { depositPaidEur: 100 })).toMatchObject({ unitEur: 1900, creditEur: 100, dueNowEur: 1800 });
    expect(quotePlan("installments", { depositPaidEur: 100 })).toMatchObject({ unitEur: 650, creditEur: 100, dueNowEur: 550, totalEur: 1950 });
  });

  it("приспадането никога не прави плащането нула или отрицателно", () => {
    expect(quotePlan("full", { depositPaidEur: 99999 }).dueNowEur).toBeGreaterThan(0);
    expect(quotePlan("installments", { depositPaidEur: 99999 }).dueNowEur).toBeGreaterThan(0);
  });
});

describe("isCartOpen — честният срок", () => {
  const close = Date.parse(KINO.screening.replayUntilISO);
  it("записването от залата е отворено до неделя 23:59", () => {
    expect(isCartOpen(close - 1)).toBe(true);
    expect(isCartOpen(close)).toBe(false);
  });
  it("след срока — само личният линк след разговор и платилите капаро", () => {
    expect(isCartOpen(close + 1, { personalLink: true })).toBe(true);
    expect(isCartOpen(close + 1, { depositPaid: true })).toBe(true);
  });
});

describe("formatEur", () => {
  it("пише сумите като на български — с интервал за хилядите", () => {
    expect(formatEur(1900)).toBe("1 900 €");
    expect(formatEur(100)).toBe("100 €");
    expect(formatEur(15600.5)).toBe("15 600,50 €");
  });
});

describe("planProductName", () => {
  it("името в Stripe казва какво е", () => {
    expect(planProductName(quotePlan("full"), "AI потокът")).toBe("AI потокът · пълно плащане");
    expect(planProductName(quotePlan("installments"), "AI потокът")).toBe("AI потокът · 3 месечни вноски");
    expect(planProductName(quotePlan("deposit"), "AI потокът")).toContain("приспада се");
  });
});

describe("isKinoPlan", () => {
  it("познава само трите плана", () => {
    expect(isKinoPlan("full")).toBe(true);
    expect(isKinoPlan("installments")).toBe(true);
    expect(isKinoPlan("deposit")).toBe(true);
    expect(isKinoPlan("mentorship")).toBe(false);
    expect(isKinoPlan(undefined)).toBe(false);
  });
});
