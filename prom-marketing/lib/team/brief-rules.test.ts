import { describe, expect, it } from "vitest";
import { briefLines, formatBriefLine, isBriefTitle, pickBriefs } from "./brief-rules";

describe("isBriefTitle — бележката „🎯 Бриф…“ е брифът на картата", () => {
  it("разпознава заглавието с префикса", () => {
    expect(isBriefTitle("🎯 Бриф за Георги · топлина 7/10 · звъни Георги (пт 06.11, 12:00–14:00)")).toBe(true);
  });
  it("другите бележки не са бриф", () => {
    expect(isBriefTitle("📅 В календара на Георги · вт 03.11")).toBe(false);
    expect(isBriefTitle(null)).toBe(false);
  });
});

describe("pickBriefs — последният бриф на картон", () => {
  it("взима най-новия по occurred_at и пропуска празните тела", () => {
    const m = pickBriefs([
      { contact_id: "a", title: "🎯 Бриф за Георги · стар", body: "стар текст", occurred_at: "2026-11-01T10:00:00Z" },
      { contact_id: "a", title: "🎯 Бриф за Георги · нов", body: "нов текст", occurred_at: "2026-11-05T10:00:00Z" },
      { contact_id: "a", title: "🎯 Бриф за Георги · празен", body: "   ", occurred_at: "2026-11-06T10:00:00Z" },
      { contact_id: "b", title: "📞 Не вдигна", body: "…", occurred_at: "2026-11-05T10:00:00Z" },
    ]);
    expect(m.get("a")?.body).toBe("нов текст");
    expect(m.has("b")).toBe(false);
  });
});

describe("formatBriefLine — линкове и удебелено", () => {
  it("markdown линк → link с етикет", () => {
    expect(formatBriefLine("вж. [57:33](https://fathom.video/calls/816031048?timestamp=3453) там")).toEqual([
      { kind: "text", text: "вж. " },
      { kind: "link", href: "https://fathom.video/calls/816031048?timestamp=3453", label: "57:33" },
      { kind: "text", text: " там" },
    ]);
  });
  it("гол URL → link, точката накрая остава текст", () => {
    expect(formatBriefLine("🗂 https://promarketing.pw/ekip?q=895650161.")).toEqual([
      { kind: "text", text: "🗂 " },
      { kind: "link", href: "https://promarketing.pw/ekip?q=895650161", label: "https://promarketing.pw/ekip?q=895650161" },
      { kind: "text", text: "." },
    ]);
  });
  it("**удебелено** → bold", () => {
    expect(formatBriefLine("**Кой е:** собственик")).toEqual([
      { kind: "bold", text: "Кой е:" },
      { kind: "text", text: " собственик" },
    ]);
  });
});

describe("briefLines — заглавия, абзаци, празни редове", () => {
  it("### е заглавие от ниво 3, празният ред е blank", () => {
    const l = briefLines("### Албърт · 7/10\n\n- първа точка");
    expect(l[0]).toMatchObject({ kind: "h", level: 3 });
    expect(l[1].kind).toBe("blank");
    expect(l[2]).toMatchObject({ kind: "p", segments: [{ kind: "text", text: "• първа точка" }] });
  });
});
