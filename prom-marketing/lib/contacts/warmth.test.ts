import { describe, it, expect } from "vitest";
import {
  warmthOf,
  decayFor,
  daysBetween,
  compareWarmth,
  HOT_THRESHOLD,
  WARM_THRESHOLD,
  type WarmthSignal,
} from "./warmth";

const NOW = new Date("2026-09-09T12:00:00+03:00");

/** Сигнал на `days` дни преди NOW. */
function ago(days: number, type: string): WarmthSignal {
  return {
    activity_type: type,
    occurred_at: new Date(NOW.getTime() - days * 86_400_000).toISOString(),
  };
}

describe("decayFor", () => {
  it("брои пълно през първите три дни", () => {
    expect(decayFor(0)).toBe(1);
    expect(decayFor(3)).toBe(1);
  });

  it("пада стъпаловидно и никога до нула", () => {
    expect(decayFor(5)).toBe(0.8);
    expect(decayFor(10)).toBe(0.6);
    expect(decayFor(20)).toBe(0.4);
    expect(decayFor(45)).toBe(0.2);
    expect(decayFor(365)).toBe(0.1);
  });
});

describe("daysBetween", () => {
  it("брои по календарен ден, не по 24 часа", () => {
    // 23:00 вчера и 01:00 днес са един ден разлика, не нула.
    expect(daysBetween("2026-09-08T23:00:00+03:00", "2026-09-09T01:00:00+03:00")).toBe(1);
  });

  it("не връща отрицателно за бъдещ сигнал", () => {
    expect(daysBetween("2026-10-01T10:00:00+03:00", NOW)).toBe(0);
  });
});

describe("warmthOf", () => {
  it("човек, който си е записал час, е топъл", () => {
    const r = warmthOf([ago(1, "booking")], { touched: true, now: NOW });
    expect(r.score).toBe(12);
    expect(r.band).toBe("hot");
  });

  it("нашите докосвания не носят точки", () => {
    const r = warmthOf([ago(1, "email_sent"), ago(2, "offer_sent"), ago(3, "call")], {
      touched: true,
      now: NOW,
    });
    expect(r.score).toBe(0);
    expect(r.reasons).toHaveLength(0);
  });

  it("старият сигнал тежи по-малко от пресния", () => {
    const fresh = warmthOf([ago(1, "offer_viewed")], { touched: true, now: NOW });
    const stale = warmthOf([ago(90, "offer_viewed")], { touched: true, now: NOW });
    expect(fresh.score).toBeGreaterThan(stale.score);
    expect(fresh.band).toBe("hot");
    expect(stale.band).toBe("cold");
  });

  it("недокоснатият се отличава от студения при нула точки", () => {
    const cold = warmthOf([], { touched: true, now: NOW });
    const untouched = warmthOf([], { touched: false, now: NOW });
    expect(cold.score).toBe(0);
    expect(untouched.score).toBe(0);
    expect(cold.band).toBe("cold");
    expect(untouched.band).toBe("untouched");
  });

  it("сумира сигналите и подрежда причините по тежест", () => {
    const r = warmthOf([ago(2, "meta_lead"), ago(1, "voice_call"), ago(1, "voice_web_session")], {
      touched: true,
      now: NOW,
    });
    expect(r.score).toBe(2 + 8 + 4);
    expect(r.reasons[0].label).toBe("говори с гласовия агент");
    expect(r.band).toBe("hot");
  });

  it("непознат тип активност се подминава мълчаливо", () => {
    const r = warmthOf([ago(1, "стара_измислица"), ago(1, "meta_lead")], { touched: true, now: NOW });
    expect(r.score).toBe(2);
    expect(r.reasons).toHaveLength(1);
  });

  it("last_signal_at е най-скорошният сигнал, не първият в списъка", () => {
    const older = ago(10, "meta_lead");
    const newer = ago(2, "offer_viewed");
    const r = warmthOf([newer, older], { touched: true, now: NOW });
    expect(r.last_signal_at).toBe(newer.occurred_at);
  });

  it("праговете се държат на границата", () => {
    // offer_viewed = 7 точки, пресен → точно на прага за hot.
    const onHot = warmthOf([ago(0, "offer_viewed")], { touched: true, now: NOW });
    expect(onHot.score).toBe(HOT_THRESHOLD);
    expect(onHot.band).toBe("hot");

    // meta_lead = 2 точки, пресен → точно на прага за warm.
    const onWarm = warmthOf([ago(0, "meta_lead")], { touched: true, now: NOW });
    expect(onWarm.score).toBe(WARM_THRESHOLD);
    expect(onWarm.band).toBe("warm");
  });
});

describe("compareWarmth", () => {
  it("топлите излизат пред всички", () => {
    const hot = warmthOf([ago(1, "booking")], { touched: true, now: NOW });
    const warm = warmthOf([ago(1, "meta_lead")], { touched: true, now: NOW });
    expect(compareWarmth(hot, warm)).toBeLessThan(0);
  });

  it("недокоснатият изпреварва студения — на него дължим първото докосване", () => {
    const cold = warmthOf([], { touched: true, now: NOW });
    const untouched = warmthOf([], { touched: false, now: NOW });
    expect(compareWarmth(untouched, cold)).toBeLessThan(0);
  });

  it("при равна лента решават точките", () => {
    const more = warmthOf([ago(1, "voice_call")], { touched: true, now: NOW });
    const less = warmthOf([ago(1, "offer_viewed")], { touched: true, now: NOW });
    expect(compareWarmth(more, less)).toBeLessThan(0);
  });

  it("сортирането дава използваем ред", () => {
    const rows = [
      warmthOf([], { touched: true, now: NOW }),
      warmthOf([ago(1, "booking")], { touched: true, now: NOW }),
      warmthOf([], { touched: false, now: NOW }),
      warmthOf([ago(1, "meta_lead")], { touched: true, now: NOW }),
    ].sort(compareWarmth);
    expect(rows.map((r) => r.band)).toEqual(["hot", "warm", "untouched", "cold"]);
  });
});
