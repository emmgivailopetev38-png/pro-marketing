import { describe, expect, it } from "vitest";
import {
  AUTO_LOG_TYPE,
  DEFAULT_OPTIONS,
  bgMobileE164,
  decide,
  firstName,
  inCallWindow,
  orderCalls,
  spokenWhen,
  zayavkaFrom,
  type AcAct,
  type AcContact,
  type AcOptions,
} from "./auto-call-rules";

const ELI = "agent_eli";
const opts: AcOptions = { ...DEFAULT_OPTIONS, eliAgentId: ELI, skipPhones: new Set() };
// Сряда, 28.10.2026, 11:00 София (UTC+2 след смяната на часа).
const NOW = new Date("2026-10-28T09:00:00Z");

const contact = (over: Partial<AcContact> = {}): AcContact => ({
  id: "c1",
  full_name: "Мария Петрова",
  phone: "0888 123 456",
  email: "maria@example.com",
  stage: "lead",
  followup_status: null,
  business: "сладкарница",
  company: null,
  last_heard_from_at: null,
  ...over,
});

const act = (activity_type: string, occurred_at: string, over: Partial<AcAct> = {}): AcAct => ({
  activity_type,
  title: null,
  body: null,
  occurred_at,
  created_by: null,
  metadata: null,
  ...over,
});

const lead = (at = "2026-10-28T07:30:00Z") =>
  act("meta_lead", at, { title: "Meta lead · ProMarketing · AI одит", body: "Поиска: 🔎 Безплатен AI одит", metadata: { offer: "ai_odit" } });

describe("часовете", () => {
  it("пон–пт 09:00–17:50 по София", () => {
    expect(inCallWindow(new Date("2026-10-28T07:00:00Z"))).toBe(true); // ср 09:00
    expect(inCallWindow(new Date("2026-10-28T06:59:00Z"))).toBe(false); // ср 08:59
    expect(inCallWindow(new Date("2026-10-28T15:49:00Z"))).toBe(true); // ср 17:49
    expect(inCallWindow(new Date("2026-10-28T15:50:00Z"))).toBe(false); // ср 17:50
    expect(inCallWindow(new Date("2026-10-30T09:00:00Z"))).toBe(true); // петък 11:00
    expect(inCallWindow(new Date("2026-10-31T09:00:00Z"))).toBe(false); // събота
    expect(inCallWindow(new Date("2026-11-01T09:00:00Z"))).toBe(false); // неделя
  });
  it("лятното време се смята правилно (UTC+3)", () => {
    expect(inCallWindow(new Date("2026-10-22T06:00:00Z"))).toBe(true); // чт 09:00 EEST
    expect(inCallWindow(new Date("2026-10-22T05:59:00Z"))).toBe(false);
  });
  it("друг прозорец (напр. без петък)", () => {
    const win = { days: ["Mon", "Tue", "Wed", "Thu"], startMin: 600, endMin: 1065 };
    expect(inCallWindow(new Date("2026-10-30T09:00:00Z"), win)).toBe(false);
    expect(inCallWindow(new Date("2026-10-28T07:30:00Z"), win)).toBe(false); // 09:30
  });
});

describe("номерът", () => {
  it("само български мобилни, в E.164", () => {
    expect(bgMobileE164("0888 123 456")).toBe("+359888123456");
    expect(bgMobileE164("+359 87 644 7159")).toBe("+359876447159");
    expect(bgMobileE164("359898607688")).toBe("+359898607688");
    expect(bgMobileE164("00359888123456")).toBe("+359888123456");
    expect(bgMobileE164("02 981 1234")).toBeNull(); // стационарен
    expect(bgMobileE164("+44 7700 900123")).toBeNull();
    expect(bgMobileE164("")).toBeNull();
  });
});

describe("нов лийд", () => {
  it("звъни няколко минути след заявката с променливите на Ели", () => {
    const d = decide(contact(), [lead()], false, NOW, opts);
    expect("call" in d).toBe(true);
    if (!("call" in d)) return;
    expect(d.call.reason).toBe("nov");
    expect(d.call.attempt).toBe(1);
    expect(d.call.toNumber).toBe("+359888123456");
    expect(d.call.variables).toMatchObject({
      pozdrav: "Здравейте, Мария!",
      ime: "Мария",
      zayavka: "безплатен AI одит",
      data_zayavka: "днес сутринта",
      deynost: "сладкарница",
      imeil: "maria@example.com",
      telefon: "+359888123456",
      kanal: "izhodyasht",
    });
    for (const k of ["pozdrav", "ime", "zayavka", "data_zayavka", "istoriya", "deynost", "imeil", "telefon", "kanal", "sesia", "minuti"]) {
      expect(typeof d.call.variables[k]).toBe("string");
    }
  });

  it("чака първите две минути след заявката", () => {
    const d = decide(contact(), [lead("2026-10-28T08:59:00Z")], false, NOW, opts);
    expect(d).toEqual({ skip: "лийдът е от преди минути — след малко" });
  });

  it("стар лийд (> 5 дни) не е повод", () => {
    expect("skip" in decide(contact(), [lead("2026-10-20T08:00:00Z")], false, NOW, opts)).toBe(true);
  });

  it("не звъни, ако Ивайло вече е говорил с човека", () => {
    const talked = act("call", "2026-10-28T08:00:00Z", { title: "Говорихме", created_by: "Ивайло" });
    expect(decide(contact(), [lead(), talked], false, NOW, opts)).toEqual({ skip: "Ивайло вече е говорил с него" });
  });

  it("„Не вдигна“ на Ивайло не е разговор — Ели пробва", () => {
    const missed = act("call", "2026-10-28T08:00:00Z", { title: "Не вдигна", created_by: "Ивайло" });
    expect("call" in decide(contact(), [lead(), missed], false, NOW, opts)).toBe(true);
  });

  it("не звъни на писал ни сам, на отказал, на клиент, със среща напред", () => {
    const wrote = act("viber_received", "2026-10-28T08:10:00Z");
    expect(decide(contact(), [lead(), wrote], false, NOW, opts)).toEqual({ skip: "писал ни е — тече разговор" });
    const refused = act("call", "2026-10-28T08:10:00Z", { title: "Не се интересува" });
    expect(decide(contact(), [lead(), refused], false, NOW, opts)).toEqual({ skip: "отказал" });
    expect(decide(contact({ stage: "won" }), [lead()], false, NOW, opts)).toEqual({ skip: "етап won" });
    expect(decide(contact(), [lead(), act("payment_received", "2026-09-01T08:00:00Z")], false, NOW, opts)).toEqual({ skip: "клиент" });
    expect(decide(contact(), [lead()], true, NOW, opts)).toEqual({ skip: "има записан час" });
    expect(decide(contact({ followup_status: "not_interested" }), [lead()], false, NOW, opts)).toEqual({ skip: "не се интересува" });
  });

  it("Академията и трейдингът не са за Ели", () => {
    expect(decide(contact({ source: "akademia" }), [lead()], false, NOW, opts)).toEqual({ skip: "източник akademia" });
  });

  it("списъкът „не звъни“", () => {
    const o = { ...opts, skipPhones: new Set(["888123456"]) };
    expect(decide(contact(), [lead()], false, NOW, o)).toEqual({ skip: "в списъка „не звъни“" });
  });
});

describe("опитите", () => {
  const dial = (at: string) => act(AUTO_LOG_TYPE, at, { created_by: "eli_auto" });
  const eli = (at: string, secs: number) =>
    act("voice_call", at, { metadata: { agent_id: ELI, duration_secs: secs, call_successful: "success" } });

  it("втори опит — чак в следващ ден", () => {
    const l = lead("2026-10-27T07:00:00Z");
    expect(decide(contact(), [l, dial("2026-10-28T08:30:00Z")], false, NOW, opts)).toEqual({ skip: "днес вече е звъняно" });
    const d = decide(contact(), [l, dial("2026-10-27T08:30:00Z"), eli("2026-10-27T08:31:00Z", 6)], false, NOW, opts);
    expect("call" in d && d.call.attempt).toBe(2);
  });

  it("най-много два опита", () => {
    const l = lead("2026-10-26T07:00:00Z");
    expect(decide(contact(), [l, dial("2026-10-26T08:00:00Z"), dial("2026-10-27T08:00:00Z")], false, NOW, opts)).toEqual({
      skip: "2 опита — стига",
    });
  });

  it("разговорите на Ели от ръчната партида също се броят", () => {
    const l = lead("2026-10-26T07:00:00Z");
    expect(decide(contact(), [l, eli("2026-10-26T08:00:00Z", 5), eli("2026-10-27T08:00:00Z", 4)], false, NOW, opts)).toEqual({
      skip: "2 опита — стига",
    });
  });

  it("вдигнал на Ели (≥ 25 сек) → поема Ивайло, Ели не звъни пак", () => {
    const l = lead("2026-10-27T07:00:00Z");
    expect(decide(contact(), [l, eli("2026-10-27T08:00:00Z", 34)], false, NOW, opts)).toEqual({ skip: "вдигна на Ели — поема Ивайло" });
  });
});

describe("неявил се", () => {
  const noshow = (at = "2026-10-27T12:00:00Z") =>
    act("note", at, { title: "🙈 Не се яви на срещата", metadata: { kind: "noshow", missed_at: "2026-10-27T09:00:00Z" } });

  it("звъни за нов час, дори ако е говорил по телефона ПРЕДИ срещата", () => {
    const before = act("call", "2026-10-20T08:00:00Z", { title: "Говорихме · интерес" });
    const d = decide(contact(), [lead("2026-10-20T07:00:00Z"), before, noshow()], false, NOW, opts);
    expect("call" in d).toBe(true);
    if (!("call" in d)) return;
    expect(d.call.reason).toBe("noshow");
    expect(d.call.variables.kanal).toBe("propusnata_sreshta");
    expect(d.call.variables.zayavka).toBe("срещата с Ивайло");
    expect(d.call.variables.data_zayavka).toBe("вчера");
  });

  it("не звъни, ако е говорено след пропуснатия час или е имал проведена среща", () => {
    const after = act("call", "2026-10-27T14:00:00Z", { title: "📞 Разговор 3 мин" });
    expect(decide(contact(), [noshow(), after], false, NOW, opts)).toEqual({ skip: "говорили след пропуснатия час" });
    const met = act("meeting", "2026-10-01T08:00:00Z", { title: "🎥 Среща" });
    expect(decide(contact(), [met, noshow()], false, NOW, opts)).toEqual({ skip: "имал е проведена среща" });
  });

  it("неявилите се са първи в реда", () => {
    const a = decide(contact({ id: "a" }), [lead()], false, NOW, opts);
    const b = decide(contact({ id: "b" }), [noshow()], false, NOW, opts);
    if (!("call" in a) || !("call" in b)) throw new Error("очаквах обаждания");
    expect(orderCalls([a.call, b.call]).map((c) => c.contactId)).toEqual(["b", "a"]);
  });
});

describe("думите", () => {
  it("име, кога, какво", () => {
    expect(firstName("vladimir dimov")).toBe("Vladimir");
    expect(firstName("+359888")).toBe("");
    expect(spokenWhen("2026-10-28T02:00:00Z", NOW)).toBe("тази нощ");
    expect(spokenWhen("2026-10-27T17:00:00Z", NOW)).toBe("вчера вечерта");
    expect(spokenWhen("2026-10-26T08:00:00Z", NOW)).toBe("в понеделник");
    expect(spokenWhen("2026-10-14T08:00:00Z", NOW)).toBe("на 14 октомври");
    expect(zayavkaFrom(act("meta_lead", NOW.toISOString(), { metadata: { offer: "kurs" } }))).toBe("безплатния курс по AI");
    expect(zayavkaFrom(undefined)).toBe("AI автоматизация");
  });
});
