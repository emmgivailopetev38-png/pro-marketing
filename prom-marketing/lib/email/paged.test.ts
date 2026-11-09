import { describe, it, expect } from "vitest";
import { readAllPages } from "./paged";

/** Фалшива таблица: връща отрязъка [from, to] от `total` реда. */
function table(total: number, calls: Array<[number, number]> = []) {
  const rows = Array.from({ length: total }, (_, i) => ({ n: i }));
  return (from: number, to: number) => {
    calls.push([from, to]);
    return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
  };
}

describe("readAllPages — всички редове, не само първите 1 000", () => {
  it("4 263 реда (колкото имаха 300-те души на 10.11.2026) → чете всичките", async () => {
    const calls: Array<[number, number]> = [];
    const all = await readAllPages<{ n: number }>(table(4263, calls));
    expect(all).toHaveLength(4263);
    expect(all[4262].n).toBe(4262);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [3000, 3999],
      [4000, 4999],
    ]);
  });

  it("точно 1 000 реда → проверява и следващата (празна) страница", async () => {
    const calls: Array<[number, number]> = [];
    const all = await readAllPages(table(1000, calls));
    expect(all).toHaveLength(1000);
    expect(calls).toHaveLength(2);
  });

  it("празна таблица → празен списък с една заявка", async () => {
    const calls: Array<[number, number]> = [];
    expect(await readAllPages(table(0, calls))).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it("грешка от базата → хвърля, вместо да върне половин история", async () => {
    let i = 0;
    const page = () => Promise.resolve(i++ === 0 ? { data: Array(1000).fill({}), error: null } : { data: null, error: { message: "timeout" } });
    await expect(readAllPages(page)).rejects.toThrow(/timeout/);
  });

  it("безкрайна таблица → спира с грешка след тавана на страниците", async () => {
    const page = () => Promise.resolve({ data: Array(10).fill({}), error: null });
    await expect(readAllPages(page, 10, 3)).rejects.toThrow(/страници/);
  });
});
