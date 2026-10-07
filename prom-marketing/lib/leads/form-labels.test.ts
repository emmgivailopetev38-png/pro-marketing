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

describe("формата на AI наръчника (лийд магнит, 07.10.2026)", () => {
  const NARACHNIK = [
    { name: "dejnost", values: ["krasota"] },
    { name: "full_name", values: ["Мария Иванова"] },
    { name: "phone_number", values: ["+359888000000"] },
    { name: "email", values: ["m@example.com"] },
  ];

  it("кодът на отговора става текст и дейността се попълва", () => {
    expect(decodeFormAnswers(NARACHNIK)).toEqual([{ question: "С какво се занимава", answer: "Салон, красота, здраве" }]);
    expect(businessFromForm(NARACHNIK)).toBe("Салон, красота, здраве");
    expect(guessBusinessOption(businessFromForm(NARACHNIK))).toBe("Услуги / кабинет / салон");
  });

  it(`„Още нямам фирма“ не се бърка с бранш`, () => {
    const a = [{ name: "dejnost", values: ["nyamam"] }];
    expect(businessFromForm(a)).toBe("Още нямам фирма");
    expect(guessBusinessOption(businessFromForm(a))).toBe("Друго");
  });
});

describe("формите от 10.2026 — Димитър вижда думи, не кодове", () => {
  it("AI одитът: колко души и кое му яде времето", () => {
    const a = decodeFormAnswers([
      { name: "kolko_dushi", values: ["2_10"] },
      { name: "full_name", values: ["Dimitar Daskalov"] },
      { name: "vreme", values: ["dokumenti"] },
    ]);
    expect(a).toEqual([
      { question: "Колко души са във фирмата", answer: "2–10 души" },
      { question: "Какво му яде най-много време", answer: "Оферти, фактури и документи на ръка" },
    ]);
  });

  it("„Преглед на рекламата“: „biznes“ тук значи „има ли бизнес“ — и не се пише като дейност", () => {
    const form = [
      { name: "biznes", values: ["oshte_ne"] },
      { name: "reklama_sega", values: ["ne_puskam"] },
    ];
    expect(decodeFormAnswers(form)).toEqual([
      { question: "Има ли бизнес", answer: "Още не — само разглежда" },
      { question: "Как върви рекламата му", answer: "Не пуска, но иска да започне" },
    ]);
    expect(businessFromForm(form)).toBeNull();
  });

  it("старата форма с „biznes“ си остава „с какво се занимава“", () => {
    expect(decodeFormAnswers([{ name: "biznes", values: ["o4"] }])).toEqual([{ question: "С какво се занимава", answer: "Строителство / имоти" }]);
    expect(businessFromForm([{ name: "biznes", values: ["o4"] }])).toBe("Строителство / имоти");
  });

  it("v5: свободният текст за фирмата попълва дейността", () => {
    const v5 = [
      { name: "biznes", values: ["ekip_2_10"] },
      { name: "vreme", values: ["gonene"] },
      { name: "firma", values: ["Автосервиз в Пловдив"] },
    ];
    expect(decodeFormAnswers(v5)).toEqual([
      { question: "Има ли бизнес", answer: "Да, с екип 2–10 души" },
      { question: "Какво му яде най-много време", answer: "Гони клиенти за срещи и плащания" },
      { question: "С какво се занимава", answer: "Автосервиз в Пловдив" },
    ]);
    expect(businessFromForm(v5)).toBe("Автосервиз в Пловдив");
  });

  it("менторската: какво прави и какво иска да може", () => {
    expect(
      decodeFormAnswers([
        { name: "kakvo_pravish", values: ["targovec"] },
        { name: "kakvo_iskash", values: ["prodazhbi"] },
      ])
    ).toEqual([
      { question: "Какво прави в момента", answer: "Търговец е — продава за фирма" },
      { question: "Какво иска да може сам", answer: "Да продава по-уверено — разговор и възражения" },
    ]);
  });
});

describe("формата на безплатния курс (1370445844914854, 07.10.2026)", () => {
  const KURS = [
    { name: "kolko_dushi", values: ["2_10"] },
    { name: "vreme", values: ["vaprosi"] },
    { name: "kurs_interes", values: ["telefon"] },
    { name: "full_name", values: ["Мария Иванова"] },
    { name: "phone_number", values: ["+359888000000"] },
    { name: "email", values: ["m@example.com"] },
  ];

  it("трите въпроса стават думи за човека, който звъни", () => {
    expect(decodeFormAnswers(KURS)).toEqual([
      { question: "Колко души са във фирмата", answer: "2–10 души" },
      { question: "Какво му яде най-много време", answer: "Едни и същи въпроси от клиенти" },
      { question: "Кое го интересува най-много (курсът)", answer: "Телефонът на сайта, който се вдига сам" },
    ]);
  });

  it(`„Още не знае — иска всичко“ и „Още няма бизнес“ се виждат с думи`, () => {
    expect(decodeFormAnswers([{ name: "kurs_interes", values: ["vsichko"] }])[0].answer).toBe("Още не знае — иска всичко");
    expect(decodeFormAnswers([{ name: "kolko_dushi", values: ["nyama_biznes"] }])[0].answer).toBe("Още няма бизнес");
  });
});
