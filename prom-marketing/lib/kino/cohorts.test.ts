import { describe, it, expect } from "vitest";
import { cohortAt, cohortById, enrollmentCohort, cohortForBuyer, cohortView, seatsByCohort } from "./cohorts";
import { parseLiveUrl } from "./live-url";

const iso = (ms: number) => new Date(ms).toISOString();

describe("потоците", () => {
  it("първият: започва в понеделник, 19.10; записването затваря в неделя, 18.10, 23:59", () => {
    const c = cohortAt(0);
    expect(c.id).toBe("potok-2026-10-19");
    expect(iso(c.startMs)).toBe("2026-10-18T21:00:00.000Z"); // 19.10, 00:00 софийско
    expect(iso(c.closeMs)).toBe("2026-10-18T20:59:00.000Z");
    expect(c.seats).toBe(30);
  });

  it("после — всеки месец, в същия пореден понеделник (третият)", () => {
    expect([1, 2, 3].map((i) => cohortAt(i).id)).toEqual(["potok-2026-11-16", "potok-2026-12-21", "potok-2027-01-18"]);
    // записването за ноемврийския затваря в неделя, 15.11, 23:59 — вече зимно време (+02:00)
    expect(iso(cohortAt(1).closeMs)).toBe("2026-11-15T21:59:00.000Z");
  });

  it("етикетите за поканата", () => {
    const v = cohortView(cohortAt(0), 12);
    expect(v).toMatchObject({
      startShort: "19.10",
      startOnDay: "в понеделник, 19 октомври",
      closeShort: "18.10, 23:59",
      closeDay: "неделя, 18 октомври",
      seatsLeft: 18,
    });
    expect(cohortView(cohortAt(0)).seatsLeft).toBeNull();
  });

  it("до затварянето записва първият; след него — следващият", () => {
    const close = cohortAt(0).closeMs;
    expect(enrollmentCohort(close - 1).id).toBe("potok-2026-10-19");
    expect(enrollmentCohort(close).id).toBe("potok-2026-11-16");
  });

  it("пълен поток → следващият", () => {
    const full = (id: string) => (id === "potok-2026-10-19" ? 30 : 0);
    expect(enrollmentCohort(cohortAt(0).closeMs - 1000, full).id).toBe("potok-2026-11-16");
  });

  it("платилият капаро доплаща за своя поток — и след затварянето", () => {
    const after = cohortAt(0).closeMs + 3 * 24 * 3600_000; // ср 21.10 — срещата
    expect(cohortForBuyer({ nowMs: after, depositCohortId: "potok-2026-10-19" }).id).toBe("potok-2026-10-19");
    expect(cohortForBuyer({ nowMs: after }).id).toBe("potok-2026-11-16");
    expect(cohortById("potok-2026-12-21")?.index).toBe(2);
    expect(cohortById("nqma")).toBeNull();
  });

  it("местата: различни хора; старите записи без поток — в първия", () => {
    const m = seatsByCohort([
      { contact_id: "a", metadata: { cohort: "potok-2026-10-19" } },
      { contact_id: "a", metadata: { cohort: "potok-2026-10-19" } }, // капаро + доплащане = едно място
      { contact_id: "b", metadata: null },
      { contact_id: "c", metadata: { cohort: "potok-2026-11-16" } },
    ]);
    expect(m.get("potok-2026-10-19")).toBe(2);
    expect(m.get("potok-2026-11-16")).toBe(1);
  });
});

describe("„Влизам на живо“ — линкът", () => {
  it("Zoom, Google Meet, YouTube Live", () => {
    expect(parseLiveUrl("https://us02web.zoom.us/j/123?pwd=x")).toMatchObject({ kind: "zoom", label: "Zoom", youtubeId: null });
    expect(parseLiveUrl("https://meet.google.com/abc-defg-hij")).toMatchObject({ kind: "meet", label: "Google Meet" });
    expect(parseLiveUrl("https://www.youtube.com/live/AbCdEf12345")).toMatchObject({ kind: "youtube", youtubeId: "AbCdEf12345" });
    expect(parseLiveUrl("https://www.youtube.com/watch?v=AbCdEf12345&t=3")).toMatchObject({ youtubeId: "AbCdEf12345" });
    expect(parseLiveUrl("https://youtu.be/AbCdEf12345")).toMatchObject({ youtubeId: "AbCdEf12345" });
    expect(parseLiveUrl("https://example.com/room")).toMatchObject({ kind: "link", label: "example.com" });
  });

  it("само https — иначе нищо", () => {
    expect(parseLiveUrl("http://zoom.us/j/1")).toBeNull();
    expect(parseLiveUrl("javascript:alert(1)")).toBeNull();
    expect(parseLiveUrl("zoom")).toBeNull();
    expect(parseLiveUrl("")).toBeNull();
    expect(parseLiveUrl(null)).toBeNull();
  });
});
