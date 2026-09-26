import { describe, expect, it } from "vitest";
import { canSee, defaultModules, homeFor, modulesFromForm, navFor, permissionsFromForm, visibleModules } from "./roles";
import { TEAM_MODULES, type TeamModule } from "./types";

/** Формата от /admin/ekip такава, каквато я праща браузърът: скрито „0“, после „1“ за отметнатите. */
function adminForm(checked: TeamModule[]): FormData {
  const fd = new FormData();
  for (const m of TEAM_MODULES) {
    fd.append(`mod_${m}`, "0");
    if (checked.includes(m)) fd.append(`mod_${m}`, "1");
  }
  return fd;
}

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
    expect(visibleModules(sales)).toEqual(["zvanene", "prodazhbi", "zadachi", "saobshtenia", "materiali", "komisioni", "napredak", "belezhki"]);
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

  it("продавач с отметнато „Звънене“ влиза в правата — не всичко изключено (Елена, 26.09)", () => {
    const fd = adminForm(["zvanene", ...defaultModules("sales")]);
    expect(permissionsFromForm(modulesFromForm(fd), "sales")).toEqual({ modules: { zvanene: true } });
  });

  it("формата, оставена както е по ролята, не записва нищо", () => {
    expect(permissionsFromForm(modulesFromForm(adminForm(defaultModules("setter"))), "setter")).toEqual({});
  });

  it("махнатата отметка по роля се пази като изрично „не“", () => {
    const fd = adminForm(defaultModules("sales").filter((m) => m !== "ceni"));
    expect(permissionsFromForm(modulesFromForm(fd), "sales")).toEqual({ modules: { ceni: false } });
  });
});
