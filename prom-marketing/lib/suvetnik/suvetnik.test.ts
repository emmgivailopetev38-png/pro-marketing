import { describe, expect, it } from "vitest";
import { etapOt, prevenciiOt, razcheti, tonInfo } from "./razbor";
import { tarsi } from "./tarsene";
import { hintSchema, razgovorTekst, sglobiZayavka } from "./zayavka";
import { VAZRAZHENIYA, vazrazhenieOt } from "./biblioteka";
import { METOD } from "./metod";
import { eEho } from "@/components/admin/suvetnik/zvuk";
import type { HintZaiavka } from "./types";

describe("разчитане на подсказката", () => {
  it("взима всички редове и недовършения последен", () => {
    const p = razcheti("КАЖИ: Какво имаш предвид, когато казваш „скъпо“?\nТОН: 😌 СПОКОЕН-УВЕРЕН · бавно, без извинение\nТЕХНИКА: ВЪЗРАЖЕНИЕ · изясняване\nЕТАП: ЗАТВАРЯНЕ\nВЪЗРАЖЕНИЕ: скъпо · неясно\nПРЕВЕНЦИЯ: —\nСЛЕДВАЩО: Ако сложим парите настр");
    expect(p.kazhi).toBe("Какво имаш предвид, когато казваш „скъпо“?");
    expect(p.tehnika).toBe("ВЪЗРАЖЕНИЕ · изясняване");
    expect(p.sledvashto).toBe("Ако сложим парите настр");
    expect(tonInfo(p.ton)).toMatchObject({ id: "СПОКОЕН-УВЕРЕН", emoji: "😌", dostavka: "бавно, без извинение" });
    expect(etapOt(p.etap)).toBe("ZATVARYANE");
    expect(prevenciiOt(p.prevencia)).toEqual([]);
  });

  it("продължава многоредов КАЖИ и търпи markdown", () => {
    const p = razcheti("**КАЖИ:** Нека да обобщя,\nза да съм сигурен.\n**ТОН:** 🧭 ВОДЕЩ");
    expect(p.kazhi).toBe("Нека да обобщя, за да съм сигурен.");
    expect(tonInfo(p.ton).id).toBe("ВОДЕЩ");
  });

  it("грешка от сървъра не се лепи към КАЖИ", () => {
    const p = razcheti("КАЖИ: Какво те спря досега?\nГРЕШКА: Gemini: лимитът е стигнат");
    expect(p.kazhi).toBe("Какво те спря досега?");
    expect(p.greshka).toContain("лимитът");
  });

  it("разпознава превенциите по думи", () => {
    expect(prevenciiOt("кой решава + готовност да инвестира")).toEqual(expect.arrayContaining(["reshavasht", "byudzhet"]));
    expect(prevenciiOt("лош опит с агенция")).toEqual(["doverie"]);
  });
});

describe("библиотеката", () => {
  it("разпознава възраженията по думите на клиента", () => {
    expect(vazrazhenieOt("Добре, ще си помисля и ще ти пиша")?.id).toBe("pomislya");
    expect(vazrazhenieOt("Трябва да го обсъдя с жена ми")?.id).toBe("partnyor");
    expect(vazrazhenieOt("Сигурно е скъпо")?.id).toBe("pari");
  });

  it("всяка верига има ходове с валиден тон и уникален id", () => {
    expect(new Set(VAZRAZHENIYA.map((v) => v.id)).size).toBe(VAZRAZHENIYA.length);
    for (const v of VAZRAZHENIYA) {
      expect(v.hodove.length).toBeGreaterThanOrEqual(1);
      for (const h of v.hodove) expect(tonInfo(h.ton).id).not.toBeNull();
    }
  });

  it("методът носи формата, тоновете и Изречението", () => {
    expect(METOD).toContain("КАЖИ:");
    expect(METOD).toContain("🤫 МЪЛЧИ");
    expect(METOD).toContain("Реалната инвестиция е");
    expect(METOD.length).toBeLessThan(120_000);
  });
});

describe("търсенето на дословни реплики", () => {
  it("за „нямам време“ връща реплика от веригата за времето", () => {
    const r = tarsi("Нямам време, зает съм постоянно", 6);
    expect(r.length).toBeGreaterThan(0);
    expect(r.some((x) => /време/i.test(x.tekst) || /време/i.test(x.zaglavie))).toBe(true);
  });
});

describe("съобщението към модела", () => {
  const z: HintZaiavka = {
    rejim: "online",
    brif: { klient: "Пешо", biznes: "климатици" },
    sastoyanie: { etap: "BOLKA", bolki: ["изпуска половината запитвания"], prevencia: { reshavasht: true }, vazrazheniya: [], poslednoKazano: [] },
    replikI: [
      { id: "1", s: "I", t: "От колко време се случва?", at: 60_000 },
      { id: "2", s: "K", t: "От година и половина, нямам време да отговарям.", at: 70_000 },
    ],
    povod: "klient",
  };

  it("съдържа бриф, превенция и разговора", () => {
    const t = sglobiZayavka(z);
    expect(t).toContain("Клиент: Пешо");
    expect(t).toContain("Кой решава ✓");
    expect(t).toContain("Готовност да инвестира ✗");
    expect(t).toContain("К: От година и половина");
    expect(t).toContain("[цената]");
  });

  it("дълга подсказка не чупи заявката — реже се", () => {
    const r = hintSchema.safeParse({ ...z, sastoyanie: { ...z.sastoyanie, poslednoKazano: ["а".repeat(1000)], bolki: Array.from({ length: 30 }, (_, i) => `болка ${i}`) } });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sastoyanie.poslednoKazano[0].length).toBe(400);
      expect(r.data.sastoyanie.bolki.length).toBe(20);
    }
  });

  it("реже стария разговор отпред", () => {
    const mnogo = Array.from({ length: 300 }, (_, i) => ({ id: String(i), s: "K" as const, t: `реплика номер ${i} `.repeat(5), at: i * 1000 }));
    const t = razgovorTekst(mnogo, 2000);
    expect(t.length).toBeLessThan(2600);
    expect(t).toContain("по-стари реплики");
    expect(t).toContain("реплика номер 299");
  });
});

describe("ехото от тонколоните", () => {
  it("хваща повторение, пропуска огледален въпрос", () => {
    const klient = ["Аз съм постоянно по обекти и не мога да вдигна телефона"];
    expect(eEho("постоянно по обекти и не мога да вдигна телефона", klient)).toBe(true);
    expect(eEho("Не можеш да вдигнеш телефона — какво става тогава?", klient)).toBe(false);
  });
});
