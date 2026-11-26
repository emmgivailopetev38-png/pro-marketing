import { describe, expect, it } from "vitest";
import { AB_DYAL_B, AB_PATH_B, ZAGLAVIE_B, abVarianta, eVarianta } from "./ab";
import { uebinarHostAction } from "./domen";

describe("A/B тестът на лендинга (Стефчо, 26.11.2026)", () => {
  it("бисквитката пази версията", () => {
    expect(abVarianta("A", 0.01)).toEqual({ varianta: "A", nova: false });
    expect(abVarianta("B", 0.99)).toEqual({ varianta: "B", nova: false });
  });

  it("нов посетител: 40% Б, 60% А", () => {
    expect(AB_DYAL_B).toBe(0.4);
    expect(abVarianta(undefined, 0.39)).toEqual({ varianta: "B", nova: true });
    expect(abVarianta(null, 0.4)).toEqual({ varianta: "A", nova: true });
    expect(abVarianta("нещо", 0.9)).toEqual({ varianta: "A", nova: true });
    let b = 0;
    for (let i = 0; i < 10_000; i++) if (abVarianta(undefined, i / 10_000).varianta === "B") b++;
    expect(b).toBe(4000);
  });

  it("началната страница на ivailopetev.com: Б от /na-zhivo/b, А както досега", () => {
    expect(uebinarHostAction("ivailopetev.com", "/", "?utm_source=fb", "B")).toEqual({ kind: "rewrite", to: `${AB_PATH_B}?utm_source=fb` });
    expect(uebinarHostAction("ivailopetev.com", "/", "?utm_source=fb", "A")).toEqual({ kind: "rewrite", to: "/na-zhivo?utm_source=fb" });
    expect(uebinarHostAction("ivailopetev.com", "/")).toEqual({ kind: "rewrite", to: "/na-zhivo" });
  });

  it("заглавието на Б е точно думите на Стефчо", () => {
    expect(`${ZAGLAVIE_B.before}${ZAGLAVIE_B.mark}${ZAGLAVIE_B.after}`).toBe(
      "3-те Скрити Тайни Как Покрай Работата Си Да Изградиш Допълнителен Доход Със Сайтове, Които AI Прави За Фирмите В Твоя Град... Дори Да Не Разбираш Нищо От AI",
    );
    expect(eVarianta("A") && eVarianta("B") && !eVarianta("C")).toBe(true);
  });
});
