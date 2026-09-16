import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { linkCodeFor, personalLinkFor, contactIdForCode, isPersonalLinkConfigured } from "./personal-link";

const A = "083a8ebf-63b6-4c11-9f0a-1d2e3f4a5b6c";
const B = "1f2e3d4c-5b6a-7988-9a0b-1c2d3e4f5a6b";

const OLD = { ...process.env };

beforeEach(() => {
  process.env.ZATOPLI_LINK_SECRET = "тайна-за-тестове";
  process.env.NEXT_PUBLIC_SITE_URL = "https://promarketing.pw";
});

afterEach(() => {
  process.env = { ...OLD };
});

describe("linkCodeFor", () => {
  it("дава един и същ код при всяко викане", () => {
    expect(linkCodeFor(A)).toBe(linkCodeFor(A));
  });

  it("различните контакти имат различни кодове", () => {
    expect(linkCodeFor(A)).not.toBe(linkCodeFor(B));
  });

  it("кодът е десет hex знака — не се познава по него кой е следващият", () => {
    expect(linkCodeFor(A)).toMatch(/^[0-9a-f]{10}$/);
  });

  it("кодът не съдържа id-то", () => {
    expect(linkCodeFor(A)).not.toContain(A.slice(0, 8));
  });

  it("нова тайна обезсилва старите линкове", () => {
    const before = linkCodeFor(A);
    process.env.ZATOPLI_LINK_SECRET = "друга-тайна";
    expect(linkCodeFor(A)).not.toBe(before);
  });

  it("пада обратно към INTERNAL_SEND_TOKEN, за да не иска нов env", () => {
    delete process.env.ZATOPLI_LINK_SECRET;
    process.env.INTERNAL_SEND_TOKEN = "токенът-на-имейл-канала";
    expect(isPersonalLinkConfigured()).toBe(true);
    expect(linkCodeFor(A)).toMatch(/^[0-9a-f]{10}$/);
  });

  it("без никаква тайна връща null, вместо линк към 404", () => {
    delete process.env.ZATOPLI_LINK_SECRET;
    delete process.env.INTERNAL_SEND_TOKEN;
    expect(isPersonalLinkConfigured()).toBe(false);
    expect(linkCodeFor(A)).toBeNull();
    expect(personalLinkFor(A)).toBeNull();
  });
});

describe("personalLinkFor", () => {
  it("сглобява адреса под /z/", () => {
    expect(personalLinkFor(A)).toBe(`https://promarketing.pw/z/${linkCodeFor(A)}`);
  });

  it("не удвоява наклонената черта", () => {
    expect(personalLinkFor(A, "https://promarketing.pw/")).toBe(`https://promarketing.pw/z/${linkCodeFor(A)}`);
  });
});

describe("contactIdForCode", () => {
  const ids = [A, B, "2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f"];

  it("намира контакта по неговия код", () => {
    expect(contactIdForCode(linkCodeFor(A)!, ids)).toBe(A);
    expect(contactIdForCode(linkCodeFor(B)!, ids)).toBe(B);
  });

  it("непознат код не води доникъде", () => {
    expect(contactIdForCode("0123456789", ids)).toBeNull();
  });

  it("код с грешна дължина или знаци се отхвърля преди търсенето", () => {
    expect(contactIdForCode("abc", ids)).toBeNull();
    expect(contactIdForCode("../../etc/pw", ids)).toBeNull();
    expect(contactIdForCode("ZZZZZZZZZZ", ids)).toBeNull();
    expect(contactIdForCode("", ids)).toBeNull();
  });

  it("главните букви се приемат — линкът минава през чатове и имейли", () => {
    expect(contactIdForCode(linkCodeFor(A)!.toUpperCase(), ids)).toBe(A);
  });

  it("празен списък не гърми", () => {
    expect(contactIdForCode(linkCodeFor(A)!, [])).toBeNull();
  });

  it("при колизия не показва страница на никого", () => {
    // Изкуствено: същият id два пъти в списъка дава два еднакви кода.
    expect(contactIdForCode(linkCodeFor(A)!, [A, A])).toBeNull();
  });
});
