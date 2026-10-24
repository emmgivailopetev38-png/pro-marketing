import { describe, it, expect } from "vitest";
import { clientMap, clientWhyFor, hasNoAutoEmailFlag, type ClientCard, type ClientSignals } from "./klienti-rules";

function card(over: Partial<ClientCard> = {}): ClientCard {
  return { id: "c1", email: "ivan@example.bg", stage: "negotiating", followup_status: null, ...over };
}

function signals(over: Partial<ClientSignals> = {}): ClientSignals {
  return { akademia: new Set(), paid: new Set(), flagged: new Set(), ...over };
}

describe("clientWhyFor", () => {
  it("won е клиент", () => {
    expect(clientWhyFor(card({ stage: "won" }), signals())).toBe("won");
  });

  it("фактура, плащане или абонамент прави човека клиент, каквото и да пише на етапа", () => {
    expect(clientWhyFor(card({ stage: "contacted" }), signals({ paid: new Set(["c1"]) }))).toBe("paid");
  });

  it("Академията е програмата — член не получава продажбени писма", () => {
    expect(clientWhyFor(card({ stage: "lead" }), signals({ akademia: new Set(["c1"]) }))).toBe("akademia");
  });

  it("ръчният знак no_auto_email спира писмата", () => {
    expect(clientWhyFor(card(), signals({ flagged: new Set(["c1"]) }))).toBe("flag");
  });

  it("проформа и „готов за затваряне“ — парите вече се движат", () => {
    expect(clientWhyFor(card({ followup_status: "sent_proforma" }), signals())).toBe("closing");
    expect(clientWhyFor(card({ followup_status: "ready_to_close" }), signals())).toBe("closing");
  });

  it("човек с оферта, но без пари и без знак, не е клиент — кръгът си върви", () => {
    expect(clientWhyFor(card({ stage: "offer_sent", followup_status: "sent_offer" }), signals())).toBeNull();
    expect(clientWhyFor(card({ stage: "lost" }), signals())).toBeNull();
  });
});

describe("clientMap", () => {
  it("вторият картон на клиента (същият имейл, друг регистър) също мълчи", () => {
    // Михаил Михов: спечелен картон + картон от Академията на същия адрес.
    const target = card({ id: "akad", email: "Mihov@Example.bg", stage: "contacted" });
    const twin = card({ id: "won", email: "mihov@example.bg", stage: "won" });
    const out = clientMap([target], [twin], signals());
    expect(out.get("akad")).toBe("won");
  });

  it("друг човек без знаци не се пипа", () => {
    const out = clientMap([card({ id: "x", email: "x@example.bg" })], [card({ id: "won", email: "y@example.bg", stage: "won" })], signals());
    expect(out.has("x")).toBe(false);
  });

  it("картон без имейл не се свързва с чужди картони", () => {
    const out = clientMap([card({ id: "a", email: null })], [card({ id: "b", email: null, stage: "won" })], signals());
    expect(out.has("a")).toBe(false);
  });
});

describe("hasNoAutoEmailFlag", () => {
  it("само истинско true", () => {
    expect(hasNoAutoEmailFlag({ no_auto_email: true })).toBe(true);
    expect(hasNoAutoEmailFlag({ no_auto_email: "true" })).toBe(false);
    expect(hasNoAutoEmailFlag(null)).toBe(false);
  });
});
