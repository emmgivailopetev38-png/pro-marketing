import { describe, expect, it } from "vitest";
import { canSee, defaultModules, homeFor, navFor, permissionsFromForm, visibleModules } from "./roles";

describe("roles: кой какво вижда", () => {
  it("сетърът вижда опашката, задачите, съобщенията и материалите — не цените", () => {
    const m = { role: "setter" as const, permissions: null };
    expect(canSee(m, "zvanene")).toBe(true);
    expect(canSee(m, "ceni")).toBe(false);
    expect(canSee(m, "komisioni")).toBe(false);
    expect(homeFor(m)).toBe("/ekip");
  });

  it("продавачът влиза на продажбите, вижда цени и комисионни, но не опашката", () => {
    const m = { role: "sales" as const, permissions: {} };
    expect(homeFor(m)).toBe("/ekip/prodazhbi");
    expect(canSee(m, "zvanene")).toBe(false);
    expect(canSee(m, "ceni")).toBe(true);
    expect(canSee(m, "komisioni")).toBe(true);
  });

  it("изпълнението и маркетингът влизат на проектите", () => {
    expect(homeFor({ role: "delivery", permissions: null })).toBe("/ekip/proekti");
    expect(homeFor({ role: "marketing", permissions: null })).toBe("/ekip/proekti");
  });

  it("правата по човек надделяват над ролята и в двете посоки", () => {
    const sales = { role: "sales" as const, permissions: { modules: { zvanene: true, ceni: false } } };
    expect(canSee(sales, "zvanene")).toBe(true);
    expect(canSee(sales, "ceni")).toBe(false);
    expect(visibleModules(sales)).toEqual(["zvanene", "prodazhbi", "zadachi", "saobshtenia", "materiali", "komisioni"]);
  });

  it("собственикът вижда всичко, каквото и да пише в правата", () => {
    const o = { role: "owner" as const, permissions: { modules: { ceni: false } } };
    expect(canSee(o, "ceni")).toBe(true);
    expect(navFor(o)).toHaveLength(defaultModules("owner").length);
  });

  it("формата пази само разликата спрямо ролята", () => {
    const p = permissionsFromForm({ zvanene: "1", prodazhbi: "1", ceni: "0", zadachi: undefined }, "sales");
    expect(p).toEqual({ modules: { zvanene: true, ceni: false } });
    expect(permissionsFromForm({ prodazhbi: "1" }, "sales")).toEqual({});
  });

  it("човек без права, дошъл от старата схема, не пада", () => {
    expect(canSee({ role: "delivery", permissions: undefined }, "proekti")).toBe(true);
    expect(homeFor(null)).toBe("/ekip");
  });
});
