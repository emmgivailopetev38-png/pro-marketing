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

  it("структурата е тази от срещата: 3–5 тайни, 4–5 подаръка, „без“ частта е един ред", () => {
    expect(NA_ZHIVO.taini.length).toBeGreaterThanOrEqual(3);
    expect(NA_ZHIVO.taini.length).toBeLessThanOrEqual(5);
    expect(NA_ZHIVO.bonusi.items.length).toBeGreaterThanOrEqual(4);
    expect(NA_ZHIVO.bonusi.items.length).toBeLessThanOrEqual(5);
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
    // Вниманието филтрира само по „вече търсиш допълнителен доход“ — без AI.
    expect(NA_ZHIVO.vnimanie).toContain("вече търсиш");
    expect(NA_ZHIVO.vnimanie).not.toMatch(/\bAI\b/);
    // Заглавието е с думите му; подзаглавието казва „бързо и лесно, вместо теб“.
    expect(NA_ZHIVO.headline.before.startsWith("Ето тайната как да изградиш допълнителен доход")).toBe(true);
    expect(NA_ZHIVO.sub).toContain("бързо и лесно");
    // Без безплатен достъп до софтуера и Академията в подаръците.
    const podaraci = JSON.stringify(NA_ZHIVO.bonusi).toLowerCase();
    expect(podaraci.includes("академия")).toBe(false);
    expect(podaraci.includes("достъп до petevai")).toBe(false);
    // Първият подарък е тестът за страха.
    expect(NA_ZHIVO.bonusi.items[0].name).toContain("Ще замени ли AI работата ти");
  });

  it("отзивите на страницата съществуват в OTZIVI", () => {
    const ids = new Set(OTZIVI.map((o) => o.id));
    for (const id of NA_ZHIVO.dokazatelstvo.otziviIds) expect(ids.has(id)).toBe(true);
  });
});
