import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseAmount,
  parsePartnerForward,
  partnerForPage,
  partnerLeadBody,
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
