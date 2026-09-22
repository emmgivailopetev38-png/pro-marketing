import { describe, expect, it } from "vitest";
import { escalationSummary, escalationVerdict } from "./escalation-rules";
import type { AttemptRow } from "./queue-rules";

const now = new Date("2026-09-22T07:00:00Z");
const row = (daysAgo: number, outcome: string | null, extra: Partial<AttemptRow> = {}): AttemptRow => ({
  contact_id: "c1",
  activity_type: "call",
  title: outcome ?? "",
  occurred_at: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
  created_by: "Димитър",
  metadata: { team: true, outcome },
  ...extra,
});

describe("escalation-rules", () => {
  it("седем дни само „не вдигна“ → връща се на Ивайло", () => {
    const v = escalationVerdict([row(1, "no_answer"), row(4, "no_answer"), row(8, "no_answer")], now);
    expect(v.escalate).toBe(true);
    expect(v.teamAttempts).toBe(3);
    expect(v.noAnswer).toBe(3);
    expect(v.daysSinceFirst).toBe(8);
    expect(escalationSummary(v)).toBe("3 опита от екипа за 8 дни · 3 × не вдигна");
  });

  it("под седем дни — още не", () => {
    expect(escalationVerdict([row(1, "no_answer"), row(5, "no_answer")], now).escalate).toBe(false);
  });

  it("записана среща или „предай на Ивайло“ затваря въпроса", () => {
    expect(escalationVerdict([row(1, "meeting", { activity_type: "meeting" }), row(9, "no_answer")], now).escalate).toBe(false);
    expect(escalationVerdict([row(1, "handoff"), row(9, "no_answer")], now).escalate).toBe(false);
    expect(escalationVerdict([row(1, "not_interested"), row(9, "no_answer")], now).escalate).toBe(false);
  });

  it("говорихме без среща цяла седмица също се връща", () => {
    const v = escalationVerdict([row(1, "talked"), row(4, "talked"), row(8, "no_answer")], now);
    expect(v.escalate).toBe(true);
    expect(v.talked).toBe(2);
  });

  it("вече върнат — брои само опитите след връщането", () => {
    const rows = [row(2, "no_answer"), row(3, null, { activity_type: "escalated", metadata: { escalated: true } }), row(12, "no_answer"), row(15, "no_answer")];
    const v = escalationVerdict(rows, now);
    expect(v.teamAttempts).toBe(1);
    expect(v.escalate).toBe(false);
  });

  it("опитите на Ивайло и маркерите за даване не се броят за екипа", () => {
    const rows = [row(1, null, { metadata: { team: false }, created_by: "Ивайло" }), row(9, null, { activity_type: "team_assigned", metadata: { to_team: true } })];
    const v = escalationVerdict(rows, now);
    expect(v.teamAttempts).toBe(0);
    expect(v.escalate).toBe(false);
  });
});
