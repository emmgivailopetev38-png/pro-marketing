import { describe, expect, it } from "vitest";
import {
  AUTO_LOG_TYPE,
  DEFAULT_OPTIONS,
  formAnswersSummary,
  formProfileFor,
  bgMobileE164,
  decide,
  firstName,
  inCallWindow,
  orderCalls,
  spokenTime,
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
  it("пон–пт 08:30–17:00 по София (09.11.2026: „да звъни до 17:00“)", () => {
    expect(inCallWindow(new Date("2026-10-28T06:30:00Z"))).toBe(true); // ср 08:30
    expect(inCallWindow(new Date("2026-10-28T06:29:00Z"))).toBe(false); // ср 08:29
    expect(inCallWindow(new Date("2026-10-28T14:59:00Z"))).toBe(true); // ср 16:59
    expect(inCallWindow(new Date("2026-10-28T15:00:00Z"))).toBe(false); // ср 17:00
    expect(inCallWindow(new Date("2026-10-28T16:30:00Z"))).toBe(false); // ср 18:30
    expect(inCallWindow(new Date("2026-10-28T18:59:00Z"))).toBe(false); // ср 20:59 (старият край беше 21:00)
    expect(inCallWindow(new Date("2026-10-30T09:00:00Z"))).toBe(true); // петък 11:00
    expect(inCallWindow(new Date("2026-10-31T09:00:00Z"))).toBe(false); // събота
    expect(inCallWindow(new Date("2026-11-01T09:00:00Z"))).toBe(false); // неделя
  });
  it("лятното време се смята правилно (UTC+3)", () => {
    expect(inCallWindow(new Date("2026-10-22T05:30:00Z"))).toBe(true); // чт 08:30 EEST
    expect(inCallWindow(new Date("2026-10-22T05:29:00Z"))).toBe(false);
    expect(inCallWindow(new Date("2026-10-22T13:59:00Z"))).toBe(true); // чт 16:59 EEST
    expect(inCallWindow(new Date("2026-10-22T14:00:00Z"))).toBe(false); // чт 17:00 EEST
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


  it("лийд от форма в VOICE_AUTO_SKIP_FORMS не е за Ели (звъни човек)", () => {
    const now = new Date("2026-11-09T09:00:00+02:00");
    const lead = { activity_type: "meta_lead", title: "Meta lead · ПОКРАЙ РАБОТАТА", occurred_at: "2026-11-09T08:40:00+02:00", created_by: "meta_webhook", metadata: { form_id: "3062805607239108" } };
    const skip = decide(contact(), [lead], false, now, { ...opts, skipForms: new Set(["3062805607239108"]) });
    expect("skip" in skip && skip.skip).toMatch(/форма 3062805607239108/);
    const call = decide(contact(), [lead], false, now, { ...opts, skipForms: new Set(["111"]) });
    expect("call" in call).toBe(true);
  });
 
  it("форма „Покрай работата“ → профил: не фирма, разговор с Георги, отговорите в бележката", () => {
    const now = new Date("2026-11-09T09:00:00+02:00");
    const lead = { activity_type: "meta_lead", title: "Meta lead · ПОКРАЙ РАБОТАТА", occurred_at: "2026-11-09T08:40:00+02:00", created_by: "meta_webhook", metadata: { form_id: "3062805607239108", meta_lead_id: "555" } };
    const d = decide(contact(), [lead], false, now, opts);
    expect("call" in d).toBe(true);
    if (!("call" in d)) return;
    expect(d.call.variables.kanal).toBe("pokrai_rabotata");
    expect(d.call.variables.povod).toMatch(/Покрай работата/);
    expect(d.call.variables.istoriya).toMatch(/ЧОВЕК НА ЗАПЛАТА/);
    expect(d.call.metaLeadId).toBe("555");
    const prof = formProfileFor("3062805607239108")!;
    expect(formAnswersSummary(prof, [{ name: "situacia", values: ["rabota"] }, { name: "vreme", values: ["h2_5"] }, { name: "cel", values: ["uslugi"] }, { name: "phone_number", values: ["+359888"] }]))
      .toBe("Къде е сега: на работа е и иска още един доход покрай нея; Време седмично: 2–5 часа; Цел: да прави AI системи за фирми срещу заплащане");
    expect(formProfileFor("1443268750632089")).toBeNull();
  });

  it("форма „AI обучение АЗ“ (2625101691244588) → kanal az_obuchenie, профил за фирма, отговорите по ключове", () => {
    const now = new Date("2026-11-09T09:00:00+02:00");
    const lead = { activity_type: "meta_lead", title: "Meta lead · AI обучение АЗ", occurred_at: "2026-11-09T08:40:00+02:00", created_by: "meta_webhook", metadata: { form_id: "2625101691244588", meta_lead_id: "777" } };
    const d = decide(contact(), [lead], false, now, opts);
    expect("call" in d).toBe(true);
    if (!("call" in d)) return;
    expect(d.call.variables.kanal).toBe("az_obuchenie");
    expect(d.call.variables.zayavka).toMatch(/Агенцията по заетостта/);
    expect(d.call.variables.povod).toMatch(/шестнайсети ноември/);
    expect(d.call.variables.vhod).toMatch(/става ли\?$/);
    expect(d.call.variables.istoriya).toMatch(/ФИРМА\/РАБОТОДАТЕЛ/);
    expect(d.call.variables.istoriya).toMatch(/Не обещавай одобрение/);
    expect(d.call.metaLeadId).toBe("777");
    const prof = formProfileFor("2625101691244588")!;
    expect(formAnswersSummary(prof, [{ name: "sluzhiteli", values: ["s2_5"] }, { name: "sfera", values: ["horeca"] }, { name: "kep", values: ["neznam"] }]))
      .toBe("Служители на трудов договор: 2–5 души на трудов договор; Сфера: ресторант / хотел / туризъм; КЕП: не знае — счетоводителят");
  });

  it("форма от сайта /obuchenie-az → същият профил, отговорите от metadata.answers_summary", () => {
    const now = new Date("2026-11-09T09:00:00+02:00");
    const lead = { activity_type: "website_form", title: "🎓 AI обучение АЗ · заявка от сайта", occurred_at: "2026-11-09T08:40:00+02:00", created_by: "website", metadata: { form_id: "sait-obuchenie-az", answers_summary: "Служители на трудов договор: 6–15" } };
    const d = decide(contact(), [lead], false, now, opts);
    expect("call" in d).toBe(true);
    if (!("call" in d)) return;
    expect(d.call.variables.kanal).toBe("az_obuchenie");
    expect(d.call.variables.povod).toMatch(/от сайта/);
    expect(d.call.variables.istoriya).toMatch(/ФИРМА\/РАБОТОДАТЕЛ/);
    expect(d.call.variables.istoriya).toMatch(/Отговори във формата — Служители на трудов договор: 6–15\./);
    expect(d.call.metaLeadId).toBeNull();
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

  it("гласова поща не е вдигнал човек — дори съобщението да е дълго", () => {
    const l = lead("2026-10-27T07:00:00Z");
    const vm = act("voice_call", "2026-10-27T08:00:00Z", { metadata: { agent_id: ELI, duration_secs: 41, call_successful: "unknown", voicemail: true } });
    const d = decide(contact(), [l, vm], false, NOW, opts);
    expect("call" in d && d.call.attempt).toBe(2);
  });

  it("първото изречение: поводът и входът са променливи", () => {
    const d = decide(contact(), [lead("2026-10-28T07:00:00Z")], false, NOW, opts);
    if (!("call" in d)) throw new Error("очаквах обаждане");
    expect(d.call.variables.povod).toBe("по заявката ви за безплатен AI одит");
    expect(d.call.variables.vhod).toMatch(/^Един бърз въпрос/);
    expect(d.call.maxAttempts).toBe(2);
  });
});

describe("неявил се", () => {
  const noshow = (at = "2026-10-27T12:00:00Z", over: Record<string, unknown> = {}) =>
    act("note", at, { title: "🙈 Не се яви на срещата", metadata: { kind: "noshow", missed_at: "2026-10-27T09:00:00Z", ...over } });
  const dial = (at: string) => act(AUTO_LOG_TYPE, at, { created_by: "eli_auto" });
  const eli = (at: string, secs: number) =>
    act("voice_call", at, { metadata: { agent_id: ELI, duration_secs: secs, call_successful: "success" } });

  it("звъни за нов час, дори ако е говорил по телефона ПРЕДИ срещата", () => {
    const before = act("call", "2026-10-20T08:00:00Z", { title: "Говорихме · интерес" });
    const d = decide(contact(), [lead("2026-10-20T07:00:00Z"), before, noshow()], false, NOW, opts);
    expect("call" in d).toBe(true);
    if (!("call" in d)) return;
    expect(d.call.reason).toBe("noshow");
    expect(d.call.maxAttempts).toBe(4);
    expect(d.call.variables.kanal).toBe("propusnata_sreshta");
    expect(d.call.variables.zayavka).toBe("срещата с Ивайло");
    expect(d.call.variables.data_zayavka).toBe("вчера в единайсет часа");
    expect(d.call.variables.povod).toBe("за срещата с Ивайло вчера в единайсет часа — разминахме се");
    expect(d.call.variables.vhod).toMatch(/нов удобен час/);
  });

  it("казва с кого е била срещата — клоузърът от бележката", () => {
    const d = decide(contact(), [noshow("2026-10-27T12:00:00Z", { missed_with: "Георги", missed_booking_id: "b1" })], false, NOW, opts);
    if (!("call" in d)) throw new Error("очаквах обаждане");
    expect(d.call.variables.zayavka).toBe("срещата с Георги");
    expect(d.call.variables.povod).toBe("за срещата с Георги вчера в единайсет часа — разминахме се");
    expect(d.call.variables.istoriya).toMatch(/при Георги/);
  });

  it("не звъни, ако е говорено след пропуснатия час или е имал проведена среща", () => {
    const after = act("call", "2026-10-27T14:00:00Z", { title: "📞 Разговор 3 мин" });
    expect(decide(contact(), [noshow(), after], false, NOW, opts)).toEqual({ skip: "говорили след пропуснатия час" });
    const met = act("meeting", "2026-10-01T08:00:00Z", { title: "🎥 Среща" });
    expect(decide(contact(), [met, noshow()], false, NOW, opts)).toEqual({ skip: "имал е проведена среща" });
  });

  it("самата пропусната среща стои в картона като `meeting` — тя не е проведена и не спира Ели", () => {
    // upsertBooking записва „Среща · дата“ в часа на срещата (Стоян, 04.11.2026: заради нея Ели не му звънна).
    const missed = act("meeting", "2026-10-27T09:00:00Z", { title: "Среща · 2026-10-27", metadata: { booking_id: "b1" } });
    const d = decide(contact(), [missed, noshow("2026-10-27T12:00:00Z", { missed_booking_id: "b1" })], false, NOW, opts);
    expect("call" in d).toBe(true);
    // Същото и без booking_id в бележката — часът на срещата съвпада с пропуснатия.
    const d2 = decide(contact(), [missed, noshow()], false, NOW, opts);
    expect("call" in d2).toBe(true);
  });

  it("до четири опита: веднага, на другия ден, после през два дни", () => {
    const n = noshow("2026-10-22T12:00:00Z", { missed_at: "2026-10-22T09:00:00Z" });
    const a1 = dial("2026-10-22T12:30:00Z");
    const a2 = dial("2026-10-23T08:00:00Z");
    const d3 = decide(contact(), [n, a1, a2], false, NOW, opts);
    expect("call" in d3 && d3.call.attempt).toBe(3);
    expect(decide(contact(), [n, a1, a2, dial("2026-10-27T08:00:00Z")], false, NOW, opts)).toEqual({ skip: "пауза 2 дни между опитите" });
    expect(decide(contact(), [n, a1, a2, dial("2026-10-25T08:00:00Z"), dial("2026-10-26T08:00:00Z")], false, NOW, opts)).toEqual({
      skip: "4 опита — стига",
    });
  });

  it("говорил с Ели без час → още един опит след два дни; обещано обаждане или „не“ → спира", () => {
    const n = noshow("2026-10-24T12:00:00Z", { missed_at: "2026-10-24T09:00:00Z" });
    expect(decide(contact(), [n, eli("2026-10-27T08:00:00Z", 60)], false, NOW, opts)).toEqual({ skip: "говори с Ели без час — пауза 2 дни" });
    const d = decide(contact(), [n, eli("2026-10-26T08:00:00Z", 60)], false, NOW, opts);
    if (!("call" in d)) throw new Error("очаквах обаждане");
    expect(d.call.attempt).toBe(2);
    expect(d.call.variables.istoriya).toMatch(/говори с Ели веднъж/);
    const promise = act("note", "2026-10-26T08:05:00Z", { metadata: { kind: "callback_promise", at: "2026-11-02T08:00:00Z" } });
    expect(decide(contact(), [n, eli("2026-10-26T08:00:00Z", 60), promise], false, NOW, opts)).toEqual({ skip: "обеща обаждане или не иска — Ели спира" });
    expect(decide(contact(), [n, eli("2026-10-24T13:00:00Z", 60), eli("2026-10-26T08:00:00Z", 50)], false, NOW, opts)).toEqual({
      skip: "говори с Ели два пъти без час — стига",
    });
  });

  it("часът с думи за първото изречение", () => {
    expect(spokenTime("2026-10-27T09:00:00Z")).toBe("в единайсет часа");
    expect(spokenTime("2026-10-27T12:30:00Z")).toBe("в четиринайсет и половина");
    expect(spokenTime("2026-10-27T07:15:00Z")).toBe("в девет и петнайсет");
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
    expect(firstName("vladimir dimov")).toBe("Владимир");
    expect(firstName("+359888")).toBe("");
    expect(firstName("Светла Иван Мишеви")).toBe("Светла");
  });

  it("латинските имена от Meta формата стават кирилица, за да ги изговори Ели", () => {
    const cases: Record<string, string> = {
      Elmer: "Елмер", Blagoy: "Благой", Svetlozar: "Светлозар", Plamen: "Пламен", Yordanka: "Йорданка", Nailedin: "Наиледин",
      Vasil: "Васил", Elena: "Елена", Stoyan: "Стоян", Boyko: "Бойко", Nikolay: "Николай", Yulia: "Юлия", Maria: "Мария",
      Liliq: "Лилия", Mariq: "Мария", Zhivko: "Живко", Chavdar: "Чавдар", Tsvetan: "Цветан", Cvetelina: "Цветелина",
      Ventsislav: "Венцислав", Hristo: "Христо", Yordan: "Йордан", Yoana: "Йоана", Petyo: "Петьо", Kristiyan: "Кристиян",
      Dimitar: "Димитър", Lachezar: "Лъчезар", Nadia: "Надя", Vanya: "Ваня", Georgi: "Георги", Shteryo: "Щерьо", Reneta: "Ренета",
    };
    for (const [lat, cyr] of Object.entries(cases)) expect(firstName(lat), lat).toBe(cyr);
    // Кирилица и смесени низове не се пипат.
    expect(firstName("Лъчезар Генов")).toBe("Лъчезар");
    expect(firstName("Ivan4o")).toBe("");
    expect(firstName("Funky-360")).toBe("");
    expect(firstName("Jean-Pierre")).toBe("Jean-Pierre");
    expect(spokenWhen("2026-10-28T02:00:00Z", NOW)).toBe("тази нощ");
    expect(spokenWhen("2026-10-27T17:00:00Z", NOW)).toBe("вчера вечерта");
    expect(spokenWhen("2026-10-26T08:00:00Z", NOW)).toBe("в понеделник");
    expect(spokenWhen("2026-10-14T08:00:00Z", NOW)).toBe("на 14 октомври");
    expect(zayavkaFrom(act("meta_lead", NOW.toISOString(), { metadata: { offer: "kurs" } }))).toBe("безплатния курс по AI");
    expect(zayavkaFrom(undefined)).toBe("AI автоматизация");
  });
});
