import { describe, it, expect } from "vitest";
import {
  entryBody,
  entryFromMetadata,
  entryTitle,
  initials,
  moodTrend,
  remindAtFromPreset,
  resolveRemindAt,
  splitPromises,
} from "./dnevnik";

describe("напомнянето „да го чуя пак“", () => {
  // сряда 16.09.2026, 14:00 София = 11:00Z
  const now = new Date("2026-09-16T11:00:00.000Z");

  it("утре = следващата работна сутрин в 10:00 София", () => {
    expect(remindAtFromPreset("tomorrow", now)?.toISOString()).toBe("2026-09-17T07:00:00.000Z");
  });

  it("след 3 дни от сряда е събота → понеделник 10:00", () => {
    expect(remindAtFromPreset("3d", now)?.toISOString()).toBe("2026-09-21T07:00:00.000Z");
  });

  it("след седмица е сряда 23.09, 10:00", () => {
    expect(remindAtFromPreset("1w", now)?.toISOString()).toBe("2026-09-23T07:00:00.000Z");
  });

  it("точен час от формата бие бутоните; без нищо = без напомняне", () => {
    expect(resolveRemindAt("1w", "2026-09-25T15:30", now)).toBe("2026-09-25T12:30:00.000Z");
    expect(resolveRemindAt("none", "", now)).toBeNull();
    expect(resolveRemindAt("", "", now)).toBeNull();
    expect(remindAtFromPreset("nikoga", now)).toBeNull();
  });
});

describe("записът в хронологията", () => {
  it("обещанията се делят по редове и „;“, без водещи тирета", () => {
    expect(splitPromises("- да прати снимки на продуктите\n• да говори със съдружника; да реши до петък\n\n")).toEqual([
      "да прати снимки на продуктите",
      "да говори със съдружника",
      "да реши до петък",
    ]);
    expect(splitPromises("")).toEqual([]);
  });

  it("чете се обратно от metadata и непознатото настроение става null", () => {
    const e = entryFromMetadata({ kind: "dnevnik", channel: "meet", mood: "zapalen", talked: "за магазина", remind_at: "2026-09-23T07:00:00.000Z" });
    expect(e).toMatchObject({ channel: "meet", mood: "zapalen", talked: "за магазина", they_promised: "", remind_at: "2026-09-23T07:00:00.000Z" });
    expect(entryFromMetadata({ kind: "dnevnik", channel: "phone", mood: "ekstaz" })?.mood).toBeNull();
    expect(entryFromMetadata({ team: true })).toBeNull();
    expect(entryFromMetadata(null)).toBeNull();
  });

  it("заглавие и тяло са четими и без интерфейса", () => {
    const e = entryFromMetadata({
      kind: "dnevnik",
      channel: "phone",
      mood: "pozitiven",
      talked: "за рекламите",
      they_promised: "да прати снимки",
      we_promised: "оферта до сряда",
      happened: "иска да продължим",
      next_step: "среща в петък",
    })!;
    expect(entryTitle(e)).toBe("📞 Телефон · 🙂 Позитивен · среща в петък");
    expect(entryBody(e, "ср 23.09, 10:00")).toBe(
      [
        "Как се чувстваше: 🙂 Позитивен",
        "Какво говорихме: за рекламите",
        "Той обеща: да прати снимки",
        "Аз обещах: оферта до сряда",
        "Какво стана: иска да продължим",
        "Следваща стъпка: среща в петък",
        "Да го чуя пак: ср 23.09, 10:00",
      ].join("\n")
    );
  });
});

describe("настроението през времето", () => {
  it("стрелката е по последните два записа, най-новият пръв", () => {
    expect(moodTrend(["zapalen", "neutralen"])).toEqual({ avg: 4, arrow: "up" });
    expect(moodTrend(["kolebliv", "pozitiven", "zapalen"])).toMatchObject({ arrow: "down" });
    expect(moodTrend(["pozitiven"])).toEqual({ avg: 4, arrow: null });
    expect(moodTrend([null, null])).toEqual({ avg: null, arrow: null });
  });

  it("инициали", () => {
    expect(initials("Иван Петров")).toBe("ИП");
    expect(initials("hristo")).toBe("H");
    expect(initials(null)).toBe("?");
  });
});
