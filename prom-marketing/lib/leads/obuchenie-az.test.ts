import { describe, expect, it } from "vitest";
import { activityBody, answersSummary, cleanUtm, countdownText, normalizeBgPhone } from "./obuchenie-az";

describe("/obuchenie-az — помощниците", () => {
  it("телефонът — толерантно към българските формати", () => {
    expect(normalizeBgPhone("0888 123 456")).toBe("+359888123456");
    expect(normalizeBgPhone("+359 88 812 3456")).toBe("+359888123456");
    expect(normalizeBgPhone("00359888123456")).toBe("+359888123456");
    expect(normalizeBgPhone("088-812-3456")).toBe("+359888123456");
    expect(normalizeBgPhone("082 123 456")).toBe("+35982123456");
    expect(normalizeBgPhone("+44 7700 900123")).toBe("+447700900123");
    expect(normalizeBgPhone("123")).toBeNull();
    expect(normalizeBgPhone("abc0888123456")).toBeNull();
    expect(normalizeBgPhone("")).toBeNull();
  });

  it("UTM — само познатите ключове", () => {
    expect(cleanUtm({ utm_source: " fb ", utm_campaign: "az", foo: "x", utm_term: "" })).toEqual({ utm_source: "fb", utm_campaign: "az" });
  });

  it("бележката и отговорите", () => {
    const lead = { full_name: "Иван", phone: "+359888123456", email: null, company: "Ресто ЕООД", employees: "s6_15", utm: { utm_source: "fb" } };
    expect(answersSummary(lead)).toBe("Служители на трудов договор: 6–15");
    const body = activityBody(lead);
    expect(body).toMatch(/Кампания: AI обучение АЗ 2026-11/);
    expect(body).toMatch(/Служители на трудов договор: 6–15/);
    expect(body).toMatch(/Фирма: Ресто ЕООД/);
    expect(body).toMatch(/UTM: utm_source=fb/);
  });

  it("обратното броене до 16.11 16:00", () => {
    expect(countdownText(new Date("2026-11-08T20:00:00+02:00"))).toBe("До края на приема: 7 дни 20 часа");
    expect(countdownText(new Date("2026-11-15T15:00:00+02:00"))).toBe("До края на приема: 1 ден 1 час");
    expect(countdownText(new Date("2026-11-16T14:30:00+02:00"))).toBe("До края на приема: 1 час 30 мин");
    expect(countdownText(new Date("2026-11-16T16:00:00+02:00"))).toBeNull();
  });
});
