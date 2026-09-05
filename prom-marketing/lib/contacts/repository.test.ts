import { describe, it, expect } from "vitest";
import { phoneVariants } from "./repository";

describe("phoneVariants", () => {
  it("свързва националния и международния запис на един и същ номер", () => {
    // Точният случай от 24.08.2026: Юри Александров влезе през Meta и през
    // попъпа на сайта в рамките на 9 секунди и си направи два картона.
    const otMeta = phoneVariants("+359892036709");
    const otPopup = phoneVariants("0892036709");

    expect(otMeta).toContain("0892036709");
    expect(otPopup).toContain("+359892036709");
    expect(otMeta.some((v) => otPopup.includes(v))).toBe(true);
  });

  it("не се влияе от интервали и тирета", () => {
    expect(phoneVariants("+359 892 036 709")).toContain("+359892036709");
    expect(phoneVariants("089-203-6709")).toContain("+359892036709");
  });

  it("винаги връща и суровия запис, за да съвпадне с вече записаното", () => {
    expect(phoneVariants("0892036709")).toContain("0892036709");
    expect(phoneVariants("+359892036709")).toContain("+359892036709");
  });

  it("не слепва два различни номера", () => {
    const a = phoneVariants("+359892036709");
    const b = phoneVariants("+359884601508");
    expect(a.some((v) => b.includes(v))).toBe(false);
  });

  it("оставя чуждите номера на мира", () => {
    // Елизабета е с британски номер — да не се превърне в български.
    const uk = phoneVariants("+447488266531");
    expect(uk).toContain("+447488266531");
    expect(uk.some((v) => v === "+359447488266531")).toBe(false);
  });

  it("издържа на празен и безсмислен вход", () => {
    expect(phoneVariants("")).toEqual([""]);
    expect(phoneVariants("не знам")).toEqual(["не знам"]);
  });
});
