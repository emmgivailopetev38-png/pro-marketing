import { describe, expect, it } from "vitest";
import { classifyCampaign, isFresh, summarize, toEur, USD_PER_EUR, type SpendRow } from "./ads-spend";

describe("classifyCampaign", () => {
  it("нашите кампании за лийдове", () => {
    expect(classifyCampaign("ProMarketing · ОБЩА · AI + автоматизации · LEADS · €18 · 15.09")).toBe("leads");
    expect(classifyCampaign("ProMarketing AI · Video Test 18.08 · CBO €15")).toBe("leads");
    expect(classifyCampaign("АЙ СРМ 24.05.2026")).toBe("leads");
    expect(classifyCampaign("сайт лийдове 12.05.26")).toBe("leads");
    expect(classifyCampaign("Уебинар 23.07 · LEADS · видео · $10")).toBe("leads");
  });

  it("кампанията на клиент не влиза в нашата цена на лийд", () => {
    expect(classifyCampaign("Белцов къща · Звънене на Вили · HOUSING · само Русе")).toBe("client");
    expect(classifyCampaign("Homers · Casa Due · Стара Загора")).toBe("client");
  });

  it("магазинът и обявата за човек са отделно", () => {
    expect(classifyCampaign("ХИДРА М1 · ПРОДАЖБИ · фуги и тераса")).toBe("shop");
    expect(classifyCampaign("Sleep Green Elixir – Copy")).toBe("shop");
    expect(classifyCampaign("Мастър Клас Продажби · Клоузър · LEADS · 18.09")).toBe("hiring");
  });

  it("непозната кампания отива в „неразпределено“, не в лийдовете", () => {
    expect(classifyCampaign("New Sales campaign – Banica – Copy 4")).toBe("other");
    expect(classifyCampaign("")).toBe("other");
    expect(classifyCampaign(null)).toBe("other");
  });

  it("клиентът бие нашето име, ако и двете ги има", () => {
    expect(classifyCampaign("ProMarketing · Белцов къща · $3.50")).toBe("client");
  });
});

describe("toEur", () => {
  it("доларите минават по курса на бюджетите", () => {
    const r = toEur(23.4, "USD");
    expect(r.spend_eur).toBe(20);
    expect(r.fx_rate).toBe(USD_PER_EUR);
    expect(r.fx_source).toContain("1.17");
  });

  it("еврото си остава евро", () => {
    expect(toEur(18, "EUR")).toEqual({ spend_eur: 18, fx_rate: 1, fx_source: "none" });
  });
});

const row = (p: Partial<SpendRow> & { campaign_id: string; purpose: SpendRow["purpose"]; spend_eur: number }): SpendRow => ({
  day: "2026-09-20",
  campaign_name: p.campaign_id,
  spend: p.spend_eur * USD_PER_EUR,
  impressions: 0,
  clicks: 0,
  leads: 0,
  ...p,
});

describe("summarize", () => {
  const rows = [
    row({ campaign_id: "c1", campaign_name: "ProMarketing · ОБЩА", purpose: "leads", spend_eur: 100, impressions: 1000, clicks: 20, leads: 30 }),
    row({ campaign_id: "c1", campaign_name: "ProMarketing · ОБЩА", purpose: "leads", spend_eur: 50, day: "2026-09-21", impressions: 500, clicks: 10, leads: 10 }),
    row({ campaign_id: "c2", campaign_name: "Белцов къща", purpose: "client", spend_eur: 40 }),
    row({ campaign_id: "c3", campaign_name: "Мастър Клас", purpose: "hiring", spend_eur: 10 }),
  ];

  it("в цената на резултата влиза само нашият лийд разход", () => {
    const s = summarize(rows);
    expect(s.leadsEur).toBe(150);
    expect(s.totalEur).toBe(200);
  });

  it("кампаниите се сумират и се подреждат по разход", () => {
    const s = summarize(rows);
    expect(s.byCampaign[0]).toMatchObject({ campaign_id: "c1", eur: 150, impressions: 1500, clicks: 30, metaLeads: 40 });
    expect(s.byCampaign.map((c) => c.campaign_id)).toEqual(["c1", "c2", "c3"]);
  });

  it("по предназначение, без празните", () => {
    const s = summarize(rows);
    expect(s.byPurpose).toEqual([
      { purpose: "leads", label: "Наши лийдове", eur: 150 },
      { purpose: "client", label: "Кампания на клиент", eur: 40 },
      { purpose: "hiring", label: "Търсим човек", eur: 10 },
    ]);
  });

  it("последният ден показва докъде е стигнал синхронът", () => {
    expect(summarize(rows).lastDay).toBe("2026-09-21");
    expect(summarize([]).lastDay).toBe(null);
  });
});

describe("isFresh", () => {
  const today = new Date("2026-09-23T09:00:00Z");
  it("вчерашните данни са свежи", () => {
    expect(isFresh("2026-09-22", today)).toBe(true);
    expect(isFresh("2026-09-23", today)).toBe(true);
  });
  it("по-старите не са", () => {
    expect(isFresh("2026-09-20", today)).toBe(false);
    expect(isFresh(null, today)).toBe(false);
  });
});
