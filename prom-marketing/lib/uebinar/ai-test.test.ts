import { describe, expect, it } from "vitest";
import { BANDOVE, KATEGORII, MAKS_TOCHKI, VAPROSI, VAPROSI_ZA_PROCENT, smetni } from "./ai-test";

const vsichki = (v: number) => Object.fromEntries(VAPROSI.map((q) => [q.id, v]));

describe("тестът „Виж дали AI ще замени работата ти“", () => {
  it("има 10 въпроса по 4 отговора, 9 от тях за процента", () => {
    expect(VAPROSI).toHaveLength(10);
    expect(VAPROSI_ZA_PROCENT).toHaveLength(9);
    expect(MAKS_TOCHKI).toBe(27);
    for (const v of VAPROSI) {
      expect(v.opcii).toHaveLength(4);
      expect(new Set(v.opcii.map((o) => o.v))).toEqual(new Set([0, 1, 2, 3]));
    }
  });

  it("процентът е между 5 и 95 и лентите са по праговете", () => {
    expect(smetni(vsichki(0))).toMatchObject({ procent: 5, band: "nisko", gotovnost: "ne", kategorii: [] });
    expect(smetni(vsichki(3))).toMatchObject({ procent: 95, band: "visoko", gotovnost: "vseki-den" });
  });

  it("лентата следва процента", () => {
    const r1 = smetni(vsichki(1));
    expect(r1.procent).toBe(33);
    expect(r1.band).toBe("nisko");
    const r2 = smetni(vsichki(2));
    expect(r2.procent).toBe(67);
    expect(r2.band).toBe("visoko");
  });

  it("задачите с 2 или 3 точки влизат в списъка — най-силните първи", () => {
    const o = { ...vsichki(0), pisane: 3, danni: 2, analizi: 1 };
    expect(smetni(o).kategorii).toEqual(["pisane", "danni"]);
  });

  it("всяка лента и задача има текст, без мъжки род към читателя", () => {
    const tekstove = [...Object.values(BANDOVE).flatMap((b) => [b.zaglavie, b.tekst]), ...Object.values(KATEGORII).map((k) => k.primer)];
    for (const t of tekstove) {
      expect(t.length).toBeGreaterThan(10);
      expect(t).not.toMatch(/\b(пробвал|сигурен|готов|изостанал)\b/i);
    }
  });
});
