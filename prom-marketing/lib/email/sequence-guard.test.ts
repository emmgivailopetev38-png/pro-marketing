import { describe, expect, it } from "vitest";
import { AUTOMATION_EXCLUDED_STAGES, automationSkipReason, isDuplicateCard } from "./sequence-guard";

describe("предпазителят на автоматичните поредици", () => {
  it("картон „ДУБЛИКАТ …“ не получава нищо, с главни или малки букви", () => {
    expect(isDuplicateCard("ДУБЛИКАТ Иван Петров")).toBe(true);
    expect(isDuplicateCard("дубликат — Иван Петров")).toBe(true);
    expect(isDuplicateCard("  ДУБЛИКАТ")).toBe(true);
    expect(automationSkipReason({ full_name: "ДУБЛИКАТ Иван", stage: "lead" })).toBe("duplicate");
  });

  it("обикновено име минава, празно или липсващо име също не е дубликат", () => {
    expect(isDuplicateCard("Иван Петров")).toBe(false);
    expect(isDuplicateCard("Иван (дубликат?)")).toBe(false);
    expect(isDuplicateCard(null)).toBe(false);
    expect(isDuplicateCard(undefined)).toBe(false);
    expect(automationSkipReason({ full_name: "Иван Петров", stage: "contacted" })).toBeNull();
  });

  it("won и lost са извън всяка автоматика; останалите етапи — не", () => {
    expect(AUTOMATION_EXCLUDED_STAGES).toEqual(["won", "lost"]);
    expect(automationSkipReason({ full_name: "Dimitar Yordanov", stage: "lost" })).toBe("stage_excluded");
    expect(automationSkipReason({ full_name: "Клиент", stage: "won" })).toBe("stage_excluded");
    for (const stage of ["lead", "contacted", "offer_sent", "meeting", "negotiation"]) {
      expect(automationSkipReason({ full_name: "Иван", stage }), stage).toBeNull();
    }
  });

  it("дубликатът тежи повече от етапа", () => {
    expect(automationSkipReason({ full_name: "ДУБЛИКАТ X", stage: "lost" })).toBe("duplicate");
  });
});
