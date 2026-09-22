import { describe, expect, it } from "vitest";
import { SERVICE_TEMPLATES, SERVICE_TYPES, isServiceType, tasksForService, templatesFor } from "./service-types";

describe("service-types: чеклистите по вид услуга", () => {
  it("всеки вид има чеклист и поне една стъпка за клиента", () => {
    for (const s of SERVICE_TYPES) {
      const t = SERVICE_TEMPLATES[s];
      expect(t.length).toBeGreaterThan(2);
      expect(t.some((x) => x.client)).toBe(true);
    }
  });

  it("сроковете се броят от старта, без срок остава празно", () => {
    const tasks = tasksForService("website", "2026-09-22");
    expect(tasks[0].due_date).toBe("2026-09-23");
    expect(tasks[0].client_visible).toBe(false);
    expect(tasks[1].client_visible).toBe(true);
    expect(tasks.every((t) => t.due_date !== null)).toBe(true);
  });

  it("невалиден старт не чупи — задачите идват без срок", () => {
    const tasks = tasksForService("other", "не-дата");
    expect(tasks).toHaveLength(SERVICE_TEMPLATES.other.length);
    expect(tasks.every((t) => t.due_date === null)).toBe(true);
  });

  it("шаблоните към клиента: общите за всеки вид + специфичните", () => {
    expect(templatesFor("marketing").some((t) => t.id === "weekly_ads")).toBe(true);
    expect(templatesFor("website").some((t) => t.id === "weekly_ads")).toBe(false);
    expect(templatesFor(null).every((t) => t.service === "all")).toBe(true);
    expect(isServiceType("crm_build")).toBe(true);
    expect(isServiceType("crm")).toBe(false);
  });
});
