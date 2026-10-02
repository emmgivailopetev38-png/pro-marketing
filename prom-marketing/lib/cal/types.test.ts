import { describe, expect, it } from "vitest";
import { calBookingSchema, rescheduledFromUid, statusFromTrigger } from "./types";

/**
 * Формата е на истинско събитие от cal_webhook_log (30.09.2026) — ключовете и
 * типовете им; съдържанието е измислено. Такива събития падаха на схемата от
 * 17.09 заради `cancellationReason: null`.
 */
function calEvent(trigger: string, extra: Record<string, unknown> = {}) {
  return {
    triggerEvent: trigger,
    createdAt: "2026-09-30T13:38:39.000Z",
    payload: {
      uid: "newUid123",
      title: "Безплатна консултация",
      type: "consultation",
      startTime: "2026-10-02T10:30:00.000Z",
      endTime: "2026-10-02T11:15:00.000Z",
      attendees: [{ name: "Мария Тест", email: "maria@example.com", timeZone: "Europe/Sofia" }],
      responses: { attendeePhoneNumber: { label: "Телефон", value: "+359888111222" } },
      userFieldsResponses: {},
      status: "ACCEPTED",
      cancellationReason: null,
      rejectionReason: null,
      customReplyToEmail: null,
      hashedLink: null,
      metadata: { videoCallUrl: "https://meet.google.com/abc-defg-hij" },
      location: "integrations:google:meet",
      bookingId: 101,
      iCalUID: "x@Cal.com",
      ...extra,
    },
  };
}

describe("схемата на Cal.com", () => {
  it("приема `cancellationReason: null` — до 01.10 тук падаше всяко събитие", () => {
    const r = calBookingSchema.safeParse(calEvent("BOOKING_CREATED"));
    expect(r.success).toBe(true);
  });

  it("отмяна с причина и без", () => {
    expect(calBookingSchema.safeParse(calEvent("BOOKING_CANCELLED", { cancellationReason: "Не мога в петък", status: "CANCELLED" })).success).toBe(true);
    expect(calBookingSchema.safeParse(calEvent("BOOKING_CANCELLED", { status: "CANCELLED" })).success).toBe(true);
  });

  it("преместване: старият uid и старият час се четат", () => {
    const r = calBookingSchema.safeParse(
      calEvent("BOOKING_RESCHEDULED", { rescheduleUid: "oldUid456", rescheduleStartTime: "2026-10-01T09:00:00Z", rescheduleId: 99 })
    );
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(rescheduledFromUid(r.data.payload)).toBe("oldUid456");
    expect(r.data.payload.rescheduleStartTime).toBe("2026-10-01T09:00:00Z");
  });

  it("по-старото поле `fromReschedule` също; същият uid не е „стар“", () => {
    const a = calBookingSchema.parse(calEvent("BOOKING_RESCHEDULED", { fromReschedule: "olderUid" }));
    expect(rescheduledFromUid(a.payload)).toBe("olderUid");
    const b = calBookingSchema.parse(calEvent("BOOKING_RESCHEDULED", { rescheduleUid: "newUid123" }));
    expect(rescheduledFromUid(b.payload)).toBeNull();
  });
});

describe("статусът на реда", () => {
  it("преместената среща е жива в новия час — не „rescheduled“, който напомнянията не познават", () => {
    expect(statusFromTrigger("BOOKING_CREATED")).toBe("confirmed");
    expect(statusFromTrigger("BOOKING_RESCHEDULED")).toBe("confirmed");
    expect(statusFromTrigger("BOOKING_CANCELLED")).toBe("cancelled");
  });
});
