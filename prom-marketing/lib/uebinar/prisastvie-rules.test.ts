import { describe, expect, it } from "vitest";
import {
  CELI,
  RED_NA_ZVANENE,
  denNaUebinara,
  izchisliRedove,
  krivaPoStapki,
  ocenka,
  ofertaOtStatistika,
  ofertaPriblizitelno,
  oshteNeobadeni,
  openerZaSegment,
  podrediZaZvanene,
  priklyuchil,
  progresNaGrupa,
  redNaKartata,
  segmentZa,
  triabvaPriblizitelnaOferta,
  tyasnoMyasto,
  uebinarKluch,
  type NotifierLead,
} from "./prisastvie-rules";

const START = "2026-11-29T19:00:00+02:00";

const lead = (p: Partial<NotifierLead>): NotifierLead => ({
  webinarRegistrantId: p.webinarRegistrantId ?? "r1",
  name: p.name ?? "Иван",
  phone: p.phone ?? "+359888000001",
  email: p.email ?? "ivan@example.com",
  clickedAt: p.clickedAt ?? null,
  joinedAt: p.joinedAt ?? null,
  watchSeconds: p.watchSeconds ?? 0,
  heardOffer: p.heardOffer ?? false,
  segment: p.segment ?? "noShow",
  warmth: p.warmth ?? null,
});

describe("редът на звънене (Йончев)", () => {
  it("първо до офертата, после излезлите рано, накрая неявилите се", () => {
    expect(RED_NA_ZVANENE).toEqual(["oferta", "rano", "ne_doshal"]);
  });

  it("групата на човека", () => {
    expect(segmentZa({ doshal: true, chulOfertata: true, zapisalChas: false })).toBe("oferta");
    expect(segmentZa({ doshal: true, chulOfertata: false, zapisalChas: false })).toBe("rano");
    expect(segmentZa({ doshal: false, chulOfertata: false, zapisalChas: false })).toBe("ne_doshal");
    // записал час — винаги „zapisal“, дори да не е дошъл
    expect(segmentZa({ doshal: false, chulOfertata: false, zapisalChas: true })).toBe("zapisal");
  });

  it("първото изречение е с името на звънящия и деня", () => {
    const den = denNaUebinara(START);
    expect(den).toBe("в неделя");
    expect(openerZaSegment("oferta", "Сезер", den)).toBe(
      "Здравейте, Сезер съм от екипа на Ивайло Петев. Видях, че в неделя бяхте на обучението до края, благодаря Ви! Какво Ви хареса най-много?"
    );
    expect(openerZaSegment("ne_doshal", "", den)).toMatch(/^Здравейте, обаждам се от екипа на Ивайло Петев\./);
    expect(denNaUebinara("2026-12-01T19:00:00+02:00")).toBe("във вторник");
  });

  it("изданието е датата по софийско време", () => {
    expect(uebinarKluch(START)).toBe("2026-11-29");
    expect(uebinarKluch("2026-11-29T23:30:00Z")).toBe("2026-11-30");
  });
});

describe("кога е свършил и часът на офертата", () => {
  it("свършил: по Notifier, иначе 4 часа след началото", () => {
    expect(priklyuchil({ krajAt: "2026-11-29T19:40:00Z", nachaloISO: START }, new Date("2026-11-29T19:41:00Z"))).toBe(true);
    expect(priklyuchil({ krajAt: null, nachaloISO: START }, new Date("2026-11-29T20:00:00Z"))).toBe(false);
    expect(priklyuchil({ krajAt: null, nachaloISO: START }, new Date("2026-11-29T21:00:00Z"))).toBe(true);
  });

  it("приблизителната оферта — 90 мин след началото, но 15 мин преди края", () => {
    expect(ofertaPriblizitelno(START, null)).toBe("2026-11-29T18:30:00.000Z");
    expect(ofertaPriblizitelno(START, "2026-11-29T18:00:00Z")).toBe("2026-11-29T17:45:00.000Z");
  });

  it("слага се само ако никой не е задал час и са минали 20 мин от края", () => {
    const kraj = "2026-11-29T20:00:00Z";
    expect(triabvaPriblizitelnaOferta({ ofertaAt: null, krajAt: kraj }, new Date("2026-11-29T20:10:00Z"))).toBe(false);
    expect(triabvaPriblizitelnaOferta({ ofertaAt: null, krajAt: kraj }, new Date("2026-11-29T20:21:00Z"))).toBe(true);
    expect(triabvaPriblizitelnaOferta({ ofertaAt: "2026-11-29T18:40:00Z", krajAt: kraj }, new Date("2026-11-29T21:00:00Z"))).toBe(false);
    expect(triabvaPriblizitelnaOferta({ ofertaAt: null, krajAt: null }, new Date("2026-11-29T23:00:00Z"))).toBe(false);
  });

  it("часът на офертата от статистиката", () => {
    const s = { startedAt: "2026-11-29T17:00:00Z", offerMinute: 95 } as Parameters<typeof ofertaOtStatistika>[0];
    expect(ofertaOtStatistika(s)).toBe("2026-11-29T18:35:00.000Z");
    expect(ofertaOtStatistika({ ...s, offerMinute: null })).toBeNull();
  });
});

describe("редовете от Notifier", () => {
  const zapisani = [
    { id: "c1", full_name: "Иван", email: "IVAN@example.com", phone: "0888 000 001" },
    { id: "c2", full_name: "Мария", email: "maria@example.com", phone: "+359888000002" },
    { id: "c3", full_name: "Петър", email: "petar@example.com", phone: "0888000003" },
    { id: "c4", full_name: "Гергана", email: "gergana@example.com", phone: "0888000004" },
    { id: "c5", full_name: "Гост", email: "gost@example.com", phone: "0888000005" },
  ];
  const leads = [
    lead({ webinarRegistrantId: "r1", email: "ivan@example.com", joinedAt: "2026-11-29T17:02:00Z", watchSeconds: 6600, heardOffer: true, segment: "completed", warmth: { score: 90, tier: "hot" } }),
    // свързва се по телефона, имейлът е различен
    lead({ webinarRegistrantId: "r2", email: "m@other.bg", phone: "0888000002", joinedAt: "2026-11-29T17:10:00Z", watchSeconds: 1800, segment: "partial" }),
    lead({ webinarRegistrantId: "r3", email: "petar@example.com", phone: "0888000003" }),
    lead({ webinarRegistrantId: "r4", email: "gergana@example.com", phone: "0888000004", joinedAt: "2026-11-29T17:01:00Z", watchSeconds: 7000, heardOffer: true }),
  ];
  const guests = [{ id: "g1", name: "Гост", email: "gost@example.com", joinedAt: "2026-11-29T17:20:00Z", watchSeconds: 1200, segment: "partial" as const }];
  // Гергана си записа час на уебинара; часът на Петър е отпреди — не се брои
  const chasove = [
    { email: "gergana@example.com", phone: null, created_at: "2026-11-29T18:50:00Z" },
    { email: "petar@example.com", phone: null, created_at: "2026-11-20T10:00:00Z" },
  ];
  const redove = izchisliRedove({ uebinar: "2026-11-29", zapisani, leads, guests, chasove, chasoveOt: "2026-11-29T16:00:00Z" });
  const po = (id: string) => redove.find((r) => r.contact_id === id)!;

  it("всеки записан е ред, в правилната група", () => {
    expect(redove).toHaveLength(5);
    expect(po("c1").segment).toBe("oferta");
    expect(po("c1").minuti).toBe(110);
    expect(po("c1").toplina_nivo).toBe("hot");
    expect(po("c2").segment).toBe("rano");
    expect(po("c2").notifier_id).toBe("r2");
    expect(po("c3").segment).toBe("ne_doshal");
    expect(po("c4").segment).toBe("zapisal");
    expect(po("c4").zapisal_chas_at).toBe("2026-11-29T18:50:00Z");
    // гост от страницата за влизане със същия имейл — дошъл
    expect(po("c5").segment).toBe("rano");
    expect(po("c5").minuti).toBe(20);
  });

  it("опашката: най-топлите и най-дълго стоялите първи", () => {
    const red = podrediZaZvanene([
      { ime: "Б", toplina: null, minuti: 30 },
      { ime: "А", toplina: 80, minuti: 10 },
      { ime: "В", toplina: null, minuti: 50 },
    ]);
    expect(red.map((r) => r.ime)).toEqual(["А", "В", "Б"]);
  });

  it("редът на картата", () => {
    expect(redNaKartata(po("c1"))).toBe("🔥 Стояха до офертата, без час · 110 мин на обучението · горещ");
    expect(redNaKartata(po("c3"))).toBe("📵 Записаха се, но не дойдоха");
  });
});

describe("звъненето след уебинара", () => {
  const sled = "2026-11-29T20:30:00Z";
  const opiti = [
    { contact_id: "a", activity_type: "call", occurred_at: "2026-11-30T08:00:00Z", outcome: "no_answer" },
    { contact_id: "b", activity_type: "call", occurred_at: "2026-11-30T08:05:00Z", outcome: "callback" },
    { contact_id: "c", activity_type: "meeting", occurred_at: "2026-11-30T08:10:00Z", outcome: "meeting" },
    // преди уебинара — не се брои
    { contact_id: "d", activity_type: "call", occurred_at: "2026-11-28T08:00:00Z", outcome: "talked" },
    { contact_id: "e", activity_type: "viber_sent", occurred_at: "2026-11-30T09:00:00Z", outcome: null },
  ];

  it("набрани, вдигнали, записали", () => {
    expect(progresNaGrupa(["a", "b", "c", "d"], opiti, sled)).toEqual({ obshto: 4, obadeni: 3, vdignali: 2, zapisali: 1 });
    expect(progresNaGrupa(["d"], opiti, sled, new Set(["d"]))).toEqual({ obshto: 1, obadeni: 0, vdignali: 0, zapisali: 1 });
  });

  it("в опашката остават само недокоснатите след края", () => {
    expect(oshteNeobadeni(["a", "b", "d", "e", "f"], opiti, sled)).toEqual(["d", "f"]);
  });
});

describe("целите", () => {
  it("оценка спрямо целта", () => {
    const doshli = CELI.find((c) => c.key === "doshli")!;
    expect(ocenka(32, doshli)).toBe("dobre");
    expect(ocenka(25, doshli)).toBe("sredno");
    expect(ocenka(12, doshli)).toBe("zle");
    expect(ocenka(null, doshli)).toBeNull();
  });

  it("тясното място е най-лошата стъпка", () => {
    expect(
      tyasnoMyasto([
        { key: "doshli", p: 31 },
        { key: "do_ofertata", p: 60 },
        { key: "chas", p: 15 },
      ])
    ).toBe("chas");
    expect(tyasnoMyasto([{ key: "doshli", p: 35 }])).toBeNull();
  });

  it("графиката през 5 минути", () => {
    expect(krivaPoStapki([1, 2, 3, 4, 5, 6, 7], 5)).toEqual([5, 7]);
  });
});
