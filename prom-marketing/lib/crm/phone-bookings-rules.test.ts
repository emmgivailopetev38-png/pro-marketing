import { describe, it, expect } from "vitest";
import { bookingEnd, decidePhoneBooking, hasTrace, isPhoneBooking, isSettleDue, type PhoneBookingLike } from "./phone-bookings-rules";

const now = new Date("2026-10-21T13:00:00Z");

function b(p: Partial<PhoneBookingLike> = {}): PhoneBookingLike {
  return { id: "b1", status: "accepted", scheduled_at: "2026-10-21T08:00:00Z", duration_minutes: 45, meeting_url: null, ...p };
}

describe("телефонни срещи", () => {
  it("телефонна е живата среща без meeting_url", () => {
    expect(isPhoneBooking(b())).toBe(true);
    expect(isPhoneBooking(b({ meeting_url: "  " }))).toBe(true);
    expect(isPhoneBooking(b({ meeting_url: "https://meet.google.com/x" }))).toBe(false);
    expect(isPhoneBooking(b({ status: "completed" }))).toBe(false);
    expect(isPhoneBooking(b({ status: "no_show" }))).toBe(false);
  });

  it("решава се 2 ч след края; без продължителност — 45 мин; старите не се пипат", () => {
    expect(bookingEnd(b({ duration_minutes: null })).toISOString()).toBe("2026-10-21T08:45:00.000Z");
    expect(isSettleDue(b(), now)).toBe(true); // край 08:45 + 2 ч = 10:45 < 13:00
    expect(isSettleDue(b({ scheduled_at: "2026-10-21T10:30:00Z" }), now)).toBe(false); // край 11:15 + 2 ч = 13:15
    expect(isSettleDue(b({ scheduled_at: "2026-09-01T08:00:00Z" }), now)).toBe(false);
  });

  it("следа = обаждане/среща от час преди началото до сега", () => {
    expect(hasTrace([{ activity_type: "call", occurred_at: "2026-10-21T07:10:00Z" }], b(), now)).toBe(true);
    expect(hasTrace([{ activity_type: "meeting", occurred_at: "2026-10-21T08:05:00Z" }], b(), now)).toBe(true);
    expect(hasTrace([{ activity_type: "call", occurred_at: "2026-10-21T06:50:00Z" }], b(), now)).toBe(false);
    expect(hasTrace([{ activity_type: "note", occurred_at: "2026-10-21T08:05:00Z" }], b(), now)).toBe(false);
    expect(hasTrace([{ activity_type: "call", occurred_at: "2026-10-21T14:00:00Z" }], b(), now)).toBe(false);
  });

  it("решението: проведена / без следа / не сега", () => {
    expect(decidePhoneBooking(b(), [{ activity_type: "call", occurred_at: "2026-10-21T08:00:00Z" }], now)).toBe("completed");
    expect(decidePhoneBooking(b(), [], now)).toBe("unclear");
    expect(decidePhoneBooking(b({ scheduled_at: "2026-10-21T12:00:00Z" }), [], now)).toBe("skip");
    expect(decidePhoneBooking(b({ meeting_url: "https://meet.google.com/x" }), [], now)).toBe("skip");
  });
});
