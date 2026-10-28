import { describe, it, expect } from "vitest";
import { classify, nextCallAt, phonePretty, skipRestDays, telHref, type ZvAct, type ZvContact } from "./rules";

const NOW = new Date("2026-10-28T08:00:00Z"); // ср 28.10, 10:00 София

function contact(over: Partial<ZvContact> = {}): ZvContact {
  return {
    id: "c1",
    full_name: "Хасан",
    company: null,
    phone: "0897483801",
    stage: "lead",
    followup_status: null,
    next_followup_at: null,
    created_at: "2026-10-27T10:00:00Z",
    ...over,
  };
}
function act(activity_type: string, occurred_at: string, title = "", created_by = "Ивайло", body: string | null = null): ZvAct {
  return { contact_id: "c1", activity_type, title, body, occurred_at, created_by };
}

describe("номерът", () => {
  it("български мобилни → +359 и обратно за четене", () => {
    expect(telHref("0897 483 801")).toBe("+359897483801");
    expect(telHref("+359 89 232 3586")).toBe("+359892323586");
    expect(telHref("00359878166442")).toBe("+359878166442");
    expect(telHref("12")).toBeNull();
    expect(phonePretty("+359897483801")).toBe("0897 483 801");
    expect(phonePretty("+4917657900661")).toBe("+4917657900661");
  });
});

describe("кого да звънна", () => {
  it("нов лийд без разговор → 🆕, писаното без отговор се казва", () => {
    const r = classify(
      contact(),
      [act("viber_sent", "2026-10-27T12:00:00Z", "Viber", "claude"), act("meta_lead", "2026-10-27T10:00:00Z", "Meta lead · X", "meta_webhook", "Поиска: 🔎 Безплатен AI одит")],
      NOW
    );
    expect(r?.kat).toBe("nov");
    expect(r?.zashto).toContain("поиска 🔎 Безплатен AI одит");
    expect(r?.zashto).toContain("писахме");
  });

  it("отказал след последния лийд → не се звъни; пак остави данни → пак е нов", () => {
    const refused = [act("call", "2026-10-09T12:00:00Z", "Не се интересува"), act("meta_lead", "2026-10-02T04:00:00Z", "Meta lead")];
    expect(classify(contact({ created_at: "2026-10-02T04:00:00Z" }), refused, NOW)).toBeNull();
    const back = [act("meta_lead", "2026-10-28T04:55:00Z", "Meta lead", "meta_webhook"), ...refused];
    expect(classify(contact({ created_at: "2026-10-02T04:00:00Z" }), back, NOW)?.kat).toBe("nov");
  });

  it("среща напред → не се звъни", () => {
    expect(classify(contact(), [act("meeting", "2026-10-30T08:00:00Z", "Среща")], NOW)).toBeNull();
  });

  it("с оферта и разговор отпреди седмица → 🔥, преди старите", () => {
    const acts = [act("offer_sent", "2026-10-20T10:00:00Z", "Оферта"), act("call", "2026-10-19T10:00:00Z", "Говорихме")];
    const hot = classify(contact({ stage: "offer_sent", created_at: "2026-09-01T10:00:00Z" }), acts, NOW);
    const old = classify(contact({ stage: "contacted", created_at: "2026-09-01T10:00:00Z" }), [act("call", "2026-09-02T10:00:00Z", "Говорихме")], NOW);
    expect(hot?.kat).toBe("topal");
    expect(old?.kat).toBe("star");
  });

  it("само писано, никога чуто, стар лийд → ✉️", () => {
    const r = classify(contact({ created_at: "2026-09-01T10:00:00Z" }), [act("whatsapp_sent", "2026-10-01T10:00:00Z", "WA", "claude")], NOW);
    expect(r?.kat).toBe("pisano");
  });

  it("автоматичните писма не са „писахме“", () => {
    const r = classify(contact({ created_at: "2026-09-01T10:00:00Z" }), [act("email", "2026-10-01T10:00:00Z", "x", "warm_sequence")], NOW);
    expect(r?.kat).toBe("star");
  });

  it("звънян днес → носи знак, „не вдигна“ не е разговор", () => {
    const r = classify(contact(), [act("call", "2026-10-28T07:30:00Z", "Не вдигна")], NOW);
    expect(r?.called_today?.title).toBe("Не вдигна");
    expect(r?.kat).toBe("nov");
    expect(r?.nevdigna).toBe(1);
  });

  it("за днес е най-горе в купчината", () => {
    const a = classify(contact({ id: "a", created_at: "2026-10-27T10:00:00Z" }), [], NOW)!;
    const b = classify(contact({ id: "b", created_at: "2026-10-20T10:00:00Z", next_followup_at: "2026-10-28T07:45:00Z" }), [], NOW)!;
    expect(b.due).toBe("today");
    expect(b.sort).toBeLessThan(a.sort);
  });
});

describe("кога пак", () => {
  it("петък, събота и неделя → понеделник", () => {
    expect(skipRestDays("2026-10-30T08:00:00Z")).toBe("2026-11-02T08:00:00.000Z"); // пт → пн
    expect(skipRestDays("2026-10-29T08:00:00Z")).toBe("2026-10-29T08:00:00.000Z"); // чт остава
  });
  it("„Не вдигна“ сама → следващия работен ден; „Не иска“ → без дата", () => {
    expect(nextCallAt("auto", "nevdigna", NOW)?.slice(0, 10)).toBe("2026-10-29");
    expect(nextCallAt("auto", "ne_iska", NOW)).toBeNull();
    expect(nextCallAt("none", "govorihme", NOW)).toBeNull();
    // чт 29.10 + „утре“ = пт → пн 02.11
    expect(nextCallAt("tomorrow", "govorihme", new Date("2026-10-29T08:00:00Z"))?.slice(0, 10)).toBe("2026-11-02");
  });
});
