import { describe, expect, it } from "vitest";
import { classifyLead } from "./moi-novi-rules";

const NOW = new Date("2026-11-12T12:00:00Z");
const lead = { id: "c1", email: null, phone: "+359888111222", stage: "lead" };
const eli = (type: string, secs?: number) => ({
  contact_id: "c1",
  activity_type: type,
  occurred_at: "2026-11-12T10:00:00Z",
  metadata: secs === undefined ? {} : { duration_secs: secs },
});
const booking = (at: string, status = "accepted") => ({ id: "b1", status, scheduled_at: at, attendee_email: null, attendee_phone: "0888111222" });

describe("🆕 Моите нови — групите", () => {
  it("никой не е звънял → 🆕", () => {
    expect(classifyLead(lead, [], [], NOW).group).toBe("not_called");
  });
  it("Ели говори 2 мин без среща → 🔥 звънни ти", () => {
    expect(classifyLead(lead, [eli("voice_outbound"), eli("voice_call", 120)], [], NOW).group).toBe("eli_talked");
  });
  it("Ели звъня, не вдига или затвори веднага → 📵", () => {
    expect(classifyLead(lead, [eli("voice_outbound")], [], NOW).group).toBe("eli_no_answer");
    expect(classifyLead(lead, [eli("voice_call", 8)], [], NOW).group).toBe("eli_no_answer");
  });
  it("предстояща среща (по телефона) → 📅, минала → 🗂, отменена не се брои", () => {
    expect(classifyLead(lead, [eli("voice_call", 120)], [booking("2026-11-16T12:00:00Z")], NOW)).toEqual({ group: "meeting", meetingAt: "2026-11-16T12:00:00Z" });
    expect(classifyLead(lead, [], [booking("2026-11-10T12:00:00Z", "completed")], NOW).group).toBe("done");
    expect(classifyLead(lead, [eli("voice_call", 120)], [booking("2026-11-16T12:00:00Z", "cancelled")], NOW).group).toBe("eli_talked");
  });
  it("клиент или отказ → 🗂", () => {
    expect(classifyLead({ ...lead, stage: "lost" }, [], [], NOW).group).toBe("done");
  });
});
