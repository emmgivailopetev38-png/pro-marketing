import { describe, it, expect } from "vitest";
import { agentPatchBody, followupKey, pickDue } from "./followup";

describe("Ели · персонален фолоуъп (опашката)", () => {
  it("ключът е един и същ за един човек и повод, каквито и интервали да има", () => {
    expect(followupKey("c1", "оферта  22.10")).toBe(followupKey("c1", "оферта 22.10"));
    expect(followupKey("c1", "оферта")).not.toBe(followupKey("c2", "оферта"));
  });

  it("взима първо по-важните, после по ред, и не минава мястото за деня", () => {
    const rows = [
      { id: "a", prio: 50, created_at: "2026-10-29T10:00:00Z" },
      { id: "b", prio: 10, created_at: "2026-10-29T10:05:00Z" },
      { id: "c", prio: 10, created_at: "2026-10-29T10:01:00Z" },
      { id: "d", created_at: "2026-10-29T09:00:00Z" },
    ];
    expect(pickDue(rows, { doneToday: 0, cap: 40 }).map((r) => r.id)).toEqual(["c", "b"]);
    expect(pickDue(rows, { doneToday: 39, cap: 40, perRun: 2 }).map((r) => r.id)).toEqual(["c"]);
    expect(pickDue(rows, { doneToday: 40, cap: 40 })).toEqual([]);
  });

  it("PATCH-ът носи само промпта и първото изречение", () => {
    expect(agentPatchBody({ name: "Ели · фолоуъп", prompt: "Ти си Ели", firstMessage: "Здравейте!" })).toEqual({
      name: "Ели · фолоуъп",
      conversation_config: { agent: { first_message: "Здравейте!", prompt: { prompt: "Ти си Ели" } } },
    });
    expect(agentPatchBody({})).toEqual({});
  });
});
