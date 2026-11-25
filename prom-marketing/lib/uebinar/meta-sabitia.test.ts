import { describe, expect, it } from "vitest";
import { chistiParametri, eStandartno, ePozvoleno, fbclidOt, nashAdres } from "./meta-sabitia";

describe("събитията на пиксела на уебинара", () => {
  it("пуска само позволените имена", () => {
    expect(ePozvoleno("PageView")).toBe(true);
    expect(ePozvoleno("Skrol")).toBe(true);
    expect(ePozvoleno("CompleteRegistration")).toBe(false); // праща го записването
    expect(ePozvoleno("Purchase")).toBe(false);
    expect(ePozvoleno(42)).toBe(false);
    expect(eStandartno("ViewContent")).toBe(true);
    expect(eStandartno("OtvoriFormata")).toBe(false);
  });

  it("чисти параметрите", () => {
    expect(chistiParametri({ procent: 50, mesto: " hero ", lo: { x: 1 }, "bad key": "x", n: Infinity })).toEqual({ procent: 50, mesto: "hero" });
    expect(chistiParametri(null)).toEqual({});
    expect(chistiParametri([1, 2])).toEqual({});
    expect(Object.keys(chistiParametri(Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, i])))).length).toBe(8);
  });

  it("fbclid и адресът", () => {
    expect(fbclidOt("https://ivailopetev.com/?fbclid=abc&utm_source=fb")).toBe("abc");
    expect(fbclidOt("не е адрес")).toBeNull();
    expect(nashAdres("https://ivailopetev.com/?a=1")).toBe("https://ivailopetev.com/?a=1");
    expect(nashAdres("https://promarketing.pw/na-zhivo")).toBe("https://promarketing.pw/na-zhivo");
    expect(nashAdres("https://evil.com/")).toBeNull();
    expect(nashAdres("https://ivailopetev.com.evil.com/")).toBeNull();
  });
});
