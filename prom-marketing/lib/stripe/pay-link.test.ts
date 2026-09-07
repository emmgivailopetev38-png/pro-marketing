import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { createPayToken, newPayLinkId, payLinkDedupeKey, speakEur, verifyPayToken } from "./pay-link";

const SECRET = "x".repeat(40);

describe("линкът за плащане", () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.PAY_LINK_SECRET = SECRET;
  });
  afterEach(() => {
    process.env = { ...env };
  });

  it("подписва и чете обратно същото", () => {
    const id = newPayLinkId();
    const token = createPayToken({ id, product: "glas-vnedryavane", email: "Ivan@Example.COM", name: "Иван", contactId: "c1" });
    const v = verifyPayToken(token);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.payload.id).toBe(id);
    expect(v.payload.p).toBe("glas-vnedryavane");
    expect(v.payload.e).toBe("ivan@example.com");
    expect(v.payload.n).toBe("Иван");
    expect(v.payload.c).toBe("c1");
    expect(payLinkDedupeKey(id)).toBe(`paylink:${id}`);
  });

  it("отхвърля подправен подпис и подправено тяло", () => {
    const token = createPayToken({ id: "a", product: "crm-vnedryavane", email: "a@b.bg" });
    const [body, sig] = token.split(".");
    expect(verifyPayToken(`${body}.${"0".repeat(sig.length)}`)).toEqual({ ok: false, reason: "signature" });
    // Друг продукт със същия подпис — подписът е върху тялото, така че пада.
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString("utf8")), p: "glas-vnedryavane" })
    ).toString("base64url");
    expect(verifyPayToken(`${forged}.${sig}`).ok).toBe(false);
  });

  it("изтича след четиринайсет дни", () => {
    const now = Date.parse("2026-09-07T10:00:00Z");
    const token = createPayToken({ id: "a", product: "avtomatizacia-proces", email: "a@b.bg", nowMs: now });
    expect(verifyPayToken(token, now + 13 * 24 * 3600_000).ok).toBe(true);
    expect(verifyPayToken(token, now + 15 * 24 * 3600_000)).toEqual({ ok: false, reason: "expired" });
  });

  it("не приема продукт извън списъка на гласовия агент", () => {
    // Токен, сглобен ръчно с продукт от курсовете — подписан е валидно, но продуктът не е за гласа.
    const payload = { v: 1, id: "a", p: "course", e: "a@b.bg", t: 1, x: Date.now() + 1000 };
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = createHmac("sha256", SECRET).update(`pay:${body}`).digest("hex").slice(0, 32);
    expect(verifyPayToken(`${body}.${sig}`)).toEqual({ ok: false, reason: "product" });
  });

  it("без тайна не проверява нищо", () => {
    delete process.env.PAY_LINK_SECRET;
    delete process.env.SHARE_LINK_SECRET;
    delete process.env.ADMIN_SESSION_SECRET;
    expect(verifyPayToken("abc.def")).toEqual({ ok: false, reason: "signature" });
    expect(verifyPayToken("")).toEqual({ ok: false, reason: "missing" });
    expect(verifyPayToken("nodot")).toEqual({ ok: false, reason: "format" });
  });
});

describe("сумата с думи", () => {
  it("изговаря ценоразписа", () => {
    expect(speakEur(2400)).toBe("две хиляди и четиристотин евро");
    expect(speakEur(1680)).toBe("хиляда шестстотин и осемдесет евро");
    expect(speakEur(1900)).toBe("хиляда и деветстотин евро");
    expect(speakEur(2900)).toBe("две хиляди и деветстотин евро");
    expect(speakEur(290)).toBe("двеста и деветдесет евро");
    expect(speakEur(4900)).toBe("четири хиляди и деветстотин евро");
    expect(speakEur(105)).toBe("сто и пет евро");
    expect(speakEur(12)).toBe("дванайсет евро");
  });
});
