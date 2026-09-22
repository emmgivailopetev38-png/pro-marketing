import { describe, expect, it } from "vitest";
import { dueKind, firstName, meetingMessage, relativeDay, viberChatLink } from "./sreshta-saobshtenia";

const now = new Date("2026-09-22T09:00:00+03:00"); // вторник сутрин

describe("sreshta-saobshtenia", () => {
  it("първото име, без фамилия и без боклук", () => {
    expect(firstName("Нели Георгиева (TMB-Smart)")).toBe("Нели");
    expect(firstName("  ")).toBe("");
    expect(firstName(null)).toBe("");
  });

  it("относителният ден", () => {
    expect(relativeDay("2026-09-22T15:00:00+03:00", now)).toBe("днес");
    expect(relativeDay("2026-09-23T15:00:00+03:00", now)).toBe("утре");
    expect(relativeDay("2026-09-21T15:00:00+03:00", now)).toBe("вчера");
    expect(relativeDay("2026-09-24T15:00:00+03:00", now)).toBe("в четвъртък (24.09)");
    expect(relativeDay("2026-09-29T15:00:00+03:00", now)).toBe("във вторник (29.09)");
  });

  it("потвърждението носи името, деня, часа и линка", () => {
    const t = meetingMessage(
      "confirm",
      { name: "Нели Георгиева", whenIso: "2026-09-24T12:00:00Z", meetingUrl: "https://meet.google.com/abc-defg-hij", setterName: "Димитър", formal: true },
      now
    );
    expect(t).toContain("Здравейте, Нели!");
    expect(t).toContain("Димитър съм от Pro Marketing");
    expect(t).toContain("в четвъртък (24.09) в 15:00 ч.");
    expect(t).toContain("https://meet.google.com/abc-defg-hij");
    expect(t).toContain("45 минути");
    expect(t).not.toMatch(/безпокоя|губя времето|гоня/);
  });

  it("без линк казва, че Ивайло ще звънне; на „ти“ е на „ти“", () => {
    const t = meetingMessage("confirm", { name: "Иван", whenIso: "2026-09-23T09:00:00Z", meetingUrl: null, setterName: "Димитър", formal: false }, now);
    expect(t).toContain("Здравей, Иван!");
    expect(t).toContain("Записах те");
    expect(t).toContain("Ивайло ще ти се обади на този номер.");
    expect(t).toContain("утре в 12:00 ч.");
  });

  it("напомнянето малко преди и след пропусната среща", () => {
    const soon = meetingMessage("remind_soon", { name: "Иван", whenIso: "2026-09-22T08:00:00Z", meetingUrl: "https://x.y/z", setterName: "Димитър", formal: true }, now);
    expect(soon).toContain("В 11:00 ч. е разговорът Ви с Ивайло");
    const ns = meetingMessage("noshow", { name: "Иван", whenIso: "2026-09-21T08:00:00Z", meetingUrl: null, setterName: "Димитър", formal: true }, now);
    expect(ns).toContain("Вчера в 11:00 ч. имахме уговорен разговор с Ивайло");
    expect(ns).toContain("Кога ще Ви е удобно да го преместим");
  });

  it("кое е на ред: малко преди > ден преди > потвърждение; изпратеното не се повтаря", () => {
    const none = new Set<never>();
    expect(dueKind("2026-09-22T10:30:00+03:00", now, none)).toBe("remind_soon"); // след 1,5 ч
    expect(dueKind("2026-09-23T10:00:00+03:00", now, none)).toBe("remind_day"); // след 25 ч
    expect(dueKind("2026-09-26T10:00:00+03:00", now, none)).toBe("confirm"); // след 4 дни
    expect(dueKind("2026-09-26T10:00:00+03:00", now, new Set(["confirm"] as const))).toBeNull();
    expect(dueKind("2026-09-23T10:00:00+03:00", now, new Set(["remind_day"] as const))).toBeNull();
    expect(dueKind("2026-09-22T08:00:00+03:00", now, none)).toBeNull(); // минала
  });

  it("Viber линкът е по международния номер", () => {
    expect(viberChatLink("0886 147 476")).toBe("viber://chat?number=%2B359886147476");
    expect(viberChatLink("+359886147476")).toBe("viber://chat?number=%2B359886147476");
    expect(viberChatLink("")).toBeNull();
  });
});
