import { describe, expect, it } from "vitest";
import { decideMessage, greetingName, messageText, orderItems, slug, spokenMeeting, type SnAct, type SnContact } from "./sinhron-rules";

const NOW = new Date("2026-10-29T10:00:00Z"); // 12:00 София
const c: SnContact = { id: "11111111-2222-3333-4444-555555555555", full_name: "Теодора Балева", phone: "+359887803336", stage: "lead" };
const lead: SnAct = { activity_type: "meta_lead", title: "Meta lead", body: "Поиска: 🔎 Безплатен AI одит", occurred_at: "2026-10-28T12:29:17Z", created_by: "meta", metadata: { offer: "ai_odit" } };
const dial = (at: string): SnAct => ({ activity_type: "voice_outbound", title: "📞 Ели звъни сама", occurred_at: at, created_by: "voice_auto", metadata: { kind: "eli_auto", conversation_id: "conv_x" } });
const talk = (at: string, secs: number, booked = false): SnAct => ({ activity_type: "voice_call", title: "🎙️ Разговор", occurred_at: at, created_by: "elevenlabs", metadata: { duration_secs: secs, booked, conversation_id: "conv_x" } });

describe("синхронът Ели ↔ Viber/WhatsApp", () => {
  it("Ели набра, никой не вдигна → en- във Viber с линка за записване", () => {
    const d = decideMessage(c, [lead, dial("2026-10-29T09:02:00Z")], [], false, NOW);
    expect("item" in d).toBe(true);
    if (!("item" in d)) return;
    expect(d.item.kind).toBe("eli_no_answer");
    expect(d.item.channel).toBe("viber");
    expect(d.item.key).toBe("en-teodora-1029");
    expect(d.item.phone9).toBe("887803336");
    expect(d.item.text).toContain("Ели, AI асистентката ми, Ви търси от 0876 447 159");
    expect(d.item.text).toContain("безплатен AI одит");
    expect(d.item.text).toContain("https://promarketing.pw/booking\n🌐 promarketing.pw");
    expect(d.item.text).not.toMatch(/\?/);
  });

  it("гласова поща (< 25 сек) е като невдигнато", () => {
    const d = decideMessage(c, [lead, dial("2026-10-29T09:02:00Z"), talk("2026-10-29T09:02:10Z", 12)], [], false, NOW);
    expect("item" in d && d.item.kind).toBe("eli_no_answer");
  });

  it("вдигнал, без час → eb-; има WhatsApp чат → по WhatsApp", () => {
    const d = decideMessage(c, [lead, dial("2026-10-29T09:13:00Z"), talk("2026-10-29T09:13:10Z", 155)], [], true, NOW);
    expect("item" in d && d.item.kind).toBe("eli_no_booking");
    expect("item" in d && d.item.channel).toBe("whatsapp");
    expect("item" in d && d.item.key).toBe("eb-teodora-1029");
    expect("item" in d && d.item.text).toContain("Благодаря за разговора с Ели преди малко");
  });

  it("записал час → p-eli- с датата на срещата и линка на срещата, винаги Viber", () => {
    const d = decideMessage(
      c,
      [lead, dial("2026-10-29T09:13:00Z"), talk("2026-10-29T09:13:10Z", 200, true)],
      [{ scheduled_at: "2026-11-02T10:00:00Z", meeting_url: "https://meet.google.com/abc-defg-hij", status: "accepted" }],
      true,
      NOW
    );
    expect("item" in d && d.item.kind).toBe("eli_booked");
    expect("item" in d && d.item.channel).toBe("viber");
    expect("item" in d && d.item.key).toBe("p-eli-teodora-1102");
    expect("item" in d && d.item.text).toContain("Потвърждавам срещата ни в понеделник, 02.11, от 12:00 — ето линка: https://meet.google.com/abc-defg-hij");
  });

  it("записал час, но срещата е отменена и няма друга → нищо", () => {
    const d = decideMessage(c, [lead, dial("2026-10-29T09:13:00Z"), talk("2026-10-29T09:13:10Z", 200, true)], [{ scheduled_at: "2026-11-02T10:00:00Z", status: "cancelled" }], false, NOW);
    expect("skip" in d && d.skip).toBe("записал час при Ели, но няма активен час — провери");
  });

  it("писал ни е след обаждането → тече разговор, не се пише", () => {
    const wa: SnAct = { activity_type: "whatsapp_received", title: "Ок", occurred_at: "2026-10-29T08:54:37Z", created_by: "claude", metadata: null };
    const d = decideMessage(c, [lead, dial("2026-10-29T07:02:00Z"), wa], [], true, NOW);
    expect("skip" in d && d.skip).toBe("писал ни е — тече разговор");
  });

  it("вече писано след обаждането → не се повтаря", () => {
    const sent: SnAct = { activity_type: "viber_sent", title: "en", occurred_at: "2026-10-29T09:30:00Z", created_by: "claude", metadata: null };
    const d = decideMessage(c, [lead, dial("2026-10-29T09:02:00Z"), sent], [], false, NOW);
    expect("skip" in d && d.skip).toBe("вече писано след обаждането");
  });

  it("Ивайло звъня и не вдигна → ei-; Ивайло говори → нищо", () => {
    const miss: SnAct = { activity_type: "call", title: "📞 Не вдигна", occurred_at: "2026-10-29T09:40:00Z", created_by: "ivailo", metadata: null };
    const d1 = decideMessage(c, [lead, dial("2026-10-29T09:02:00Z"), miss], [], false, NOW);
    expect("item" in d1 && d1.item.kind).toBe("ivailo_no_answer");
    expect("item" in d1 && d1.item.key).toBe("ei-teodora-1029");
    const ok: SnAct = { activity_type: "call", title: "📞 Разговор 6 мин", occurred_at: "2026-10-29T09:50:00Z", created_by: "ivailo", metadata: null };
    const d2 = decideMessage(c, [lead, dial("2026-10-29T09:02:00Z"), ok], [], false, NOW);
    expect("skip" in d2 && d2.skip).toBe("Ивайло е говорил с него");
  });

  it("старо обаждане (> 2 дни) не е повод; отказал и клиент никога", () => {
    expect("skip" in decideMessage(c, [lead, dial("2026-10-26T09:02:00Z")], [], false, NOW)).toBe(true);
    const refuse: SnAct = { activity_type: "note", title: "Не се интересува", occurred_at: "2026-10-29T09:30:00Z", created_by: "ivailo", metadata: null };
    expect("skip" in decideMessage(c, [lead, dial("2026-10-29T09:02:00Z"), refuse], [], false, NOW) && "отказал").toBe("отказал");
    const paid: SnAct = { activity_type: "payment_received", title: "плащане", occurred_at: "2026-10-01T09:00:00Z", created_by: "x", metadata: null };
    expect("skip" in decideMessage(c, [lead, dial("2026-10-29T09:02:00Z"), paid], [], false, NOW) && "клиент").toBe("клиент");
  });

  it("латиница или фирма вместо име → „Здравейте!“, ключът остава по името", () => {
    const d = decideMessage({ ...c, full_name: "Adryan Stoykov" }, [lead, dial("2026-10-29T09:02:00Z")], [], false, NOW);
    expect("item" in d && d.item.text.startsWith("Здравейте! Ивайло Петев е")).toBe(true);
    expect("item" in d && d.item.key).toBe("en-adryan-1029");
    expect(greetingName("Студио Христови")).toBe("");
    expect(greetingName("петя")).toBe("Петя");
    expect(greetingName("Vania Georgieva")).toBe("");
  });

  it("чужд номер → не", () => {
    expect("skip" in decideMessage({ ...c, phone: "+44 7700 900000" }, [lead, dial("2026-10-29T09:02:00Z")], [], false, NOW)).toBe(true);
  });

  it("без име → „Здравейте!“; помощните", () => {
    const d = decideMessage({ ...c, full_name: null }, [lead, dial("2026-10-29T09:02:00Z")], [], false, NOW);
    expect("item" in d && d.item.text.startsWith("Здравейте! Ивайло Петев е")).toBe(true);
    expect(slug("Йордан Митев")).toBe("yordan-mitev");
    expect(spokenMeeting("2026-10-29T10:00:00Z")).toBe("в четвъртък, 29.10, от 12:00");
    expect(messageText("eli_booked", { ime: "Лили", when: "", zayavka: "", meetingAt: "2026-11-02T10:00:00Z", meetingUrl: null })).toContain("ще Ви звънна на този номер");
    const a = { kind: "eli_no_answer", triggerAt: "2026-10-29T09:00:00Z" } as never;
    const b = { kind: "eli_booked", triggerAt: "2026-10-28T09:00:00Z" } as never;
    expect(orderItems([a, b])[0]).toBe(b);
  });
});
