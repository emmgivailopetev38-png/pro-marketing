import { describe, expect, it, vi } from "vitest";
import { hedged, quickQuestion, wantsNumbers } from "./asistent-rules";

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

describe("AI асистентът · застраховани опити", () => {
  const opts = { staggerMs: 8_000, budgetMs: 50_000 };
  const later = <T,>(ms: number, value: T) => new Promise<T>((r) => setTimeout(() => r(value), ms));

  it("бърз първи отговор → вторият изобщо не тръгва", async () => {
    vi.useFakeTimers();
    const started: number[] = [];
    const p = hedged(3, (i) => (started.push(i), later(2_000, `модел ${i}`)), opts);
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(p).resolves.toBe("модел 0");
    await vi.advanceTimersByTimeAsync(20_000);
    expect(started).toEqual([0]);
    vi.useRealTimers();
  });

  it("бавен първи → след 8 s тръгва вторият и печели, без първият да се хвърля", async () => {
    vi.useFakeTimers();
    const started: number[] = [];
    const p = hedged(3, (i) => (started.push(i), later(i === 0 ? 40_000 : 3_000, `модел ${i}`)), opts);
    await vi.advanceTimersByTimeAsync(7_999);
    expect(started).toEqual([0]);
    await vi.advanceTimersByTimeAsync(3_001);
    await expect(p).resolves.toBe("модел 1");
    expect(started).toEqual([0, 1]);
    vi.useRealTimers();
  });

  it("първият е почти готов → печели той, макар че вторият вече е тръгнал", async () => {
    vi.useFakeTimers();
    const p = hedged(2, (i) => later(i === 0 ? 9_000 : 30_000, `модел ${i}`), opts);
    await vi.advanceTimersByTimeAsync(9_000);
    await expect(p).resolves.toBe("модел 0");
    vi.useRealTimers();
  });

  it("грешка на първия → следващият тръгва веднага, не след 8 s", async () => {
    vi.useFakeTimers();
    const started: number[] = [];
    const p = hedged(2, (i) => (started.push(i), i === 0 ? Promise.reject(new Error("503")) : later(1_000, "втори")), opts);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(p).resolves.toBe("втори");
    expect(started).toEqual([0, 1]);
    vi.useRealTimers();
  });

  it("всички падат → последната грешка; времето изтича → грешка", async () => {
    await expect(hedged(2, (i) => Promise.reject(new Error(`грешка ${i}`)), opts)).rejects.toThrow("грешка 1");
    vi.useFakeTimers();
    const p = hedged(1, () => new Promise<string>(() => {}), opts);
    const caught = p.catch((e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(50_000);
    await expect(caught).resolves.toContain("изтече");
    vi.useRealTimers();
  });
});
