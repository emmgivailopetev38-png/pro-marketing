import { describe, expect, it } from "vitest";
import { busyByCloser, defaultScope, feedToken, groupByDay, readFeedToken, visibleMeetings, type CalMeeting, type CalViewer } from "./kalendar-rules";
import { busyFor, findOverlap, type BusyMeeting } from "./sreshti-zastapvane";
import { buildFeedIcs, buildInviteIcs } from "@/lib/cal/ics";

const SECRET = "x".repeat(40);
const m = (id: string, at: string, closerId: string | null, bookedBy: string | null = null, status = "accepted"): CalMeeting => ({
  id,
  at,
  minutes: 60,
  name: `Човек ${id}`,
  phone: null,
  email: null,
  business: null,
  status,
  closerId,
  closer: closerId === "g" ? "Георги" : closerId === "t" ? "Теодор" : null,
  bookedBy,
  meetUrl: null,
  recording: null,
});
const closers = new Set(["g", "t"]);
const all = [m("1", "2026-11-25T10:00:00Z", "g", "Сезер Дурмуш"), m("2", "2026-11-25T10:00:00Z", "t", "Сезер Дурмуш"), m("3", "2026-11-26T12:00:00Z", null), m("4", "2026-11-26T13:00:00Z", "t", "Теодор")];

describe("календарът: кой какво вижда", () => {
  const owner: CalViewer = { kind: "owner", id: null, name: "Ивайло", role: "owner" };
  const teo: CalViewer = { kind: "member", id: "t", name: "Теодор", role: "sales" };
  const sezer: CalViewer = { kind: "member", id: "s", name: "Сезер Дурмуш", role: "setter" };
  const rey: CalViewer = { kind: "member", id: "r", name: "Ресан Хамид", role: "manager" };

  it("собственикът вижда всичко; екипът не вижда срещите на Ивайло", () => {
    expect(visibleMeetings(all, owner, "all", closers).map((x) => x.id)).toEqual(["1", "2", "3", "4"]);
    expect(visibleMeetings(all, rey, "all", closers).map((x) => x.id)).toEqual(["1", "2", "4"]);
  });

  it("„Моите“: клоузърът — които води; сетърът — които е записал", () => {
    expect(defaultScope(teo)).toBe("mine");
    expect(defaultScope(sezer)).toBe("all");
    expect(visibleMeetings(all, teo, "mine", closers).map((x) => x.id)).toEqual(["2", "4"]);
    expect(visibleMeetings(all, sezer, "mine", closers).map((x) => x.id)).toEqual(["1", "2"]);
  });

  it("групиране по дни и заети часове по клоузър", () => {
    expect(groupByDay(all).map((d) => [d.day, d.meetings.length])).toEqual([
      ["2026-11-25", 2],
      ["2026-11-26", 2],
    ]);
    const busy = busyByCloser(all, [{ id: "g", name: "Георги" }, { id: "t", name: "Теодор" }], new Date("2026-11-25T06:00:00Z"), 2);
    expect(busy[0].slots.map((s) => s.times.length)).toEqual([1, 1]);
    expect(busy[1].slots.map((s) => s.times.length)).toEqual([0, 1]);
  });
});

describe("линкът за абонамент", () => {
  it("подписан е и не се подправя", () => {
    const t = feedToken("abc-123", SECRET);
    expect(readFeedToken(t, SECRET)).toBe("abc-123");
    expect(readFeedToken(`${t}.ics`, SECRET)).toBe("abc-123");
    expect(readFeedToken(t.replace("abc-123", "abc-124"), SECRET)).toBeNull();
    expect(readFeedToken("owner.deadbeef", SECRET)).toBeNull();
    expect(readFeedToken(t, "y".repeat(40))).toBeNull();
  });
});

describe("застъпването е по водещ", () => {
  const busy: BusyMeeting[] = [
    { name: "А", startIso: "2026-11-25T10:00:00Z", minutes: 45, leaderId: "g" },
    { name: "Б", startIso: "2026-11-25T12:00:00Z", minutes: 45, leaderId: null },
  ];
  it("срещата на Георги не пречи на Теодор; срещата на Ивайло пречи само на Ивайло", () => {
    expect(findOverlap("2026-11-25T10:15:00Z", busyFor(busy, "g", closers))?.name).toBe("А");
    expect(findOverlap("2026-11-25T10:15:00Z", busyFor(busy, "t", closers))).toBeNull();
    expect(findOverlap("2026-11-25T12:00:00Z", busyFor(busy, "t", closers))).toBeNull();
    expect(findOverlap("2026-11-25T12:00:00Z", busyFor(busy, null, closers))?.name).toBe("Б");
  });
});

describe("ICS", () => {
  it("копието на собственика е „свободно“ време", () => {
    const base = { uid: "u", sequence: 0, method: "REQUEST" as const, startISO: "2026-11-25T10:00:00Z", minutes: 60, summary: "С", organizer: { name: "PM", email: "a@b.bg" }, attendee: { name: "И", email: "c@d.bg" } };
    expect(buildInviteIcs({ ...base, transparent: true })).toContain("TRANSP:TRANSPARENT");
    expect(buildInviteIcs(base)).toContain("TRANSP:OPAQUE");
  });
  it("абонаментният календар носи име и събитията", () => {
    const ics = buildFeedIcs("ProMarketing · срещи", [{ uid: "k-1", startISO: "2026-11-25T10:00:00Z", minutes: 60, summary: "👤 Иван" }]);
    expect(ics).toContain("METHOD:PUBLISH");
    expect(ics).toContain("X-WR-CALNAME:ProMarketing · срещи");
    expect(ics).toContain("UID:k-1");
    expect(ics).toContain("DTSTART:20261125T100000Z");
  });
});

import { partnerSeesThread } from "./messages-rules";
describe("съобщенията на партньора", () => {
  it("вижда общата, личните си и нишките по свои картони — не проектите и чуждите картони", () => {
    const own = new Set(["c1"]);
    expect(partnerSeesThread("general", "me", own)).toBe(true);
    expect(partnerSeesThread("direct:me|owner", "me", own)).toBe(true);
    expect(partnerSeesThread("direct:a|b", "me", own)).toBe(false);
    expect(partnerSeesThread("contact:c1", "me", own)).toBe(true);
    expect(partnerSeesThread("contact:c2", "me", own)).toBe(false);
    expect(partnerSeesThread("project:p1", "me", own)).toBe(false);
    expect(partnerSeesThread("task:t1", "me", own)).toBe(false);
  });
});
