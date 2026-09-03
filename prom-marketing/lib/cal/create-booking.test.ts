import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildCalPayload, isCalWriteConfigured, CAL_TIMEZONE } from "./create-booking";

describe("buildCalPayload", () => {
  const base = {
    name: "Иван Антонов",
    email: "Ivan@Example.COM",
    startISO: "2026-09-03T10:00:00.000Z",
  };

  it("праща началото в UTC, както Cal.com иска", () => {
    // Часът е мислен като 13:00 софийско време; навън трябва да излезе 10:00 UTC.
    const body = buildCalPayload({ ...base, startISO: "2026-09-03T13:00:00+03:00" });
    expect(body.start).toBe("2026-09-03T10:00:00.000Z");
  });

  it("сваля имейла до малки букви и слага българския език", () => {
    const a = buildCalPayload(base).attendee as Record<string, unknown>;
    expect(a.email).toBe("ivan@example.com");
    expect(a.language).toBe("bg");
    expect(a.timeZone).toBe(CAL_TIMEZONE);
  });

  it("пропуска телефона и бележката, когато ги няма", () => {
    const body = buildCalPayload(base);
    expect((body.attendee as Record<string, unknown>).phoneNumber).toBeUndefined();
    expect(body.bookingFieldsResponses).toBeUndefined();
  });

  it("носи бележката в описанието на събитието", () => {
    const body = buildCalPayload({ ...base, notes: "Наследство, брат не подписва" });
    expect(body.bookingFieldsResponses).toEqual({ notes: "Наследство, брат не подписва" });
  });
});

/**
 * Тези очаквания са ОБЪРНАТИ на 03.09.2026 и обръщането е нарочно.
 *
 * Дотогава мостът се смяташе за изключен без `CAL_API_KEY` — а такъв никога
 * не беше слаган във Vercel. Тоест функцията „срещата влиза в календара"
 * мълчеше от деня, в който беше написана, и тестът пазеше точно мълчанието.
 *
 * Проверено на живо срещу api.cal.com: `POST /v2/bookings` приема резервация
 * без никаква автентикация, както публичната страница на типа събитие.
 * Ключът остава опционален — за резервация от името на акаунта.
 */
describe("isCalWriteConfigured", () => {
  const saved = process.env.CAL_API_KEY;
  beforeEach(() => { delete process.env.CAL_API_KEY; });
  afterEach(() => { if (saved === undefined) delete process.env.CAL_API_KEY; else process.env.CAL_API_KEY = saved; });

  it("работи и без ключ — Cal.com не иска такъв за публичен тип събитие", () => {
    expect(isCalWriteConfigured()).toBe(true);
  });

  it("ключът не пречи, когато го има", () => {
    process.env.CAL_API_KEY = "cal_live_0123456789abcdef";
    expect(isCalWriteConfigured()).toBe(true);
  });

  it("без потребител в Cal.com няма къде да пише", () => {
    const savedUser = process.env.CAL_USERNAME;
    const savedPublic = process.env.NEXT_PUBLIC_CAL_USERNAME;
    process.env.CAL_USERNAME = "";
    process.env.NEXT_PUBLIC_CAL_USERNAME = "";
    try {
      expect(isCalWriteConfigured()).toBe(false);
    } finally {
      if (savedUser === undefined) delete process.env.CAL_USERNAME; else process.env.CAL_USERNAME = savedUser;
      if (savedPublic === undefined) delete process.env.NEXT_PUBLIC_CAL_USERNAME; else process.env.NEXT_PUBLIC_CAL_USERNAME = savedPublic;
    }
  });
});

// Пазачът срещу капана, който щеше да прати покана точно когато е казано „без
// покана": ElevenLabs подава булевите полета и като текст, а Boolean("false")
// в JavaScript е true.
import { z } from "zod";

const sendInvite = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((v) => {
    if (typeof v !== "string") return v;
    const t = v.trim().toLowerCase();
    if (["false", "0", "не", "ne", "no"].includes(t)) return false;
    if (["true", "1", "да", "da", "yes"].includes(t)) return true;
    return undefined;
  });

describe("send_invite от гласа", () => {
  it("текстът „false\" значи false, не true", () => {
    expect(sendInvite.parse("false")).toBe(false);
    expect(sendInvite.parse("не")).toBe(false);
    expect(sendInvite.parse("0")).toBe(false);
  });

  it("истинските булеви стойности минават непокътнати", () => {
    expect(sendInvite.parse(true)).toBe(true);
    expect(sendInvite.parse(false)).toBe(false);
  });

  it("неразбрана дума не значи отказ — остава по подразбиране", () => {
    expect(sendInvite.parse("може би")).toBeUndefined();
    expect(sendInvite.parse(undefined)).toBeUndefined();
  });
});
