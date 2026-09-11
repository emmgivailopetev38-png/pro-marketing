import { describe, it, expect } from "vitest";
import { warmMessage, formalVerb, type MessageCtx } from "./warm-message";
import type { WarmthBand } from "./warmth";

const LINK = "https://promarketing.pw/z/a1b2c3d4e5";

function ctx(over: Partial<MessageCtx> = {}): MessageCtx {
  return {
    full_name: "Иван Петров",
    company: "Петров ЕООД",
    band: "cold",
    top_reason: null,
    link: LINK,
    ...over,
  };
}

const BANDS: WarmthBand[] = ["hot", "warm", "cold", "untouched"];

describe("warmMessage · тонът", () => {
  it("нито един вариант не се самопринизява", () => {
    // Правилата на Ивайло: нищо, което ни прави натрапници.
    const forbidden = [
      "гоня",
      "преследвам",
      "досаждам",
      "натискам",
      "извинявам се",
      "да не Ви губя времето",
      "да не ти губя времето",
      "надявам се да не преча",
      "безпокоя",
      "няколко пъти",
    ];
    for (const band of BANDS) {
      for (const formal of [false, true]) {
        const msg = warmMessage(ctx({ band, formal, top_reason: "отвори офертата" }));
        for (const bad of forbidden) {
          expect(msg.toLowerCase()).not.toContain(bad.toLowerCase());
        }
      }
    }
  });

  it("всеки вариант води към линка и завършва с него", () => {
    for (const band of BANDS) {
      const msg = warmMessage(ctx({ band }));
      expect(msg).toContain(LINK);
      expect(msg.trim().endsWith(LINK)).toBe(true);
    }
  });

  it("всеки вариант се подписва с името на Ивайло", () => {
    for (const band of BANDS) {
      expect(warmMessage(ctx({ band }))).toContain("Ивайло от ProMarketing");
    }
  });

  it("остава кратко за месинджър — три абзаца", () => {
    for (const band of BANDS) {
      const msg = warmMessage(ctx({ band, top_reason: "отвори офертата" }));
      expect(msg.split("\n\n")).toHaveLength(3);
      expect(msg.length).toBeLessThan(400);
    }
  });
});

describe("warmMessage · обръщението", () => {
  it("ползва първото име", () => {
    expect(warmMessage(ctx())).toContain("Здравей, Иван");
  });

  it("на Вие сменя и поздрава, и глаголите", () => {
    const msg = warmMessage(ctx({ band: "warm", top_reason: "отвори офертата", formal: true }));
    expect(msg).toContain("Здравейте, Иван");
    expect(msg).toContain("сте отворили офертата");
    expect(msg).not.toContain("избери си");
  });

  it("без име минава през фирмата", () => {
    expect(warmMessage(ctx({ full_name: null }))).toContain("Здравей от Петров ЕООД");
  });

  it("без име и без фирма пак е поздрав, не празно", () => {
    // Запетаята принадлежи на името — без него редът е „Здравей — Ивайло…".
    const msg = warmMessage(ctx({ full_name: null, company: null }));
    expect(msg.split("\n")[0]).toBe("Здравей — Ивайло от ProMarketing.");
  });
});

describe("warmMessage · поводът по лента", () => {
  it("топлият получава референция към своето действие", () => {
    const msg = warmMessage(ctx({ band: "hot", top_reason: "отвори офертата" }));
    expect(msg).toContain("отвори офертата");
    expect(msg).toContain("лош момент");
  });

  it("топлият без известна причина не измисля такава", () => {
    const msg = warmMessage(ctx({ band: "hot", top_reason: null }));
    expect(msg).not.toContain("Видях, че .");
    expect(msg).toContain("лош момент");
  });

  it("студеният получава ползата за своя бранш", () => {
    const msg = warmMessage(ctx({ band: "cold", vertical: "transport" }));
    expect(msg).toContain("курсове, шофьори и документи");
  });

  it("непознат бранш пада към обща полза, не към празно", () => {
    const msg = warmMessage(ctx({ band: "cold", vertical: "няма такъв" }));
    expect(msg).toContain("рекламите, запитванията и офертите");
  });

  it("недокоснатият получава НОВ повод, не спомен за старо запитване", () => {
    // 126-те от май–юни: „оставихте запитване" отпреди четири месеца не се връзва.
    const msg = warmMessage(ctx({ band: "untouched" }));
    expect(msg).toContain("гласов AI агент");
    expect(msg).not.toContain("запитване");
    expect(msg).not.toContain("оставихте");
  });
});

describe("formalVerb", () => {
  it("превръща третото лице във второ множествено", () => {
    expect(formalVerb("отвори офертата")).toBe("сте отворили офертата");
    expect(formalVerb("говори с гласовия агент")).toBe("сте говорили с гласовия агент");
  });

  it("непознатото се връща както е, вместо да се гадае", () => {
    expect(formalVerb("направи нещо ново")).toBe("направи нещо ново");
  });
});

describe("warmMessage · пунктуация", () => {
  it("поздравът няма двойна запетая пред подписа", () => {
    // „Здравей, Иван, — Ивайло" — запетаята от името се удвояваше с тази пред
    // подписа. Личи чак на екрана, затова стои като тест.
    for (const band of BANDS) {
      for (const formal of [false, true]) {
        for (const full_name of ["Иван Петров", null]) {
          const msg = warmMessage(ctx({ band, formal, full_name }));
          expect(msg).not.toContain(", —");
          expect(msg).not.toMatch(/,\s*,/);
        }
      }
    }
  });

  it("първият ред е поздрав, име и подпис в едно изречение", () => {
    expect(warmMessage(ctx()).split("\n")[0]).toBe("Здравей, Иван — Ивайло от ProMarketing.");
  });
});
