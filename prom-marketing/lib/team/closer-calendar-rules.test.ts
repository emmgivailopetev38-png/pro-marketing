import { describe, expect, it } from "vitest";
import {
  calRefusalReason,
  inviteUid,
  nextInviteStep,
  phoneKey,
  readInviteState,
  realEmail,
  type CloserInviteState,
} from "./closer-calendar-rules";

const now = new Date("2026-11-11T14:00:00.000Z");
const state: CloserInviteState = {
  uid: "sreshta-1@promarketing.pw",
  seq: 0,
  to: "george@example.com",
  start: "2026-11-17T09:00:00.000Z",
  sent_at: "2026-11-11T13:55:00.000Z",
};

describe("поканата към календара на клоузъра — какво следва от промяна", () => {
  it("без пратена покана няма какво да се мести или отменя", () => {
    expect(nextInviteStep({ state: null, status: "cancelled", scheduledIso: state.start, now })).toEqual({ kind: "none" });
  });

  it("същият час, жива среща → нищо", () => {
    expect(nextInviteStep({ state, status: "accepted", scheduledIso: "2026-11-17T09:00:00+00:00", now })).toEqual({
      kind: "none",
    });
  });

  it("преместена → нова покана със следващ номер", () => {
    expect(nextInviteStep({ state, status: "accepted", scheduledIso: "2026-11-18T10:30:00.000Z", now })).toEqual({
      kind: "move",
      seq: 1,
    });
  });

  it("отменена предстояща → отмяна", () => {
    expect(nextInviteStep({ state, status: "cancelled", scheduledIso: state.start, now })).toEqual({ kind: "cancel", seq: 1 });
  });

  it("проведена и „не се яви“ остават в календара", () => {
    const after = new Date("2026-11-17T11:00:00.000Z");
    expect(nextInviteStep({ state, status: "completed", scheduledIso: state.start, now: after })).toEqual({ kind: "none" });
    expect(nextInviteStep({ state, status: "no_show", scheduledIso: state.start, now: after })).toEqual({ kind: "none" });
  });

  it("отменена, след като часът е минал → не се праща отмяна", () => {
    const after = new Date("2026-11-17T11:00:00.000Z");
    expect(nextInviteStep({ state, status: "cancelled", scheduledIso: state.start, now: after })).toEqual({ kind: "none" });
  });

  it("вече отменена покана не се отменя втори път", () => {
    const s = { ...state, seq: 1, cancelled_at: "2026-11-12T08:00:00.000Z" };
    expect(nextInviteStep({ state: s, status: "cancelled", scheduledIso: state.start, now })).toEqual({ kind: "none" });
  });

  it("върната среща след отмяна → поканата тръгва пак", () => {
    const s = { ...state, seq: 1, cancelled_at: "2026-11-12T08:00:00.000Z" };
    expect(nextInviteStep({ state: s, status: "accepted", scheduledIso: state.start, now })).toEqual({ kind: "move", seq: 2 });
  });
});

describe("паметта за поканата", () => {
  it("чете само пълен запис", () => {
    expect(readInviteState(null)).toBeNull();
    expect(readInviteState({ closer_invite: { uid: "x" } })).toBeNull();
    expect(readInviteState({ closer_invite: { ...state, seq: "2" } })?.seq).toBe(0);
    expect(readInviteState({ closer_invite: state })).toMatchObject({ uid: state.uid, to: state.to, cancelled_at: null });
  });

  it("UID-ът е постоянен за срещата; пробата е отделна", () => {
    expect(inviteUid("abc")).toBe("sreshta-abc@promarketing.pw");
    expect(inviteUid("abc", true)).toBe("sreshta-abc-proba@promarketing.pw");
  });
});

describe("отказът на Cal.com с човешки думи", () => {
  it("зает или липсващ слот", () => {
    expect(calRefusalReason("User either already has booking at this time or is not available")).toContain("12–18");
    expect(calRefusalReason("no_available_users_found_error")).toContain("свободен слот");
  });
  it("липсващ телефон, мрежа, непознато", () => {
    expect(calRefusalReason("phone_required")).toBe("липсва телефон");
    expect(calRefusalReason("The operation was aborted due to timeout")).toBe("Cal.com не отговори навреме");
    expect(calRefusalReason("HTTP 500")).toBe("HTTP 500");
    expect(calRefusalReason(null)).toBe("няма отговор от Cal.com");
  });
});

describe("дребните помощници", () => {
  it("ключът за търсене в /ekip е последните 9 цифри", () => {
    expect(phoneKey("+359 877 224 410")).toBe("877224410");
    expect(phoneKey("0877224410")).toBe("877224410");
    expect(phoneKey("123")).toBeNull();
  });
  it("адресите-заместители не са имейл на човека", () => {
    expect(realEmail("bez-imeil@promarketing.pw")).toBeNull();
    expect(realEmail("ivo+glas-359888444454@gmail.com")).toBeNull();
    expect(realEmail(" Mmz@Abv.bg ")).toBe("mmz@abv.bg");
  });
});
