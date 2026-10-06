import { describe, it, expect } from "vitest";
import { signTicket, verifyTicket, uuidToB64, b64ToUuid } from "./token";
import { normalizePhone, isBgMobile, seatFor, pickUtm, utmLine, costOfWaiting, isDecisionMaker } from "./people";

const ID = "3f2c8a1e-9b7d-4c3a-8e21-5d6f7a8b9c0d";

describe("билетът (токенът)", () => {
  it("uuid ↔ base64url без загуба", () => {
    const b = uuidToB64(ID)!;
    expect(b).toHaveLength(22);
    expect(b64ToUuid(b)).toBe(ID);
  });

  it("подписаният билет се разчита до същия картон", () => {
    const t = signTicket(ID, "тайна")!;
    expect(t).toHaveLength(31);
    expect(verifyTicket(t, "тайна")).toBe(ID);
  });

  it("чужд ключ, сменена буква или боклук — отказ", () => {
    const t = signTicket(ID, "тайна")!;
    expect(verifyTicket(t, "друга")).toBeNull();
    const tampered = t.slice(0, -1) + (t.endsWith("A") ? "B" : "A");
    expect(verifyTicket(tampered, "тайна")).toBeNull();
    expect(verifyTicket("abc", "тайна")).toBeNull();
    expect(verifyTicket(null, "тайна")).toBeNull();
    expect(verifyTicket(t, null)).toBeNull();
  });

  it("билетът на един не отваря залата на друг", () => {
    const other = "11111111-2222-4333-8444-555555555555";
    const t = signTicket(ID, "тайна")!;
    const forged = `${uuidToB64(other)}.${t.split(".")[1]}`;
    expect(verifyTicket(forged, "тайна")).toBeNull();
  });
});

describe("normalizePhone", () => {
  it("всички записи на един БГ мобилен дават един номер", () => {
    for (const raw of ["0888 123 456", "+359 888 123 456", "00359888123456", "359888123456", "888123456", "+359 0888 123 456", "0888-123-456"]) {
      const r = normalizePhone(raw);
      expect(r.ok, raw).toBe(true);
      if (r.ok) {
        expect(r.e164).toBe("+359888123456");
        expect(r.pretty).toBe("0888 123 456");
        expect(r.bg).toBe(true);
      }
    }
  });

  it("стационарен софийски номер също минава", () => {
    const r = normalizePhone("02 123 4567");
    expect(r.ok && r.e164).toBe("+35921234567");
  });

  it("чужд номер — само с изричен код", () => {
    const r = normalizePhone("+44 7700 900123");
    expect(r.ok && r.bg).toBe(false);
    expect(r.ok && r.e164).toBe("+447700900123");
  });

  it("празно, букви или непълен номер — ясна причина", () => {
    expect(normalizePhone("").ok).toBe(false);
    expect(normalizePhone("Иван").ok).toBe(false);
    expect(normalizePhone("0888 12").ok).toBe(false);
    const r = normalizePhone("12345");
    expect(!r.ok && r.reason).toMatch(/0888/);
  });

  it("SMS — само до български мобилни", () => {
    expect(isBgMobile("+359888123456")).toBe(true);
    expect(isBgMobile("+359988123456")).toBe(true);
    expect(isBgMobile("+35921234567")).toBe(false);
    expect(isBgMobile("+447700900123")).toBe(false);
  });
});

describe("seatFor", () => {
  it("едно и също място при всяко отваряне, в границите на залата", () => {
    const a = seatFor(ID);
    expect(seatFor(ID)).toEqual(a);
    expect(a.hall).toBe(1);
    expect(a.row).toBeGreaterThanOrEqual(1);
    expect(a.row).toBeLessThanOrEqual(12);
    expect(a.seat).toBeGreaterThanOrEqual(1);
    expect(a.seat).toBeLessThanOrEqual(18);
  });

  it("различните хора се разпределят из залата", () => {
    const seats = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const s = seatFor(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
      seats.add(`${s.row}-${s.seat}`);
    }
    expect(seats.size).toBeGreaterThan(100);
  });
});

describe("UTM", () => {
  it("взима само познатите ключове, подрязани", () => {
    const utm = pickUtm(new URLSearchParams("utm_source=meta&utm_campaign=valnata-reg&x=1&utm_medium=%20"));
    expect(utm).toEqual({ utm_source: "meta", utm_campaign: "valnata-reg" });
    expect(utmLine(utm)).toBe("meta / valnata-reg");
    expect(utmLine({})).toBeNull();
  });
});

describe("costOfWaiting", () => {
  it("запитвания × 52 × % клиенти × стойност", () => {
    const r = costOfWaiting({ inquiriesPerWeek: 5, closeRatePct: 20, clientValueEur: 300 });
    expect(r.clientsPerYear).toBe(52);
    expect(r.yearlyEur).toBe(15600);
    expect(r.monthlyEur).toBe(1300);
  });

  it("абсурдните числа се свиват до разумното", () => {
    expect(costOfWaiting({ inquiriesPerWeek: -3, closeRatePct: 150, clientValueEur: 100 }).yearlyEur).toBe(0);
    expect(costOfWaiting({ inquiriesPerWeek: 1, closeRatePct: 150, clientValueEur: 100 }).yearlyEur).toBe(5200);
    expect(costOfWaiting({ inquiriesPerWeek: Number.NaN, closeRatePct: 10, clientValueEur: 10 }).yearlyEur).toBe(0);
  });
});

describe("isDecisionMaker", () => {
  it("собственик и управител — да; останалите — не", () => {
    expect(isDecisionMaker("owner")).toBe(true);
    expect(isDecisionMaker("manager")).toBe(true);
    expect(isDecisionMaker("starting")).toBe(false);
    expect(isDecisionMaker(null)).toBe(false);
  });
});
