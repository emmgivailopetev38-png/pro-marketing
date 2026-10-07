import { describe, expect, it } from "vitest";
import { LEAD_OFFERS, MAGNET_BY_VARIANT, offerFor, offerFromNames, offerLabel, openerFor, type OfferKey } from "./lead-offers";
import { NARACHNIK_FORM_IDS, firstStepForForm } from "@/lib/email/lead-steps";

describe("какво е поискал човекът", () => {
  it("лийд магнитът се познава по формата (вариантът на първото писмо), не по името", () => {
    const variant = firstStepForForm([...NARACHNIK_FORM_IDS][0]).variant;
    expect(variant).toBe("narachnik");
    expect(offerFor({ magnetVariant: variant, campaignName: "каквото и да е", source: "meta_lead" })).toBe("narachnik");
  });

  it("курсът има готов ред — ако първото му писмо е с вариант „kurs“, не трябва нищо друго", () => {
    expect(MAGNET_BY_VARIANT.kurs).toBe("kurs");
    expect(offerFor({ magnetVariant: "kurs", source: "meta_lead" })).toBe("kurs");
    expect(LEAD_OFFERS.kurs.label).toBe("🎓 Безплатен курс");
    expect(LEAD_OFFERS.kurs.magnet).toBe(true);
  });

  it("по името на формата или кампанията — живите кампании от 07.10.2026", () => {
    expect(offerFromNames("ПМ · Лийд магнит · AI наръчник · 2026-10-07")).toBe("narachnik");
    expect(offerFromNames(null, "ПМ · Лийд магнит · Безплатен курс · 2026-10-08")).toBe("kurs");
    expect(offerFromNames("ProMarketing · Безплатен AI одит · 10.2026")).toBe("ai_odit");
    expect(offerFromNames(null, "ProMarketing · AI автоматизации · ФИЛМ · Безплатен AI одит · LEADS · 25 € · 07.10")).toBe("ai_odit");
    expect(offerFromNames("ProMarketing · Преглед на рекламата · 10.2026")).toBe("marketing");
    expect(offerFromNames(null, "ProMarketing · Академия · Менторска програма · LEADS · 9 € · 01.10")).toBe("mentorska");
    expect(offerFromNames(null, "ProMarketing · ОБЩА · AI + автоматизации + камери + гласов агент")).toBeNull();
    expect(offerFromNames(null, "")).toBeNull();
  });

  it("формата бие кампанията: първото име със съвпадение печели", () => {
    expect(offerFor({ formName: "ProMarketing · Безплатен AI одит · 10.2026", campaignName: "ПМ · Лийд магнит · AI наръчник", source: "meta_lead" })).toBe("ai_odit");
  });

  it("без форма и без познато име — по източника", () => {
    expect(offerFor({ source: "meta_lead" })).toBe("reklama");
    expect(offerFor({ source: "website_form" })).toBe("sait");
    expect(offerFor({ source: "voice_web" })).toBe("glas");
    expect(offerFor({ source: "hermes" })).toBeNull();
    expect(offerFor({})).toBeNull();
  });
});

describe("първото изречение на разговора", () => {
  it("наръчникът — точно за какво звъни", () => {
    expect(openerFor("narachnik", "Димитър")).toBe(
      "Здравейте, Димитър съм от Pro Marketing — обаждам се за AI наръчника, който изтеглихте. Успяхте ли да го разгледате?"
    );
    expect(offerLabel("narachnik")).toBe("📘 Наръчник");
  });

  it("името на човека, който звъни; без име — Димитър", () => {
    expect(openerFor("ai_odit", "Ивайло")).toMatch(/^Здравейте, Ивайло съм от Pro Marketing/);
    expect(openerFor("ai_odit", "  ")).toMatch(/^Здравейте, Димитър съм/);
    expect(openerFor(null, "Димитър")).toBeNull();
    expect(openerFor("nyama" as OfferKey, "Димитър")).toBeNull();
  });

  it("всяко изречение е учтиво, без извинения и без „гоня“", () => {
    for (const key of Object.keys(LEAD_OFFERS) as OfferKey[]) {
      const o = openerFor(key, "Димитър") ?? "";
      expect(o, key).toMatch(/^Здравейте, Димитър съм от Pro Marketing — /);
      expect(o, key).toMatch(/\?$/);
      for (const bad of ["гоня", "извинявам", "безпокоя", "да не ви губя", "да не преча", "{име}"]) {
        expect(o.toLowerCase(), key).not.toContain(bad);
      }
    }
  });
});
