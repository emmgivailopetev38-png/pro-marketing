import { describe, expect, it } from "vitest";
import { isQuotaReason, judgeCredits } from "./credits";

const NOW = 1_793_000_000_000;
const conv = (minAgo: number, status: string) => ({
  conversation_id: `c${minAgo}`,
  start_time_unix_secs: Math.floor((NOW - minAgo * 60_000) / 1000),
  status,
});

describe("judgeCredits", () => {
  it("работещ последен разговор → ok", () => {
    expect(judgeCredits(conv(5, "done"), conv(60, "done"), false, NOW)).toEqual({ state: "ok", freshOutage: false });
  });

  it("паднал по друга причина → ok (не спираме хората)", () => {
    expect(judgeCredits(conv(5, "failed"), undefined, false, NOW).state).toBe("ok");
  });

  it("квота преди 5 мин след работещ разговор → out + аларма", () => {
    expect(judgeCredits(conv(5, "failed"), conv(120, "done"), true, NOW)).toEqual({ state: "out", freshOutage: true });
  });

  it("втори провал подред → out без нова аларма", () => {
    expect(judgeCredits(conv(5, "failed"), conv(40, "failed"), true, NOW)).toEqual({ state: "out", freshOutage: false });
  });

  it("провал отпреди 6+ часа → нова серия, пак аларма", () => {
    expect(judgeCredits(conv(5, "failed"), conv(7 * 60, "failed"), true, NOW).freshOutage).toBe(true);
  });

  it("квота отпреди повече от 30 мин → пускаме един разговор да провери", () => {
    expect(judgeCredits(conv(31, "failed"), conv(90, "failed"), true, NOW).state).toBe("ok");
  });
});

describe("isQuotaReason", () => {
  it("разпознава текста на ElevenLabs", () => {
    expect(isQuotaReason("[quota_exceeded] You've run out of credits. Add credits or upgrade your plan")).toBe(true);
    expect(isQuotaReason("websocket closed")).toBe(false);
    expect(isQuotaReason(undefined)).toBe(false);
  });
});
