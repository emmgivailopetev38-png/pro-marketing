import { describe, expect, it } from "vitest";
import { leadStatus, matchesQuery, sourceLabel, summarizeLeadActivities, type LeadActivityRow } from "./liidove-rules";
import { callOutcome, closerStats, sofiaDayStart, type NapredakBooking, type PersonRef } from "./napredak-rules";

const NOW = new Date("2026-11-24T16:00:00Z");
const act = (contact_id: string, activity_type: string, outcome: string | null, at: string): LeadActivityRow => ({
  contact_id,
  activity_type,
  title: `${activity_type} ${outcome ?? ""}`,
  occurred_at: at,
  created_by: "Сезер Дурмуш",
  metadata: outcome ? { outcome } : {},
});

describe("всички лийдове: групата на човека", () => {
  const s = summarizeLeadActivities([
    act("a", "call", "no_answer", "2026-11-20T10:00:00Z"),
    act("b", "call", "no_answer", "2026-11-20T10:00:00Z"),
    act("b", "call", "talked", "2026-11-21T10:00:00Z"),
    act("c", "call", "dq", "2026-11-22T10:00:00Z"),
    act("d", "voice_outbound", null, "2026-11-22T10:00:00Z"),
  ]);
  const base = { stage: "lead", followupStatus: null, bookings: [] };

  it("нечут, не вдига, говорили, DQ", () => {
    expect(leadStatus({ ...base, activity: null }, NOW)).toBe("nov");
    expect(leadStatus({ ...base, activity: s.get("a")! }, NOW)).toBe("ne_vdiga");
    expect(leadStatus({ ...base, activity: s.get("b")! }, NOW)).toBe("govorili");
    expect(leadStatus({ ...base, activity: s.get("c")! }, NOW)).toBe("dq");
    expect(leadStatus({ ...base, activity: s.get("d")! }, NOW)).toBe("ne_vdiga");
    expect(s.get("b")?.calls).toBe(2);
  });

  it("срещата решава: предстояща > дошъл > не дошъл; клиентът е най-отгоре", () => {
    const past = { status: "completed", scheduled_at: "2026-11-20T09:00:00Z" };
    const noShow = { status: "no_show", scheduled_at: "2026-11-21T09:00:00Z" };
    const next = { status: "accepted", scheduled_at: "2026-11-26T09:00:00Z" };
    expect(leadStatus({ ...base, activity: null, bookings: [past, next] }, NOW)).toBe("sreshta");
    expect(leadStatus({ ...base, activity: null, bookings: [past] }, NOW)).toBe("doshal");
    expect(leadStatus({ ...base, activity: null, bookings: [past, noShow] }, NOW)).toBe("ne_doshal");
    expect(leadStatus({ ...base, stage: "won", activity: s.get("c")!, bookings: [noShow] }, NOW)).toBe("klient");
    expect(leadStatus({ ...base, stage: "offer_sent", activity: null, bookings: [past] }, NOW)).toBe("oferta");
    expect(leadStatus({ ...base, stage: "lost", activity: s.get("b")!, bookings: [] }, NOW)).toBe("otkaz");
  });

  it("откъде и търсенето", () => {
    expect(sourceLabel("meta_lead", { ad: "Видео 1", campaign: "К" })).toBe("Meta · Видео 1");
    expect(sourceLabel("uebinar-pari", null)).toBe("уебинар");
    const row = { name: "Иван Петров", phone: "+359 888 123 456", email: null, company: null, business: "автосервиз" };
    expect(matchesQuery(row, "0888123456")).toBe(true);
    expect(matchesQuery(row, "автосерв")).toBe(true);
    expect(matchesQuery(row, "мария")).toBe(false);
  });
});

describe("метриките: DQ, срещите на клоузъра, „Днес“", () => {
  it("DQ е отделен изход от разговора", () => {
    expect(callOutcome({ metadata: { outcome: "dq" } })).toBe("dq");
    expect(callOutcome({ metadata: { outcome: "not_interested" } })).toBe("not_interested");
  });

  it("срещите се броят на клоузъра, който ги води — по часа им", () => {
    const teo: PersonRef = { key: "teodor", name: "Теодор", role: "sales", kind: "team", memberId: "t" };
    const b = (id: string, status: string, at: string, closer: string | null): NapredakBooking => ({ id, status, scheduled_at: at, created_at: "2026-11-01T10:00:00Z", notes: null, closer });
    const s = closerStats(
      [
        b("1", "completed", "2026-11-20T09:00:00Z", "Теодор"),
        b("2", "no_show", "2026-11-21T09:00:00Z", "теодор"),
        b("3", "accepted", "2026-11-22T09:00:00Z", "Теодор"),
        b("4", "accepted", "2026-11-27T09:00:00Z", "Теодор"),
        b("5", "completed", "2026-11-20T09:00:00Z", "Джордж Мандаджиев"),
      ],
      teo,
      { from: new Date("2026-11-17T00:00:00Z"), to: NOW },
      NOW
    );
    expect(s).toMatchObject({ scheduled: 3, held: 1, noShow: 1, pastUnmarked: 1, upcoming: 1, showRate: 50 });
  });

  it("„Днес“ започва от полунощ в София — зима и лято", () => {
    expect(sofiaDayStart(new Date("2026-11-24T16:00:00Z")).toISOString()).toBe("2026-11-23T22:00:00.000Z");
    expect(sofiaDayStart(new Date("2026-07-10T08:00:00Z")).toISOString()).toBe("2026-07-09T21:00:00.000Z");
  });
});
