import { describe, expect, it } from "vitest";
import { statSync } from "node:fs";
import path from "node:path";
import { VIBER_ODOBRENI, VIBER_POSTOVE, dalzhimiPostove } from "./viber-postove";

const T = (iso: string) => new Date(iso).getTime();
const PUB = path.join(process.cwd(), "public", "ivailo", "viber");

describe("Viber постовете (26.11.2026: кратки, с видео и картинки)", () => {
  it("всеки файл го има, с точния размер и в лимитите на Viber", () => {
    for (const p of VIBER_POSTOVE) {
      if (p.kartina) {
        expect(p.kartina, p.kluch).toMatch(/\.jpeg$/); // Viber иска .jpeg
        expect(statSync(path.join(PUB, p.kartina)).size, p.kluch).toBeLessThan(1_000_000);
      }
      if (p.video) {
        expect(statSync(path.join(PUB, p.video.fajl)).size, p.kluch).toBe(p.video.razmer);
        expect(p.video.razmer).toBeLessThan(50_000_000);
        expect(p.video.sekundi).toBeLessThanOrEqual(180);
        expect(statSync(path.join(PUB, p.video.thumb)).size, p.kluch).toBeLessThan(100_000);
      }
    }
  });

  it("кратки, без „—“, по ред и с уникални ключове", () => {
    const k = VIBER_POSTOVE.map((p) => p.kluch);
    expect(new Set(k).size).toBe(k.length);
    for (let i = 1; i < VIBER_POSTOVE.length; i++) expect(T(VIBER_POSTOVE[i].koga)).toBeGreaterThan(T(VIBER_POSTOVE[i - 1].koga));
    for (const p of VIBER_POSTOVE) {
      expect(p.tekst.length, p.kluch).toBeLessThanOrEqual(320);
      expect(p.tekst, p.kluch).not.toContain("—");
      expect(p.tekst, p.kluch).not.toMatch(/гарантира/i);
    }
  });

  it("линкът за влизане е в постовете на 29.11 вечерта", () => {
    for (const k of ["10", "15min", "11"]) expect(VIBER_POSTOVE.find((p) => p.kluch === k)!.tekst).toContain("https://ivailopetev.com/vlez");
  });

  it("само един пост наведнъж: последният дължим", () => {
    expect(dalzhimiPostove(T("2026-11-26T11:59:00+02:00"), new Set())).toEqual([]);
    expect(dalzhimiPostove(T("2026-11-26T12:03:00+02:00"), new Set())).toEqual(["2"]);
    expect(dalzhimiPostove(T("2026-11-26T12:08:00+02:00"), new Set(["2"]))).toEqual([]);
    // одобрено следобед: тръгва пропуснатият от 12:00, веднъж
    expect(dalzhimiPostove(T("2026-11-26T15:00:00+02:00"), new Set())).toEqual(["2"]);
    // спрян Viber до 18:50 в неделя: само „15 минути“, не и „1 час“
    expect(dalzhimiPostove(T("2026-11-29T18:50:00+02:00"), new Set())).toEqual(["15min"]);
    expect(dalzhimiPostove(T("2026-11-29T19:02:00+02:00"), new Set(["15min"]))).toEqual(["11"]);
    expect(dalzhimiPostove(T("2026-11-29T19:40:00+02:00"), new Set())).toEqual([]);
  });

  it("чакат „да“ от Ивайло", () => {
    expect(VIBER_ODOBRENI).toBe(false);
  });
});
