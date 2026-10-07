import { describe, expect, it } from "vitest";
import { FRESH_WINDOW_DAYS, reLeadReason, reLeadVerdict, type ReLeadInput } from "./relead-rules";

const now = new Date("2026-10-07T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
const base: ReLeadInput = { stage: "lead", ownerId: null, createdAt: daysAgo(20), hasPhone: true, attempts: 1, ivailo: false, now };

describe("пак остави данни — кога картонът се връща в „🆕 Нови“", () => {
  it("звънян вече (Венцислав, 06.10: 3 опита на Димитър, после нова форма) — да", () => {
    expect(reLeadVerdict({ ...base, stage: "contacted", attempts: 3 })).toEqual({ give: true });
  });

  it("„не се интересува“ преди и пак попълва — да, отново е лийд", () => {
    expect(reLeadVerdict({ ...base, stage: "lost", attempts: 2 })).toEqual({ give: true });
  });

  it(`картон отпреди ${FRESH_WINDOW_DAYS} дни без нито едно обаждане (Hristo Manolov: юни → 26.09) — да`, () => {
    expect(reLeadVerdict({ ...base, createdAt: daysAgo(108), attempts: 0 })).toEqual({ give: true });
  });

  it("етап „говорено“ без опити (Lyuboslav, 24.09) — да: в „🆕 Нови“ влизат само етап lead", () => {
    expect(reLeadVerdict({ ...base, stage: "contacted", attempts: 0 })).toEqual({ give: true });
  });

  it("и без това е в „🆕 Нови“ (две форми една след друга — Пламен Петров, 07.10) — не", () => {
    expect(reLeadVerdict({ ...base, attempts: 0, createdAt: daysAgo(0) })).toEqual({ give: false, why: "already_fresh" });
  });

  it("клиент, при продавач, човек на Ивайло, в тръбата му, без телефон — не", () => {
    expect(reLeadVerdict({ ...base, stage: "won" })).toEqual({ give: false, why: "won" });
    expect(reLeadVerdict({ ...base, ownerId: "m2" })).toEqual({ give: false, why: "owner" });
    expect(reLeadVerdict({ ...base, ivailo: true })).toEqual({ give: false, why: "ivailo" });
    expect(reLeadVerdict({ ...base, stage: "offer_sent" })).toEqual({ give: false, why: "pipeline" });
    expect(reLeadVerdict({ ...base, stage: "discovery" })).toEqual({ give: false, why: "pipeline" });
    expect(reLeadVerdict({ ...base, hasPhone: false })).toEqual({ give: false, why: "no_phone" });
  });

  it("причината на картата казва какво е поискал и от коя реклама", () => {
    expect(reLeadReason("📘 Наръчник", "Корица · AI наръчник")).toBe(
      "🔁 Пак остави данни · 📘 Наръчник · реклама „Корица · AI наръчник“ — звънни като на нов лийд."
    );
    expect(reLeadReason(null, null)).toBe("🔁 Пак остави данни — звънни като на нов лийд.");
  });
});
