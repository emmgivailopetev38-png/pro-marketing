import { describe, expect, it } from "vitest";
import { buildInviteIcs, foldIcsLine, googleCalendarTemplateUrl, icsDate, icsEscape } from "./ics";

const base = {
  uid: "booking-31988da9@promarketing.pw",
  sequence: 0,
  method: "REQUEST" as const,
  startISO: "2026-11-17T09:00:00.000Z",
  minutes: 60,
  summary: "👤 Среща · Елтимир Цветков (наливни парфюми)",
  description: "Телефон: +359877224410\nИска ERP и CRM; следи наличности, клиенти",
  location: "https://meet.google.com/vis-xgdj-bku",
  organizer: { name: "ProMarketing", email: "Ivailo@promarketing.pw" },
  attendee: { name: "Джордж Мандаджиев", email: "George.Mandadzhiev@gmail.com" },
  now: new Date("2026-11-11T14:00:00.000Z"),
};

function unfold(ics: string): string[] {
  return ics.replace(/\r\n /g, "").split("\r\n").filter(Boolean);
}

describe("покана за календар (.ics)", () => {
  it("датите са в UTC, без тирета и двоеточия", () => {
    expect(icsDate(new Date("2026-11-17T09:00:00.000Z"))).toBe("20261117T090000Z");
  });

  it("екранира запетая, точка и запетая, обратна черта и нов ред", () => {
    expect(icsEscape("а, б; в\\г\nд")).toBe("а\\, б\\; в\\\\г\\nд");
  });

  it("покана: метод, час, край след 60 мин, организатор и получател с малки букви", () => {
    const lines = unfold(buildInviteIcs(base));
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("METHOD:REQUEST");
    expect(lines).toContain("UID:booking-31988da9@promarketing.pw");
    expect(lines).toContain("SEQUENCE:0");
    expect(lines).toContain("DTSTAMP:20261111T140000Z");
    expect(lines).toContain("DTSTART:20261117T090000Z");
    expect(lines).toContain("DTEND:20261117T100000Z");
    expect(lines).toContain("STATUS:CONFIRMED");
    expect(lines).toContain("LOCATION:https://meet.google.com/vis-xgdj-bku");
    expect(lines.find((l) => l.startsWith("ORGANIZER"))).toBe('ORGANIZER;CN="ProMarketing":mailto:ivailo@promarketing.pw');
    const att = lines.find((l) => l.startsWith("ATTENDEE")) ?? "";
    expect(att).toContain("RSVP=TRUE");
    expect(att.endsWith(":mailto:george.mandadzhiev@gmail.com")).toBe(true);
    expect(lines.find((l) => l.startsWith("DESCRIPTION"))).toBe(
      "DESCRIPTION:Телефон: +359877224410\\nИска ERP и CRM\\; следи наличности\\, клиенти"
    );
    expect(lines[lines.length - 1]).toBe("END:VCALENDAR");
  });

  it("всеки ред е до 75 байта и редовете завършват с CRLF", () => {
    const ics = buildInviteIcs({ ...base, description: "Много дълга бележка с кирилица и емоджи 🎯. ".repeat(12) });
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    const enc = new TextEncoder();
    for (const row of ics.split("\r\n")) expect(enc.encode(row).length).toBeLessThanOrEqual(75);
    // Сгънатото се връща едно към едно — знак не е срязан наполовина.
    expect(unfold(ics).find((l) => l.startsWith("DESCRIPTION"))).toContain("емоджи 🎯");
  });

  it("късите редове не се пипат, дългият се сгъва с интервал в началото", () => {
    expect(foldIcsLine("SUMMARY:кратко")).toBe("SUMMARY:кратко");
    const folded = foldIcsLine("X:" + "я".repeat(80));
    expect(folded.split("\r\n").length).toBeGreaterThan(1);
    expect(folded.split("\r\n")[1].startsWith(" ")).toBe(true);
  });

  it("отмяна: METHOD:CANCEL, STATUS:CANCELLED, без напомняне и без RSVP", () => {
    const lines = unfold(buildInviteIcs({ ...base, method: "CANCEL", sequence: 2, alarmMinutes: 15 }));
    expect(lines).toContain("METHOD:CANCEL");
    expect(lines).toContain("STATUS:CANCELLED");
    expect(lines).toContain("SEQUENCE:2");
    expect(lines).not.toContain("BEGIN:VALARM");
    expect(lines.find((l) => l.startsWith("ATTENDEE"))).toContain("RSVP=FALSE");
  });

  it("напомняне само при покана", () => {
    const lines = unfold(buildInviteIcs({ ...base, alarmMinutes: 15 }));
    expect(lines).toContain("BEGIN:VALARM");
    expect(lines).toContain("TRIGGER:-PT15M");
  });

  it("невалиден час гърми, вместо да прати покана за 1970 г.", () => {
    expect(() => buildInviteIcs({ ...base, startISO: "утре" })).toThrow();
  });

  it("линк „Добави в Google Календар“ носи часа, заглавието и мястото", () => {
    const url = googleCalendarTemplateUrl({
      startISO: base.startISO,
      minutes: 60,
      title: "Среща · Елтимир",
      details: "Телефон: +359877224410",
      location: base.location,
    });
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(u.searchParams.get("action")).toBe("TEMPLATE");
    expect(u.searchParams.get("dates")).toBe("20261117T090000Z/20261117T100000Z");
    expect(u.searchParams.get("text")).toBe("Среща · Елтимир");
    expect(u.searchParams.get("location")).toBe(base.location);
  });
});
