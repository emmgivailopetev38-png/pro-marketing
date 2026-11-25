import { describe, expect, it } from "vitest";
import { OTZIVI } from "@/lib/site/otzivi";
import { NA_ZHIVO, calendarUrl, denOtSedmicata, endISO } from "./na-zhivo";

describe("/na-zhivo — текстът и датата", () => {
  it("денят от седмицата в надписа съвпада с датата", () => {
    expect(NA_ZHIVO.dateLabel.startsWith(denOtSedmicata())).toBe(true);
  });

  it("часът в надписа е часът на датата по българско време", () => {
    const hm = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Sofia",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(NA_ZHIVO.dateISO));
    expect(NA_ZHIVO.dateLabel).toContain(hm);
    expect(NA_ZHIVO.dayShort).toContain(hm);
    // Подзаглавието казва същия ден и час като рекламите.
    expect(NA_ZHIVO.sub).toContain(NA_ZHIVO.dayShort);
  });

  it("краят е след началото и линкът за календара носи двете", () => {
    expect(new Date(endISO()).getTime()).toBeGreaterThan(new Date(NA_ZHIVO.dateISO).getTime());
    const u = new URL(calendarUrl());
    expect(u.searchParams.get("dates")).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
  });

  it("структурата е тази от срещата: 3–5 тайни, 4–6 подаръка, „без“ частта е един ред", () => {
    expect(NA_ZHIVO.taini.length).toBeGreaterThanOrEqual(3);
    expect(NA_ZHIVO.taini.length).toBeLessThanOrEqual(5);
    expect(NA_ZHIVO.bonusi.items.length).toBeGreaterThanOrEqual(4);
    expect(NA_ZHIVO.bonusi.items.length).toBeLessThanOrEqual(6);
    // Числото в заглавието и в последния ред е броят на подаръците.
    expect(NA_ZHIVO.bonusi.title.startsWith(`${NA_ZHIVO.bonusi.items.length} подаръка`)).toBe(true);
    expect(NA_ZHIVO.bonusi.total).toContain(`Всичките ${NA_ZHIVO.bonusi.items.length}`);
    NA_ZHIVO.bonusi.items.forEach((g, i) => expect(g.kind.startsWith(`Подарък №${i + 1} `)).toBe(true));
    expect(typeof NA_ZHIVO.bez).toBe("string");
    expect(NA_ZHIVO.bez.startsWith("Без ")).toBe(true);
    expect(NA_ZHIVO.bez).not.toContain("\n");
  });

  it("няма думи, които водят грешните хора или които Meta спира", () => {
    const all = JSON.stringify(NA_ZHIVO).toLowerCase();
    for (const zabraneno of ["без пари", "без никакви умения", "начален капитал", "пасивен доход", "гарантирано", "напусни работа"]) {
      expect(all.includes(zabraneno)).toBe(false);
    }
  });

  it("корекциите на Стефчо (23.11.2026) са вътре", () => {
    const all = JSON.stringify(NA_ZHIVO).toLowerCase();
    // Името на метода отпада изцяло; „бранш“ и „търсачът“ не се разбират.
    for (const ne of ["покажи, не продавай", "покажи, не", "бранш", "търсачът"]) {
      expect(all.includes(ne)).toBe(false);
    }
    // Вниманието филтрира по „вече търсиш… допълнителен доход“ — доходът е без „с AI“ (00:31).
    expect(NA_ZHIVO.vnimanie).toContain("вече търсиш");
    expect(NA_ZHIVO.vnimanie).not.toContain("доход с AI");
    // Заглавието е с думите му; подзаглавието казва „бързо и лесно, вместо теб“.
    expect(NA_ZHIVO.headline.before.startsWith("Ето тайната как")).toBe(true);
    expect(NA_ZHIVO.sub).toContain("бързо и лесно");
    // Без безплатен достъп до софтуера и Академията в подаръците.
    const podaraci = JSON.stringify(NA_ZHIVO.bonusi).toLowerCase();
    expect(podaraci.includes("академия")).toBe(false);
    expect(podaraci.includes("достъп до petevai")).toBe(false);
    // Първият подарък е тестът за страха.
    expect(NA_ZHIVO.bonusi.items[0].name).toContain("AI ще замени работата ти");
  });

  it("пропуснатото от видеото и гласовите от 24.11.2026 е вътре", () => {
    const zaglavie = `${NA_ZHIVO.headline.before}${NA_ZHIVO.headline.mark}${NA_ZHIVO.headline.after}`;
    // „работата си със сайтове“ се четеше „работата ми е със сайтове“ — тези две думи не са една до друга.
    expect(zaglavie).not.toContain("работата си със");
    expect(zaglavie).toContain("покрай работата си");
    // Най-голямото възражение е в самото заглавие.
    expect(zaglavie).toContain("дори да не разбираш нищо от AI");
    // Страхът да не изпуснеш е опашката на заглавието.
    expect(NA_ZHIVO.fomo).toContain("някой друг");
    // Подзаглавието казва стъпките с „персонално“; от 25.11 (Ивайло) AI сам прави демото и сам праща.
    expect(NA_ZHIVO.sub).toContain("персонално демо на сайта");
    expect(NA_ZHIVO.sub).toContain("автоматично им праща и имейлите, и съобщенията");
    expect(NA_ZHIVO.sub).toContain("Ако им хареса");
    // „Без“: говориш на AI; дълги разговори; камера — не „без да снимаш“.
    expect(NA_ZHIVO.bez).toContain("само говориш на AI");
    expect(NA_ZHIVO.bez).toContain("дълги разговори, за да им продадеш");
    expect(NA_ZHIVO.bez.toLowerCase()).toContain("без да се снимаш пред камера");
    expect(NA_ZHIVO.bez.toLowerCase()).not.toContain("без да снимаш");
    // Над тайните не пише „3-те тайни“.
    expect(NA_ZHIVO.tainiTitle).toContain("По време на обучението ще ти разкрия");
    // Вторият подарък е видео демонстрацията, третият — томболата.
    expect(NA_ZHIVO.bonusi.items[1].kind).toContain("Видео демонстрация");
    expect(NA_ZHIVO.bonusi.items[2].kind).toContain("Томбола");
    // Главното послание: AI прави почти всичко — и съобщенията ги праща той (Ивайло, 25.11.2026).
    expect(JSON.stringify(NA_ZHIVO.taini)).toContain("автоматично им праща имейли и съобщения");
    expect(JSON.stringify(NA_ZHIVO)).not.toContain("копираш");
  });

  it("видеото на Стефчо, прочетено дума по дума (25.11.2026)", () => {
    const zaglavie = `${NA_ZHIVO.headline.before}${NA_ZHIVO.headline.mark}${NA_ZHIVO.headline.after}`;
    // 05:09 и 06:57: страхът да не изостанеш е и „в споменаването на аудиторията“.
    expect(NA_ZHIVO.vnimanie).toContain("знаеш, че AI е бъдещето");
    // Гласовото от 24.11: страхът е в заглавието, с неговия глагол.
    expect(NA_ZHIVO.fomo).toContain("някой друг");
    expect(NA_ZHIVO.fomo).toContain("да се възползва");
    expect(NA_ZHIVO.fomo).toContain("вместо теб");
    // Без тирета в заглавието — „личи, че е писано с AI“.
    expect(zaglavie).not.toContain("—");
    // 09:41: главното послание е горе, до заглавието.
    expect(NA_ZHIVO.sub).toContain("Почти всичко го върши AI");
    expect(NA_ZHIVO.sub).not.toContain("копираш");
    expect(NA_ZHIVO.sub).toContain("автоматично");
    // 03:47: за „без“ частта каза „иначе е окей“ — „без склад, стока и доставки“ остава.
    expect(NA_ZHIVO.bez).toContain("Без склад, стока и доставки");
    // 04:20: тайна №1 с неговите думи; 06:36: „вместо само да му пишеш за ежедневни задачи“.
    expect(NA_ZHIVO.taini[0].title).toContain("Най-добрият начин за изкарване на допълнителен доход");
    expect(NA_ZHIVO.taini[0].body).toContain("ежедневни задачи");
    expect(NA_ZHIVO.taini[0].body).toContain("покрай основната ти работа");
    // Списъкът на Стефчо (25.11): без „Не X. Y.“ и без „повечето хора“ под тайните.
    expect(JSON.stringify(NA_ZHIVO.taini)).not.toContain("не ти трябва. ");
    expect(JSON.stringify(NA_ZHIVO.taini)).not.toContain("повечето хора");
    expect(JSON.stringify(NA_ZHIVO.taini).toLowerCase()).not.toContain("бизнес модел");
    // 07:11: „да ти намира клиенти много бързо“.
    expect(NA_ZHIVO.taini[2].title).toContain("много бързо");
    // 06:04: „който не използва AI, остава назад“.
    expect(NA_ZHIVO.tainiIntro).toContain("AI е бъдещето");
    expect(NA_ZHIVO.tainiIntro).toContain("остава назад");
    // 11:51 и 12:34: имената на първите два подаръка са неговите.
    expect(NA_ZHIVO.bonusi.items[0].name).toContain("Виж дали AI ще замени работата ти");
    expect(NA_ZHIVO.bonusi.items[1].name).toContain("Виж как го правя на живо пред теб");
    // 13:03: консултацията е лична, по 30 минути, за трима.
    expect(NA_ZHIVO.bonusi.items[2].name).toContain("Лична консултация");
    expect(NA_ZHIVO.bonusi.items[2].name).toContain("30 минути");
    // 14:10: стойност се изписва само с истински цени — празно или с „€“.
    expect(NA_ZHIVO.bonusi.stoinost === "" || NA_ZHIVO.bonusi.stoinost.includes("€")).toBe(true);
    // 15:13–15:45: в авторитета — „правя това, на което те уча“; без уроци, бюджет и поръчки.
    const avt = JSON.stringify(NA_ZHIVO.avtoritet).toLowerCase();
    expect(avt).toContain("правя това, на което те уча");
    for (const ne of ["566", "28 000", "13 000", "урока", "рекламен бюджет", "поръчки"]) expect(avt.includes(ne)).toBe(false);
    // 16:14: „нека да пише, че няма запис“.
    expect(NA_ZHIVO.faq.find((f) => f.q.includes("запис"))?.a.startsWith("Не.")).toBe(true);
  });

  it("отзивите на страницата съществуват в OTZIVI", () => {
    const ids = new Set(OTZIVI.map((o) => o.id));
    for (const id of NA_ZHIVO.dokazatelstvo.otziviIds) expect(ids.has(id)).toBe(true);
  });
});
