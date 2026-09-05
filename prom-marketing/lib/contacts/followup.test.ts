import { describe, it, expect } from "vitest";
import { alignStage, alignStatus, dayKey, followupState, minStageFor, nextWorkingDayAt } from "./followup";

describe("етап ↔ статус", () => {
  it("изпратена оферта при lead вдига етапа до offer_sent", () => {
    expect(alignStage("lead", "sent_offer")).toBe("offer_sent");
    expect(alignStage("contacted", "sent_offer")).toBe("offer_sent");
    expect(alignStage("discovery", "sent_offer")).toBe("offer_sent");
  });

  it(`никога не връща назад — оферта на масата остава, дори статусът да е „заинтересован"`, () => {
    expect(alignStage("offer_sent", "interested")).toBe("offer_sent");
    expect(alignStage("negotiating", "called_waiting_feedback")).toBe("negotiating");
    expect(alignStage("negotiating", "sent_presentation")).toBe("negotiating");
  });

  it("презентация и проформа си имат етап", () => {
    expect(alignStage("lead", "sent_presentation")).toBe("presentation_sent");
    expect(alignStage("offer_sent", "sent_proforma")).toBe("negotiating");
    expect(alignStage("contacted", "ready_to_close")).toBe("negotiating");
  });

  it(`„да се обади" и „изпратен имейл" не казват нищо за етапа`, () => {
    expect(minStageFor("needs_call")).toBe(null);
    expect(minStageFor("sent_email")).toBe(null);
    expect(alignStage("lead", "needs_call")).toBe("lead");
    expect(alignStage("lead", null)).toBe("lead");
  });

  it("незаинтересован → lost, но спечеленият не става загубен", () => {
    expect(alignStage("contacted", "not_interested")).toBe("lost");
    expect(alignStage("won", "not_interested")).toBe("won");
  });

  it("крайните етапи не се пипат", () => {
    expect(alignStage("won", "sent_offer")).toBe("won");
    expect(alignStage("lost", "sent_offer")).toBe("lost");
  });

  it("спечеленият няма статус за проследяване", () => {
    expect(alignStatus("won", "needs_call")).toBe(null);
    expect(alignStatus("contacted", "needs_call")).toBe("needs_call");
  });
});

describe("календарният ден в София", () => {
  it("23:30 UTC е вече следващият ден в София", () => {
    expect(dayKey("2026-09-03T21:30:00Z")).toBe("2026-09-04");
    expect(dayKey("2026-09-03T20:59:00Z")).toBe("2026-09-03");
  });

  it("следващият работен ден е в 10:00 софийско време", () => {
    // петък 04.09.2026 → понеделник 07.09, 10:00 EEST = 07:00 UTC
    const d = nextWorkingDayAt(new Date("2026-09-04T12:00:00Z"));
    expect(d.toISOString()).toBe("2026-09-07T07:00:00.000Z");
    // сряда → четвъртък
    expect(nextWorkingDayAt(new Date("2026-09-02T06:00:00Z")).toISOString()).toBe("2026-09-03T07:00:00.000Z");
    // през зимата отместването е +2
    expect(nextWorkingDayAt(new Date("2026-12-14T06:00:00Z")).toISOString()).toBe("2026-12-15T08:00:00.000Z");
  });
});

describe("обещаното обаждане", () => {
  const NOW = new Date("2026-09-05T06:00:00Z"); // събота, 09:00 София

  it("напомняне за онзи ден без нито един опит е просрочено", () => {
    expect(followupState({ next_followup_at: "2026-09-03T12:00:00Z", last_heard_from_at: null }, null, NOW)).toBe("overdue");
  });

  it("обаждане в САМИЯ ден на напомнянето го изпълнява — дори да е било по-рано през деня", () => {
    // напомняне 03.09 15:00 София, звънене 03.09 10:30 София
    const c = { next_followup_at: "2026-09-03T12:00:00Z", last_heard_from_at: null };
    expect(followupState(c, "2026-09-03T07:30:00Z", NOW)).toBe("fulfilled");
  });

  it("среща след срока също изпълнява обещанието", () => {
    const c = { next_followup_at: "2026-09-02T09:00:00Z", last_heard_from_at: null };
    expect(followupState(c, "2026-09-04T08:00:00Z", NOW)).toBe("fulfilled");
  });

  it(`„чут" след срока изпълнява обещанието и без записано обаждане`, () => {
    const c = { next_followup_at: "2026-09-02T09:00:00Z", last_heard_from_at: "2026-09-02T14:00:00Z" };
    expect(followupState(c, null, NOW)).toBe("fulfilled");
  });

  it("опит ПРЕДИ деня на напомнянето не го изпълнява", () => {
    const c = { next_followup_at: "2026-09-03T12:00:00Z", last_heard_from_at: "2026-09-01T10:00:00Z" };
    expect(followupState(c, "2026-09-02T10:00:00Z", NOW)).toBe("overdue");
  });

  it("бъдещо напомняне остава бъдеще, дори срещата за този ден вече да е записана", () => {
    const c = { next_followup_at: "2026-09-16T08:00:00Z", last_heard_from_at: null };
    expect(followupState(c, "2026-09-16T08:00:00Z", NOW)).toBe("future");
    expect(followupState(c, "2026-09-04T08:00:00Z", NOW)).toBe("future");
  });

  it("опит с бъдеща дата не изпълнява минало напомняне", () => {
    const c = { next_followup_at: "2026-09-03T12:00:00Z", last_heard_from_at: null };
    expect(followupState(c, "2026-09-10T08:00:00Z", NOW)).toBe("overdue");
  });

  it(`днес е „за днес", утре е „бъдеще"`, () => {
    expect(followupState({ next_followup_at: "2026-09-05T14:00:00Z", last_heard_from_at: null }, null, NOW)).toBe("due_today");
    expect(followupState({ next_followup_at: "2026-09-07T07:00:00Z", last_heard_from_at: null }, null, NOW)).toBe("future");
    expect(followupState({ next_followup_at: null, last_heard_from_at: null }, null, NOW)).toBe("none");
  });
});
