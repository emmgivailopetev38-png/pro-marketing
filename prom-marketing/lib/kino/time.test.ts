import { describe, it, expect } from "vitest";
import { KINO } from "./config";
import {
  kinoTimeline,
  phaseAt,
  simulivePosition,
  chapterIndexAt,
  chapterSpans,
  isOfferOpen,
  clampSimuliveSeek,
  splitCountdown,
  formatClock,
  sofiaDayLabel,
  sofiaOnDay,
  sofiaTimeLabel,
  premiereLabels,
  resolveSimTime,
  sofiaLocalMs,
} from "./time";

/**
 * Часовете тук са в UTC нарочно: машината на Ивайло е в София, Vercel е в UTC.
 * Премиерата е пт 16.10.2026, 19:30 софийско = 16:30 UTC (още е лятно часово
 * време, +03:00 — то свършва на 25.10).
 */
const tl = kinoTimeline();
const at = (iso: string) => Date.parse(iso);

describe("kinoTimeline", () => {
  it("премиерата е 16:30 UTC — 19:30 софийско (лятно часово време)", () => {
    expect(new Date(tl.premiereMs).toISOString()).toBe("2026-10-16T16:30:00.000Z");
    expect(new Date(tl.doorsMs).toISOString()).toBe("2026-10-16T16:25:00.000Z");
  });

  it("филмът (с въпросите и подаръка) свършва след durationSec; записването затваря в нд 23:59", () => {
    expect(tl.filmEndMs - tl.premiereMs).toBe(KINO.film.durationSec * 1000);
    expect(KINO.film.durationSec).toBeLessThanOrEqual(60 * 60); // най-много час
    expect(new Date(tl.closeMs).toISOString()).toBe("2026-10-18T20:59:00.000Z");
  });
});

describe("phaseAt", () => {
  it("минава през всички фази в правилния ред — без повторение", () => {
    expect(phaseAt(at("2026-10-15T10:00:00Z"), tl)).toBe("before");
    expect(phaseAt(at("2026-10-16T16:26:00Z"), tl)).toBe("doors");
    expect(phaseAt(at("2026-10-16T16:30:00Z"), tl)).toBe("film");
    expect(phaseAt(tl.filmEndMs - 1, tl)).toBe("film");
    expect(phaseAt(tl.filmEndMs, tl)).toBe("after");
    expect(phaseAt(at("2026-10-18T20:58:59Z"), tl)).toBe("after");
  });

  it("в неделя в 23:59 софийско записването затваря", () => {
    expect(phaseAt(at("2026-10-18T20:59:00Z"), tl)).toBe("closed");
  });
});

describe("simulivePosition", () => {
  it("закъснелият влиза в текущата минута", () => {
    // 19:42:30 софийско → 12 мин 30 сек от началото
    expect(simulivePosition(at("2026-10-16T16:42:30Z"), tl)).toBe(750);
  });

  it("преди началото е нула, след края — дължината на филма", () => {
    expect(simulivePosition(at("2026-10-16T16:00:00Z"), tl)).toBe(0);
    expect(simulivePosition(at("2026-10-17T16:00:00Z"), tl)).toBe(KINO.film.durationSec);
  });
});

describe("главите", () => {
  it("12 глави, подредени по време; гл. 0 започва след „Добре дошли“", () => {
    expect(KINO.film.chapters).toHaveLength(12);
    expect(KINO.film.chapters[0].startSec).toBe(KINO.film.filmStartSec);
    const starts = KINO.film.chapters.map((c) => c.startSec);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it("точките от двигателя (tochki-zala-v2.json — черновата v2, 46:21)", () => {
    const f = KINO.film;
    expect(formatClock(f.filmStartSec)).toBe("2:22");
    expect(formatClock(f.numberAtSec)).toBe("33:20");
    expect(formatClock(f.offerAtSec)).toBe("38:32");
    expect(formatClock(f.againAtSec)).toBe("39:32");
    expect(formatClock(f.qaAtSec)).toBe("41:17");
    expect(formatClock(f.goodnightAtSec)).toBe("45:36");
    expect(formatClock(f.giftSceneAtSec)).toBe("45:53");
    expect(formatClock(f.postCreditsAtSec)).toBe("46:06");
    expect(formatClock(f.durationSec)).toBe("46:21");
    expect(f.chapters.map((c) => c.startSec)).toEqual([142, 226.4, 396.9, 525.9, 645.5, 701.9, 870.8, 1011.5, 1377, 1543.8, 2017.7, 2063.8]);
    // редът: надписите → „Ето ни отново“ → въпросите → „Лека вечер“ → подаръкът → краят
    const order = [f.filmStartSec, f.numberAtSec, f.offerAtSec, f.againAtSec, f.qaAtSec, f.goodnightAtSec, f.giftSceneAtSec, f.postCreditsAtSec, f.durationSec];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("намира главата по секундата — и на самата граница", () => {
    const ch = KINO.film.chapters;
    expect(ch[chapterIndexAt(KINO.film.filmStartSec, ch)].title).toBe("Седни удобно");
    expect(ch[chapterIndexAt(525.9, ch)].title).toBe("Правец");
    expect(ch[chapterIndexAt(525.8, ch)].n).toBe(2);
    expect(ch[chapterIndexAt(KINO.film.offerAtSec - 1, ch)].title).toBe("Част втора");
  });

  it("последната глава свършва с надписите", () => {
    const spans = chapterSpans(KINO.film.chapters, KINO.film.offerAtSec);
    expect(spans.at(-1)).toMatchObject({ fromSec: 2063.8, toSec: KINO.film.offerAtSec });
    expect(spans[0]).toMatchObject({ fromSec: 142, toSec: 226.4 });
  });
});

describe("офертата", () => {
  it("бутоните изплуват точно с надписите — не секунда по-рано", () => {
    expect(isOfferOpen(KINO.film.offerAtSec - 1)).toBe(false);
    expect(isOfferOpen(KINO.film.offerAtSec)).toBe(true);
  });

  it("редът във файла: поканата → надписите → въпросите → подаръкът → краят", () => {
    const offerChapter = KINO.film.chapters.find((c) => c.n === KINO.film.offerChapter)!;
    expect(KINO.film.offerAtSec).toBeGreaterThan(offerChapter.startSec);
    expect(KINO.film.qaAtSec).toBeGreaterThan(KINO.film.offerAtSec);
    expect(KINO.film.postCreditsAtSec).toBeGreaterThan(KINO.film.qaAtSec);
    expect(KINO.film.durationSec).toBeGreaterThan(KINO.film.postCreditsAtSec);
    expect(KINO.film.numberAtSec).toBeLessThan(KINO.film.offerAtSec);
  });
});

describe("clampSimuliveSeek", () => {
  it("не пуска превъртане напред по време на премиерата", () => {
    expect(clampSimuliveSeek(900, 600)).toBe(600);
  });
  it("назад може — и малкото изпреварване от буфера се търпи", () => {
    expect(clampSimuliveSeek(300, 600)).toBe(300);
    expect(clampSimuliveSeek(601, 600)).toBe(601);
  });
});

describe("броячът и часовникът", () => {
  it("разбива милисекундите на дни, часове, минути, секунди", () => {
    expect(splitCountdown(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000)).toEqual({
      totalSec: 183845,
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
    expect(splitCountdown(-5000).totalSec).toBe(0);
  });

  it("форматира позицията във филма", () => {
    expect(formatClock(125)).toBe("2:05");
    expect(formatClock(3725)).toBe("1:02:05");
  });
});

describe("етикетите на български", () => {
  it("денят и часът са софийски, независимо от зоната на сървъра", () => {
    expect(sofiaDayLabel(tl.premiereMs)).toBe("петък, 16 октомври");
    expect(sofiaTimeLabel(tl.premiereMs)).toBe("19:30");
  });

  it("всички етикети на прожекцията", () => {
    expect(premiereLabels()).toEqual({
      day: "петък, 16 октомври",
      onDay: "в петък, 16 октомври",
      time: "19:30",
      short: "пт 16.10 · 19:30",
      doorsTime: "19:25",
      closeDay: "неделя, 18 октомври",
      closeOnDay: "в неделя, 18 октомври",
      closeTime: "23:59",
      closeShort: "18.10, 23:59",
    });
  });

  it("софийски час → UTC, и през смяната на часовото време", () => {
    expect(new Date(sofiaLocalMs(2026, 10, 18, 23, 59)).toISOString()).toBe("2026-10-18T20:59:00.000Z");
    expect(new Date(sofiaLocalMs(2026, 11, 15, 23, 59)).toISOString()).toBe("2026-11-15T21:59:00.000Z");
    expect(new Date(sofiaLocalMs(2026, 10, 19)).toISOString()).toBe("2026-10-18T21:00:00.000Z");
  });
});

describe("sofiaOnDay", () => {
  it("„във“ пред вторник, „в“ пред другите дни", () => {
    expect(sofiaOnDay(Date.parse("2026-11-10T17:30:00Z"))).toBe("във вторник, 10 ноември");
    expect(sofiaOnDay(Date.parse("2026-11-11T17:30:00Z"))).toBe("в сряда, 11 ноември");
    expect(sofiaOnDay(Date.parse("2026-11-12T17:30:00Z"))).toBe("в четвъртък, 12 ноември");
  });
});

describe("resolveSimTime (прегледът на Ивайло)", () => {
  it("кратките имена водят в правилната фаза", () => {
    expect(phaseAt(resolveSimTime("lobby", tl)!, tl)).toBe("before");
    expect(phaseAt(resolveSimTime("doors", tl)!, tl)).toBe("doors");
    expect(phaseAt(resolveSimTime("film", tl)!, tl)).toBe("film");
    expect(phaseAt(resolveSimTime("number", tl)!, tl)).toBe("film");
    expect(phaseAt(resolveSimTime("offer", tl)!, tl)).toBe("film");
    expect(phaseAt(resolveSimTime("qa", tl)!, tl)).toBe("film");
    expect(phaseAt(resolveSimTime("bonus", tl)!, tl)).toBe("film");
    expect(phaseAt(resolveSimTime("after", tl)!, tl)).toBe("after");
    expect(phaseAt(resolveSimTime("last", tl)!, tl)).toBe("after");
    expect(phaseAt(resolveSimTime("closed", tl)!, tl)).toBe("closed");
  });

  it("film:<секунди> пуска залата в точната секунда", () => {
    expect(simulivePosition(resolveSimTime("film:1950", tl)!, tl)).toBe(1950);
  });

  it("„offer“ е след надписите — бутоните вече са горе", () => {
    expect(isOfferOpen(simulivePosition(resolveSimTime("offer", tl)!, tl))).toBe(true);
  });

  it("приема ISO и отказва глупости", () => {
    expect(resolveSimTime("2026-11-10T17:31:00Z", tl)).toBe(at("2026-11-10T17:31:00Z"));
    expect(resolveSimTime("утре", tl)).toBeNull();
    expect(resolveSimTime("", tl)).toBeNull();
  });
});
