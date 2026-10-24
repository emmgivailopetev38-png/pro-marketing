import { describe, it, expect } from "vitest";
import { daysBetweenDays, rankTopCalls, type TopCallCandidate } from "./top-calls-rules";

const now = new Date("2026-10-24T06:00:00Z"); // петък 09:00 София

function c(p: Partial<TopCallCandidate> & { id: string }): TopCallCandidate {
  return {
    full_name: p.id,
    company: null,
    phone: "0888000000",
    email: null,
    stage: "offer_sent",
    followup_status: "sent_offer",
    deal_value_eur: null,
    next_followup_at: "2026-10-20T07:00:00Z",
    last_heard_from_at: null,
    last_attempt_at: null,
    last_activity: null,
    ...p,
  };
}

describe("Топ 10 за днес", () => {
  it("брои дни между календарни дни", () => {
    expect(daysBetweenDays("2026-10-10", "2026-10-24")).toBe(14);
    expect(daysBetweenDays("2026-10-24", "2026-10-24")).toBe(0);
  });

  it("подрежда по сума, после по давност; won/lost и бъдещите не влизат", () => {
    const r = rankTopCalls(
      [
        c({ id: "малка", deal_value_eur: 800, next_followup_at: "2026-10-01T07:00:00Z" }),
        c({ id: "голяма", deal_value_eur: 3000, next_followup_at: "2026-10-22T07:00:00Z" }),
        c({ id: "без сума стара", next_followup_at: "2026-10-05T07:00:00Z" }),
        c({ id: "без сума днес", next_followup_at: "2026-10-24T08:00:00Z" }),
        c({ id: "спечелен", stage: "won", deal_value_eur: 9000 }),
        c({ id: "загубен", stage: "lost", deal_value_eur: 9000 }),
        c({ id: "утре", deal_value_eur: 9000, next_followup_at: "2026-10-27T07:00:00Z" }),
      ],
      now
    );
    expect(r.top.map((x) => x.name)).toEqual(["голяма", "малка", "без сума стара", "без сума днес"]);
    expect(r.top[0].days_overdue).toBe(2);
    expect(r.top[3].days_overdue).toBe(0);
    expect(r.cold).toBe(0);
  });

  it("изпълненото напомняне (обаждане на деня или след него) не влиза", () => {
    const r = rankTopCalls([c({ id: "звъннато", next_followup_at: "2026-10-20T07:00:00Z", last_attempt_at: "2026-10-21T10:00:00Z" })], now);
    expect(r.top).toHaveLength(0);
  });

  it("студените (lead/contacted без сума, needs_call > 14 дни) са отделен брой", () => {
    const r = rankTopCalls(
      [
        c({ id: "студен", stage: "lead", followup_status: "needs_call", next_followup_at: "2026-09-20T07:00:00Z" }),
        c({ id: "студен 2", stage: "contacted", followup_status: "needs_call", next_followup_at: "2026-10-01T07:00:00Z" }),
        c({ id: "пресен lead", stage: "lead", followup_status: "needs_call", next_followup_at: "2026-10-15T07:00:00Z" }),
        c({ id: "lead със сума", stage: "lead", followup_status: "needs_call", deal_value_eur: 500, next_followup_at: "2026-09-01T07:00:00Z" }),
      ],
      now
    );
    expect(r.cold).toBe(2);
    expect(r.top.map((x) => x.name)).toEqual(["lead със сума", "пресен lead"]);
    expect(r.warm_total).toBe(2);
  });

  it("реже до лимита, но warm_total е всички", () => {
    const many = Array.from({ length: 15 }, (_, i) => c({ id: `k${i}`, deal_value_eur: 100 * i }));
    const r = rankTopCalls(many, now, 10);
    expect(r.top).toHaveLength(10);
    expect(r.warm_total).toBe(15);
    expect(r.top[0].amount).toBe(1400);
  });
});
