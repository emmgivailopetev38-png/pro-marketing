import { describe, expect, it } from "vitest";
import { attributionBody, leadAttribution, magnetStepFor, magnetVariantFor } from "./meta-lead-rules";
import { LEAD_SEQUENCE, NARACHNIK_FORM_IDS } from "@/lib/email/lead-steps";

const NARACHNIK_FORM = [...NARACHNIK_FORM_IDS][0];

/** Истинският лийд от 07.10.2026, 15:17 — така го връща Graph API. */
const narachnikLead = {
  id: "966655555864670",
  created_time: "2026-10-07T12:17:39+0000",
  ad_id: "120248709913930574",
  ad_name: "Корица · AI наръчник · 2026-10-07",
  adset_id: "120248709769970574",
  adset_name: "BG · 25–60 · без Advantage+ audience · AI наръчник · 2026-10-07",
  campaign_id: "120248709769130574",
  campaign_name: "ПМ · Лийд магнит · AI наръчник · 2026-10-07",
  form_id: NARACHNIK_FORM,
};

describe("откъде е дошъл лийдът", () => {
  it("кампания, ад сет, реклама и форма — с id и име; какво е поискал", () => {
    const a = leadAttribution(narachnikLead, { formName: "ПМ · Лийд магнит · AI наръчник · 2026-10-07" });
    expect(a).toEqual({
      meta_lead_id: "966655555864670",
      form_id: NARACHNIK_FORM,
      form_name: "ПМ · Лийд магнит · AI наръчник · 2026-10-07",
      campaign_id: "120248709769130574",
      campaign_name: "ПМ · Лийд магнит · AI наръчник · 2026-10-07",
      adset_id: "120248709769970574",
      adset_name: "BG · 25–60 · без Advantage+ audience · AI наръчник · 2026-10-07",
      ad_id: "120248709913930574",
      ad_name: "Корица · AI наръчник · 2026-10-07",
      offer: "narachnik",
      magnet: "narachnik",
    });
  });

  it("формата от webhook-а, ако Graph не е върнал form_id; празните стават null", () => {
    const a = leadAttribution({ id: "1", ad_name: " ", campaign_name: "ProMarketing · Безплатен AI одит · 25 €" }, { formId: "4166605913635626" });
    expect(a.form_id).toBe("4166605913635626");
    expect(a.ad_name).toBeNull();
    expect(a.adset_id).toBeNull();
    expect(a.offer).toBe("ai_odit");
    expect(a.magnet).toBeNull();
  });

  it("тялото в картона се чете от човек", () => {
    const body = attributionBody(leadAttribution(narachnikLead, { formName: "ПМ · Лийд магнит · AI наръчник · 2026-10-07" }));
    expect(body).toBe(
      [
        "Поиска: 📘 Наръчник",
        "Реклама: Корица · AI наръчник · 2026-10-07",
        "Ад сет: BG · 25–60 · без Advantage+ audience · AI наръчник · 2026-10-07",
        "Форма: ПМ · Лийд магнит · AI наръчник · 2026-10-07",
      ].join("\n")
    );
    expect(attributionBody(leadAttribution({ id: "1", form_id: "77" }))).toBe("Поиска: 📣 От реклама\nФорма: 77");
  });
});

describe("материалът на лийд магнита", () => {
  it("нов картон — първото писмо на поредицата (общ ключ, за да не тръгне отгоре и демотата)", () => {
    const step = magnetStepFor(NARACHNIK_FORM, true);
    expect(step?.key).toBe(LEAD_SEQUENCE[0].key);
    expect(step?.variant).toBe("narachnik");
  });

  it("стар картон — същото писмо с отделен ключ: поредицата му не се бърка, материалът стига", () => {
    const step = magnetStepFor(NARACHNIK_FORM, false);
    expect(step?.key).toBe("magnit_narachnik");
    expect(step?.variant).toBe("narachnik");
    expect(step?.subject).toBe(magnetStepFor(NARACHNIK_FORM, true)?.subject);
    expect(step?.build("Иван", { contactId: "c1" }).text).toContain("/narachnik?");
  });

  it("форма, която не е магнит — нищо за стария картон", () => {
    expect(magnetStepFor("4166605913635626", false)).toBeNull();
    expect(magnetStepFor(null, false)).toBeNull();
    expect(magnetVariantFor("4166605913635626")).toBeNull();
    expect(magnetVariantFor(NARACHNIK_FORM)).toBe("narachnik");
  });
});
