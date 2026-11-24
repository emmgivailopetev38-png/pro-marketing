import { describe, expect, it } from "vitest";
import { quickQuestion, wantsNumbers } from "./asistent-rules";

describe("AI асистентът · кога зарежда числата", () => {
  it("въпрос за собствените числа ги иска", () => {
    expect(wantsNumbers("Колко обаждания имам тази седмица?")).toBe(true);
    expect(wantsNumbers("Какви са ми числата за днес")).toBe(true);
    expect(wantsNumbers("Къде съм в класацията?")).toBe(true);
    expect(wantsNumbers("Какъв ми е DQ процентът")).toBe(true);
    expect(wantsNumbers("Как се справям тази седмица?")).toBe(true);
  });

  it("реплика, цена или „как се прави“ не ги иска", () => {
    expect(wantsNumbers("Човекът казва „скъпо е“. Какво да му кажа?")).toBe(false);
    expect(wantsNumbers("Колко е вноската за 24 месеца?")).toBe(false);
    expect(wantsNumbers("Как записвам среща при втория клоузър?")).toBe(false);
  });
});

describe("AI асистентът · кога отговаря бързо", () => {
  it("кратък въпрос = бърз отговор", () => {
    expect(quickQuestion("Човекът казва „трябва да помисля“. Дай ми реплика.")).toBe(true);
    expect(quickQuestion("Колко струва CRM системата?")).toBe(true);
  });

  it("писане на текст или дълъг въпрос = с мислене", () => {
    expect(quickQuestion("Напиши ми съобщение за Viber до човек, който не вдигна два пъти")).toBe(false);
    expect(quickQuestion("Сравни обучението и Done for You за собственик на салон")).toBe(false);
    expect(quickQuestion("а".repeat(200))).toBe(false);
  });
});
