import { describe, expect, it } from "vitest";
import { dueSequenceStep, optedOutIds } from "./lead-sequence-rules";
import { LEAD_SEQUENCE, NARACHNIK_FORM_IDS, VOICE_LEAD_SEQUENCE } from "./lead-steps";

const NARACHNIK_FORM = [...NARACHNIK_FORM_IDS][0];

describe("кое писмо е дължимо в крона", () => {
  it("първото писмо на лийд от формата на наръчника е наръчникът, не демотата", () => {
    const step = dueSequenceStep({ source: "meta_lead", ageDays: 0.4, formId: NARACHNIK_FORM });
    expect(step?.variant).toBe("narachnik");
    expect(step?.key).toBe("s1_lichno");
    expect(step?.subject).toContain("наръчника");
  });

  it("друга форма или без форма — демотата, както досега", () => {
    expect(dueSequenceStep({ source: "meta_lead", ageDays: 0.4, formId: "4166605913635626" })).toBe(LEAD_SEQUENCE[0]);
    expect(dueSequenceStep({ source: "meta_lead", ageDays: 0.4 })).toBe(LEAD_SEQUENCE[0]);
    expect(dueSequenceStep({ source: "website_form", ageDays: 0.4, formId: NARACHNIK_FORM })).toBe(LEAD_SEQUENCE[0]);
    expect(dueSequenceStep({ source: "voice_web", ageDays: 0.4 })).toBe(VOICE_LEAD_SEQUENCE[0]);
  });

  it("от ден 2 нататък стъпките са общите — и за наръчника", () => {
    expect(dueSequenceStep({ source: "meta_lead", ageDays: 2.1, formId: NARACHNIK_FORM })?.key).toBe("s2_smetkata");
    expect(dueSequenceStep({ source: "meta_lead", ageDays: 5.5, formId: NARACHNIK_FORM })?.key).toBe("s3_demota");
    expect(dueSequenceStep({ source: "meta_lead", ageDays: 12, formId: NARACHNIK_FORM })?.key).toBe("s4_posledno");
  });

  it("третото писмо не твърди, че сме му пратили демота — лийдът на наръчника не е получавал", () => {
    const s3 = dueSequenceStep({ source: "meta_lead", ageDays: 5.5, formId: NARACHNIK_FORM });
    const { html, text } = s3!.build("Иван", { contactId: "c1" });
    expect(html).not.toContain("които ти пратих");
    expect(text).not.toContain("които ти пратих");
  });
});

describe("„Спри писмата“", () => {
  it("бележката от страницата за отписване спира поредицата", () => {
    const ids = optedOutIds([
      { contact_id: "a", metadata: { email_opt_out: true } },
      { contact_id: "b", metadata: { email_opt_out: false } },
      { contact_id: "c", metadata: null },
    ]);
    expect([...ids]).toEqual(["a"]);
  });
});
