import { describe, expect, it } from "vitest";
import { isFirstMeeting } from "./closer-rules";

const now = new Date("2026-11-01T14:00:00Z");

describe("isFirstMeeting — новите срещи са за клоузъра, фолоуъпите при Ивайло", () => {
  it("нов лийд без срещи → първа среща", () => {
    expect(isFirstMeeting({ stage: "lead", activities: [{ activity_type: "meta_lead", occurred_at: "2026-11-01T05:17:00Z" }], now })).toBe(true);
  });
  it("бъдещата среща, която току-що се записва, не брои за минала", () => {
    expect(isFirstMeeting({ stage: "discovery", activities: [{ activity_type: "meeting", occurred_at: "2026-11-02T14:45:00Z" }], now })).toBe(true);
  });
  it("проведена среща преди това → фолоуъп", () => {
    expect(isFirstMeeting({ stage: "discovery", activities: [{ activity_type: "meeting", occurred_at: "2026-10-15T12:00:00Z" }, { activity_type: "meeting", occurred_at: "2026-11-02T14:00:00Z" }], now })).toBe(false);
  });
  it("оферта или фактура → фолоуъп, независимо от етапа", () => {
    expect(isFirstMeeting({ stage: "discovery", activities: [{ activity_type: "offer", occurred_at: "2026-10-20T10:00:00Z" }], now })).toBe(false);
  });
  it("етап след оферта → фолоуъп дори без записи", () => {
    for (const stage of ["proposal", "negotiating", "won", "lost"]) expect(isFirstMeeting({ stage, activities: [], now })).toBe(false);
  });
  it("истинските етапи от CRM-а след презентация/оферта → фолоуъп (Ивайло, 03.11)", () => {
    for (const stage of ["presentation_sent", "offer_sent"]) expect(isFirstMeeting({ stage, activities: [], now })).toBe(false);
  });
  it("оферта, създадена от Ивайло, или презентация → фолоуъп, дори етапът да е discovery", () => {
    for (const activity_type of ["offer_created", "offer_ready", "presentation_sent", "payment_received"])
      expect(isFirstMeeting({ stage: "discovery", activities: [{ activity_type, occurred_at: "2026-10-08T10:00:00Z" }], now })).toBe(false);
  });
  it("ред в offers → фолоуъп, без значение от етапа и записите", () => {
    expect(isFirstMeeting({ stage: "contacted", activities: [], hasOffer: true, now })).toBe(false);
  });
  it("обаждане или Viber преди срещата не правят фолоуъп", () => {
    expect(isFirstMeeting({ stage: "contacted", activities: [{ activity_type: "call", occurred_at: "2026-10-26T09:24:00Z" }, { activity_type: "viber_sent", occurred_at: "2026-10-29T06:18:00Z" }], now })).toBe(true);
  });
});

import { closerForBooking, pickCloser, sortClosers } from "./closer-rules";

describe("двама клоузъри · честното редуване", () => {
  const georgi = { id: "g", created_at: "2026-10-25T00:00:00Z" };
  const teodor = { id: "t", created_at: "2026-11-24T00:00:00Z" };
  const closers = [teodor, georgi];

  it("първият по реда на влизане е клоузърът по подразбиране", () => {
    expect(sortClosers(closers).map((c) => c.id)).toEqual(["g", "t"]);
  });

  it("следващата среща е на този с по-малко срещи", () => {
    expect(pickCloser(closers, new Map([["g", 3], ["t", 1]]))?.id).toBe("t");
    expect(pickCloser(closers, new Map([["g", 1], ["t", 4]]))?.id).toBe("g");
  });

  it("при равенство — който не е получил последната", () => {
    expect(pickCloser(closers, new Map(), null)?.id).toBe("g");
    expect(pickCloser(closers, new Map([["g", 2], ["t", 2]]), "g")?.id).toBe("t");
    expect(pickCloser(closers, new Map([["g", 2], ["t", 2]]), "t")?.id).toBe("g");
  });

  it("картон с клоузър остава при него; после записващият клоузър; после изборът на сетъра", () => {
    const counts = new Map([["g", 0], ["t", 5]]);
    expect(closerForBooking({ closers, ownerId: "t", actorId: "g", wantedId: "g", counts })?.id).toBe("t");
    expect(closerForBooking({ closers, ownerId: null, actorId: "t", wantedId: "g", counts })?.id).toBe("t");
    expect(closerForBooking({ closers, ownerId: null, actorId: "setter", wantedId: "t", counts })?.id).toBe("t");
    expect(closerForBooking({ closers, ownerId: null, actorId: "setter", wantedId: null, counts })?.id).toBe("g");
  });

  it("без клоузъри — никой", () => {
    expect(pickCloser([], new Map())).toBeNull();
  });
});
