import { describe, it, expect } from "vitest";
import { parseZvaneneView, urgentBanner, zvaneneHref, zvaneneTabs, type ZvaneneCounts } from "./zvanene-vidove";

const counts: ZvaneneCounts = {
  fresh: 7,
  cancelled: 1,
  noshow: 2,
  retry: 5,
  waiting: 12,
  given: 4,
  msgsDue: 3,
  booked: 6,
};

describe("кой изглед е отворен", () => {
  it("без параметър и при непознат параметър е първо обаждане", () => {
    expect(parseZvaneneView(undefined)).toBe("novi");
    expect(parseZvaneneView("")).toBe("novi");
    expect(parseZvaneneView("глупости")).toBe("novi");
  });

  it("чете познатите изгледи, включително повтореният параметър в адреса", () => {
    expect(parseZvaneneView("povtorno")).toBe("povtorno");
    expect(parseZvaneneView(["ivailo", "novi"])).toBe("ivailo");
  });

  it("подразбирането няма параметър в адреса", () => {
    expect(zvaneneHref("novi")).toBe("/ekip");
    expect(zvaneneHref("sreshti")).toBe("/ekip?vid=sreshti");
  });
});

describe("числата по табовете", () => {
  it("за повторно събира отказали, неявили се, днешните и чакащите", () => {
    const tabs = zvaneneTabs(counts);
    expect(tabs.map((t) => t.view)).toEqual(["novi", "povtorno", "ivailo", "stari", "sreshti"]);
    expect(tabs[1].count).toBe(1 + 2 + 5 + 12);
    expect(tabs[1].urgent).toBe(3);
  });

  it("никоя карта не изчезва между табовете", () => {
    const tabs = zvaneneTabs(counts);
    const cards = counts.fresh + counts.cancelled + counts.noshow + counts.retry + counts.waiting + counts.given;
    expect((tabs[0].count ?? 0) + (tabs[1].count ?? 0) + (tabs[2].count ?? 0)).toBe(cards);
  });

  it("срещите броят часовете, а баджът — съобщенията за пращане", () => {
    const tabs = zvaneneTabs(counts);
    const sreshti = tabs.find((t) => t.view === "sreshti");
    expect(sreshti?.count).toBe(6);
    expect(sreshti?.urgent).toBe(3);
  });
});

describe("лентата за спешните", () => {
  it("излиза на другите изгледи и казва колко са", () => {
    expect(urgentBanner("novi", counts)).toBe("1 отказаха срещата · 2 не се явиха — звънни им днес");
    expect(urgentBanner("sreshti", { cancelled: 0, noshow: 2 })).toBe("2 не се явиха — звънни им днес");
  });

  it("не се повтаря върху самия изглед „за повторно“ и мълчи, когато няма спешни", () => {
    expect(urgentBanner("povtorno", counts)).toBeNull();
    expect(urgentBanner("novi", { cancelled: 0, noshow: 0 })).toBeNull();
  });
});

describe("студените (26.09.2026)", () => {
  it("табът излиза само при човек със студени фирми — последен", () => {
    expect(zvaneneTabs(counts).map((t) => t.view)).not.toContain("studeni");
    const tabs = zvaneneTabs({ ...counts, studeni: 31 });
    expect(tabs.map((t) => t.view)).toEqual(["novi", "povtorno", "ivailo", "stari", "sreshti", "studeni"]);
    expect(tabs.at(-1)).toMatchObject({ label: "❄️ Студени", count: 31, href: "/ekip?vid=studeni", urgent: 0 });
  });

  it("отвореният таб не изчезва, когато студените свършат", () => {
    expect(zvaneneTabs({ ...counts, studeni: 0 }, "studeni").map((t) => t.view)).toContain("studeni");
    expect(parseZvaneneView("studeni")).toBe("studeni");
  });
});

describe("стари и топли (11.11.2026)", () => {
  it("табът е винаги там; без число, докато изгледът не е отворен", () => {
    const tab = zvaneneTabs(counts).find((t) => t.view === "stari");
    expect(tab).toMatchObject({ label: "🗂 Стари и топли", href: "/ekip?vid=stari", count: null, urgent: 0 });
    expect(zvaneneTabs({ ...counts, stari: 37 }, "stari").find((t) => t.view === "stari")?.count).toBe(37);
    expect(parseZvaneneView("stari")).toBe("stari");
  });
});
