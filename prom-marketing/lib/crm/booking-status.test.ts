import { describe, expect, it } from "vitest";
import {
  isLiveBooking,
  markValidFor,
  pickBookingAt,
  sameInstant,
  stampMsgsForMove,
  upcomingOfPerson,
  type BookingLite,
} from "./booking-status";
import { dueKind, sentKindsFor } from "@/lib/team/sreshta-saobshtenia";

const at = (s: string) => new Date(s).toISOString();

function booking(id: string, scheduled: string, over: Partial<BookingLite> = {}): BookingLite {
  return {
    id,
    status: "accepted",
    scheduled_at: at(scheduled),
    attendee_email: "maria@example.com",
    attendee_phone: "+359888111222",
    ...over,
  };
}

describe("жива среща — само тя получава напомняния", () => {
  it("accepted · pending · confirmed са живи; отменена, преместена, проведена, „не се яви“ — не", () => {
    for (const s of ["accepted", "pending", "confirmed"]) expect(isLiveBooking(s)).toBe(true);
    for (const s of ["cancelled", "rejected", "completed", "no_show", "rescheduled", "", null, undefined]) {
      expect(isLiveBooking(s)).toBe(false);
    }
  });

  it("един и същ час до минута — Cal.com пише „Z“, базата „+00“", () => {
    expect(sameInstant("2026-10-01T12:30:00Z", "2026-10-01T12:30:00.000+00:00")).toBe(true);
    expect(sameInstant("2026-10-01T12:30:00Z", "2026-10-01T15:30:00+03:00")).toBe(true);
    expect(sameInstant("2026-10-01T12:30:00Z", "2026-10-01T12:45:00Z")).toBe(false);
    expect(sameInstant("не е дата", "2026-10-01T12:45:00Z")).toBe(false);
  });
});

describe("пратеното важи за часа, за който е пратено", () => {
  const old = at("2026-09-29T15:15:00+03:00");
  const moved = at("2026-09-30T17:00:00+03:00");

  it("маркер без час (отпреди 01.10) важи, докато срещата не се премести", () => {
    expect(markValidFor({ at: "2026-09-28T07:46:51Z", by: "Димитър" }, old)).toBe(true);
    expect(markValidFor({ at: "x", by: "Димитър", for: old }, old)).toBe(true);
    expect(markValidFor({ at: "x", by: "Димитър", for: old }, moved)).toBe(false);
    expect(markValidFor(null, old)).toBe(false);
  });

  it("при местене старите маркери получават стария час; новите не се пипат", () => {
    const raw = {
      source: "ekip",
      notes: "Записа: Димитър",
      msgs: { remind_day: { at: "2026-09-28T07:46:51Z", by: "Димитър" }, confirm: { at: "y", by: "Д", for: old } },
    };
    const next = stampMsgsForMove(raw, old);
    expect(next).not.toBe(raw);
    expect(next.source).toBe("ekip");
    expect((next.msgs as Record<string, { for: string }>).remind_day.for).toBe(old);
    expect((next.msgs as Record<string, { for: string }>).confirm.for).toBe(old);
    // без маркери — същият обект, нищо за писане
    const bare = { source: "hermes" };
    expect(stampMsgsForMove(bare, old)).toBe(bare);
  });

  it("преместената среща (29.09 → 30.09) получава пак „ден преди“ — за новия час", () => {
    // Истинският случай от 30.09: напомнянията за 29.09 бяха пратени, срещата
    // се премести за 30.09 и за новия час нищо не излизаше.
    const raw = {
      msgs: {
        remind_day: { at: "2026-09-28T07:46:51Z", by: "Димитър" },
        remind_soon: { at: "2026-09-29T09:28:42Z", by: "Димитър" },
      },
    };
    const nowNextDay = new Date("2026-09-29T19:00:00+03:00");
    // преди поправката — маркерите се броят и нищо не е на ред
    expect(dueKind(moved, nowNextDay, sentKindsFor(raw, moved))).toBeNull();
    // след местенето през CRM-а / Cal.com
    const after = stampMsgsForMove(raw, old);
    expect(sentKindsFor(after, moved).size).toBe(0);
    expect(dueKind(moved, nowNextDay, sentKindsFor(after, moved))).toBe("remind_day");
    // и за стария час остава записано, че е пратено
    expect([...sentKindsFor(after, old)].sort()).toEqual(["remind_day", "remind_soon"]);
  });
});

describe("кой ред в CRM-а е срещата от Cal.com", () => {
  const rows = [
    booking("manual-row", "2026-10-02T13:30:00+03:00", { status: "accepted" }),
    booking("other-person", "2026-10-02T13:30:00+03:00", { attendee_email: "ivan@example.com", attendee_phone: "+359877000111" }),
    booking("old-cancelled", "2026-10-02T13:30:00+03:00", { status: "cancelled" }),
  ];

  it("същият човек, същият час — живата има предимство", () => {
    expect(pickBookingAt(rows, at("2026-10-02T13:30:00+03:00"), { email: "Maria@Example.com" })?.id).toBe("manual-row");
    // по телефона, изписан по друг начин
    expect(pickBookingAt(rows, at("2026-10-02T13:32:00+03:00"), { phone: "0888 111 222" })?.id).toBe("manual-row");
  });

  it("друг човек или друг час не се хващат", () => {
    expect(pickBookingAt(rows, at("2026-10-02T14:30:00+03:00"), { email: "maria@example.com" })).toBeNull();
    expect(pickBookingAt(rows, at("2026-10-02T13:30:00+03:00"), { email: "nobody@example.com" })).toBeNull();
  });
});

describe("нов час от картата = старата среща е преместена", () => {
  const now = new Date("2026-10-01T10:00:00+03:00");
  const rows = [
    booking("new", "2026-10-03T11:00:00+03:00"),
    booking("old-upcoming", "2026-10-02T14:00:00+03:00", { attendee_email: "bez-imeil@promarketing.pw", attendee_phone: "0888111222" }),
    booking("past", "2026-09-30T14:00:00+03:00"),
    booking("done", "2026-10-05T14:00:00+03:00", { status: "cancelled" }),
    booking("someone-else", "2026-10-02T15:00:00+03:00", { attendee_email: "ivan@example.com", attendee_phone: "+359877000111" }),
    booking("placeholder-email-only", "2026-10-04T15:00:00+03:00", { attendee_email: "bez-imeil@promarketing.pw", attendee_phone: null }),
  ];

  it("затварят се само предстоящите живи срещи на същия човек, без новата", () => {
    const hit = upcomingOfPerson(rows, { email: "maria@example.com", phone: "+359888111222" }, now, "new");
    expect(hit.map((r) => r.id)).toEqual(["old-upcoming"]);
  });

  it("имейлът-запълвач не прави двама различни души един човек", () => {
    const hit = upcomingOfPerson(rows, { email: "bez-imeil@promarketing.pw", phone: null }, now, "new");
    expect(hit).toEqual([]);
  });
});
