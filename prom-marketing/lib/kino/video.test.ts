import { describe, it, expect } from "vitest";
import { pickVariant, pickVideoSet, parseVideoBlobName } from "./video";
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

describe("коя версия на филма от Blob", () => {
  const B = "https://x.public.blob.vercel-storage.com/";
  const f = (pathname: string, at: string) => ({ pathname, url: B + pathname, uploadedAt: at });
  const files = [
    f("kino/film/chernova-v1-1080-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4", "2026-10-06T09:14:00Z"),
    f("kino/film/chernova-v1-720-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.mp4", "2026-10-06T09:15:00Z"),
    f("kino/film/chernova-v1-poster-cccccccccccccccccccccccccccccc.jpg", "2026-10-06T09:16:00Z"),
    f("kino/film/chernova-v2-1080-dddddddddddddddddddddddddddddd.mp4", "2026-10-06T12:20:00Z"),
    f("kino/film/chernova-v2-720-eeeeeeeeeeeeeeeeeeeeeeeeeeeeee.mp4", "2026-10-06T12:21:00Z"),
    f("kino/film/chernova-v2-poster-ffffffffffffffffffffffffffffff.jpg", "2026-10-06T12:22:00Z"),
  ];

  it("разчита името: версия, вид, разширение", () => {
    expect(parseVideoBlobName("v2-1080-dddd.mp4")).toEqual({ ver: "v2", kind: "1080" });
    expect(parseVideoBlobName("1080-dddd.mp4")).toEqual({ ver: "", kind: "1080" });
    expect(parseVideoBlobName("v3-poster-x.jpg")).toEqual({ ver: "v3", kind: "poster" });
    expect(parseVideoBlobName("v3-poster-x.mp4")).toBeNull();
    expect(parseVideoBlobName("v3-1080-x.jpg")).toBeNull();
    expect(parseVideoBlobName("v3-480-x.mp4")).toBeNull();
  });

  it("най-новата качена версия печели — целият ѝ комплект", () => {
    const s = pickVideoSet(files, "kino/film/chernova-")!;
    expect(s.version).toBe("v2");
    expect(s.v1080).toContain("chernova-v2-1080-");
    expect(s.v720).toContain("chernova-v2-720-");
    expect(s.poster).toContain("chernova-v2-poster-");
  });

  it("v3 влиза само с качването; нов постер на стара версия не мести избора", () => {
    const more = [
      ...files,
      f("kino/film/chernova-v1-poster-gggggggggggggggggggggggggggggg.jpg", "2026-10-07T08:00:00Z"),
      f("kino/film/chernova-v3-1080-hhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.mp4", "2026-10-09T10:00:00Z"),
    ];
    const s = pickVideoSet(more, "kino/film/chernova-")!;
    expect(s.version).toBe("v3");
    expect(s.v720).toBeNull();
    expect(pickVideoSet(more.slice(0, 7), "kino/film/chernova-")!.version).toBe("v2");
  });

  it("закована версия (draftPin) и истинският филм без версия", () => {
    expect(pickVideoSet(files, "kino/film/chernova-", "v1")!.v1080).toContain("chernova-v1-1080-");
    expect(pickVideoSet(files, "kino/film/chernova-", "v9")).toBeNull();
    const film = [f("kino/film/valnata-film-1080-zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz.mp4", "2026-10-14T10:00:00Z")];
    expect(pickVideoSet(film, "kino/film/valnata-film-")).toMatchObject({ version: "", v1080: B + film[0].pathname, v720: null });
    expect(pickVideoSet(files, "kino/film/valnata-film-")).toBeNull();
  });
});
