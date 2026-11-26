import { describe, expect, it } from "vitest";
import {
  BEZ_REKLAMA,
  IZVAN_PERIODA,
  bezRoasPrediUebinara,
  denSofia,
  etiketNaData,
  kodNaReklama,
  medianaCpm,
  poDni,
  sabiraiReklami,
  tonCenaZapisan,
  tonChestota,
  tonCpm,
  tonCtr,
  tonRoas,
  type MetaRed,
  type Zapisan,
} from "./metriki";

const red = (o: Partial<MetaRed> & Pick<MetaRed, "ad_id" | "ad_name">): MetaRed => ({
  day: "2026-11-26",
  campaign_id: "c1",
  campaign_name: "Уебинар 29.11 · записвания",
  adset_id: "s1",
  adset_name: "Заплатата не стига",
  spend_eur: 10,
  impressions: 1000,
  clicks: 50,
  reach: 800,
  link_clicks: 30,
  landing_views: 25,
  registrations: 3,
  ...o,
});

const zap = (o: Partial<Zapisan>): Zapisan => ({ kod: null, adsetId: null, den: "2026-11-26", chas: false, kupil: false, prihod: 0, ...o });

describe("кодът на рекламата", () => {
  it("взима кода от името, и с кирилица", () => {
    expect(kodNaReklama("Уебинар 29.11 · K9 · Един час вечер (кола) · кукичка A")).toBe("K9");
    expect(kodNaReklama("Уебинар 29.11 · К9 · Един час вечер")).toBe("K9");
    expect(kodNaReklama("Уебинар 29.11 · Д7 · AI и работата ти")).toBe("D7");
    expect(kodNaReklama("Уебинар 29.11 · кукичка A")).toBeNull();
    expect(kodNaReklama(null)).toBeNull();
  });

  it("датата на уебинара и денят в София", () => {
    expect(etiketNaData("2026-11-29T19:00:00+02:00")).toBe("29.11");
    expect(denSofia("2026-11-26T23:30:00Z")).toBe("2026-11-27");
    expect(denSofia("2026-11-26T21:59:00Z")).toBe("2026-11-26");
  });
});

describe("сборът по реклами (като при Стефчо)", () => {
  const meta = [
    red({ ad_id: "a1", ad_name: "Уебинар 29.11 · K9 · Един час вечер (кола) · кукичка A", spend_eur: 20, impressions: 1500, link_clicks: 45, reach: 1200 }),
    red({ ad_id: "a2", ad_name: "Уебинар 29.11 · D7 · AI и работата ти (двор) · кукичка A", adset_id: "s2", adset_name: "AI · страх", spend_eur: 16, impressions: 1000, link_clicks: 8, reach: 300 }),
  ];
  const zapisani = [
    zap({ kod: "K9", chas: true }),
    zap({ kod: "K9", kupil: true, prihod: 2000 }),
    zap({ kod: "D7" }),
    zap({}),
  ];

  it("по реклама: записаните се връзват по кода, директните — отделно", () => {
    const { redove, obshto } = sabiraiReklami(meta, zapisani, "ad");
    const k9 = redove.find((r) => r.kluch === "K9")!;
    expect(k9.zapisani).toBe(2);
    expect(k9.chasove).toBe(1);
    expect(k9.kupili).toBe(1);
    expect(k9.cenaZapisan).toBe(10);
    expect(k9.ctr).toBeCloseTo(0.03);
    expect(k9.chestota).toBeCloseTo(1.25);
    expect(k9.roas).toBe(100);
    expect(redove.find((r) => r.kluch === BEZ_REKLAMA)?.zapisani).toBe(1);
    expect(obshto.razhod).toBe(36);
    expect(obshto.zapisani).toBe(4);
    expect(obshto.cenaZapisan).toBe(9);
  });

  it("по група: по групата на рекламата, иначе по utm_term, иначе „извън периода“", () => {
    const z = [...zapisani, zap({ kod: "R3", adsetId: "s2" }), zap({ kod: "R1" })];
    const { redove } = sabiraiReklami(meta, z, "adset");
    expect(redove.find((r) => r.kluch === "s1")?.zapisani).toBe(2);
    expect(redove.find((r) => r.kluch === "s2")?.zapisani).toBe(2);
    expect(redove.find((r) => r.kluch === IZVAN_PERIODA)?.zapisani).toBe(1);
    expect(redove.find((r) => r.kluch === BEZ_REKLAMA)?.zapisani).toBe(1);
  });

  it("по кампания: всички от рекламите в кампанията", () => {
    const { redove } = sabiraiReklami(meta, zapisani, "campaign");
    expect(redove.find((r) => r.kluch === "c1")?.zapisani).toBe(3);
    expect(redove.find((r) => r.kluch === "c1")?.razhod).toBe(36);
  });

  it("стари редове без кликове към страницата → броят се всички кликове и се казва", () => {
    const stari = [red({ ad_id: "a1", ad_name: "Уебинар 29.11 · K9 · x", link_clicks: null, reach: null, clicks: 90 })];
    const { redove } = sabiraiReklami(stari, [], "ad");
    expect(redove[0].klikove).toBe(90);
    expect(redove[0].vsichkiKlikove).toBe(true);
    expect(redove[0].chestota).toBeNull();
  });
});

describe("преди уебинара и без разход", () => {
  const meta = [red({ ad_id: "a1", ad_name: "Уебинар 29.11 · K9 · x", spend_eur: 20 })];

  it("редът без реклама няма цена (— , не 0 €)", () => {
    const { redove } = sabiraiReklami(meta, [zap({})], "ad");
    const bez = redove.find((r) => r.kluch === BEZ_REKLAMA)!;
    expect(bez.cenaZapisan).toBeNull();
    expect(bez.cpc).toBeNull();
    expect(bez.roas).toBeNull();
  });

  it("ROAS е „—“ преди уебинара, докато няма продажби", () => {
    const x = sabiraiReklami(meta, [zap({ kod: "K9" })], "ad");
    expect(x.redove[0].roas).toBe(0);
    const predi = bezRoasPrediUebinara(x, true);
    expect(predi.redove[0].roas).toBeNull();
    expect(predi.obshto.roas).toBeNull();
    expect(bezRoasPrediUebinara(x, false).redove[0].roas).toBe(0);
    const sProdazhba = sabiraiReklami(meta, [zap({ kod: "K9", kupil: true, prihod: 100 })], "ad");
    expect(bezRoasPrediUebinara(sProdazhba, true).redove[0].roas).toBe(5);
  });
});

describe("цветовете", () => {
  it("CTR, CPM, честота, цена на записан, ROAS", () => {
    expect(tonCtr(0.005)).toBe("zle");
    expect(tonCtr(0.025)).toBe("dobre");
    expect(tonCpm(30, 10)).toBe("zle");
    expect(tonCpm(5, 10)).toBe("dobre");
    expect(tonChestota(2.6)).toBe("sredno");
    expect(tonChestota(1.4)).toBeNull();
    expect(tonCenaZapisan(2.3)).toBe("dobre");
    expect(tonCenaZapisan(12)).toBe("zle");
    expect(tonRoas(0.5)).toBe("zle");
    expect(tonRoas(3.2)).toBe("dobre");
  });

  it("медианата на CPM", () => {
    const { redove } = sabiraiReklami([red({ ad_id: "a", ad_name: "x · A1", spend_eur: 10 }), red({ ad_id: "b", ad_name: "x · B1", spend_eur: 30 }), red({ ad_id: "c", ad_name: "x · C1", spend_eur: 20 })], [], "ad");
    expect(medianaCpm(redove)).toBe(20);
  });
});

describe("по дни", () => {
  it("разходът и записаните на ден", () => {
    const d = poDni(
      [red({ ad_id: "a", ad_name: "x", day: "2026-11-26", spend_eur: 10.111 }), red({ ad_id: "b", ad_name: "y", day: "2026-11-27", spend_eur: 5 })],
      [zap({ den: "2026-11-26" }), zap({ den: "2026-11-26" }), zap({ den: "2026-11-28" })]
    );
    expect(d).toEqual([
      { den: "2026-11-26", razhod: 10.11, zapisani: 2 },
      { den: "2026-11-27", razhod: 5, zapisani: 0 },
      { den: "2026-11-28", razhod: 0, zapisani: 1 },
    ]);
  });
});
