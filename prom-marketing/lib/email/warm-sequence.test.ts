import { describe, it, expect } from "vitest";
import { nextWarmStep, warmStartAt } from "./warm-sequence";
import {
  ALL_WARM_STEPS,
  CLOSING_KEY,
  WARM_SEQUENCE,
  WARM_TRACKS,
  subjectFor,
  trackFor,
  warmStepsFor,
} from "./warm-steps";
import { firstName, VOICE_URL } from "./sequence-layout";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 3, 6, 0, 0);
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

function contact(over: Partial<Parameters<typeof nextWarmStep>[0]> = {}) {
  return {
    id: "c1",
    full_name: "Иван Петров",
    email: "ivan@example.bg",
    stage: "contacted",
    followup_status: null,
    created_at: ago(40),
    last_heard_from_at: null,
    ...over,
  };
}

function touches(over: Partial<Parameters<typeof nextWarmStep>[1]> = {}) {
  return {
    firstTalk: NOW - 30 * DAY,
    lastTouch: NOW - 30 * DAY,
    lastEmail: null,
    sentKeys: new Set<string>(),
    optedOut: false,
    ...over,
  };
}

const GOVORILI = WARM_TRACKS.govorili;
const PREZ = WARM_TRACKS.prezentacia;
const OFERTA = WARM_TRACKS.oferta;

describe("кой влиза в топлия кръг", () => {
  it(`човек, с когото сме говорили, продължава да получава писма — първо „какво обещах"`, () => {
    const d = nextWarmStep(contact(), touches(), NOW);
    expect(d).toEqual({ step: GOVORILI[0], track: "govorili" });
  });

  it("спечеленият не получава нищо — той има договор, не оферта", () => {
    const d = nextWarmStep(contact({ stage: "won" }), touches(), NOW);
    expect(d).toEqual({ skip: "stage_excluded" });
  });

  it("човек с изпратена оферта ПРОДЪЛЖАВА да получава — това беше целта", () => {
    const d = nextWarmStep(contact({ stage: "offer_sent" }), touches(), NOW);
    expect("step" in d).toBe(true);
  });

  it("уговорената среща също не спира кръга", () => {
    const d = nextWarmStep(contact({ stage: "negotiating" }), touches(), NOW);
    expect("step" in d).toBe(true);
  });

  it("отписалият се спира веднага", () => {
    const d = nextWarmStep(contact(), touches({ optedOut: true }), NOW);
    expect(d).toEqual({ skip: "opted_out" });
  });
});

describe("пътеките — различен човек, различно писмо", () => {
  it("оферта на масата → писмата след оферта, по етап или по статус", () => {
    expect(trackFor({ stage: "offer_sent", followup_status: null }, true)).toBe("oferta");
    expect(trackFor({ stage: "negotiating", followup_status: null }, false)).toBe("oferta");
    expect(trackFor({ stage: "discovery", followup_status: "sent_offer" }, true)).toBe("oferta");
    expect(trackFor({ stage: "contacted", followup_status: "sent_proforma" }, true)).toBe("oferta");
    expect(trackFor({ stage: "contacted", followup_status: "ready_to_close" }, true)).toBe("oferta");
  });

  it("презентация на масата → писмата след презентация", () => {
    expect(trackFor({ stage: "presentation_sent", followup_status: null }, true)).toBe("prezentacia");
    expect(trackFor({ stage: "contacted", followup_status: "sent_presentation" }, false)).toBe("prezentacia");
  });

  it("офертата е с предимство пред презентацията", () => {
    expect(trackFor({ stage: "presentation_sent", followup_status: "sent_offer" }, true)).toBe("oferta");
  });

  it(`„говорили сме" иска истински разговор в картона, не етап`, () => {
    expect(trackFor({ stage: "contacted", followup_status: "needs_call" }, true)).toBe("govorili");
    expect(trackFor({ stage: "contacted", followup_status: "sent_email" }, false)).toBe("obshta");
    expect(trackFor({ stage: "lead", followup_status: null }, false)).toBe("obshta");
  });

  it(`„не сега" не влиза в пътека — само общият кръг, на половин темпо`, () => {
    expect(trackFor({ stage: "lost", followup_status: "sent_offer" }, true)).toBe("obshta");
    expect(trackFor({ stage: "contacted", followup_status: "not_interested" }, true)).toBe("obshta");
  });

  it(`човек с оферта получава „двата въпроса", не поредната находка`, () => {
    const d = nextWarmStep(contact({ stage: "offer_sent" }), touches(), NOW);
    expect(d).toEqual({ step: OFERTA[0], track: "oferta" });
  });

  it(`човек с презентация получава „двете неща, които решават"`, () => {
    const d = nextWarmStep(contact({ stage: "presentation_sent" }), touches(), NOW);
    expect(d).toEqual({ step: PREZ[0], track: "prezentacia" });
  });

  it("оферта по средата на кръга вмъква писмата след оферта, без да повтаря пратеното", () => {
    const sent = new Set([GOVORILI[0].key, WARM_SEQUENCE[0].key, WARM_SEQUENCE[1].key]);
    const d = nextWarmStep(contact({ stage: "offer_sent" }), touches({ sentKeys: sent }), NOW);
    expect(d).toEqual({ step: OFERTA[0], track: "oferta" });
    // После — четвъртото от офертата, и чак тогава кръгът продължава оттам, докъдето беше.
    const sent2 = new Set([...sent, ...OFERTA.map((s) => s.key)]);
    const d2 = nextWarmStep(contact({ stage: "offer_sent" }), touches({ sentKeys: sent2 }), NOW);
    expect(d2).toEqual({ step: WARM_SEQUENCE[2], track: "oferta" });
  });

  it(`човек с оферта не получава „ще ти сглобя демо" — той вече го е видял`, () => {
    const rotationOnly = new Set(OFERTA.map((s) => s.key));
    const c = contact({ stage: "offer_sent" });
    const steps = warmStepsFor("oferta").filter((s) => !rotationOnly.has(s.key));
    const demoIdx = steps.findIndex((s) => s.key === "w6_tvoeto_demo");
    const before = new Set([...rotationOnly, ...steps.slice(0, demoIdx).map((s) => s.key)]);
    const d = nextWarmStep(c, touches({ sentKeys: before }), NOW);
    expect("step" in d && d.step.key).toBe(steps[demoIdx + 1].key);
    // А човек без оферта го получава.
    const c2 = contact({ stage: "contacted" });
    const before2 = new Set([GOVORILI[0].key, ...steps.slice(0, demoIdx).map((s) => s.key)]);
    const d2 = nextWarmStep(c2, touches({ sentKeys: before2 }), NOW);
    expect("step" in d2 && d2.step.key).toBe("w6_tvoeto_demo");
  });

  it("след оферта се пише по-начесто: третия ден, не след седмица", () => {
    const c = contact({ stage: "offer_sent" });
    // Офертата тръгна преди 3 дни като имейл — това е и последното докосване.
    const t = touches({ lastEmail: NOW - 3 * DAY, lastTouch: NOW - 3 * DAY });
    expect(nextWarmStep(c, t, NOW)).toEqual({ step: OFERTA[0], track: "oferta" });
    // А общият кръг за същия човек чака цялата седмица.
    const t2 = touches({ lastEmail: NOW - 3 * DAY, lastTouch: NOW - 3 * DAY, sentKeys: new Set(OFERTA.map((s) => s.key)) });
    expect(nextWarmStep(c, t2, NOW)).toEqual({ skip: "too_soon" });
  });
});

describe("темпо и предпазители", () => {
  it("не пише на човек, с когото сме говорили онзи ден", () => {
    const d = nextWarmStep(contact(), touches({ lastTouch: NOW - 1 * DAY }), NOW);
    expect(d).toEqual({ skip: "just_talked" });
  });

  it("не пише два пъти в една седмица — брои се и ръчният имейл на Ивайло", () => {
    const sent = new Set([GOVORILI[0].key]);
    const d = nextWarmStep(contact(), touches({ lastEmail: NOW - 2 * DAY, lastTouch: NOW - 5 * DAY, sentKeys: sent }), NOW);
    expect(d).toEqual({ skip: "too_soon" });
  });

  it("отбелязаният като незаинтересован също върви на половин темпо", () => {
    const t = touches({ lastEmail: NOW - 9 * DAY, lastTouch: NOW - 9 * DAY });
    expect(nextWarmStep(contact({ followup_status: "not_interested" }), t, NOW)).toEqual({ skip: "too_soon" });
  });

  it("загубеният върви на половин темпо, не спира", () => {
    const t = touches({ lastEmail: NOW - 9 * DAY, lastTouch: NOW - 9 * DAY });
    expect(nextWarmStep(contact({ stage: "lost" }), t, NOW)).toEqual({ skip: "too_soon" });
    const t2 = touches({ lastEmail: NOW - 15 * DAY, lastTouch: NOW - 15 * DAY });
    expect(nextWarmStep(contact({ stage: "lost" }), t2, NOW)).toEqual({ step: WARM_SEQUENCE[0], track: "obshta" });
  });

  it("архивът мълчи — контакт без докосване от два месеца не се буди", () => {
    const c = contact({ created_at: ago(90) });
    const d = nextWarmStep(c, touches({ firstTalk: NOW - 80 * DAY, lastTouch: NOW - 80 * DAY }), NOW);
    expect(d).toEqual({ skip: "too_cold" });
  });

  it("пресен контакт без оферта чака седмица след първия разговор за общия кръг", () => {
    // Пътеката „говорили сме" тръгва веднага (след трите тихи дни); общият кръг — след седмица.
    const c = contact({ created_at: ago(5) });
    const t = touches({ firstTalk: NOW - 4 * DAY, lastTouch: NOW - 4 * DAY, sentKeys: new Set([GOVORILI[0].key]), lastEmail: NOW - 4 * DAY });
    expect(nextWarmStep(c, t, NOW)).toEqual({ skip: "too_soon" });
    const t2 = touches({ firstTalk: NOW - 4 * DAY, lastTouch: NOW - 4 * DAY });
    expect(nextWarmStep(c, t2, NOW)).toEqual({ step: GOVORILI[0], track: "govorili" });
  });

  it("човек без разговор чака седмица след като студената е изтекла", () => {
    const c = contact({ created_at: ago(15) });
    const t = touches({ firstTalk: null, lastTouch: NOW - 5 * DAY, lastEmail: NOW - 5 * DAY });
    // Студената изтече преди 3 дни → общият кръг започва след още 4.
    expect(nextWarmStep(c, t, NOW)).toEqual({ skip: "not_started" });
  });

  it("но стар лийд, който проговори вчера, е закъснял и влиза веднага", () => {
    // Студената поредица му е изтекла преди месец — кръгът вече е започнал,
    // разговорът само сваля тишината. Точно това е „наглото продължаване".
    const c = contact({ created_at: ago(40) });
    const t = touches({ firstTalk: NOW - 4 * DAY, lastTouch: NOW - 4 * DAY });
    expect("step" in nextWarmStep(c, t, NOW)).toBe(true);
  });

  it(`след „трите врати" темпото пада наполовина — идва само новото, по-рядко`, () => {
    const allButNew = new Set([GOVORILI[0].key, ...WARM_SEQUENCE.map((s) => s.key)]);
    // Ново писмо в кръга след затварящото: ключ, който още не е пратен.
    const withClosing = new Set([...allButNew].filter((k) => k !== "w9_dvadeset_videa"));
    const t = touches({ sentKeys: withClosing, lastEmail: NOW - 10 * DAY, lastTouch: NOW - 10 * DAY });
    expect(withClosing.has(CLOSING_KEY)).toBe(true);
    expect(nextWarmStep(contact(), t, NOW)).toEqual({ skip: "too_soon" });
    const t2 = touches({ sentKeys: withClosing, lastEmail: NOW - 15 * DAY, lastTouch: NOW - 15 * DAY });
    expect("step" in nextWarmStep(contact(), t2, NOW)).toBe(true);
  });
});

describe("редът на писмата", () => {
  it("върви по ред, а не по календар — който влиза късно, минава през всичко", () => {
    const t = touches({ sentKeys: new Set([GOVORILI[0].key, WARM_SEQUENCE[0].key, WARM_SEQUENCE[1].key]) });
    const d = nextWarmStep(contact(), t, NOW);
    expect(d).toEqual({ step: WARM_SEQUENCE[2], track: "govorili" });
  });

  it("след последното писмо кръгът мълчи, вместо да повтаря", () => {
    const t = touches({ sentKeys: new Set([GOVORILI[0].key, ...WARM_SEQUENCE.map((s) => s.key)]) });
    expect(nextWarmStep(contact(), t, NOW)).toEqual({ skip: "sequence_done" });
  });

  it("човек без разговор влиза 12 дни след създаването си, когато студената е изтекла", () => {
    const c = contact({ created_at: ago(20), last_heard_from_at: null });
    const start = warmStartAt(c, touches({ firstTalk: null, lastTouch: null }));
    expect(Math.round((NOW - start) / DAY)).toBe(8);
  });

  it("камерите идват рано — четвърто писмо в общия кръг", () => {
    expect(WARM_SEQUENCE[3].key).toBe("w3b_kameri");
    const { html } = WARM_SEQUENCE[3].build("Иван", {});
    expect(html).toContain("/demo/ohrana");
    expect(html).toContain("работно");
  });
});

describe("текстовете", () => {
  it("всяко писмо има уникален ключ — в кръга и по пътеките", () => {
    const keys = ALL_WARM_STEPS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("ключовете не се бъркат със студената поредица", () => {
    expect(ALL_WARM_STEPS.every((s) => /^(w|t_)/.test(s.key))).toBe(true);
  });

  it("първите 14 дни идват по пътеката след оферта, не като вариант на демото", () => {
    const step = OFERTA.find((s) => s.key === "t_oferta_2_parvite_14_dni")!;
    expect(subjectFor(step, { stage: "offer_sent" })).toBe("Какво се случва в първите 14 дни");
    expect(step.build("Иван", { stage: "offer_sent" }).html).toContain("Ден 1–3");
    const demo = WARM_SEQUENCE.find((s) => s.key === "w6_tvoeto_demo")!;
    expect(demo.build("Иван", { stage: "contacted" }).html).not.toContain("Ден 1–3");
    expect(demo.skipFor?.({ stage: "offer_sent" })).toBe(true);
    expect(demo.skipFor?.({ stage: "contacted" })).toBe(false);
  });

  it("никъде не се пита за офертата и не се напомня за мълчанието", () => {
    const forbidden = ["гоня", "извинявам се", "да не Ви губя", "не отговори", "напомням ти", "видя ли офертата", "мълчиш"];
    for (const step of ALL_WARM_STEPS) {
      for (const stage of ["contacted", "offer_sent"]) {
        const { html, text } = step.build("Иван", { stage });
        for (const bad of forbidden) {
          expect(html.toLowerCase(), `${step.key} · ${stage}`).not.toContain(bad.toLowerCase());
          expect(text.toLowerCase(), `${step.key} · ${stage}`).not.toContain(bad.toLowerCase());
        }
      }
    }
  });

  it("всяко писмо води и към гласовия агент — той записва среща без Ивайло", () => {
    for (const step of ALL_WARM_STEPS) {
      const { html, text } = step.build("Иван", { contactId: "c1" });
      expect(html, step.key).toContain(VOICE_URL);
      expect(text, step.key).toContain(VOICE_URL);
    }
  });

  it("всяко писмо носи линка за отписване, когато е подаден", () => {
    for (const step of ALL_WARM_STEPS) {
      const { html, text } = step.build("Иван", { contactId: "c1", unsubscribeUrl: "https://x.bg/stop" });
      expect(html, step.key).toContain("https://x.bg/stop");
      expect(text, step.key).toContain("https://x.bg/stop");
    }
  });

  it("името се вмъква само когато е истинско име", () => {
    expect(firstName("Иван Петров")).toBe("Иван");
    expect(firstName("+359888")).toBe(null);
    expect(firstName(null)).toBe(null);
    const { html } = WARM_SEQUENCE[0].build(null);
    expect(html).toContain("Здравей,");
  });

  it("HTML и текстовата версия водят към едно и също място", () => {
    for (const step of ALL_WARM_STEPS) {
      const { html, text } = step.build("Иван", { stage: "contacted", contactId: "abcd-1" });
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
