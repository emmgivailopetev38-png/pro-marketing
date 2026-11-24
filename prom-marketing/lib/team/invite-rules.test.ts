import { describe, expect, it } from "vitest";
import { inviteState, passwordProblem } from "./invite-rules";
import { partnerModules } from "./invite-defaults";
import { canSee, defaultModules, homeFor } from "./roles";

const NOW = new Date("2026-11-24T12:00:00Z");

describe("поканите", () => {
  it("отворена, приета, отменена, изтекла", () => {
    expect(inviteState({ expires_at: "2026-12-01T00:00:00Z", used_at: null, revoked_at: null }, NOW)).toBe("open");
    expect(inviteState({ expires_at: "2026-12-01T00:00:00Z", used_at: "2026-11-24T13:00:00Z", revoked_at: null }, NOW)).toBe("used");
    expect(inviteState({ expires_at: "2026-12-01T00:00:00Z", used_at: null, revoked_at: "2026-11-24T11:00:00Z" }, NOW)).toBe("revoked");
    expect(inviteState({ expires_at: "2026-11-24T11:59:00Z", used_at: null, revoked_at: null }, NOW)).toBe("expired");
  });

  it("паролата: дължина, буква и цифра, повторение", () => {
    expect(passwordProblem("kratka1", "kratka1")).toMatch(/поне/);
    expect(passwordProblem("самобуквиии", "самобуквиии")).toMatch(/цифра/);
    expect(passwordProblem("dobraparola7", "drugaparola7")).toMatch(/не съвпадат/);
    expect(passwordProblem("dobraparola7", "dobraparola7")).toBeNull();
  });

  it("човек на партньор вижда каквото и нашият клоузър — без „Комисионни“ (24.11.2026)", () => {
    const perms = { modules: partnerModules("sales", "revstream") };
    const closer = { role: "sales" as const, permissions: perms };
    expect(canSee(closer, "prodazhbi")).toBe(true);
    expect(canSee(closer, "napredak")).toBe(true);
    expect(canSee(closer, "liidove")).toBe(true);
    expect(canSee(closer, "ceni")).toBe(true);
    expect(canSee(closer, "oferti")).toBe(true);
    expect(canSee(closer, "materiali")).toBe(true);
    expect(canSee(closer, "saobshtenia")).toBe(true);
    expect(canSee(closer, "komisioni")).toBe(false);
    expect(partnerModules("sales", "promarketing")).toEqual({});
  });
});

describe("нивото мениджър", () => {
  it("таблото на екипа е само за мениджър — отметка не го дава на друг", () => {
    expect(canSee({ role: "manager", permissions: null }, "ekipat")).toBe(true);
    expect(canSee({ role: "sales", permissions: { modules: { ekipat: true } } }, "ekipat")).toBe(false);
    expect(canSee({ role: "setter", permissions: { modules: { ekipat: true } } }, "ekipat")).toBe(false);
  });

  it("мениджърът вижда екипа, бизнеса, всички лийдове и цените, но не звъни; домът му е таблото", () => {
    expect(defaultModules("manager")).toEqual(expect.arrayContaining(["ekipat", "biznes", "liidove", "ceni", "materiali", "napredak"]));
    expect(defaultModules("manager")).not.toContain("zvanene");
    expect(defaultModules("manager")).not.toContain("oferti");
    expect(defaultModules("manager")).not.toContain("prodazhbi");
    expect(defaultModules("manager")).not.toContain("komisioni");
    expect(homeFor({ role: "manager", permissions: null })).toBe("/ekip/ekipat");
  });

  it("„Бизнесът“ е ниво като таблото — отметка не го дава на сетър или клоузър", () => {
    expect(canSee({ role: "manager", permissions: null }, "biznes")).toBe(true);
    expect(canSee({ role: "sales", permissions: { modules: { biznes: true } } }, "biznes")).toBe(false);
    expect(canSee({ role: "setter", permissions: { modules: { biznes: true } } }, "biznes")).toBe(false);
  });
});
