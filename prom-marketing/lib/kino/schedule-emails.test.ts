import { describe, it, expect } from "vitest";
import { kinoTimeline, sofiaParts, sofiaTimeLabel, sofiaDayLabel, premiereLabels } from "./time";
import { buildFlowStages, activeStages, inAudience, smsText } from "./schedule";
import { smsSegments } from "./sms";
import { ticketEmail, flowEmail, welcomeEmail, depositEmail, type KinoEmailCtx } from "./emails";

const tl = kinoTimeline();
const p = sofiaParts(tl.premiereMs);
const stages = buildFlowStages(tl, { hour: p.hour, minute: p.minute });
const byId = (id: string) => stages.find((s) => s.id === id)!;

describe("загряването — кога тръгва всяка стъпка (по софийско време)", () => {
  it("трейлърите са в 11:00 на ден −5 и −3, „утре“ — в 11:00 на ден −1", () => {
    expect(sofiaDayLabel(byId("trailer1").opensMs)).toBe("неделя, 11 октомври");
    expect(sofiaTimeLabel(byId("trailer1").opensMs)).toBe("11:00");
    expect(sofiaDayLabel(byId("trailer2").opensMs)).toBe("вторник, 13 октомври");
    expect(sofiaDayLabel(byId("tomorrow").opensMs)).toBe("четвъртък, 15 октомври");
  });

  it("в деня: SMS в 12:00 и линкът към залата в 19:15", () => {
    expect(sofiaTimeLabel(byId("today").opensMs)).toBe("12:00");
    expect(byId("today").channels).toEqual(["sms"]);
    expect(sofiaTimeLabel(byId("doors").opensMs)).toBe("19:15");
    expect(byId("doors").channels).toEqual(["email", "sms"]);
  });

  it("„пропускаш“ е 30 мин след началото и само за невлезлите", () => {
    expect(sofiaTimeLabel(byId("missing").opensMs)).toBe("20:00");
    expect(byId("missing").audience).toBe("notEntered");
  });

  it("последните 3 часа — в 20:59 в неделя, без купилите", () => {
    expect(sofiaDayLabel(byId("last3h").opensMs)).toBe("неделя, 18 октомври");
    expect(sofiaTimeLabel(byId("last3h").opensMs)).toBe("20:59");
    expect(byId("last3h").audience).toBe("notBought");
  });

  it("всеки прозорец е поне 20 минути — кронът е на 15", () => {
    for (const s of stages) expect(s.closesMs - s.opensMs, s.id).toBeGreaterThanOrEqual(20 * 60_000);
  });

  it("в 19:20 в деня на премиерата е активна само стъпката с линка", () => {
    expect(activeStages(stages, tl.premiereMs - 10 * 60_000).map((s) => s.id)).toEqual(["doors"]);
  });

  it("късно записалият се не получава стари напомняния", () => {
    // ден −2 следобед: трейлър 1 и 2 вече са затворени/неотворени, нищо не тръгва
    expect(activeStages(stages, tl.premiereMs - 2 * 24 * 3600_000 + 4 * 3600_000).map((s) => s.id)).toEqual([]);
  });

  it("аудиториите", () => {
    expect(inAudience("all", { entered: true, bought: true })).toBe(true);
    expect(inAudience("notEntered", { entered: false, bought: false })).toBe(true);
    expect(inAudience("notEntered", { entered: true, bought: false })).toBe(false);
    expect(inAudience("notEntered", { entered: false, bought: true })).toBe(false);
    expect(inAudience("notBought", { entered: true, bought: true })).toBe(false);
  });
});

describe("SMS текстовете са кратки", () => {
  const short = "promarketing.pw/k/AAAAAAAAAAAAAAAAAAAAAA.BBBBBBBB";
  const when = { day: "вт 10.11", time: "19:30" };
  it("всяко влиза в най-много 2 части (кирилица = 67 знака на част)", () => {
    for (const id of ["ticket", "today", "doors", "last3h"]) {
      const t = smsText(id, short, when);
      expect(t, id).toBeTruthy();
      expect(smsSegments(t!), id).toBeLessThanOrEqual(2);
      expect(t).toContain(short);
    }
  });
  it("непозната стъпка — без SMS", () => {
    expect(smsText("trailer1", short, when)).toBeNull();
  });
});

describe("писмата — тонът от CLAUDE.md", () => {
  const ctx: KinoEmailCtx = {
    name: "Мария",
    links: {
      ticket: "https://promarketing.pw/kino/bilet?t=x",
      short: "https://promarketing.pw/k/x",
      hall: "https://promarketing.pw/kino/zala?t=x",
      ics: "https://promarketing.pw/api/kino/ics?t=x",
    },
    labels: premiereLabels(),
    seat: { hall: 1, row: 7, seat: 12 },
    viberUrl: null,
    unsubscribeUrl: "https://promarketing.pw/api/email/unsubscribe?c=1&t=2",
  };
  const all = [
    ticketEmail(ctx),
    ...["trailer1", "trailer2", "tomorrow", "doors", "missing", "replay", "last3h"].map((id) => flowEmail(id, ctx)!),
    welcomeEmail({ name: "Мария", planLine: "1 490 € · пълно плащане", calUrl: "https://cal.com/x" }),
    depositEmail({ name: "Мария", amountLine: "100 €", calUrl: "https://cal.com/x", payUrl: null }),
  ];
  const FORBIDDEN = [/гоня/i, /преследва/i, /досажда/i, /натиска/i, /извинявам/i, /безпокоя/i, /губя времето/i, /да не преча/i, /гарантира(м|н) доход/i];

  it("никакви извинения, преследване и обещания за доходи", () => {
    for (const m of all) for (const re of FORBIDDEN) expect(`${m.subject} ${m.html} ${m.text}`, `${m.subject} ~ ${re}`).not.toMatch(re);
  });

  it("всяко писмо има тема, HTML и текст, и води към следваща стъпка (линк)", () => {
    for (const m of all) {
      expect(m.subject.length).toBeGreaterThan(5);
      expect(m.html).toMatch(/href="https:\/\//);
      expect(m.text).toMatch(/https:\/\//);
    }
  });

  it("името се ескейпва в HTML", () => {
    const evil = ticketEmail({ ...ctx, name: "<script>x</script>" });
    expect(evil.html).not.toContain("<script>x</script>");
    expect(evil.html).toContain("&lt;script&gt;");
  });

  it("билетът казва мястото и часа", () => {
    const m = ticketEmail(ctx);
    expect(m.html).toContain("РЕД 7");
    expect(m.html).toContain("МЯСТО 12");
    expect(m.subject).toContain("19:30");
  });
});
