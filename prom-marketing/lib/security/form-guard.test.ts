import { describe, expect, it } from "vitest";
import { confirmationAllowed, hasLink, isOwnOrigin, safeForMail } from "./form-guard";

const req = (h: Record<string, string>) => new Request("https://promarketing.pw/api/order", { method: "POST", headers: h });

// Подменен клиент: връща броя по реда на заявките (адрес, маршрут).
function fakeSupabase(byAddress: number, byRoute: number) {
  let call = 0;
  const q = () => {
    const n = call++ === 0 ? byAddress : byRoute;
    const chain: Record<string, unknown> = {};
    for (const m of ["select", "eq", "gte"]) chain[m] = () => chain;
    (chain as { then: unknown }).then = (r: (v: unknown) => void) => r({ count: n, error: null });
    return chain;
  };
  return { from: q } as never;
}

describe("form-guard", () => {
  it("пуска само нашия произход", () => {
    expect(isOwnOrigin(req({ origin: "https://promarketing.pw" }))).toBe(true);
    expect(isOwnOrigin(req({ referer: "https://www.promarketing.pw/ai-reshenia" }))).toBe(true);
    expect(isOwnOrigin(req({ origin: "https://evil.example" }))).toBe(false);
    expect(isOwnOrigin(req({}))).toBe(false);
  });
  it("реже връзките от текста към непознат адрес", () => {
    expect(hasLink("Иван Петров")).toBe(false);
    expect(hasLink("Win $$$ http://spam.xyz")).toBe(true);
    expect(safeForMail("visit www.x.ru now", 60, "приятелю")).toBe("приятелю");
    expect(safeForMail("  Мария   Иванова ", 60, "x")).toBe("Мария Иванова");
  });
  it("едно писмо на адрес на денонощие и таван на час", async () => {
    expect(await confirmationAllowed(fakeSupabase(1, 3), "store_order", "a@b.bg")).toBe(true);
    expect(await confirmationAllowed(fakeSupabase(2, 3), "store_order", "a@b.bg")).toBe(false);
    expect(await confirmationAllowed(fakeSupabase(1, 21), "store_order", "a@b.bg")).toBe(false);
  });
});
