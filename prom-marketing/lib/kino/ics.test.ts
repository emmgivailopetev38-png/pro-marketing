import { describe, it, expect } from "vitest";
import { buildIcs, googleCalendarUrl, icsDate, icsEscape, icsFold } from "./ics";

const ev = {
  uid: "valnata-premiera@promarketing.pw",
  startMs: Date.parse("2026-11-10T17:30:00Z"),
  endMs: Date.parse("2026-11-10T18:35:00Z"),
  title: "ВЪЛНАТА · онлайн премиера",
  description: "Филм за изкуствения интелект и българския бизнес.\nЗалата: https://promarketing.pw/k/abc",
  url: "https://promarketing.pw/k/abc",
  location: "Онлайн, Зала 1",
  alarmsMinutes: [60, 10],
  nowMs: Date.parse("2026-10-06T09:00:00Z"),
};

describe("icsDate", () => {
  it("пише UTC без тирета и милисекунди", () => {
    expect(icsDate(ev.startMs)).toBe("20261110T173000Z");
  });
});

describe("icsEscape", () => {
  it("ескейпва запетаи, точки и запетаи, наклонени черти и нови редове", () => {
    expect(icsEscape("а, б; в\\г\nд")).toBe("а\\, б\\; в\\\\г\\nд");
  });
});

describe("icsFold", () => {
  it("къс ред остава както е", () => {
    expect(icsFold("SUMMARY:кратко")).toBe("SUMMARY:кратко");
  });

  it("дълъг кирилски ред се пренася по байтове, без да реже буква", () => {
    const line = `DESCRIPTION:${"вълна".repeat(40)}`;
    const folded = icsFold(line);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    const enc = new TextEncoder();
    for (const p of parts) expect(enc.encode(p).length).toBeLessThanOrEqual(75);
    // Сглобено обратно (без водещия интервал) дава същото.
    expect(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(line);
  });
});

describe("buildIcs", () => {
  const ics = buildIcs(ev);

  it("е валиден календар с едно събитие в UTC", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261110T173000Z");
    expect(ics).toContain("DTEND:20261110T183500Z");
    expect(ics).toContain("DTSTAMP:20261006T090000Z");
    expect(ics).toContain("UID:valnata-premiera@promarketing.pw");
  });

  it("всеки ред е с CRLF и напомнянията са преди началото", () => {
    expect(ics.split("\r\n").every((l) => !l.includes("\n"))).toBe(true);
    expect(ics).toContain("TRIGGER:-PT60M");
    expect(ics).toContain("TRIGGER:-PT10M");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });

  it("новите редове в описанието са ескейпнати", () => {
    expect(ics).toContain("бизнес.\\nЗалата");
  });
});

describe("googleCalendarUrl", () => {
  it("носи заглавието, часовете и зоната", () => {
    const url = new URL(googleCalendarUrl(ev));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("text")).toBe(ev.title);
    expect(url.searchParams.get("dates")).toBe("20261110T173000Z/20261110T183500Z");
    expect(url.searchParams.get("ctz")).toBe("Europe/Sofia");
  });
});
