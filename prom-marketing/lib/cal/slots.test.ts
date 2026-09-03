import { describe, it, expect } from "vitest";
import { speakDay, speakTime, speakSlots, matchSlot, type Slot } from "./slots";

/**
 * Часовете тук са писани в UTC нарочно. Машината, на която върви това, е в
 * София, а Vercel е в UTC — тест, който минава само на едната, не пази нищо.
 * Виж и [[bektest-chasova-zona]]: същият капан вече веднъж обърна изводите.
 */

const utc = (iso: string): Date => new Date(iso);
const slot = (iso: string): Slot => ({ startISO: iso, day: iso.slice(0, 10) });

describe("speakTime", () => {
  it("кръглият час се казва „часа“", () => {
    // 07:00 UTC = 10:00 софийско лятно време
    expect(speakTime(utc("2026-09-08T07:00:00Z"))).toBe("10 часа");
  });

  it("половинката се казва „и половина“, не „и трийсет“", () => {
    expect(speakTime(utc("2026-09-08T06:30:00Z"))).toBe("9 и половина");
  });

  it("останалите минути се изговарят както са", () => {
    expect(speakTime(utc("2026-09-08T08:45:00Z"))).toBe("11 и 45");
  });

  it("полунощ е нула часа, а не двайсет и четири", () => {
    // 21:00 UTC = 00:00 софийско на следващия ден
    expect(speakTime(utc("2026-09-08T21:00:00Z"))).toBe("0 часа");
  });
});

describe("speakDay", () => {
  it("казва деня от седмицата и датата на български", () => {
    expect(speakDay(utc("2026-09-08T07:00:00Z"))).toBe("вторник, 8 септември");
  });

  it("късният час не мести деня назад", () => {
    // 20:00 UTC е 23:00 софийско — все още същият вторник.
    expect(speakDay(utc("2026-09-08T20:00:00Z"))).toBe("вторник, 8 септември");
  });
});

describe("speakSlots", () => {
  const slots = [
    slot("2026-09-08T06:00:00Z"),
    slot("2026-09-08T06:30:00Z"),
    slot("2026-09-08T07:00:00Z"),
    slot("2026-09-08T08:00:00Z"),
    slot("2026-09-09T06:00:00Z"),
    slot("2026-09-09T07:00:00Z"),
    slot("2026-09-10T06:00:00Z"),
  ];

  it("предлага най-много два дни — списък от седем дни по телефона е шум", () => {
    const said = speakSlots(slots);
    expect(said).toContain("вторник, 8 септември");
    expect(said).toContain("сряда, 9 септември");
    expect(said).not.toContain("10 септември");
  });

  it("дава най-много три часа на ден", () => {
    const said = speakSlots(slots);
    // Четвъртият час на вторник (11 часа) остава извън изречението.
    expect(said).not.toContain("11 часа");
    expect(said).toContain("9 часа");
  });

  it("свързва последното с „и“, както се говори", () => {
    expect(speakSlots(slots)).toMatch(/9 часа, 9 и половина и 10 часа/);
  });

  it("празният календар не мълчи, а подава следваща стъпка", () => {
    const said = speakSlots([]);
    expect(said).toContain("нямам свободен час");
    expect(said).toContain("кога ти е удобно");
  });
});

describe("matchSlot", () => {
  const slots = [
    slot("2026-09-08T06:30:00Z"), // 9:30
    slot("2026-09-08T07:30:00Z"), // 10:30
    slot("2026-09-08T11:00:00Z"), // 14:00
  ];

  it("намира точния час", () => {
    const m = matchSlot(slots, utc("2026-09-08T07:30:00Z"));
    expect(m.exact?.startISO).toBe("2026-09-08T07:30:00Z");
  });

  it("без точно съвпадение подава най-близкото в рамките на час и половина", () => {
    // Поискано 10:00 софийско; свободни са 9:30 и 10:30 — и двете на 30 мин.
    const m = matchSlot(slots, utc("2026-09-08T07:00:00Z"));
    expect(m.exact).toBeNull();
    expect(m.nearest?.startISO).toBe("2026-09-08T06:30:00Z");
  });

  it("далечен час не се подменя мълчаливо с чужд", () => {
    // Поискано 18:00 софийско — най-близкото свободно е 4 часа по-рано.
    const m = matchSlot(slots, utc("2026-09-08T15:00:00Z"));
    expect(m.exact).toBeNull();
    expect(m.nearest).toBeNull();
  });

  it("празният календар не връща нищо, вместо да гадае", () => {
    const m = matchSlot([], utc("2026-09-08T07:00:00Z"));
    expect(m.exact).toBeNull();
    expect(m.nearest).toBeNull();
  });
});
