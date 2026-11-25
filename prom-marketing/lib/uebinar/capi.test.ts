import { describe, expect, it } from "vitest";
import { clientIp, cookieValue, fbcFor, safeEventId, splitName } from "./capi";

describe("cookieValue", () => {
  it("намира бисквитката по име", () => {
    const c = "pm_x=1; _fbp=fb.1.1700000000000.123456789; _fbc=fb.1.1700000000001.IwAR";
    expect(cookieValue(c, "_fbp")).toBe("fb.1.1700000000000.123456789");
    expect(cookieValue(c, "_fbc")).toBe("fb.1.1700000000001.IwAR");
  });
  it("няма бисквитка → null", () => {
    expect(cookieValue(null, "_fbp")).toBeNull();
    expect(cookieValue("a=1", "_fbp")).toBeNull();
    expect(cookieValue("_fbp=", "_fbp")).toBeNull();
  });
});

describe("fbcFor", () => {
  it("първо бисквитката _fbc", () => {
    expect(fbcFor("_fbc=fb.1.5.abc", "zzz", 9)).toBe("fb.1.5.abc");
  });
  it("иначе се прави от fbclid", () => {
    expect(fbcFor("_fbp=x", "IwTEST", 1700000000000)).toBe("fb.1.1700000000000.IwTEST");
  });
  it("без двете → null", () => {
    expect(fbcFor(null, undefined)).toBeNull();
  });
});

describe("splitName", () => {
  it("едно, две и три имена", () => {
    expect(splitName("Иван")).toEqual({ firstName: "Иван", lastName: null });
    expect(splitName("  Иван   Петров ")).toEqual({ firstName: "Иван", lastName: "Петров" });
    expect(splitName("Иван Петров Иванов")).toEqual({ firstName: "Иван", lastName: "Иванов" });
    expect(splitName("   ")).toEqual({ firstName: null, lastName: null });
  });
});

describe("clientIp", () => {
  it("първият адрес от x-forwarded-for", () => {
    expect(clientIp("85.11.22.33, 76.76.21.21")).toBe("85.11.22.33");
    expect(clientIp(null, "1.2.3.4")).toBe("1.2.3.4");
    expect(clientIp(null, null)).toBeNull();
  });
});

describe("safeEventId", () => {
  it("пуска UUID и отказва странни стойности", () => {
    expect(safeEventId("6f1c2b1e-8d2a-4c1e-9b7f-1a2b3c4d5e6f")).toBe("6f1c2b1e-8d2a-4c1e-9b7f-1a2b3c4d5e6f");
    expect(safeEventId("evt_1700000000000_ab12cd34")).toBe("evt_1700000000000_ab12cd34");
    expect(safeEventId("<script>")).toBeNull();
    expect(safeEventId("abc")).toBeNull();
    expect(safeEventId(undefined)).toBeNull();
  });
});
