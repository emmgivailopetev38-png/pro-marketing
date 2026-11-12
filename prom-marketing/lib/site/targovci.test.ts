import { describe, expect, it } from "vitest";
import { PRIMER, USLUGI, evro, komisiona, smetka } from "./targovci";

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
    expect(r.mesechnoNaMesec).toBe(78); // 30 + 48
    expect(r.prezMesec).toBe(890 + 78 * 6);
  });

  it("празно и отрицателно не носят пари", () => {
    expect(smetka({}).ednokratno).toBe(0);
    expect(smetka({ kc: -3 }).ednokratno).toBe(0);
  });

  it("всяка услуга има цена или месечна такса", () => {
    for (const u of USLUGI) expect(u.cena + u.mesechno).toBeGreaterThan(0);
  });
});
