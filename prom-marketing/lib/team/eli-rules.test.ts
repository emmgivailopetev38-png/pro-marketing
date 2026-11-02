import { describe, expect, it } from "vitest";
import { summarizeEli, type EliRow } from "./eli-rules";

const row = (over: Partial<EliRow>): EliRow => ({
  contact_id: "c1",
  activity_type: "voice_outbound",
  occurred_at: "2026-11-02T05:05:00Z",
  metadata: null,
  ...over,
});

describe("summarizeEli", () => {
  it("нищо от Ели → няма запис", () => {
    expect(summarizeEli([]).get("c1")).toBeUndefined();
  });

  it("само набирания → „не вдига“ с броя и последния час", () => {
    const info = summarizeEli([
      row({ occurred_at: "2026-11-02T05:05:00Z" }),
      row({ occurred_at: "2026-11-01T07:10:00Z" }),
    ]).get("c1")!;
    expect(info.line).toContain("Ели звъня 2 пъти");
    expect(info.line).toContain("не вдига");
    expect(info.line).toContain("07:05"); // 05:05Z = 07:05 София
    expect(info.summary).toBeNull();
  });

  it("едно набиране → „веднъж“", () => {
    const info = summarizeEli([row({})]).get("c1")!;
    expect(info.line).toContain("веднъж");
  });

  it("кратък разговор (< 20 сек) → „затвори веднага“, без резюме", () => {
    const info = summarizeEli([
      row({ activity_type: "voice_call", metadata: { duration_secs: 12, call_successful: "failure", summary: "затвори" } }),
    ]).get("c1")!;
    expect(info.line).toContain("затвори веднага");
    expect(info.summary).toBeNull();
  });

  it("истински разговор → продължителност и резюмето за Георги", () => {
    const info = summarizeEli([
      row({
        activity_type: "voice_call",
        metadata: { duration_secs: 155, call_successful: "success", summary: "Иска да говори с човек по телефона." },
      }),
      row({}),
    ]).get("c1")!;
    expect(info.line).toContain("Ели говори с него");
    expect(info.line).toContain("2:35 мин");
    expect(info.summary).toBe("Иска да говори с човек по телефона.");
  });

  it("неуспешен дълъг разговор → „без резултат“", () => {
    const info = summarizeEli([
      row({ activity_type: "voice_call", metadata: { duration_secs: 65, call_successful: "failure" } }),
    ]).get("c1")!;
    expect(info.line).toContain("без резултат");
  });

  it("разделя по контакти", () => {
    const m = summarizeEli([row({}), row({ contact_id: "c2", activity_type: "voice_call", metadata: { duration_secs: 60 } })]);
    expect(m.get("c1")!.line).toContain("звъня");
    expect(m.get("c2")!.line).toContain("говори");
  });
});
