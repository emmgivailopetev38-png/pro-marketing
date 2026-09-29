import { describe, expect, it } from "vitest";
import { PAGE_SIZE, allRows } from "./all-rows";

/** Като PostgREST: всяка заявка връща най-много PAGE_SIZE реда от диапазона. */
function table(n: number) {
  const calls: Array<[number, number]> = [];
  const page = (from: number, to: number) => {
    calls.push([from, to]);
    const data = Array.from({ length: Math.max(0, Math.min(n, to + 1) - from) }, (_, i) => from + i);
    return Promise.resolve({ data, error: null });
  };
  return { page, calls };
}

describe("allRows — покрай тавана от 1000 реда", () => {
  it("3 532 реда идват всичките, на 4 страници", async () => {
    const t = table(3532);
    const { rows, error } = await allRows(t.page);
    expect(error).toBeNull();
    expect(rows).toHaveLength(3532);
    expect(t.calls).toEqual([[0, 999], [1000, 1999], [2000, 2999], [3000, 3999]]);
  });

  it("точно една пълна страница — пита още веднъж и спира на празната", async () => {
    const t = table(PAGE_SIZE);
    expect((await allRows(t.page)).rows).toHaveLength(PAGE_SIZE);
    expect(t.calls).toHaveLength(2);
  });

  it("грешка — връща каквото е събрало и казва защо", async () => {
    const r = await allRows(() => Promise.resolve({ data: null, error: { message: "няма таблица" } }));
    expect(r).toEqual({ rows: [], error: "няма таблица" });
  });
});
