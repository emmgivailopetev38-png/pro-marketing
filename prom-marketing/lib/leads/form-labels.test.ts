import { describe, it, expect } from "vitest";
import { businessFromForm, decodeFormAnswers, guessBusinessOption } from "./form-labels";

const USLUGI_PO_MQRKA = [
  { name: "phone_number", values: ["+359898861477"] },
  { name: "full_name", values: ["Васил Бозев"] },
  { name: "С_какво_се_занимаваш?", values: ["o6"] },
  { name: "email", values: ["v@example.com"] },
  { name: "Какво_търсиш?", values: ["o7"] },
];

const EDIN_DEN = [
  { name: "biznes", values: ["o1"] },
  { name: "phone_number", values: ["+359877582006"] },
  { name: "chasove", values: ["o4"] },
  { name: "bolka", values: ["o6"] },
  { name: "cel", values: ["o5"] },
  { name: "koga", values: ["o4"] },
];

describe("отговорите от Meta формите", () => {
  it("кодовете стават текст, стандартните полета се изрязват", () => {
    const a = decodeFormAnswers(USLUGI_PO_MQRKA);
    expect(a).toEqual([
      { question: "С какво се занимава", answer: "Транспорт и логистика" },
      { question: "Какво търси", answer: "Още не знае — иска съвет" },
    ]);
  });

  it("формата с 5-те въпроса се чете изцяло", () => {
    const a = decodeFormAnswers(EDIN_DEN);
    expect(a.map((x) => x.question)).toEqual([
      "С какво се занимава",
      "Часове седмично ръчна работа",
      "Какво му яде най-много време",
      "Целта му за 12 месеца",
      "Кога иска да започне",
    ]);
    expect(a[0].answer).toBe("Услуги (сервиз, салон, ремонти, транспорт)");
    expect(a[4].answer).toBe("Само разглежда засега");
  });

  it("непознат въпрос и непознат код се показват както са", () => {
    const a = decodeFormAnswers([{ name: "grad_na_firmata", values: ["Варна"] }, { name: "biznes", values: ["o9"] }]);
    expect(a).toEqual([
      { question: "grad na firmata", answer: "Варна" },
      { question: "С какво се занимава", answer: "o9" },
    ]);
  });

  it("приема и JSON низ, а боклукът дава празен списък", () => {
    expect(decodeFormAnswers(JSON.stringify(EDIN_DEN))).toHaveLength(5);
    expect(decodeFormAnswers(null)).toEqual([]);
    expect(decodeFormAnswers("не е json")).toEqual([]);
    expect(decodeFormAnswers([{ name: "koga", values: [] }])).toEqual([]);
  });

  it("дейността се вади от формата и се свежда до опция в картата", () => {
    expect(businessFromForm(USLUGI_PO_MQRKA)).toBe("Транспорт и логистика");
    expect(businessFromForm(EDIN_DEN)).toBe("Услуги (сервиз, салон, ремонти, транспорт)");
    expect(businessFromForm([])).toBeNull();
    expect(guessBusinessOption("Транспорт и логистика")).toBe("Транспорт / логистика");
    expect(guessBusinessOption("Услуги (сервиз, салон, ремонти, транспорт)")).toBe("Услуги / кабинет / салон");
    expect(guessBusinessOption("Строителство и ремонти")).toBe("Строителство / имоти / ремонти");
    expect(guessBusinessOption("Онлайн магазин или е-търговия")).toBe("Онлайн магазин / е-търговия");
    expect(guessBusinessOption("Друго")).toBe("Друго");
    expect(guessBusinessOption(null)).toBe("Друго");
  });
});
