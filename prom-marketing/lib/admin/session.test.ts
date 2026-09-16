import { describe, it, expect, beforeAll } from "vitest";
import { issueMemberSession, issueSession, readSession, verifySession } from "./session";

const MEMBER = "6f1a2b3c-4d5e-4f60-8a71-9b8c7d6e5f40";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "тест-таен-ключ-за-сесиите-поне-32-знака-дълъг!!";
});

describe("сесии: собственик и екип", () => {
  it("токенът на собственика е както досега и минава verifySession", () => {
    const t = issueSession();
    expect(t.split(".")).toHaveLength(2);
    expect(verifySession(t)).toBe(true);
    expect(readSession(t)).toMatchObject({ kind: "owner" });
  });

  it("токенът на човек от екипа носи id-то му и НЕ отваря /admin", () => {
    const t = issueMemberSession(MEMBER);
    expect(t.split(".")).toHaveLength(4);
    expect(readSession(t)).toMatchObject({ kind: "member", memberId: MEMBER });
    expect(verifySession(t)).toBe(false);
  });

  it("сменено id или подпис не минава", () => {
    const t = issueMemberSession(MEMBER);
    const other = t.replace(MEMBER, "00000000-0000-4000-8000-000000000000");
    expect(readSession(other)).toBeNull();
    const [ts, m, id, sig] = t.split(".");
    expect(readSession(`${ts}.${m}.${id}.${sig.slice(0, -2)}ab`)).toBeNull();
    expect(readSession(`${ts}.${sig}`)).toBeNull();
  });

  it("боклук и празно не минават", () => {
    expect(readSession(null)).toBeNull();
    expect(readSession("")).toBeNull();
    expect(readSession("a.b.c")).toBeNull();
    expect(readSession("123.m.not-a-uuid.deadbeef")).toBeNull();
    expect(() => issueMemberSession("not-a-uuid")).toThrow();
  });
});
