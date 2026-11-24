import { describe, expect, it } from "vitest";
import { NA_ZHIVO } from "./na-zhivo";
import { DEMO, PODARACI, sledvasht, vgradi } from "./podaraci";

describe("подаръците за останалите до края", () => {
  it("са номерирани подред и са колкото обещава лендингът", () => {
    PODARACI.forEach((p, i) => expect(p.n).toBe(i + 1));
    expect(PODARACI.length).toBe(NA_ZHIVO.bonusi.items.length);
  });

  it("редът е този на Стефчо: тест → видео демонстрация → томбола → ръководствата", () => {
    expect(PODARACI.map((p) => p.id).slice(0, 3)).toEqual(["test", "demo", "tombola"]);
    // Същият ред е и на лендинга.
    expect(NA_ZHIVO.bonusi.items[0].kind).toContain("Тест");
    expect(NA_ZHIVO.bonusi.items[1].kind).toContain("Видео демонстрация");
    expect(NA_ZHIVO.bonusi.items[2].kind).toContain("Томбола");
  });

  it("само томболата няма страница; „следващ подарък“ я прескача", () => {
    expect(PODARACI.filter((p) => !p.href).map((p) => p.id)).toEqual(["tombola"]);
    expect(sledvasht("test")?.id).toBe("demo");
    expect(sledvasht("demo")?.id).toBe("ceni");
    expect(sledvasht("danaci")).toBeNull();
  });

  it("никой подарък не дава безплатен достъп до платеното и не обещава суми", () => {
    const all = JSON.stringify(PODARACI).toLowerCase();
    for (const ne of ["академия", "petevai", "гарантира", "пасивен доход"]) expect(all.includes(ne)).toBe(false);
    // Сума в името на видеото („как изкарах X €“) — само ако е истинска; дотогава няма.
    expect(PODARACI.find((p) => p.id === "demo")?.name).not.toMatch(/€|евро|\d/);
  });
});

describe("видеото (подарък №2)", () => {
  it("празен линк = още не е качено", () => {
    expect(vgradi("")).toBeNull();
    expect(vgradi("   ")).toBeNull();
    expect(DEMO.kogaIdva.length).toBeGreaterThan(20);
  });

  it("YouTube и Loom се вграждат, файлът се пуска направо", () => {
    expect(vgradi("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      vid: "iframe",
      src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
    });
    expect(vgradi("https://youtu.be/dQw4w9WgXcQ")?.src).toContain("/embed/dQw4w9WgXcQ");
    expect(vgradi("https://www.loom.com/share/8e3cd8ab659144daa1d842521833f01b")?.src).toContain(
      "loom.com/embed/8e3cd8ab659144daa1d842521833f01b",
    );
    expect(vgradi("/videos/demo.mp4")).toEqual({ vid: "video", src: "/videos/demo.mp4" });
    expect(vgradi("https://example.com/a/demo.mp4?x=1")?.vid).toBe("video");
  });

  it("непознат или опасен линк не се вгражда", () => {
    expect(vgradi("javascript:alert(1)")).toBeNull();
    expect(vgradi("https://example.com/page")).toBeNull();
    expect(vgradi("http://example.com/demo.mp4")).toBeNull();
  });
});
