import { describe, expect, it } from "vitest";
import { NAPOMNYANIA, dalzhimiImeili, sglobiImeil } from "./napomnyania";
import { IMEILI_TEKSTOVE, SMS_TEKSTOVE } from "./napomnyania-tekstove";

const T = (iso: string) => new Date(iso).getTime();
const nishto = { nomera: new Set<number>() };

describe("графикът на писмата", () => {
  it("№0 веднага, №1 след 10 минути", () => {
    const zap = "2026-11-26T05:00:00+02:00";
    expect(dalzhimiImeili(zap, T("2026-11-26T05:01:00+02:00"), nishto)).toEqual([0]);
    expect(dalzhimiImeili(zap, T("2026-11-26T05:11:00+02:00"), { nomera: new Set([0]) })).toEqual([1]);
  });

  it("съдържанието тръгва по ред, по едно на „час“", () => {
    const zap = "2026-11-26T05:00:00+02:00";
    const sent = new Set([0, 1]);
    expect(dalzhimiImeili(zap, T("2026-11-26T12:05:00+02:00"), { nomera: sent })).toEqual([2]);
    // в същия час второ не тръгва
    expect(dalzhimiImeili(zap, T("2026-11-26T12:20:00+02:00"), { nomera: new Set([0, 1, 2]), poslednoSadarzhanie: T("2026-11-26T12:05:00+02:00") })).toEqual([]);
    expect(dalzhimiImeili(zap, T("2026-11-26T18:35:00+02:00"), { nomera: new Set([0, 1, 2]), poslednoSadarzhanie: T("2026-11-26T12:05:00+02:00") })).toEqual([3]);
  });

  it("включено по-късно: продължава от следващия час, без да праща няколко наведнъж", () => {
    const zap = "2026-11-26T05:00:00+02:00";
    // включено в 27.11 10:30 — №0 и №1 тръгват веднага, от съдържанието само №2
    expect(dalzhimiImeili(zap, T("2026-11-27T10:30:00+02:00"), nishto)).toEqual([0, 1, 2]);
  });

  it("часът трябва да е поне час след записването", () => {
    const zap = "2026-11-26T11:30:00+02:00";
    expect(dalzhimiImeili(zap, T("2026-11-26T12:05:00+02:00"), { nomera: new Set([0, 1]) })).toEqual([]);
  });

  it("напомнянията: №8/№9 само за записаните преди тях, №10/№11 за всеки", () => {
    const rano = "2026-11-26T05:00:00+02:00";
    const all = new Set([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(dalzhimiImeili(rano, T("2026-11-28T19:02:00+02:00"), { nomera: all })).toEqual([8]);
    expect(dalzhimiImeili(rano, T("2026-11-29T09:01:00+02:00"), { nomera: new Set([...all, 8]) })).toEqual([9]);
    const kasno = "2026-11-29T18:30:00+02:00";
    // записан в 18:30 в неделя: без „бърз въпрос“ (последните 3 часа), №10 веднага, №1 след 10 мин
    expect(dalzhimiImeili(kasno, T("2026-11-29T18:31:00+02:00"), nishto)).toEqual([10]);
    expect(dalzhimiImeili(kasno, T("2026-11-29T18:41:00+02:00"), { nomera: new Set([10]) })).toEqual([1]);
    expect(dalzhimiImeili(kasno, T("2026-11-29T19:01:00+02:00"), { nomera: new Set([1, 10]) })).toEqual([11]);
  });

  it("след началото нищо от подготовката не тръгва", () => {
    expect(dalzhimiImeili("2026-11-26T05:00:00+02:00", T("2026-11-29T20:00:00+02:00"), nishto)).toEqual([]);
  });

  it("включено след одобрението на Ивайло (25.11.2026)", () => {
    expect(NAPOMNYANIA.vklyucheni).toBe(true);
  });
});

describe("текстовете", () => {
  it("12 писма, всяко с тема, без „—“ и с въпрос накрая", () => {
    expect(IMEILI_TEKSTOVE.map((x) => x.n)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (const x of IMEILI_TEKSTOVE) {
      expect(x.tema.length, `тема ${x.n}`).toBeGreaterThan(3);
      expect(x.tekst, `№${x.n}`).not.toContain("—");
      expect(x.tekst, `№${x.n}`).not.toContain("⚠️");
      expect(x.tekst.replace(/\n\nИвайло\s*$/u, "").trim().endsWith("?"), `№${x.n} свършва с въпрос`).toBe(true);
    }
  });

  it("писмото се сглобява с името, календара и линка за отписване", () => {
    const m = sglobiImeil(1, "Мария Петрова", "https://ivailopetev.com/api/uebinar/otpisvane?k=x");
    expect(m.tekst).toContain("Здравей, Мария,");
    expect(m.tekst).not.toMatch(/\{име\}|\{календар\}/);
    expect(m.html).toContain('href="https://ivailopetev.com/viber"');
    expect(m.html).toContain("отпиши ме");
    // линковете са от домейна на подателя (Resend), без дългия линк на Google
    expect(m.html).toContain('href="https://ivailopetev.com/kalendar"');
    expect(m.html).not.toContain("calendar.google.com");
    const bez = sglobiImeil(2, null, "https://x");
    expect(bez.tekst.startsWith("Здравей,\n")).toBe(true);
  });

  it("SMS-ите са до 159 знака (с личния линк ~22 знака)", () => {
    for (const [k, v] of Object.entries(SMS_TEKSTOVE)) {
      expect(v.replace("[link]", "https://notf.bg/abcd12").length, k).toBeLessThanOrEqual(159);
      expect(v, k).toMatch(/^[\x20-\x7E]+$/); // само латиница — евтино и без разбити знаци
    }
  });
});
