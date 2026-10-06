import { describe, it, expect } from "vitest";
import { pickVariant } from "./video";
import { blobVideo, KINO } from "./config";

const V = [
  { src: "https://x/film-1080.mp4", height: 1080 },
  { src: "https://x/film-720.mp4", height: 720 },
];

describe("pickVariant", () => {
  it("телефон (390 px × 3) → 720p", () => {
    expect(pickVariant(V, { devicePx: 1170 })?.height).toBe(720);
  });

  it("широк екран (1440 px × 2) → 1080p", () => {
    expect(pickVariant(V, { devicePx: 2880 })?.height).toBe(1080);
  });

  it("„пести данни“ или бавна мрежа → най-лекият, и на голям екран", () => {
    expect(pickVariant(V, { devicePx: 2880, saveData: true })?.height).toBe(720);
    expect(pickVariant(V, { devicePx: 2880, slow: true })?.height).toBe(720);
  });

  it("само един вариант — него; без варианти — null", () => {
    expect(pickVariant([V[0]], { devicePx: 800 })?.height).toBe(1080);
    expect(pickVariant([], { devicePx: 800 })).toBeNull();
    expect(pickVariant(undefined, { devicePx: 800 })).toBeNull();
  });
});

describe("blobVideo", () => {
  it("без адреси — няма видео (залата върви „на сухо“)", () => {
    expect(blobVideo({ v1080: null, v720: null, poster: null })).toBeNull();
  });

  it("с адресите — MP4 с двата варианта и постера; основният е 720p", () => {
    const v = blobVideo({ v1080: "https://b/1080.mp4", v720: "https://b/720.mp4", poster: "https://b/p.jpg" });
    expect(v).toEqual({
      kind: "mp4",
      src: "https://b/720.mp4",
      variants: [
        { src: "https://b/1080.mp4", height: 1080 },
        { src: "https://b/720.mp4", height: 720 },
      ],
      poster: "https://b/p.jpg",
    });
  });
});

describe("подаръкът и формулата", () => {
  it("формулата е публичен PDF във Vercel Blob", () => {
    expect(KINO.formula.url).toMatch(/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/kino\/podaraci\/formulata\.pdf$/);
    expect(KINO.formula.fromSec).toBe(KINO.film.chapters.find((c) => c.n === 9)!.startSec);
  });

  it("адресът на подаръка НЕ е в конфигурацията (репото е публично) — само пътят в Blob", () => {
    expect("url" in KINO.bonus).toBe(false);
    expect(JSON.stringify(KINO)).not.toMatch(/30-poruchki-za-ai-[A-Za-z0-9]+\.pdf/);
    expect(KINO.bonus.blobPrefix).toBe("kino/podaraci/30-poruchki-za-ai");
  });
});
