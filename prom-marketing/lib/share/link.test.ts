import { describe, it, expect, beforeAll } from "vitest";
import {
  createShareToken,
  verifyShareToken,
  codeFingerprint,
  unlockCookieValue,
  safeEqual,
} from "./link";

beforeAll(() => {
  process.env.SHARE_LINK_SECRET = "test-secret-dostatuchno-dulga-za-hmac-32";
});

describe("споделен линк", () => {
  it("отваря се със собствения си подпис", () => {
    const token = createShareToken({ n: "Георги", s: "skript", x: [], e: 0 });
    const payload = verifyShareToken(token);
    expect(payload?.n).toBe("Георги");
    expect(payload?.s).toBe("skript");
  });

  it("подправен подпис не минава", () => {
    const token = createShareToken({ n: "Георги", s: "skript", x: [], e: 0 });
    expect(verifyShareToken(`${token.slice(0, -3)}aaa`)).toBeNull();
  });

  it("подмяна на съдържанието не минава — точно това пази от чужд линк", () => {
    const [, sig] = createShareToken({ n: "Георги", s: "skript", x: [], e: 0 }).split(".");
    const forged = Buffer.from(
      JSON.stringify({ n: "Георги", s: "skript", x: ["napredak"], e: 0 }),
    ).toString("base64url");
    expect(verifyShareToken(`${forged}.${sig}`)).toBeNull();
  });

  it("изтекъл линк не отваря нищо", () => {
    const token = createShareToken({ n: "Георги", s: "skript", x: [], e: Date.now() - 1000 });
    expect(verifyShareToken(token)).toBeNull();
  });

  it("безсрочният линк остава валиден", () => {
    const token = createShareToken({ n: "Георги", s: "skript", x: [], e: 0 });
    expect(verifyShareToken(token)).not.toBeNull();
  });

  it("боклук вместо линк не чупи проверката", () => {
    expect(verifyShareToken(null)).toBeNull();
    expect(verifyShareToken("")).toBeNull();
    expect(verifyShareToken("nyama-tochka")).toBeNull();
    expect(verifyShareToken("a.b")).toBeNull();
  });

  it("кодът за достъп не зависи от главни букви и интервали", () => {
    expect(codeFingerprint("Georgi 2026 ")).toBe(codeFingerprint("georgi 2026"));
    expect(codeFingerprint("georgi")).not.toBe(codeFingerprint("georgi2"));
  });

  it("бисквитката за отключване е различна за всеки линк", () => {
    const a = createShareToken({ n: "Георги", s: "skript", x: [], e: 0 });
    const b = createShareToken({ n: "Катя", s: "skript", x: [], e: 0 });
    expect(unlockCookieValue(a)).not.toBe(unlockCookieValue(b));
  });

  it("сравнението не гърми при различна дължина", () => {
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "abc")).toBe(false);
    expect(safeEqual("abc", "abc")).toBe(true);
  });
});
