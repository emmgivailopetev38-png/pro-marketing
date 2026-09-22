import { describe, expect, it } from "vitest";
import { daysLaterAt, isWeekend, retryFromPreset, talkedRetryAt, threeHoursLater } from "./retry-rules";

const sofia = (s: string) => new Date(s); // ISO с отместване

describe("retry-rules", () => {
  it("след 3 часа в работен ден остава след 3 часа", () => {
    const now = sofia("2026-09-22T09:00:00+03:00"); // вторник
    expect(threeHoursLater(now).toISOString()).toBe(sofia("2026-09-22T12:00:00+03:00").toISOString());
  });

  it("след 3 часа късно вечер отива на следващата работна сутрин", () => {
    const now = sofia("2026-09-22T18:30:00+03:00"); // вторник 18:30 → 21:30 е късно
    expect(threeHoursLater(now).toISOString()).toBe(sofia("2026-09-23T10:00:00+03:00").toISOString());
  });

  it("след 3 часа в събота отива на понеделник 10:00", () => {
    const now = sofia("2026-09-26T11:00:00+03:00"); // събота
    expect(isWeekend(now)).toBe(true);
    expect(threeHoursLater(now).toISOString()).toBe(sofia("2026-09-28T10:00:00+03:00").toISOString());
  });

  it("след 7 дни е същият ден другата седмица, в 10:00", () => {
    const now = sofia("2026-09-22T15:00:00+03:00"); // вторник
    expect(daysLaterAt(now, 7).toISOString()).toBe(sofia("2026-09-29T10:00:00+03:00").toISOString());
  });

  it("след 3 дни от четвъртък прескача уикенда", () => {
    const now = sofia("2026-09-24T15:00:00+03:00"); // четвъртък → неделя → понеделник
    expect(daysLaterAt(now, 3).toISOString()).toBe(sofia("2026-09-28T10:00:00+03:00").toISOString());
  });

  it("presets", () => {
    const now = sofia("2026-09-22T09:00:00+03:00");
    expect(retryFromPreset("tomorrow", null, now)?.toISOString()).toBe(sofia("2026-09-23T10:00:00+03:00").toISOString());
    expect(retryFromPreset("3d", null, now)?.toISOString()).toBe(sofia("2026-09-25T10:00:00+03:00").toISOString());
    expect(retryFromPreset("custom", "2026-09-30T14:30", now)?.toISOString()).toBe(sofia("2026-09-30T14:30:00+03:00").toISOString());
    expect(retryFromPreset("custom", "", now)).toBeNull();
    expect(retryFromPreset("nope", null, now)).toBeNull();
  });

  it("говорихме без среща: по подразбиране след 3 дни, иначе по избора", () => {
    const now = sofia("2026-09-22T09:00:00+03:00");
    expect(talkedRetryAt(null, now).toISOString()).toBe(sofia("2026-09-25T10:00:00+03:00").toISOString());
    expect(talkedRetryAt("7", now).toISOString()).toBe(sofia("2026-09-29T10:00:00+03:00").toISOString());
    expect(talkedRetryAt("99", now).toISOString()).toBe(sofia("2026-09-25T10:00:00+03:00").toISOString());
  });
});

describe("sameOrNextWorkingDayAt", () => {
  it("рано сутрин в работен ден → същия ден в 10:00", async () => {
    const { sameOrNextWorkingDayAt } = await import("./retry-rules");
    expect(sameOrNextWorkingDayAt(new Date("2026-09-22T07:00:00+03:00")).toISOString()).toBe(new Date("2026-09-22T10:00:00+03:00").toISOString());
    expect(sameOrNextWorkingDayAt(new Date("2026-09-22T11:00:00+03:00")).toISOString()).toBe(new Date("2026-09-23T10:00:00+03:00").toISOString());
    expect(sameOrNextWorkingDayAt(new Date("2026-09-26T07:00:00+03:00")).toISOString()).toBe(new Date("2026-09-28T10:00:00+03:00").toISOString());
  });
});
