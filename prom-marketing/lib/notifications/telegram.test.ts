import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildTelegramPayload, sendTelegram, isTelegramConfigured } from "./telegram";

const ENV_KEYS = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
});

describe("telegram мост", () => {
  it("е безшумен no-op без конфигурация (нищо не чупи)", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(isTelegramConfigured()).toBe(false);
    expect(await sendTelegram("здрасти")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("строи payload с HTML режим и url бутони на един ред", () => {
    process.env.TELEGRAM_CHAT_ID = "123";
    const p = buildTelegramPayload("текст", {
      buttons: [
        { text: "Профил", url: "https://x/admin/clients/1" },
        { text: "Фактури", url: "https://x/admin/invoices" },
      ],
    });
    expect(p.chat_id).toBe("123");
    expect(p.parse_mode).toBe("HTML");
    const kb = (p.reply_markup as { inline_keyboard: Array<Array<{ text: string; url: string }>> }).inline_keyboard;
    expect(kb).toHaveLength(1);
    expect(kb[0].map((b) => b.text)).toEqual(["Профил", "Фактури"]);
  });

  it("праща и докладва успех при конфигуриран бот", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "t0k";
    process.env.TELEGRAM_CHAT_ID = "123";
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);
    expect(await sendTelegram("тест")).toBe(true);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(String(fetchSpy.mock.calls[0][0])).toContain("api.telegram.org/bott0k/sendMessage");
  });

  it("никога не хвърля при мрежова грешка", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "t0k";
    process.env.TELEGRAM_CHAT_ID = "123";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await sendTelegram("тест")).toBe(false);
  });
});
