import { describe, expect, it } from "vitest";
import { clashMessage, findOverlap, freeAround, samePerson, tooEarly, type BusyMeeting } from "./sreshti-zastapvane";

const at = (s: string) => new Date(s).toISOString(); // ISO с отместване
const NOW = new Date("2026-09-29T12:00:00+03:00");

// 30.09.2026 — денят, в който 13:45 застана върху 14:00.
const fani: BusyMeeting = { name: "Фани", startIso: at("2026-09-30T14:00:00+03:00"), minutes: 45, email: "fani@abv.bg", phone: "+359888804028" };
const yordan: BusyMeeting = { name: "Йордан", startIso: at("2026-09-30T15:00:00+03:00"), minutes: 45, email: "jordan@abv.bg" };
const koceto: BusyMeeting = { name: "Коцето", startIso: at("2026-09-30T15:45:00+03:00"), minutes: 45, email: "k@gmail.com" };
const busy = [fani, yordan, koceto];

describe("sreshti-zastapvane", () => {
  it("13:45 се застъпва с 14:00, защото срещите са по 45 минути", () => {
    expect(findOverlap(at("2026-09-30T13:45:00+03:00"), busy)?.name).toBe("Фани");
  });

  it("точно една след друга не е застъпване", () => {
    expect(findOverlap(at("2026-09-30T13:15:00+03:00"), busy)).toBeNull(); // 13:15–14:00
    expect(findOverlap(at("2026-09-30T16:30:00+03:00"), busy)).toBeNull(); // след Коцето
  });

  it("половинката след срещата вече не става — старото правило за 30 минути", () => {
    expect(findOverlap(at("2026-09-30T14:30:00+03:00"), busy)?.name).toBe("Фани");
  });

  it("съобщава най-ранната от засегнатите срещи", () => {
    // 14:30–15:15 закача и Фани (до 14:45), и Йордан (от 15:00)
    expect(findOverlap(at("2026-09-30T14:30:00+03:00"), busy)?.name).toBe("Фани");
  });

  it("предлага свободен час преди и след, като прескача всички заети", () => {
    const r = freeAround(at("2026-09-30T14:30:00+03:00"), busy, {}, 45, NOW);
    expect(r.before?.toISOString()).toBe(at("2026-09-30T13:15:00+03:00"));
    // след Фани (14:45) идва Йордан 15:00 и Коцето 15:45 → първото чисто е 16:30
    expect(r.after.toISOString()).toBe(at("2026-09-30T16:30:00+03:00"));
  });

  it("не предлага час преди 10:00 или в миналото", () => {
    const early: BusyMeeting = { name: "Даниел", startIso: at("2026-09-30T10:00:00+03:00"), minutes: 45 };
    expect(freeAround(at("2026-09-30T10:15:00+03:00"), [early], {}, 45, NOW).before).toBeNull();
    const late: BusyMeeting = { name: "Късно", startIso: at("2026-09-30T10:45:00+03:00"), minutes: 45 };
    expect(freeAround(at("2026-09-30T11:00:00+03:00"), [late], {}, 45, NOW).before?.toISOString()).toBe(
      at("2026-09-30T10:00:00+03:00")
    );
    const soon: BusyMeeting = { name: "Скоро", startIso: at("2026-09-29T12:30:00+03:00"), minutes: 45 };
    expect(freeAround(at("2026-09-29T12:40:00+03:00"), [soon], {}, 45, NOW).before).toBeNull();
  });

  it("срещи преди 10:00 не се записват", () => {
    expect(tooEarly(at("2026-10-01T09:45:00+03:00"))).toBe(true);
    expect(tooEarly(at("2026-10-01T10:00:00+03:00"))).toBe(false);
    expect(tooEarly(at("2026-11-02T09:30:00+02:00"))).toBe(true); // зимно време
    expect(tooEarly(at("2026-11-02T14:00:00+02:00"))).toBe(false);
  });

  it("срещата на същия човек не пречи — по имейл или по телефон", () => {
    expect(findOverlap(fani.startIso, busy, { email: "FANI@abv.bg" })).toBeNull();
    expect(findOverlap(fani.startIso, busy, { phone: "0888 804 028" })).toBeNull();
  });

  it("имейлът-запълвач не прави двама души един", () => {
    const phoneOnly: BusyMeeting = { name: "+359888103448", startIso: at("2026-09-30T13:45:00+03:00"), minutes: 45, email: "bez-imeil@promarketing.pw", phone: "+359888103448" };
    expect(samePerson({ email: "bez-imeil@promarketing.pw", phone: "+359877000000" }, phoneOnly)).toBe(false);
    expect(findOverlap(at("2026-09-30T14:00:00+03:00"), [phoneOnly], { email: "bez-imeil@promarketing.pw" })?.name).toBe("+359888103448");
  });

  it("среща без дължина се брои за 45 минути", () => {
    const noLen: BusyMeeting = { name: "Без дължина", startIso: at("2026-10-01T11:00:00+03:00"), minutes: null };
    expect(findOverlap(at("2026-10-01T11:30:00+03:00"), [noLen])?.name).toBe("Без дължина");
    expect(findOverlap(at("2026-10-01T11:45:00+03:00"), [noLen])).toBeNull();
  });

  it("часова среща (60 мин) пази целия си час", () => {
    const hour: BusyMeeting = { name: "Презентация", startIso: at("2026-10-07T08:30:00+03:00"), minutes: 60 };
    expect(findOverlap(at("2026-10-07T09:15:00+03:00"), [hour])?.name).toBe("Презентация");
    expect(findOverlap(at("2026-10-07T09:30:00+03:00"), [hour])).toBeNull();
  });
});

describe("clashMessage", () => {
  it("казва с кого е застъпването и кои часове остават", () => {
    const start = at("2026-09-30T13:45:00+03:00");
    const clash = findOverlap(start, busy)!;
    const { before, after } = freeAround(start, busy, {}, 45, NOW);
    const msg = clashMessage(clash, before, after);
    expect(msg).toContain("Фани");
    expect(msg).toContain("14:45");
    expect(msg).toContain("45 минути");
    expect(msg).toContain("13:15");
  });
});
