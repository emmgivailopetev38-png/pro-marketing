import { describe, expect, it } from "vitest";
import { chislo, naDen, tablica, zaCelta, MESECHNA_CEL } from "./liniyata";

describe("Линията — сметките", () => {
  it("пише хилядите с интервал", () => {
    expect(chislo(8000)).toBe("8 000");
    expect(chislo(300000)).toBe("300 000");
    expect(chislo(1250000)).toBe("1 250 000");
    expect(chislo(500)).toBe("500");
  });

  it("колко менторски правят 300 000 €/мес", () => {
    expect(MESECHNA_CEL).toBe(300000);
    expect(zaCelta(8000)).toBe(38);
    expect(zaCelta(50000)).toBe(6);
    expect(zaCelta(3900)).toBe(77);
    expect(zaCelta(0)).toBe(0);
  });

  it("38 на месец са под 2 на работен ден", () => {
    expect(naDen(38)).toBeLessThan(2);
    expect(naDen(38)).toBe(1.8);
  });

  it("таблицата: 1, 5 и 10 по всяка цена", () => {
    const red = tablica().find((r) => r.cena.value === 8000)!;
    expect(red.sumi.map((s) => s.suma)).toEqual([8000, 40000, 80000]);
    expect(red.zaCelta).toBe(38);
  });
});
