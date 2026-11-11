import { describe, expect, it } from "vitest";
import { ABOUT, COMPARE_ROWS, MODULES, MODULE_BY_KEY, DEFAULT_TEMPLATES } from "./katalog";
import { buildSchema, describeIssues } from "./schema";
import { CLIENT_CASES, SHOW_CLIENT_NAMES } from "@/lib/site/clients";
import {
  buildAlternatives,
  buildItems,
  cleanSections,
  compareNote,
  compareTable,
  compareTitle,
  fill,
  fmtEur,
  greeting,
  isToken,
  latin,
  offerNumber,
  offerTitle,
  pdfFilename,
  summaryLines,
  totals,
  validUntilIso,
} from "./smetki";
import { newToken } from "./token";

describe("каталогът", () => {
  it("има стълбата с цените от 06.11.2026", () => {
    expect(MODULE_BY_KEY["nivo-1"].price).toBe(3900);
    expect(MODULE_BY_KEY["nivo-2"].price).toBe(6900);
    expect(MODULE_BY_KEY["nivo-3"].price).toBe(9900);
    expect(MODULE_BY_KEY["nivo-0"].price).toBe(2000);
    expect(MODULE_BY_KEY["komanden"].price).toBe(7900);
    expect(MODULE_BY_KEY["eli"]).toMatchObject({ price: 300, unit: "/мес", setup_price: 500 });
    expect(MODULE_BY_KEY["nivo-2"].installments?.map((i) => i.monthly)).toEqual([1211, 632, 344]);
  });
  it("модулите без цена са обявени — цената е от Ивайло", () => {
    for (const m of MODULES) {
      if (m.price === null) expect(m.needs_price).toBe(true);
    }
  });
  it("всеки шаблон сочи към съществуващи модули и има стъпки и условия", () => {
    for (const t of DEFAULT_TEMPLATES) {
      for (const it of t.items) expect(MODULE_BY_KEY[it.key]).toBeDefined();
      expect(t.content.next_steps?.length).toBeGreaterThan(1);
      expect(t.content.terms?.length).toBeGreaterThan(1);
    }
  });
});

describe("сумите", () => {
  it("програма: еднократно, с ДДС вътре", () => {
    const { items } = buildItems([{ key: "nivo-2" }]);
    const t = totals(items, 0, "incl");
    expect(t.one_time).toBe(6900);
    expect(t.monthly).toBe(0);
    expect(t.year_value).toBe(6900);
    expect(t.gross).toBe(6900);
    expect(t.net).toBe(5750);
    expect(t.vat).toBe(1150);
  });
  it("Ели: внедряване + месечно → стойност за година", () => {
    const { items } = buildItems([{ key: "eli" }]);
    const t = totals(items, 0, "incl");
    expect(t.one_time).toBe(500);
    expect(t.monthly).toBe(300);
    expect(t.year_value).toBe(500 + 3600);
  });
  it("отстъпката пада върху еднократното; без еднократно — върху месечното", () => {
    const a = totals(buildItems([{ key: "nivo-2" }]).items, 400, "incl");
    expect(a.one_time_after).toBe(6500);
    const b = totals(buildItems([{ key: "petevai" }]).items, 50, "incl");
    expect(b.monthly_after).toBe(149);
  });
  it("без ДДС в цените → ДДС-ът се добавя", () => {
    const { items } = buildItems([{ key: "custom", title: "Система за Kosara", price: 800 }]);
    const t = totals(items, 0, "excl");
    expect(t.net).toBe(800);
    expect(t.vat).toBe(160);
    expect(t.gross).toBe(960);
  });
});

describe("сглобяването на редовете", () => {
  it("модул без цена спира офертата с ясна грешка", () => {
    const r = buildItems([{ key: "marketing" }]);
    expect(r.items).toHaveLength(0);
    expect(r.errors[0]).toMatch(/Ивайло/);
  });
  it("маркетинг с цена от Ивайло минава", () => {
    const r = buildItems([{ key: "marketing", price: 450 }]);
    expect(r.errors).toEqual([]);
    expect(r.items[0]).toMatchObject({ price: 450, unit: "/мес" });
  });
  it("сменена цена маха вноските от стълбата", () => {
    const r = buildItems([{ key: "nivo-1", price: 3500 }]);
    expect(r.items[0].installments).toBeUndefined();
    const s = buildItems([{ key: "nivo-1" }]);
    expect(s.items[0].installments?.length).toBe(3);
  });
  it("непознат модул и празен свободен ред са грешки", () => {
    expect(buildItems([{ key: "nqma" }]).errors[0]).toMatch(/непознат/);
    expect(buildItems([{ key: "custom", price: 100 }]).errors[0]).toMatch(/заглавие/);
  });
  it("заглавие и редове за имейла", () => {
    const { items } = buildItems([{ key: "nivo-2" }, { key: "eli" }]);
    expect(offerTitle(items)).toBe("Ниво II · Пари с AI + Ели · гласов AI агент");
    expect(summaryLines(items)[0]).toBe("Ниво II · Пари с AI — 6 900 € еднократно");
    expect(summaryLines(items)[1]).toMatch(/300 €\/мес \+ 500 €/);
  });
});

describe("текстовете", () => {
  it("форматира евро по български", () => {
    expect(fmtEur(6900)).toBe("6 900 €");
    expect(fmtEur(0.4)).toBe("0,40 €");
    expect(fmtEur(187)).toBe("187 €");
  });
  it("обръщение по формата и галено име", () => {
    expect(greeting("ti", "Лъчезар Генов")).toBe("Здравей, Лъчезар!");
    expect(greeting("vie", "Галина Трендафилова")).toBe("Здравейте, Галина!");
    expect(greeting("ti", null)).toBe("Здравей!");
  });
  it("попълва {име}, {фирма}, {продавач}, {дата}", () => {
    expect(fill("Благодаря за разговора с {продавач}. За {фирма}, {име}.", { name: "Лъчезар Генов", company: "Funky 360", seller: "georgi" })).toBe(
      "Благодаря за разговора с Георги. За Funky 360, Лъчезар."
    );
    expect(fill("до {дата}", { date: "20.11.2026" })).toBe("до 20.11.2026");
  });
  it("код, номер и име на файл", () => {
    const t = newToken();
    expect(isToken(t)).toBe(true);
    expect(t).toHaveLength(10);
    expect(offerNumber(17, "2026-11-06T10:00:00Z")).toBe("2026-017");
    expect(latin("Лъчезар Генов")).toBe("Lachezar-Genov");
    expect(pdfFilename("Лъчезар Генов", "Funky 360")).toBe("ProMarketing-Oferta-Funky-360.pdf");
    expect(validUntilIso(14, new Date("2026-11-06T10:00:00Z"))).toBe("2026-11-20");
  });
});

describe("поправките от 09.11.2026 (офертите на Георги)", () => {
  it("името и фирмата се пишат като в документ", async () => {
    const { niceName, niceCompany, firstName } = await import("./smetki");
    expect(niceName("даниел вучев")).toBe("Даниел Вучев");
    expect(niceName("ДАНИЕЛ ВУЧЕВ")).toBe("Даниел Вучев");
    expect(niceName("мария-елена петрова")).toBe("Мария-Елена Петрова");
    expect(niceName("МакДоналд")).toBe("МакДоналд");
    expect(niceName("Лъчезар Генов")).toBe("Лъчезар Генов");
    expect(niceCompany("cafemag.bg")).toBe("Cafemag.bg");
    expect(niceCompany("ТОТЕХ")).toBe("ТОТЕХ");
    expect(firstName("даниел вучев")).toBe("Даниел");
    expect(greeting("vie", "даниел вучев")).toBe("Здравейте, Даниел!");
  });
  it("заглавието на ръка печели; три кратки реда се събират изцяло", () => {
    const items = buildItems([
      { key: "eli", title: "Гласов агент", price: 1000, unit: "еднократно", setup_price: 0 },
      { key: "avtomatizacia", title: "Имейл и чат агент", price: 1500 },
      { key: "custom", title: "Поддръжка", price: 500, unit: "/мес" },
    ]).items;
    expect(offerTitle(items)).toBe("Гласов агент + Имейл и чат агент + Поддръжка");
    expect(offerTitle(items, "Внедряване на гласов, имейл и чат агенти")).toBe("Внедряване на гласов, имейл и чат агенти");
    expect(offerTitle(items, "  ")).toBe("Гласов агент + Имейл и чат агент + Поддръжка");
  });
  it("преименуване на ред пази цената (без нов „няма цена“)", async () => {
    const { mergeItems } = await import("./smetki");
    const base = [
      { key: "eli", title: "Внедряване на гласов агент", price: 1000, unit: "еднократно" as const, setup_price: 0 },
      { key: "avtomatizacia", title: "Агент за имейли", price: 1500, unit: "еднократно" as const },
      { key: "custom", title: "Поддръжка", price: 500, unit: "/мес" as const },
    ];
    const merged = mergeItems(base, [
      { key: "eli", title: "Гласов агент" },
      { key: "avtomatizacia", title: "Имейл и чат агент с ERP интеграция" },
      { key: "custom", title: "Поддръжка на двете системи" },
    ]);
    const built = buildItems(merged);
    expect(built.errors).toEqual([]);
    expect(built.items.map((i) => [i.title, i.price, i.unit])).toEqual([
      ["Гласов агент", 1000, "еднократно"],
      ["Имейл и чат агент с ERP интеграция", 1500, "еднократно"],
      ["Поддръжка на двете системи", 500, "/мес"],
    ]);
    // remove маха, нов key се добавя, неспоменатото остава
    const m2 = mergeItems(base, [{ key: "custom", remove: true }, { key: "petevai" }]);
    expect(m2.map((i) => i.key)).toEqual(["eli", "avtomatizacia", "petevai"]);
  });
  it("списък с имейли: запетаи, точка и запетая, повторения", async () => {
    const { emailList } = await import("./schema");
    expect(emailList("daniel@cafemag.bg, Miroslava@cafemag.bg;daniel@cafemag.bg")).toEqual(["daniel@cafemag.bg", "miroslava@cafemag.bg"]);
    expect(emailList(["a@b.bg", " c@d.bg "])).toEqual(["a@b.bg", "c@d.bg"]);
    expect(emailList("")).toBeUndefined();
  });
});

describe("за сравнение — другите нива (11.11.2026)", () => {
  it("модулите за сравнение са от каталога, с цената си, без реда на офертата и без повторения", () => {
    const { items, errors } = buildAlternatives([{ key: "nivo-1" }, { key: "nivo-2" }, { key: "nivo-3" }, { key: "nivo-2" }], ["nivo-1"]);
    expect(errors).toEqual([]);
    expect(items.map((i) => i.key)).toEqual(["nivo-2", "nivo-3"]);
    expect(items.map((i) => i.price)).toEqual([6900, 9900]);
  });
  it("модул без цена и свободен ред не влизат за сравнение", () => {
    expect(buildAlternatives([{ key: "marketing" }], []).errors[0]).toMatch(/няма цена/);
    expect(buildAlternatives([{ key: "custom", title: "Нещо" }], []).errors[0]).toMatch(/свободен ред/);
    expect(buildAlternatives([{ key: "nyama-takav" }], []).errors[0]).toMatch(/непознат/);
    expect(buildAlternatives([{ key: "marketing", price: 900 }], []).items[0].price).toBe(900);
  });
  it("сравнението не променя сумата — тя е само от редовете на офертата", () => {
    const main = buildItems([{ key: "nivo-1" }]).items;
    expect(totals(main, 0, "incl").one_time).toBe(3900);
  });
  it("таблицата: трите нива по реда на каталога, препоръчаното е редът на офертата, цената е от реда", () => {
    const main = buildItems([{ key: "nivo-2", price: 6500 }]).items;
    const alts = buildAlternatives([{ key: "nivo-3" }, { key: "nivo-1" }], ["nivo-2"]).items;
    const t = compareTable(main, alts)!;
    expect(t.columns.map((c) => c.key)).toEqual(["nivo-1", "nivo-2", "nivo-3"]);
    expect(t.columns.map((c) => c.recommended)).toEqual([false, true, false]);
    const row = (label: string) => t.rows.find((r) => r.label === label)!.values;
    expect(row("Лични срещи с Ивайло")).toEqual(["4 — по 1 на месец", "8 — по 2 на месец", "16 — всяка седмица"]);
    expect(row("Цена")).toEqual(["3 900 €", "6 500 €", "9 900 €"]);
    // сменена цена → вноските от стълбата не важат за този ред
    expect(row("На вноски през TBI Bank")).toEqual(["от 195 €/мес (24 мес.)", "—", "от 494 €/мес (24 мес.)"]);
    expect(compareTitle(main, alts)).toBe("Трите нива — за сравнение");
  });
  it("без факти в каталога няма таблица, а заглавието е общо", () => {
    const main = buildItems([{ key: "eli" }]).items;
    const alts = buildAlternatives([{ key: "komanden" }], ["eli"]).items;
    expect(compareTable(main, alts)).toBeNull();
    expect(compareTable(main, [])).toBeNull();
    expect(compareTitle(main, alts)).toBe("Другите варианти — за сравнение");
    expect(compareNote(main, "vie")).toMatch(/Препоръчваме Ви „Ели · гласов AI агент“/);
  });
  it("фактите за сравнение покриват всички нива на програмата", () => {
    for (const key of ["nivo-0", "nivo-1", "nivo-2", "nivo-3"]) {
      const c = MODULE_BY_KEY[key].compare!;
      for (const r of COMPARE_ROWS) expect(c[r.key], `${key}.${r.key}`).toBeTruthy();
    }
  });
});

describe("свободните раздели и „Кой е Ивайло Петев“", () => {
  it("празните раздели отпадат, текстът се подрязва", () => {
    expect(
      cleanSections([
        { title: " Графикът ", text: " всеки вторник " },
        { title: "", text: "без заглавие" },
        { title: "Само заглавие" },
        { title: "Точки", bullets: [" едно ", ""] },
      ])
    ).toEqual([
      { title: "Графикът", text: "всеки вторник" },
      { title: "Точки", bullets: ["едно"] },
    ]);
  });
  it("разделът за Ивайло носи числата от CRM-а с дата и линкове към сайта", () => {
    expect(ABOUT.proof).toMatch(/клиента · \d+ проведени срещи от август · \d+ активни месечни услуги · към \d{2}\.\d{2}\.\d{4}/);
    for (const l of ABOUT.links) expect(/^https:\/\/(promarketing\.pw|youtu\.be|www\.youtube\.com)\//.test(l.url)).toBe(true);
    // случаите са тези от сайта; имената на фирмите излизат само с изричното „да“ (SHOW_CLIENT_NAMES)
    expect(ABOUT.cases).toHaveLength(CLIENT_CASES.length);
    if (!SHOW_CLIENT_NAMES) for (const c of CLIENT_CASES) expect(ABOUT.cases.join(" ")).not.toContain(c.name);
    // нашето съдържание — без емоджита (NotoSans няма глифове) и без обещания
    expect(ABOUT.paragraphs.join(" ")).not.toMatch(/гарантир|№\s*1|най-добр/i);
  });
});

describe("грешките на човешки", () => {
  it("дълъг P.S. казва колко е позволено и колко е подадено", () => {
    const raw = { contact_id: "93693295-3b32-4924-a88a-c3699a26e81d", template_key: "programa-1", ps: "x".repeat(2656) };
    const parsed = buildSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errs = describeIssues(parsed.error.issues, raw);
      expect(errs).toHaveLength(1);
      expect(errs[0]).toMatch(/P\.S\. \(ps\): най-много 400 знака, а са 2656/);
      expect(errs[0]).toMatch(/свободен раздел/);
    }
  });
  it("схемата приема сравнение, раздели и „Кой е Ивайло“", () => {
    const parsed = buildSchema.safeParse({
      contact_id: "93693295-3b32-4924-a88a-c3699a26e81d",
      template_key: "programa-1",
      alternatives: [{ key: "nivo-2" }, { key: "nivo-3" }],
      about: true,
      sections: [{ title: "Графикът", text: "Всеки вторник и четвъртък." }],
    });
    expect(parsed.success).toBe(true);
  });
});
