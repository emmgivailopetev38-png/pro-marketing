import { describe, expect, it } from "vitest";
import {
  applyPreset,
  fitsGrafik,
  freeSlots,
  grafikMessage,
  grafikMessageAll,
  hasAnyHour,
  hoursFor,
  hoursLabel,
  isDayOverride,
  nextDays,
  readGrafik,
  slotLabel,
  toggleDayHour,
  toggleWeekHour,
  toggleWeekRow,
  type Grafik,
} from "./grafik-rules";

// 26.11.2026 е четвъртък (ISO „4“); зимно време в София = UTC+2.
const THU = "2026-11-26";
const teodor: Grafik = { week: { "4": [18, 19, 20], "5": [10, 11] }, days: {} };

describe("графикът · четене", () => {
  it("без график (null, масив, текст) → null", () => {
    expect(readGrafik(null)).toBeNull();
    expect(readGrafik([1, 2])).toBeNull();
    expect(readGrafik("18-21")).toBeNull();
  });

  it("чисти часовете: извън 10–21, повторени и дробни отпадат", () => {
    const g = readGrafik({ week: { "1": [9, 10, 10, 21, 22, 12.5, "13"] }, days: {} })!;
    expect(g.week["1"]).toEqual([10, 13, 21]);
  });

  it("празен ден в „конкретни дни“ се пази (= не е на линия), миналите дни отпадат", () => {
    const g = readGrafik({ week: {}, days: { "2026-11-20": [18], [THU]: [] } }, "2026-11-25")!;
    expect(g.days).toEqual({ [THU]: [] });
    expect(isDayOverride(g, THU)).toBe(true);
    expect(hasAnyHour(g)).toBe(false);
  });
});

describe("графикът · побира ли се срещата", () => {
  it("без график — всеки час е позволен (както досега)", () => {
    expect(fitsGrafik(null, "2026-11-26T08:00:00Z")).toBe(true);
  });

  it("18:00 в четвъртък е на линия; 17:00 — не", () => {
    expect(fitsGrafik(teodor, "2026-11-26T16:00:00Z")).toBe(true); // 18:00 София
    expect(fitsGrafik(teodor, "2026-11-26T15:00:00Z")).toBe(false); // 17:00 София
  });

  it("среща в 20:30 (45 мин) стига до 21:15 → трябва и 21:00, а него го няма", () => {
    expect(fitsGrafik(teodor, "2026-11-26T18:00:00Z")).toBe(true); // 20:00
    expect(fitsGrafik(teodor, "2026-11-26T18:30:00Z")).toBe(false); // 20:30
  });

  it("конкретният ден заменя обичайната седмица", () => {
    const off = { ...teodor, days: { [THU]: [] } };
    expect(fitsGrafik(off, "2026-11-26T16:00:00Z")).toBe(false);
    expect(hoursFor(off, "2026-12-03")).toEqual([18, 19, 20]);
  });
});

describe("графикът · свободните часове", () => {
  it("по графика, без заетите, без миналото и без часа след по-малко от 30 мин", () => {
    const busy = [{ at: "2026-11-26T17:00:00Z", minutes: 60 }]; // 19:00–20:00 София
    const slots = freeSlots(teodor, busy, new Date("2026-11-26T06:00:00Z"), { days: 7 });
    expect(slots.slice(0, 4)).toEqual(["2026-11-26T18:00", "2026-11-26T20:00", "2026-11-27T10:00", "2026-11-27T11:00"]);
    expect(slots).toContain("2026-12-03T19:00");

    const late = freeSlots(teodor, [], new Date("2026-11-26T15:45:00Z"), { days: 0 });
    expect(late).toEqual(["2026-11-26T19:00", "2026-11-26T20:00"]);
  });

  it("без график → няма предложения; ограничението се спазва", () => {
    expect(freeSlots(null, [], new Date("2026-11-26T06:00:00Z"))).toEqual([]);
    expect(freeSlots(teodor, [], new Date("2026-11-26T06:00:00Z"), { limit: 2 })).toHaveLength(2);
  });
});

describe("графикът · надписите", () => {
  it("часовете се слепват", () => {
    expect(hoursLabel([17, 18, 19, 20])).toBe("17–21");
    expect(hoursLabel([12, 10, 11, 17, 18])).toBe("10–13 · 17–19");
    expect(hoursLabel([])).toBe("");
  });

  it("часът и отказът за сетъра", () => {
    expect(slotLabel("2026-11-26T18:00")).toBe("чт 26.11 18:00");
    const msg = grafikMessage("Теодор", "2026-11-26T08:00:00Z", ["2026-11-26T18:00", "2026-11-27T10:00"]);
    expect(msg).toContain("Теодор не е на линия в чт 26.11 10:00");
    expect(msg).toContain("чт 26.11 18:00 · пт 27.11 10:00");
    expect(grafikMessage("Теодор", "2026-11-26T08:00:00Z", [])).toContain("няма свободен час");
    expect(grafikMessageAll("2026-11-26T08:00:00Z", [{ name: "Теодор", slots: [] }, { name: "Джордж", slots: ["2026-11-26T12:00"] }])).toContain(
      "Джордж: чт 26.11 12:00"
    );
  });
});

describe("графикът · цъкането", () => {
  it("клетка от седмицата се включва и изключва; влаченето държи едно състояние", () => {
    const g = toggleWeekHour(teodor, "4", 17);
    expect(g.week["4"]).toEqual([17, 18, 19, 20]);
    expect(toggleWeekHour(g, "4", 17).week["4"]).toEqual([18, 19, 20]);
    expect(toggleWeekHour(g, "4", 17, true).week["4"]).toEqual([17, 18, 19, 20]);
  });

  it("цял ред: празен → навсякъде; пълен → маха се", () => {
    const g = toggleWeekRow({ week: {}, days: {} }, 10);
    expect(Object.keys(g.week)).toHaveLength(7);
    expect(Object.keys(toggleWeekRow(g, 10).week)).toHaveLength(0);
  });

  it("конкретен ден се откъсва от седмицата; върне ли се същият — правилото се маха", () => {
    const g = toggleDayHour(teodor, THU, 18);
    expect(g.days[THU]).toEqual([19, 20]);
    expect(g.week["4"]).toEqual([18, 19, 20]);
    const back = toggleDayHour(g, THU, 18);
    expect(isDayOverride(back, THU)).toBe(false);
  });

  it("готовите седмици пазят конкретните дни", () => {
    const g = applyPreset({ week: {}, days: { [THU]: [] } }, "vecher");
    expect(g.week["1"]).toEqual([17, 18, 19, 20]);
    expect(g.week["6"]).toBeUndefined();
    expect(g.days[THU]).toEqual([]);
  });

  it("следващите дни са поредни", () => {
    expect(nextDays(new Date("2026-11-26T06:00:00Z"), 3)).toEqual(["2026-11-26", "2026-11-27", "2026-11-28"]);
  });
});
