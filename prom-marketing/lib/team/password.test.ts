import { describe, it, expect } from "vitest";
import { generatePassword, hashPassword, verifyPassword } from "./password";

describe("пароли за екипа", () => {
  it("хешът се проверява с вярната парола и отхвърля грешната", () => {
    const stored = hashPassword("Tajna-2026");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(stored).not.toContain("Tajna-2026");
    expect(verifyPassword("Tajna-2026", stored)).toBe(true);
    expect(verifyPassword("tajna-2026", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("две еднакви пароли дават различни хешове (солта е случайна)", () => {
    expect(hashPassword("abc")).not.toBe(hashPassword("abc"));
  });

  it("повреден или липсващ запис не минава", () => {
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "md5$abc$def")).toBe(false);
    expect(verifyPassword("x", "scrypt$$")).toBe(false);
    expect(verifyPassword("x", "scrypt$aa$zz")).toBe(false);
  });

  it("генерираната парола е дълга и без объркващи знаци", () => {
    const p = generatePassword(14);
    expect(p).toHaveLength(14);
    expect(p).not.toMatch(/[0O1lI]/);
  });
});
