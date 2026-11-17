import { describe, expect, it } from "vitest";
import { PRIMER, USLUGI, evro, komisiona, procentZaSdelka, smetka } from "./targovci";

describe("комисионната на търговеца", () => {
  it("10 % от цената, до цента", () => {
    expect(komisiona(7900)).toBe(790);
    expect(komisiona(6900)).toBe(690);
    expect(komisiona(199)).toBe(19.9);
  });

  it("сумата се пише по български", () => {
    expect(evro(790)).toBe("790 €");
    expect(evro(19.9)).toBe("19,90 €");
    expect(evro(7900)).toBe("7 900 €");
    expect(evro(1358)).toBe("1 358 €");
    expect(evro(12345.6)).toBe("12 345,60 €");
  });

  it("примерът: обучение + сайт + Ели + маркетинг", () => {
    const r = smetka(PRIMER, 6);
    expect(r.ednokratno).toBe(890); // 690 + 150 + 50
    expect(r.mesechnoNaMesec).toBe(82.9); // 30 + 48 + 4,90 от поддръжката на сайта
    expect(r.prezMesec).toBe(Math.round((890 + 82.9 * 6) * 100) / 100);
  });

  it("празно и отрицателно не носят пари", () => {
    expect(smetka({}).ednokratno).toBe(0);
    expect(smetka({ kc: -3 }).ednokratno).toBe(0);
  });

  it("всяка услуга има цена или месечна такса", () => {
    for (const u of USLUGI) expect(u.cena + u.mesechno).toBeGreaterThan(0);
  });

  it("от 5-ата платена сделка — 12 %", () => {
    expect(procentZaSdelka(1)).toBe(0.1);
    expect(procentZaSdelka(4)).toBe(0.1);
    expect(procentZaSdelka(5)).toBe(0.12);
    expect(komisiona(4900, procentZaSdelka(5))).toBe(588);
  });

  it("автоматизация не под 4 500 €, минимумът не е над цената", () => {
    const crm = USLUGI.find((u) => u.id === "crm");
    expect(crm?.cena).toBe(4900);
    expect(crm?.minimum).toBe(4500);
    for (const u of USLUGI) if (u.minimum) expect(u.minimum).toBeLessThanOrEqual(u.cena);
  });
});
