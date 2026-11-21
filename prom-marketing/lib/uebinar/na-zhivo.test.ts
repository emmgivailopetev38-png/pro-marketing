import { describe, expect, it } from "vitest";
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

  it("структурата е тази от срещата: 3–5 тайни, 4–5 бонуса, „без“ част", () => {
    expect(NA_ZHIVO.taini.length).toBeGreaterThanOrEqual(3);
    expect(NA_ZHIVO.taini.length).toBeLessThanOrEqual(5);
    expect(NA_ZHIVO.bonusi.items.length).toBeGreaterThanOrEqual(4);
    expect(NA_ZHIVO.bonusi.items.length).toBeLessThanOrEqual(5);
    expect(NA_ZHIVO.bez.every((b) => b.startsWith("Без "))).toBe(true);
  });

  it("няма думи, които водят грешните хора или които Meta спира", () => {
    const all = JSON.stringify(NA_ZHIVO).toLowerCase();
    for (const zabraneno of ["без пари", "без никакви умения", "начален капитал", "пасивен доход", "гарантирано", "напусни работа"]) {
      expect(all.includes(zabraneno)).toBe(false);
    }
  });
});
