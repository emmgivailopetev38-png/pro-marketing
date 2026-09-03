import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkVoiceAuth } from "./auth";

function req(authHeader?: string) {
  const headers = new Headers();
  if (authHeader !== undefined) headers.set("authorization", authHeader);
  return new Request("https://example.com/api/voice/tools/brief", { headers });
}

describe("checkVoiceAuth", () => {
  const prevVoice = process.env.VOICE_AGENT_TOKEN;
  const prevHermes = process.env.HERMES_API_TOKEN;
  const prevEnabled = process.env.VOICE_AGENT_ENABLED;

  beforeEach(() => {
    delete process.env.VOICE_AGENT_TOKEN;
    delete process.env.HERMES_API_TOKEN;
    delete process.env.VOICE_AGENT_ENABLED;
  });
  afterEach(() => {
    process.env.VOICE_AGENT_TOKEN = prevVoice;
    process.env.HERMES_API_TOKEN = prevHermes;
    process.env.VOICE_AGENT_ENABLED = prevEnabled;
  });

  it("пуска правилния гласов токен", () => {
    process.env.VOICE_AGENT_TOKEN = "glas-taen-klyuch";
    expect(checkVoiceAuth(req("Bearer glas-taen-klyuch")).ok).toBe(true);
  });

  it("пада обратно към HERMES_API_TOKEN, докато гласовият още не е сложен", () => {
    process.env.HERMES_API_TOKEN = "hermes-klyuch";
    expect(checkVoiceAuth(req("Bearer hermes-klyuch")).ok).toBe(true);
  });

  it("отказва грешен токен", () => {
    process.env.VOICE_AGENT_TOKEN = "pravilen";
    const r = checkVoiceAuth(req("Bearer greshen"));
    expect(r.ok).toBe(false);
  });

  it("отказва, когато няма никакъв конфигуриран токен", () => {
    // Иначе празна променлива в средата би отворила рутовете за всички.
    const r = checkVoiceAuth(req("Bearer kakvoto-i-da-e"));
    expect(r).toEqual({ ok: false, reason: "no_token_configured" });
  });

  /**
   * Очакването е ОБЪРНАТО на 03.09.2026, и то нарочно.
   *
   * ElevenLabs пълни заглавката по два взаимно изключващи се начина: тип
   * „Environment Variable" подава САМО стойността на променливата, а тип
   * „Value" позволява префикс, но не замества `{{system__env_...}}` и го
   * праща буквално. Тестът пазеше отказа на първия вариант — тоест пазеше
   * счупеното: гласовите инструменти връщаха 403 при иначе верен токен.
   */
  it("приема и гол токен — така го подава ElevenLabs от environment variable", () => {
    process.env.VOICE_AGENT_TOKEN = "pravilen";
    expect(checkVoiceAuth(req("pravilen")).ok).toBe(true);
  });

  it("голият токен пак трябва да е верният", () => {
    process.env.VOICE_AGENT_TOKEN = "pravilen";
    expect(checkVoiceAuth(req("gresen")).ok).toBe(false);
  });

  it("отказва без заглавка изобщо", () => {
    process.env.VOICE_AGENT_TOKEN = "pravilen";
    expect(checkVoiceAuth(req()).ok).toBe(false);
  });

  it("шалтерът VOICE_AGENT_ENABLED=false спира дори верен токен", () => {
    process.env.VOICE_AGENT_TOKEN = "pravilen";
    process.env.VOICE_AGENT_ENABLED = "false";
    expect(checkVoiceAuth(req("Bearer pravilen"))).toEqual({ ok: false, reason: "disabled" });
  });

  it("по подразбиране е включен, когато променливата липсва", () => {
    process.env.VOICE_AGENT_TOKEN = "pravilen";
    expect(checkVoiceAuth(req("Bearer pravilen")).ok).toBe(true);
  });
});
