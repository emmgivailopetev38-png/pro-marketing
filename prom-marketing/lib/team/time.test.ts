import { describe, it, expect } from "vitest";
import { defaultRetryAt, isoToSofiaLocal, sofiaLocalToIso, todayEndIso } from "./time";

describe("софийско време ↔ UTC", () => {
  it("лятото е +3, зимата +2", () => {
    expect(sofiaLocalToIso("2026-09-17T11:00")).toBe("2026-09-17T08:00:00.000Z");
    expect(sofiaLocalToIso("2026-12-01T11:00")).toBe("2026-12-01T09:00:00.000Z");
  });

  it("невалидното е null, а обратното преобразуване връща същото", () => {
    expect(sofiaLocalToIso("")).toBeNull();
    expect(sofiaLocalToIso("утре")).toBeNull();
    expect(sofiaLocalToIso(null)).toBeNull();
    expect(isoToSofiaLocal("2026-09-17T08:00:00.000Z")).toBe("2026-09-17T11:00");
    expect(isoToSofiaLocal("2026-12-01T09:00:00.000Z")).toBe("2026-12-01T11:00");
  });

  it("не вдига сутринта → след 3 часа; следобед → следващата работна сутрин 10:00", () => {
    // сряда 16.09.2026, 10:30 София = 07:30Z
    const morning = new Date("2026-09-16T07:30:00.000Z");
    expect(defaultRetryAt(morning).toISOString()).toBe("2026-09-16T10:30:00.000Z");
    // сряда 16:00 София = 13:00Z → четвъртък 10:00 София = 07:00Z
    const afternoon = new Date("2026-09-16T13:00:00.000Z");
    expect(defaultRetryAt(afternoon).toISOString()).toBe("2026-09-17T07:00:00.000Z");
    // петък 16:00 → понеделник 10:00
    const friday = new Date("2026-09-18T13:00:00.000Z");
    expect(defaultRetryAt(friday).toISOString()).toBe("2026-09-21T07:00:00.000Z");
    // събота сутрин → понеделник 10:00
    const saturday = new Date("2026-09-19T07:30:00.000Z");
    expect(defaultRetryAt(saturday).toISOString()).toBe("2026-09-21T07:00:00.000Z");
  });

  it("краят на деня е 23:59:59 в София", () => {
    expect(todayEndIso(new Date("2026-09-16T07:30:00.000Z"))).toBe("2026-09-16T20:59:59.999Z");
  });
});
