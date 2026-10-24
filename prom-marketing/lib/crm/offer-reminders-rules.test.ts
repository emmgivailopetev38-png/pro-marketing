import { describe, it, expect } from "vitest";
import { nextWorkingMorning, offerReminderDay, offerReminderKey, planFollowupAt, planOfferReminders } from "./offer-reminders-rules";

// четвъртък 24.10? Не — 24.10.2026 е събота; взимаме сряда 21.10 08:00 София (05:00Z)
const wed = new Date("2026-10-21T05:00:00Z");

describe("напомняне за оферта на 3-ия и 7-ия ден", () => {
  it("познава 3 и 7 по календарен ден, другите — не", () => {
    expect(offerReminderDay("2026-10-18T15:30:00Z", wed)).toBe(3);
    expect(offerReminderDay("2026-10-14T06:00:00Z", wed)).toBe(7);
    expect(offerReminderDay("2026-10-19T06:00:00Z", wed)).toBe(null);
    expect(offerReminderDay("2026-10-21T04:00:00Z", wed)).toBe(null);
  });

  it("следващата работна сутрин: днес 10:00, ако е преди 10; иначе утре/понеделник", () => {
    expect(nextWorkingMorning(wed).toISOString()).toBe("2026-10-21T07:00:00.000Z");
    expect(nextWorkingMorning(new Date("2026-10-21T09:00:00Z")).toISOString()).toBe("2026-10-22T07:00:00.000Z");
    // петък следобед → понеделник 10:00
    expect(nextWorkingMorning(new Date("2026-10-23T12:00:00Z")).toISOString()).toBe("2026-10-26T08:00:00.000Z");
    // събота сутрин → понеделник (вече зимно време: 10:00 = 08:00Z)
    expect(nextWorkingMorning(new Date("2026-10-24T05:00:00Z")).toISOString()).toBe("2026-10-26T08:00:00.000Z");
  });

  it("по-ранна бъдеща дата не се пипа; минала или по-късна → сутринта", () => {
    expect(planFollowupAt("2026-10-21T06:30:00Z", wed)).toBe(null);
    expect(planFollowupAt("2026-10-20T06:30:00Z", wed)).toBe("2026-10-21T07:00:00.000Z");
    expect(planFollowupAt("2026-10-29T06:30:00Z", wed)).toBe("2026-10-21T07:00:00.000Z");
    expect(planFollowupAt(null, wed)).toBe("2026-10-21T07:00:00.000Z");
  });

  it("един сигнал на контакт, dedupe по контакт + ден на офертата + праг", () => {
    const r = planOfferReminders(
      [
        { contact_id: "a", sent_at: "2026-10-18T10:00:00Z", label: "оферта" },
        { contact_id: "a", sent_at: "2026-10-18T12:00:00Z", label: "имейл" },
        { contact_id: "b", sent_at: "2026-10-14T10:00:00Z", label: "оферта" },
        { contact_id: "c", sent_at: "2026-10-16T10:00:00Z", label: "оферта" },
      ],
      new Set([offerReminderKey("b", "2026-10-14T10:00:00Z", 7)]),
      wed
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ contact_id: "a", day: 3, label: "имейл" });
    expect(r[0].dedupe_key).toBe("offer-reminder:a:2026-10-18:3");
  });
});
