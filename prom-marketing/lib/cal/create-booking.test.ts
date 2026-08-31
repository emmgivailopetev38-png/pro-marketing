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

describe("isCalWriteConfigured", () => {
  const saved = process.env.CAL_API_KEY;
  beforeEach(() => { delete process.env.CAL_API_KEY; });
  afterEach(() => { if (saved === undefined) delete process.env.CAL_API_KEY; else process.env.CAL_API_KEY = saved; });

  it("мълчи без ключ — така нищо не се променя, докато Ивайло не го сложи", () => {
    expect(isCalWriteConfigured()).toBe(false);
  });

  it("не приема огризка вместо ключ", () => {
    process.env.CAL_API_KEY = "cal_x";
    expect(isCalWriteConfigured()).toBe(false);
  });

  it("приема истински ключ", () => {
    process.env.CAL_API_KEY = "cal_live_0123456789abcdef";
    expect(isCalWriteConfigured()).toBe(true);
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
