import { describe, expect, it } from "vitest";
import {
  countMatches,
  daysUntil,
  deadlineStrip,
  deadlineText,
  deadlineTone,
  dedupeBy,
  groupByColumns,
  matchPayloadSchema,
  matchRow,
  programChange,
  programPayloadSchema,
  programRow,
  sortPrograms,
  todaySofia,
} from "./finansirane-rules";

const TODAY = "2026-11-10";
const CID = "3f1c2b6e-9a1d-4c3e-8f2a-1b2c3d4e5f60";

describe("срокът", () => {
  it("дни до срока и цветът", () => {
    expect(daysUntil("2026-11-10", TODAY)).toBe(0);
    expect(daysUntil("2026-12-10", TODAY)).toBe(30);
    expect(daysUntil("2026-11-01", TODAY)).toBe(-9);
    expect(daysUntil(null, TODAY)).toBeNull();
    expect(deadlineTone("2026-12-10", TODAY)).toBe("urgent"); // точно 30 дни → червено
    expect(deadlineTone("2026-12-11", TODAY)).toBe("ok");
    expect(deadlineTone("2026-11-09", TODAY)).toBe("past");
    expect(deadlineTone(null, TODAY)).toBe("none");
  });
  it("текстът", () => {
    expect(deadlineText("2026-11-10", TODAY)).toBe("днес");
    expect(deadlineText("2026-11-11", TODAY)).toBe("утре");
    expect(deadlineText("2026-11-22", TODAY)).toBe("след 12 дни");
    expect(deadlineText("2026-11-09", TODAY)).toBe("изтече преди 1 ден");
    expect(deadlineText(undefined, TODAY)).toBe("без срок");
  });
  it("днес е по софийско време", () => {
    expect(todaySofia(new Date("2026-11-10T22:30:00Z"))).toBe("2026-11-11"); // 00:30 в София
    expect(todaySofia(new Date("2026-11-10T21:30:00Z"))).toBe("2026-11-10");
  });
});

describe("сортирането", () => {
  const P = (key: string, status: string, deadline: string | null, priority = 3) => ({ key, name: key, status, deadline, priority });
  it("активните по срок, без срок отзад, затворените най-накрая", () => {
    const rows = [
      P("zatvorena", "closed", "2026-11-12"),
      P("bez-srok", "open", null),
      P("dalech", "open", "2027-03-01"),
      P("blizo", "open", "2026-11-20"),
      P("predstoi", "upcoming", "2026-11-15"),
      P("postoyanna", "rolling", null),
      P("iztekla", "open", "2026-11-01"),
    ];
    expect(sortPrograms(rows, TODAY).map((r) => r.key)).toEqual([
      "blizo",
      "dalech",
      "iztekla",
      "bez-srok",
      "postoyanna",
      "predstoi",
      "zatvorena",
    ]);
  });
  it("при еднакъв срок решава приоритетът", () => {
    const rows = [P("b", "open", "2026-12-01", 3), P("a", "open", "2026-12-01", 1)];
    expect(sortPrograms(rows, TODAY).map((r) => r.key)).toEqual(["a", "b"]);
  });
  it("лентата горе: само активни с бъдещ срок, по срок", () => {
    const rows = [P("z", "closed", "2026-11-12"), P("x", "upcoming", "2027-01-10"), P("y", "open", "2026-11-25"), P("old", "open", "2026-10-01"), P("n", "open", null)];
    expect(deadlineStrip(rows, TODAY).map((r) => r.key)).toEqual(["y", "x"]);
  });
});

describe("валидацията", () => {
  const base = { key: "pvu-digitalizaciya-2026", name: "Дигитализация на МСП", status: "open", deadline: "2026-12-15" };
  it("една програма, масив или { programs }", () => {
    expect(programPayloadSchema.parse(base)).toHaveLength(1);
    expect(programPayloadSchema.parse([base, { ...base, key: "az-umenia" }])).toHaveLength(2);
    expect(programPayloadSchema.parse({ programs: [base] })).toHaveLength(1);
  });
  it("лош ключ, статус, дата, url → отказ", () => {
    expect(programPayloadSchema.safeParse({ ...base, key: "Дигитализация" }).success).toBe(false);
    expect(programPayloadSchema.safeParse({ ...base, status: "otvorena" }).success).toBe(false);
    expect(programPayloadSchema.safeParse({ ...base, deadline: "15.12.2026" }).success).toBe(false);
    expect(programPayloadSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(programPayloadSchema.safeParse({ ...base, category: "nqkva" }).success).toBe(false);
    expect(programPayloadSchema.safeParse(Array.from({ length: 101 }, (_, i) => ({ ...base, key: `k${i}` }))).success).toBe(false);
  });
  it("датата с час се реже до деня; null чисти полето", () => {
    const [p] = programPayloadSchema.parse({ ...base, deadline: "2026-12-15T17:00:00+02:00", open_date: null });
    expect(p.deadline).toBe("2026-12-15");
    expect(p.open_date).toBeNull();
  });
  it("съвпадения: масив до 500, fit 0–100, contact_id uuid", () => {
    const m = { program_key: "pvu-digitalizaciya-2026", contact_id: CID, fit: 80, reason: "МСП с онлайн магазин" };
    expect(matchPayloadSchema.parse([m])).toHaveLength(1);
    expect(matchPayloadSchema.parse({ matches: [m] })).toHaveLength(1);
    expect(matchPayloadSchema.safeParse([{ ...m, fit: 120 }]).success).toBe(false);
    expect(matchPayloadSchema.safeParse([{ ...m, contact_id: "123" }]).success).toBe(false);
    expect(matchPayloadSchema.safeParse(m).success).toBe(false); // само масив
    expect(matchPayloadSchema.safeParse(Array.from({ length: 501 }, () => m)).success).toBe(false);
  });
});

describe("upsert", () => {
  it("какво се е сменило: само статус и срок, само подадените", () => {
    const prev = { key: "k", status: "upcoming", deadline: "2026-12-01" };
    expect(programChange(prev, { key: "k", status: "open" })).toEqual({ key: "k", status: { from: "upcoming", to: "open" } });
    expect(programChange(prev, { key: "k", deadline: "2026-12-20" })).toEqual({ key: "k", deadline: { from: "2026-12-01", to: "2026-12-20" } });
    expect(programChange(prev, { key: "k", status: "upcoming", deadline: "2026-12-01", name: "друго име" })).toBeNull();
    expect(programChange(prev, { key: "k" })).toBeNull(); // не са подадени → няма промяна
    expect(programChange(prev, { key: "k", deadline: null })).toEqual({ key: "k", deadline: { from: "2026-12-01", to: null } });
  });
  it("редът за базата: без undefined, last_checked_at по подразбиране", () => {
    const row = programRow({ key: "k", name: "N", deadline: undefined, notes: null }, "2026-11-10T08:00:00.000Z");
    expect(row).toEqual({ key: "k", name: "N", notes: null, last_checked_at: "2026-11-10T08:00:00.000Z" });
  });
  it("съвпадението: без program_key и без status", () => {
    const row = matchRow({ program_key: "k", contact_id: CID, fit: 70 }, "pid");
    expect(row).toEqual({ contact_id: CID, fit: 70, program_id: "pid" });
    expect("status" in row).toBe(false);
  });
  it("дубликатите: последният печели; групите по еднакви колони", () => {
    const d = dedupeBy([{ k: "a", v: 1 }, { k: "b", v: 2 }, { k: "a", v: 3 }], (r) => r.k);
    expect(d).toEqual([{ k: "b", v: 2 }, { k: "a", v: 3 }]);
    const g = groupByColumns([{ a: 1, b: 2 }, { b: 3, a: 4 }, { a: 5 }]);
    expect(g).toHaveLength(2);
    expect(g[0]).toHaveLength(2);
  });
  it("броят по статус", () => {
    const c = countMatches([
      { program_id: "p1", status: "nov" },
      { program_id: "p1", status: "nov" },
      { program_id: "p1", status: "spechelen" },
      { program_id: "p2", status: "ne" },
    ]);
    expect(c.get("p1")).toMatchObject({ total: 3, nov: 2, spechelen: 1 });
    expect(c.get("p2")).toMatchObject({ total: 1, ne: 1 });
  });
});
