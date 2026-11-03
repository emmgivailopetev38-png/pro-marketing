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
