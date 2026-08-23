import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkCaller, callerFromRequest, normalizeNumber } from "./caller";

describe("normalizeNumber", () => {
  it("свежда всички изписвания до едни и същи цифри", () => {
    expect(normalizeNumber("+359 87 644 7159")).toBe("359876447159");
    expect(normalizeNumber("00359876447159")).toBe("359876447159");
    expect(normalizeNumber("(0876) 447-159")).toBe("0876447159");
  });
});

describe("checkCaller", () => {
  const prev = { ...process.env };
  beforeEach(() => {
    delete process.env.VOICE_ALLOWED_CALLERS;
    delete process.env.VOICE_PIN;
  });
  afterEach(() => {
    process.env.VOICE_ALLOWED_CALLERS = prev.VOICE_ALLOWED_CALLERS;
    process.env.VOICE_PIN = prev.VOICE_PIN;
  });

  it("уеб разговорът минава — там пази админ бисквитката", () => {
    expect(checkCaller(null)).toMatchObject({ ok: true, via: "web" });
    expect(checkCaller("")).toMatchObject({ ok: true, via: "web" });
  });

  it("познат номер минава, дори записан в друг формат", () => {
    process.env.VOICE_ALLOWED_CALLERS = "0876447159";
    expect(checkCaller("+359876447159")).toMatchObject({ ok: true, via: "allowlist" });
  });

  it("непознат номер НЕ минава", () => {
    process.env.VOICE_ALLOWED_CALLERS = "+359876447159";
    const r = checkCaller("+359888123456");
    expect(r.ok).toBe(false);
  });

  it("непознат номер минава с верен код", () => {
    process.env.VOICE_ALLOWED_CALLERS = "+359876447159";
    process.env.VOICE_PIN = "4271";
    expect(checkCaller("+359888123456", "4271")).toMatchObject({ ok: true, via: "pin" });
    expect(checkCaller("+359888123456", "4 2 7 1")).toMatchObject({ ok: true, via: "pin" });
  });

  it("грешен код не минава", () => {
    process.env.VOICE_PIN = "4271";
    expect(checkCaller("+359888123456", "1234").ok).toBe(false);
  });

  it("къс код се брои за никакъв код — иначе PIN „12“ би отворил CRM-а", () => {
    process.env.VOICE_PIN = "12";
    expect(checkCaller("+359888123456", "12").ok).toBe(false);
  });

  it("без настройка телефонът е ЗАТВОРЕН, не отворен", () => {
    const r = checkCaller("+359888123456");
    expect(r).toMatchObject({ ok: false, reason: "not_configured" });
  });

  it("иска код, когато има настроен такъв", () => {
    process.env.VOICE_PIN = "4271";
    expect(checkCaller("+359888123456")).toMatchObject({ ok: false, reason: "pin_required" });
  });
});

describe("callerFromRequest", () => {
  it("чете от адреса при GET", () => {
    process.env.VOICE_ALLOWED_CALLERS = "+359876447159";
    const r = callerFromRequest(
      new Request("https://x.dev/api/voice/tools/contact?q=иван&caller_id=%2B359876447159")
    );
    expect(r).toMatchObject({ ok: true, via: "allowlist" });
  });

  it("чете от тялото при POST", () => {
    process.env.VOICE_ALLOWED_CALLERS = "+359876447159";
    const r = callerFromRequest(new Request("https://x.dev/api/voice/tools/note", { method: "POST" }), {
      caller_id: "+359876447159",
      note: "нещо",
    });
    expect(r).toMatchObject({ ok: true, via: "allowlist" });
  });
});

describe("checkCaller · каналът, не само номерът", () => {
  const prev = { ...process.env };
  beforeEach(() => {
    delete process.env.VOICE_ALLOWED_CALLERS;
    delete process.env.VOICE_PIN;
  });
  afterEach(() => {
    process.env.VOICE_ALLOWED_CALLERS = prev.VOICE_ALLOWED_CALLERS;
    process.env.VOICE_PIN = prev.VOICE_PIN;
  });

  it("СКРИТ номер по телефона НЕ минава за уеб сесия", () => {
    // Дупката, която само caller_id не хваща: обаждане без номер изглеждаше
    // като натиснат бутон в браузъра и минаваше.
    process.env.VOICE_ALLOWED_CALLERS = "+359877399963";
    process.env.VOICE_PIN = "4271";
    const r = checkCaller("", null, "twilio");
    expect(r).toMatchObject({ ok: false, reason: "hidden_number" });
  });

  it("скрит номер с верен код минава", () => {
    process.env.VOICE_PIN = "4271";
    expect(checkCaller("", "4271", "twilio")).toMatchObject({ ok: true, via: "pin" });
  });

  it("познат номер минава и когато каналът е телефонен", () => {
    process.env.VOICE_ALLOWED_CALLERS = "+359877399963";
    expect(checkCaller("+359877399963", null, "twilio")).toMatchObject({ ok: true, via: "allowlist" });
  });

  it("уеб бутонът остава свободен — няма нито канал, нито номер", () => {
    expect(checkCaller(null, null, null)).toMatchObject({ ok: true, via: "web" });
  });
});
