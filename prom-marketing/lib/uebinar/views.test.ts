import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({}) }));
vi.mock("@/lib/notifications/telegram", () => ({ tgNotify: {} }));

const { isMilestone, shouldNotify, uebinarTitle } = await import("./views");

describe("уебинарът в картона", () => {
  it("приема само четвъртините", () => {
    for (const n of [0, 25, 50, 75, 100]) expect(isMilestone(n)).toBe(true);
    for (const n of [1, 30, 99, 101, -1]) expect(isMilestone(n)).toBe(false);
  });

  it("заглавието казва докъде е стигнал", () => {
    expect(uebinarTitle(0)).toContain("Пусна");
    expect(uebinarTitle(50)).toContain("50 %");
    expect(uebinarTitle(100)).toContain("докрай");
  });

  it("Telegram — при пускането и при прехода към три четвърти, не за всяка четвърт", () => {
    expect(shouldNotify(null, 0)).toBe(true);
    expect(shouldNotify(null, 25)).toBe(true);
    expect(shouldNotify(0, 25)).toBe(false);
    expect(shouldNotify(25, 50)).toBe(false);
    expect(shouldNotify(50, 75)).toBe(true);
    expect(shouldNotify(50, 100)).toBe(true);
    expect(shouldNotify(75, 100)).toBe(false);
  });
});
