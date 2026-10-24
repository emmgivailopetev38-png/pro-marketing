import { describe, expect, it } from "vitest";
import { isDemoAdminPath } from "./demo-paths";

describe("isDemoAdminPath", () => {
  it("пуска само трите демо страници", () => {
    expect(isDemoAdminPath("/admin/jarvis")).toBe(true);
    expect(isDemoAdminPath("/admin/deck/")).toBe(true);
    expect(isDemoAdminPath("/admin/demo-glas")).toBe(true);
  });
  it("спира всичко с числата на фирмата", () => {
    for (const p of ["/admin", "/admin/clients", "/admin/glas", "/admin/jarvis/x", "/admin/accounting", "/admin/ekip"]) {
      expect(isDemoAdminPath(p)).toBe(false);
    }
  });
});
