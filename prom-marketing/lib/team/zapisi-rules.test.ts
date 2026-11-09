import { describe, expect, it } from "vitest";
import { cleanRecordingUrl, dueForReminder, meetingEnd, needsRecording, reminderText, taskMark } from "./zapisi-rules";

const NOW = new Date("2026-11-10T13:00:00Z"); // 15:00 софийско

describe("записите от срещите", () => {
  it("линкът: само http(s), режат се препинателните накрая", () => {
    expect(cleanRecordingUrl("https://fathom.video/share/abc123.")).toBe("https://fathom.video/share/abc123");
    expect(cleanRecordingUrl(" https://drive.google.com/file/d/xyz/view?usp=sharing ")).toBe("https://drive.google.com/file/d/xyz/view?usp=sharing");
    expect(cleanRecordingUrl("fathom.video/share/abc")).toBeNull();
    expect(cleanRecordingUrl("https://localhost/x")).toBeNull();
    expect(cleanRecordingUrl("не е линк")).toBeNull();
  });
  it("краят на срещата: 45 мин по подразбиране", () => {
    expect(meetingEnd({ scheduled_at: "2026-11-10T10:00:00Z" }).toISOString()).toBe("2026-11-10T10:45:00.000Z");
    expect(meetingEnd({ scheduled_at: "2026-11-10T10:00:00Z", duration_minutes: 30 }).toISOString()).toBe("2026-11-10T10:30:00.000Z");
  });
  it("кои срещи чакат запис", () => {
    const base = { id: "b1", scheduled_at: "2026-11-10T12:00:00Z", status: "accepted" };
    expect(needsRecording(base, NOW)).toBe(true); // свършила 12:45, +10 мин ≤ 13:00
    expect(needsRecording({ ...base, scheduled_at: "2026-11-10T12:10:00Z" }, NOW)).toBe(false); // свършва 12:55 → още не
    expect(needsRecording({ ...base, recording_url: "https://fathom.video/x" }, NOW)).toBe(false);
    expect(needsRecording({ ...base, status: "no_show" }, NOW)).toBe(false);
    expect(needsRecording({ ...base, status: "cancelled" }, NOW)).toBe(false);
    expect(needsRecording({ ...base, status: "completed" }, NOW)).toBe(true);
    expect(needsRecording({ ...base, scheduled_at: "2026-11-01T12:00:00Z" }, NOW)).toBe(false); // по-стара от 7 дни
  });
  it("напомнянето: веднага, после на 3 часа, само 9–21 ч.", () => {
    const b = { id: "b1", scheduled_at: "2026-11-10T11:00:00Z", status: "accepted" };
    expect(dueForReminder(b, NOW)).toBe(true);
    expect(dueForReminder({ ...b, recording_reminded_at: "2026-11-10T11:30:00Z" }, NOW)).toBe(false); // преди 1,5 ч
    expect(dueForReminder({ ...b, recording_reminded_at: "2026-11-10T09:59:00Z" }, NOW)).toBe(true); // преди 3 ч+
    expect(dueForReminder(b, new Date("2026-11-10T20:30:00Z"))).toBe(false); // 22:30 софийско
  });
  it("текстът и маркерът на задачата", () => {
    expect(taskMark("abc")).toBe("[zapis:abc]");
    const t = reminderText([{ name: "Даниел Вучев", when: "вт 10.11 14:00", reminders: 0 }], "https://promarketing.pw");
    expect(t).toContain("Даниел Вучев");
    expect(t).toContain("https://promarketing.pw/ekip/prodazhbi");
    expect(reminderText([], "x")).toBe("");
  });
});
