import { describe, expect, it } from "vitest";
import { guessCategory, lastMonths, monthTotals, parseImport, type PfRow } from "./personal-finance";

const rows: PfRow[] = [
  { id: "1", kind: "income", category: "salary", description: null, amount: 2000, currency: "EUR", occurred_on: "2026-09-01", recurring: true, note: null },
  { id: "2", kind: "expense", category: "home", description: "наем", amount: 450, currency: "EUR", occurred_on: "2026-09-03", recurring: true, note: null },
  { id: "3", kind: "expense", category: "food", description: null, amount: 120.5, currency: "EUR", occurred_on: "2026-09-10", recurring: false, note: null },
  { id: "4", kind: "expense", category: "food", description: null, amount: 80, currency: "EUR", occurred_on: "2026-08-10", recurring: false, note: null },
];

describe("personal-finance", () => {
  it("сборовете за месеца и категориите, най-големите първи", () => {
    const t = monthTotals(rows, "2026-09");
    expect(t).toMatchObject({ income: 2000, expense: 570.5, net: 1429.5 });
    expect(t.byCategory[0]).toEqual({ category: "salary", kind: "income", amount: 2000 });
    expect(t.byCategory.map((c) => c.category)).toEqual(["salary", "home", "food"]);
  });

  it("последните месеци, най-новият накрая", () => {
    expect(lastMonths(3, new Date("2026-09-22T00:00:00Z"))).toEqual(["2026-07", "2026-08", "2026-09"]);
  });

  it("вносът разбира разхвърляни редове от бележки", () => {
    const rows = parseImport(
      [
        "22.09.2026; наем; 450",
        "2026-09-22 | храна | 120,50 | лично",
        "+ заплата 2000 01.09.2026 всеки месец",
        "кола гориво 80",
        "# коментар",
        "без сума",
        "-абонамент Netflix 15.99",
      ].join("\n"),
      "2026-09-22"
    );
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ kind: "expense", category: "home", amount: 450, occurred_on: "2026-09-22", description: "наем" });
    expect(rows[1]).toMatchObject({ kind: "expense", category: "food", amount: 120.5, occurred_on: "2026-09-22" });
    expect(rows[2]).toMatchObject({ kind: "income", category: "salary", amount: 2000, occurred_on: "2026-09-01", recurring: true });
    expect(rows[3]).toMatchObject({ kind: "expense", category: "car", amount: 80, occurred_on: "2026-09-22" });
    expect(rows[4]).toMatchObject({ kind: "expense", category: "subscriptions", amount: 15.99 });
  });

  it("категорията се познава по думи; приходна дума прави прихода приход", () => {
    expect(guessCategory("Дивидент от фирмата", "income")).toBe("dividend");
    expect(guessCategory("наем на квартира", "expense")).toBe("home");
    expect(guessCategory("нещо неясно", "expense")).toBe("other");
    expect(parseImport("дивидент 1500", "2026-09-22")[0].kind).toBe("income");
  });
});
