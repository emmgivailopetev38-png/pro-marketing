import { describe, expect, it } from "vitest";
import type { ZvRow } from "@/lib/zvanene/rules";
import {
  STARI_OT,
  recentEnough,
  scheduledLater,
  showsInStari,
  stariHeading,
  stariPileOf,
  teamStari,
  type StariContact,
  type StariInput,
} from "./stari-rules";

const NOW = new Date("2026-11-11T10:00:00Z"); // 12:00 в София
const GEORGI = "g1";
const DRUG = "d2";

function row(id: string, kat: ZvRow["kat"], lead_at = "2026-10-20T09:00:00Z"): ZvRow {
  return {
    id,
    name: id,
    company: null,
    tel: "+359888000111",
    phone_pretty: "0888 000 111",
    stage: "lead",
    kat,
    sort: 0,
    lead_at,
    zashto: "",
    posledno: [],
    nevdigna: 0,
    oferta: false,
    due: null,
    called_today: null,
  };
}

function input(rows: ZvRow[], extra: Partial<Omit<StariInput, "rows">> = {}, contacts: StariContact[] = []): StariInput {
  const map = new Map<string, StariContact>(rows.map((r) => [r.id, { id: r.id, owner_id: null, next_followup_at: null }]));
  for (const c of contacts) map.set(c.id, c);
  return {
    rows,
    contacts: map,
    inQueue: new Set(),
    ivailos: new Set(),
    teamIds: new Set([GEORGI, DRUG]),
    viewerId: GEORGI,
    now: NOW,
    ...extra,
  };
}

describe("купчините са тези на /admin/zvanene", () => {
  it("топъл → топли, стар → по-стари, писано и „нов извън опашката“ → писано/звънено без разговор", () => {
    expect(stariPileOf({ kat: "topal" })).toBe("topli");
    expect(stariPileOf({ kat: "star" })).toBe("stari");
    expect(stariPileOf({ kat: "pisano" })).toBe("pisano");
    expect(stariPileOf({ kat: "nov" })).toBe("pisano");
  });

  it("редът се пази — обещаното за днес е най-горе, както го е подредила страницата на Ивайло", () => {
    const p = teamStari(input([row("a", "star"), row("b", "topal"), row("c", "star"), row("d", "pisano")]));
    expect(p.stari.map((r) => r.id)).toEqual(["a", "c"]);
    expect(p.topli.map((r) => r.id)).toEqual(["b"]);
    expect(p.pisano.map((r) => r.id)).toEqual(["d"]);
  });
});

describe("кой НЕ излиза при екипа", () => {
  it("вече е в друг изглед на опашката", () => {
    expect(showsInStari(row("a", "star"), input([], { inQueue: new Set(["a"]) }))).toBe(false);
  });

  it("човек на Ивайло (говорил с него, среща, Академията, махнат от звъненето)", () => {
    const i = input([row("a", "topal")], { ivailos: new Set(["a"]) });
    expect(teamStari(i).topli).toEqual([]);
  });

  it("…освен ако Ивайло го е дал да го води човек от екипа — тогава е на екипа (топлите от 05.11)", () => {
    const stara = row("a", "topal", "2026-03-02T09:00:00Z");
    const i = input([stara], { ivailos: new Set(["a"]) }, [{ id: "a", owner_id: GEORGI, next_followup_at: null }]);
    expect(teamStari(i).topli.map((r) => r.id)).toEqual(["a"]);
  });

  it("води го друг човек от екипа — вижда го той и собственикът, не аз", () => {
    const c: StariContact = { id: "a", owner_id: DRUG, next_followup_at: null };
    expect(showsInStari(row("a", "topal"), input([], {}, [c]))).toBe(false);
    expect(showsInStari(row("a", "topal"), input([], { viewerId: DRUG }, [c]))).toBe(true);
    expect(showsInStari(row("a", "topal"), input([], { viewerId: null }, [c]))).toBe(true);
  });

  it("насрочен е за друг ден — ще излезе тогава; просроченото и днешното излизат сега", () => {
    expect(scheduledLater("2026-11-12T08:00:00Z", NOW)).toBe(true);
    expect(scheduledLater("2026-11-11T15:00:00Z", NOW)).toBe(false);
    expect(scheduledLater("2026-11-05T08:00:00Z", NOW)).toBe(false);
    expect(scheduledLater(null, NOW)).toBe(false);
    const utre: StariContact = { id: "a", owner_id: null, next_followup_at: "2026-11-12T08:00:00Z" };
    const vchera: StariContact = { id: "b", owner_id: null, next_followup_at: "2026-11-10T08:00:00Z" };
    const p = teamStari(input([row("a", "star"), row("b", "star")], {}, [utre, vchera]));
    expect(p.stari.map((r) => r.id)).toEqual(["b"]);
  });
});

describe("само последните — от септември насам (Ивайло, 11.11.2026)", () => {
  it("границата е 01.09.2026 в София; по-старата заявка не излиза при екипа", () => {
    expect(STARI_OT).toBe("2026-08-31T21:00:00Z");
    expect(recentEnough("2026-09-01T06:00:00Z")).toBe(true);
    expect(recentEnough("2026-08-31T20:59:00Z")).toBe(false);
    expect(recentEnough(null)).toBe(false);
    const p = teamStari(input([row("nov", "star", "2026-10-02T09:00:00Z"), row("star", "star", "2026-06-15T09:00:00Z")]));
    expect(p.stari.map((r) => r.id)).toEqual(["nov"]);
  });

  it("стар картон, който пак е оставил данни след септември, е „последен“ (гледа се последната заявка)", () => {
    expect(showsInStari(row("a", "pisano", "2026-10-21T07:28:00Z"), input([]))).toBe(true);
  });
});

describe("заглавието", () => {
  it("казва колко са и колко се виждат", () => {
    expect(stariHeading("topli", 31, 25)).toBe("🔥 Топли · 31 · на екрана първите 25");
    expect(stariHeading("stari", 8, 8)).toBe("🗂 По-стари · 8");
  });
});
