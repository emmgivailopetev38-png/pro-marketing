import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseAmount,
  parseFormQuestions,
  parsePartnerForward,
  partnerForPage,
  partnerLeadBody,
  resolveFieldData,
  slotForQuestion,
  sofiaReceivedAt,
  type PartnerForward,
} from "./partner-pages";

const CCGROUP: PartnerForward = {
  page_id: "106532484251875",
  url: "https://ccgroup-crm.vercel.app/api/leads",
  token_env: "CCGROUP_LEADS_TOKEN",
  source: "Facebook реклама",
  label: "CCGroup",
};

/** Лийд от формата на Иво (v3: вид имот · сума · населено място), както го връща Graph. */
const ivoLead = {
  id: "1234567890",
  created_time: "2026-10-26T07:03:12+0000",
  ad_name: "D · 3 просрочени вноски",
  campaign_name: "CCGroup | Лийдове | Собственици на имот | D+E+B | 16.10.2026",
  form_id: "1649235670330145",
  field_data: [
    { name: "Какъв_е_видът_на_имота?", values: ["Апартамент"] },
    { name: "Каква_сума_Ви_е_необходима?", values: ["50 000 – 100 000 €"] },
    { name: "Къде_се_намира_имотът?_(населено_място)", values: ["Пловдив"] },
    { name: "email", values: ["ivan@example.bg"] },
    { name: "full_name", values: ["Иван Петров"] },
    { name: "phone_number", values: ["+359888123456"] },
  ],
};

describe("превод на лийда към /api/leads на партньора", () => {
  it("стандартните полета + имот/сума/град по ключови думи, всичко и в answers", () => {
    const b = partnerLeadBody(ivoLead, CCGROUP);
    expect(b.full_name).toBe("Иван Петров");
    expect(b.phone).toBe("+359888123456");
    expect(b.email).toBe("ivan@example.bg");
    expect(b.property).toBe("Апартамент");
    expect(b.amount).toBe(50000);
    expect(b.city).toBe("Пловдив");
    expect(b.urgency).toBeUndefined();
    expect(b.source).toBe("Facebook реклама");
    expect(b.ad_name).toBe("D · 3 просрочени вноски");
    expect(b.received_at).toBe("26.10 09:03"); // лятното време свърши на 25.10 → UTC+2
    expect(b.answers).toEqual([
      { question: "Какъв е видът на имота?", answer: "Апартамент" },
      { question: "Каква сума Ви е необходима?", answer: "50 000 – 100 000 €" },
      { question: "Къде се намира имотът? (населено място)", answer: "Пловдив" },
    ]);
  });

  it("спешността и „Какъв имот притежавате?“ също се разпознават; first/last name се слепват", () => {
    const b = partnerLeadBody(
      {
        id: "2",
        created_time: "2026-01-05T22:30:00+0000",
        field_data: [
          { name: "first_name", values: ["Мария"] },
          { name: "last_name", values: ["Иванова"] },
          { name: "phone", values: ["0888123456"] },
          { name: "Какъв_имот_притежавате?", values: ["Къща"] },
          { name: "Каква_сума_Ви_трябва?", values: ["35 хил."] },
          { name: "Колко_е_спешно?", values: ["Спешно"] },
          { name: "Как_да_се_свържем_с_Вас?", values: ["По телефона"] },
        ],
      },
      CCGROUP
    );
    expect(b.full_name).toBe("Мария Иванова");
    expect(b.property).toBe("Къща");
    expect(b.amount).toBe(35000);
    expect(b.urgency).toBe("Спешно");
    expect(b.city).toBeUndefined();
    expect(b.received_at).toBe("06.01 00:30"); // UTC+2 през януари → следващият ден
    expect(b.answers.at(-1)).toEqual({ question: "Как да се свържем с Вас?", answer: "По телефона" });
  });

  it("„Къде се намира имотът“ е град, не имот", () => {
    expect(slotForQuestion("Къде се намира имотът?")).toBe("city");
    expect(slotForQuestion("Какъв е видът на имота?")).toBe("property");
    expect(slotForQuestion("Каква сума Ви е необходима?")).toBe("amount");
    expect(slotForQuestion("Кога искате да започнете?")).toBe("urgency");
    expect(slotForQuestion("Как да се свържем?")).toBeNull();
  });

  it("сумата: първото число, хиляди, без число → undefined", () => {
    expect(parseAmount("50 000 – 100 000 €")).toBe(50000);
    expect(parseAmount("над 100 000")).toBe(100000);
    expect(parseAmount("20,000")).toBe(20000);
    expect(parseAmount("100.000 евро")).toBe(100000);
    expect(parseAmount("50k")).toBe(50000);
    expect(parseAmount("двайсет хиляди")).toBeUndefined();
    expect(parseAmount("")).toBeUndefined();
  });

  it("received_at е софийско „дд.мм чч:мм“; счупена дата → няма", () => {
    expect(sofiaReceivedAt("2026-10-07T12:17:39+0000")).toBe("07.10 15:17");
    expect(sofiaReceivedAt("не е дата")).toBeUndefined();
    expect(sofiaReceivedAt(null)).toBeUndefined();
  });
});

describe("картата META_PARTNER_FORWARD", () => {
  const RAW = JSON.stringify({
    "106532484251875": { url: "https://ccgroup-crm.vercel.app/api/leads", token_env: "CCGROUP_LEADS_TOKEN" },
    "123": { url: "http://insecure.example", token_env: "X" }, // не е https → отпада
    "99999999999": { url: "https://ok.example/api", token_env: "" }, // без token_env → отпада
  });

  it("чете само валидните записи и слага подразбирания", () => {
    const map = parsePartnerForward(RAW);
    expect(Object.keys(map)).toEqual(["106532484251875"]);
    expect(map["106532484251875"]).toEqual({
      page_id: "106532484251875",
      url: "https://ccgroup-crm.vercel.app/api/leads",
      token_env: "CCGROUP_LEADS_TOKEN",
      source: "Facebook реклама",
      label: "106532484251875",
    });
  });

  it("празно или счупено → празна карта", () => {
    expect(parsePartnerForward("")).toEqual({});
    expect(parsePartnerForward(undefined)).toEqual({});
    expect(parsePartnerForward("{не е json")).toEqual({});
    expect(parsePartnerForward("[1,2]")).toEqual({});
  });

  describe("partnerForPage от env", () => {
    beforeEach(() => {
      vi.stubEnv("META_PARTNER_FORWARD", RAW);
    });
    afterEach(() => {
      vi.unstubAllEnvs();
    });
    it("намира партньора по page id; нашата/непозната страница → null", () => {
      expect(partnerForPage("106532484251875")?.url).toBe("https://ccgroup-crm.vercel.app/api/leads");
      expect(partnerForPage("106080979260944")).toBeNull();
      expect(partnerForPage("")).toBeNull();
    });
  });
});

/** Формата v4 на Иво (28.10.2026): Graph дава ключовете o1…o8, дефиницията — текста. */
const ivoFormV4 = {
  questions: [
    { key: "kade_e_imotat", type: "CUSTOM", label: "Къде се намира имотът?", options: [
      { key: "o1", value: "София" }, { key: "o5", value: "Русе" }, { key: "o8", value: "Друго място" } ] },
    { key: "vid_imot", type: "CUSTOM", label: "Какъв е имотът?", options: [
      { key: "o1", value: "Апартамент" }, { key: "o2", value: "Къща" }, { key: "o6", value: "Нямам имот" } ] },
    { key: "suma", type: "CUSTOM", label: "Каква сума Ви е необходима?", options: [
      { key: "o1", value: "Под 20 000 €" }, { key: "o2", value: "20 000 – 50 000 €" }, { key: "o4", value: "Над 100 000 €" } ] },
    { key: "koga", type: "CUSTOM", label: "Кога Ви трябват средствата?", options: [
      { key: "o1", value: "До 2 седмици" }, { key: "o3", value: "Само проучвам" } ] },
    { key: "full_name", type: "FULL_NAME", label: "Full name" },
    { key: "phone_number", type: "PHONE", label: "Phone number" },
    { key: "email", type: "EMAIL", label: "Email" },
  ],
};

describe("формата v4: ключовете на въпросите и отговорите се превеждат по дефиницията", () => {
  it("o-кодовете стават текст, label-ът става въпрос, стандартните полета пазят ключа си", () => {
    const form = parseFormQuestions(ivoFormV4);
    expect(Object.keys(form)).toHaveLength(7);
    expect(form.suma.options.o2).toBe("20 000 – 50 000 €");
    const resolved = resolveFieldData(
      [
        { name: "suma", values: ["o2"] },
        { name: "kade_e_imotat", values: ["o5"] },
        { name: "vid_imot", values: ["o2"] },
        { name: "koga", values: ["o1"] },
        { name: "full_name", values: ["Борислав Гълъбов"] },
        { name: "phone_number", values: ["+359897378578"] },
        { name: "email", values: ["b@example.bg"] },
        { name: "nepoznat_vapros", values: ["x"] },
      ],
      form
    );
    expect(resolved).toEqual([
      { name: "Каква сума Ви е необходима?", values: ["20 000 – 50 000 €"] },
      { name: "Къде се намира имотът?", values: ["Русе"] },
      { name: "Какъв е имотът?", values: ["Къща"] },
      { name: "Кога Ви трябват средствата?", values: ["До 2 седмици"] },
      { name: "full_name", values: ["Борислав Гълъбов"] },
      { name: "phone_number", values: ["+359897378578"] },
      { name: "email", values: ["b@example.bg"] },
      { name: "nepoznat_vapros", values: ["x"] },
    ]);
    const b = partnerLeadBody({ id: "1", created_time: "2026-10-29T14:50:40+0000", form_id: "1407165992484488", field_data: resolved }, CCGROUP);
    expect(b.full_name).toBe("Борислав Гълъбов");
    expect(b.city).toBe("Русе");
    expect(b.property).toBe("Къща");
    expect(b.amount).toBe(20000);
    expect(b.urgency).toBe("До 2 седмици");
    expect(b.received_at).toBe("29.10 16:50");
    expect(b.answers[0]).toEqual({ question: "Каква сума Ви е необходима?", answer: "20 000 – 50 000 €" });
  });

  it("„Под 20 000 €“ няма точна сума, „Над 100 000 €“ е 100 000; „Нямам имот“ минава като имот-текст", () => {
    const form = parseFormQuestions(ivoFormV4);
    const b = partnerLeadBody(
      { id: "2", field_data: resolveFieldData([
        { name: "suma", values: ["o1"] }, { name: "vid_imot", values: ["o6"] }, { name: "kade_e_imotat", values: ["o8"] },
        { name: "full_name", values: ["Тест"] }, { name: "phone_number", values: ["+359888000000"] } ], form) },
      CCGROUP
    );
    expect(b.amount).toBeUndefined();
    expect(b.property).toBe("Нямам имот");
    expect(b.city).toBe("Друго място");
    expect(parseAmount("Над 100 000 €")).toBe(100000);
    expect(parseAmount("до 15 000")).toBeUndefined();
  });

  it("без дефиниция (Graph не отговори) всичко остава както е", () => {
    const raw = [{ name: "suma", values: ["o2"] }];
    expect(resolveFieldData(raw, null)).toBe(raw);
    expect(parseFormQuestions({ error: { message: "x" } })).toEqual({});
  });
});
