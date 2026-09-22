import { describe, it, expect } from "vitest";
import {
  dueReminders,
  levelForAge,
  reminderKey,
  sofiaHour,
  withinWorkingHours,
  type ReminderCandidate,
} from "./lead-reminders";

function lead(id: string, minutesAgo: number, now: Date): ReminderCandidate {
  return {
    id,
    full_name: id,
    phone: "+359888000000",
    email: null,
    business: null,
    source: "meta_lead",
    created_at: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
  };
}

describe("кога напомняме", () => {
  it("нивото расте с възрастта, преди 45 минути няма напомняне", () => {
    expect(levelForAge(10)).toBeNull();
    expect(levelForAge(44)).toBeNull();
    expect(levelForAge(45)).toBe(1);
    expect(levelForAge(179)).toBe(1);
    expect(levelForAge(180)).toBe(2);
    expect(levelForAge(24 * 60)).toBe(3);
    expect(levelForAge(40 * 60)).toBe(3);
  });

  it("нищо не тръгва нощем", () => {
    // 07:30 София = 04:30Z (лято)
    expect(withinWorkingHours(new Date("2026-09-17T04:30:00.000Z"))).toBe(false);
    expect(sofiaHour(new Date("2026-09-17T04:30:00.000Z"))).toBe(7);
    expect(withinWorkingHours(new Date("2026-09-17T06:00:00.000Z"))).toBe(true); // 09:00
    expect(withinWorkingHours(new Date("2026-09-17T17:30:00.000Z"))).toBe(true); // 20:30
    expect(withinWorkingHours(new Date("2026-09-17T18:30:00.000Z"))).toBe(false); // 21:30
  });
});

describe("кои напомняния са дължими", () => {
  const now = new Date("2026-09-17T09:00:00.000Z");

  it("праща само най-високото заслужено ниво и не повтаря вече пратено", () => {
    const candidates = [lead("nov", 20, now), lead("chaka", 60, now), lead("stoi", 5 * 60, now)];
    const due = dueReminders(candidates, new Set(), now);
    expect(due.map((d) => [d.contact.id, d.level])).toEqual([
      ["stoi", 2],
      ["chaka", 1],
    ]);

    const after = dueReminders(candidates, new Set([reminderKey("stoi", 2), reminderKey("chaka", 1)]), now);
    expect(after).toEqual([]);
  });

  it("лийд, престоял нощта, получава едно напомняне, не три", () => {
    const due = dueReminders([lead("noshtuval", 14 * 60, now)], new Set(), now);
    expect(due).toHaveLength(1);
    expect(due[0].level).toBe(2);
  });

  it("по-старите от 48 часа не се напомнят — те са в общата опашка", () => {
    expect(dueReminders([lead("star", 50 * 60, now)], new Set(), now)).toEqual([]);
  });

  it("най-дълго чакащият е най-отгоре", () => {
    const due = dueReminders([lead("a", 60, now), lead("b", 300, now), lead("c", 120, now)], new Set(), now);
    expect(due.map((d) => d.contact.id)).toEqual(["b", "c", "a"]);
  });
});
