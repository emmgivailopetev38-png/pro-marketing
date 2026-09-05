import { describe, it, expect } from "vitest";
import { LEAD_SEQUENCE, LEAD_SOURCES, VOICE_LEAD_SEQUENCE, leadSequenceFor } from "./lead-steps";
import { ALL_WARM_STEPS } from "./warm-steps";
import { VOICE_URL } from "./sequence-layout";

describe("студената поредица — кой какво получава", () => {
  it("лийдът от гласовата реклама влиза в поредицата — дотогава не получаваше нищо", () => {
    expect(LEAD_SOURCES).toContain("voice_web");
    expect(LEAD_SOURCES).toContain("meta_lead");
    expect(LEAD_SOURCES).toContain("website_form");
  });

  it("човекът, който е чул агента, получава първо писмо, което тръгва от разговора", () => {
    const voice = leadSequenceFor("voice_web");
    expect(voice[0].key).toBe("s1_glas_lichno");
    const { html, text } = voice[0].build("Иван", { contactId: "c1" });
    expect(html).toContain(VOICE_URL);
    expect(text).toContain(VOICE_URL);
    expect(html).toContain("наложен платеж");
  });

  it("лийдът от Meta получава демотата", () => {
    expect(leadSequenceFor("meta_lead")[0].key).toBe("s1_lichno");
    expect(leadSequenceFor("website_form")[0].key).toBe("s1_lichno");
    expect(leadSequenceFor(null)[0].key).toBe("s1_lichno");
  });

  it("след първото писмо двете поредици са едни и същи — само входът е различен", () => {
    expect(VOICE_LEAD_SEQUENCE.slice(1).map((s) => s.key)).toEqual(LEAD_SEQUENCE.slice(1).map((s) => s.key));
  });

  it("сроковете растат — всяко следващо писмо е по-късно от предното", () => {
    for (const seq of [LEAD_SEQUENCE, VOICE_LEAD_SEQUENCE]) {
      for (let i = 1; i < seq.length; i++) expect(seq[i].afterDays).toBeGreaterThan(seq[i - 1].afterDays);
    }
  });
});

describe("текстовете на студената поредица", () => {
  const ALL_COLD = [...new Map([...LEAD_SEQUENCE, ...VOICE_LEAD_SEQUENCE].map((s) => [s.key, s])).values()];

  it("ключовете са уникални и не се бъркат с топлия кръг", () => {
    const cold = ALL_COLD.map((s) => s.key);
    expect(new Set(cold).size).toBe(cold.length);
    expect(cold.every((k) => k.startsWith("s"))).toBe(true);
    const warm = new Set(ALL_WARM_STEPS.map((s) => s.key));
    expect(cold.some((k) => warm.has(k))).toBe(false);
  });

  it("никъде няма гонене, извинения и самопринизяване", () => {
    const forbidden = ["гоня", "извинявам се", "да не Ви губя", "не отговори", "напомням ти", "да не преча", "пощенска кутия"];
    for (const step of ALL_COLD) {
      const { html, text } = step.build("Иван", { contactId: "c1", source: "voice_web" });
      for (const bad of forbidden) {
        expect(html.toLowerCase(), step.key).not.toContain(bad.toLowerCase());
        expect(text.toLowerCase(), step.key).not.toContain(bad.toLowerCase());
      }
    }
  });

  it("всяко писмо носи гласовия агент и линка за отписване", () => {
    for (const step of ALL_COLD) {
      const { html, text } = step.build("Иван", { contactId: "c1", unsubscribeUrl: "https://x.bg/stop" });
      expect(html, step.key).toContain(VOICE_URL);
      expect(text, step.key).toContain(VOICE_URL);
      expect(html, step.key).toContain("https://x.bg/stop");
      expect(text, step.key).toContain("https://x.bg/stop");
    }
  });

  it("HTML и текстовата версия водят към едно и също място", () => {
    for (const step of ALL_COLD) {
      const { html, text } = step.build("Иван", { contactId: "abcd-1" });
      const links = [...html.matchAll(/href="(https:\/\/www\.promarketing\.pw[^"]*)"/g)]
        .map((m) => m[1])
        .filter((u) => u !== "https://www.promarketing.pw");
      const inText = new Set([...text.matchAll(/https:\/\/www\.promarketing\.pw\S*/g)].map((m) => m[0]));
      for (const l of links) {
        expect([...inText].some((t) => t.startsWith(l)), `${step.key} · ${l}`).toBe(true);
      }
    }
  });
});
