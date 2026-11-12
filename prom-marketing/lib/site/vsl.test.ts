import { describe, expect, it } from "vitest";
import { VSL, answersText, cleanName, isVslSlug } from "./vsl";

describe("vsl", () => {
  it("answersText: само попълнените, в реда на въпросите", () => {
    const t = answersText(VSL.biznes, { name: "Иван", phone: "0888123456" }, {
      vaprosi: "Колко време отнема?",
      firma: "Ремонти, 6 души",
      chuzhd: "игнорира се",
      klient: "   ",
    });
    expect(t).toContain("видео „AI във фирмата ти“");
    expect(t).toContain("Иван · 0888123456");
    expect(t.indexOf("Ремонти")).toBeLessThan(t.indexOf("Колко време"));
    expect(t).not.toContain("игнорира");
    expect(t).not.toContain("Колко ти носи");
  });

  it("answersText: без отговори", () => {
    expect(answersText(VSL["pari-s-ai"], { name: "А", phone: "1" }, {})).toContain("без отговори");
  });

  it("cleanName пази от боклук", () => {
    expect(cleanName("Иван")).toBe("Иван");
    expect(cleanName(["Ани Петрова"])).toBe("Ани Петрова");
    expect(cleanName("<script>")).toBeNull();
    expect(cleanName("x".repeat(40))).toBeNull();
    expect(cleanName(undefined)).toBeNull();
  });

  it("всеки VSL има уникални ключове на въпросите и голямо поле за разказ", () => {
    for (const c of Object.values(VSL)) {
      const keys = c.questions.map((q) => q.key);
      expect(new Set(keys).size).toBe(keys.length);
      expect(c.questions[0].long).toBe(true);
    }
    expect(isVslSlug("biznes")).toBe(true);
    expect(isVslSlug("x")).toBe(false);
  });
});
