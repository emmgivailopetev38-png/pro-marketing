import "server-only";
import { list } from "@vercel/blob";
import { KINO, KINO_BLOB_PREFIX, KINO_TEST_VIDEO, blobVideo, type KinoVideoSource } from "./config";
import type { KinoPhase } from "./time";
import { isKinoDemoEnv } from "./token";

/**
 * Откъде залата взима филма. Адресите НЕ са в кода (репото е публично):
 * сървърът ги намира във Vercel Blob по префикса с BLOB_READ_WRITE_TOKEN.
 * Файловете се качват със scripts/kino-video.sh със случаен суфикс:
 *   kino/film/valnata-film-1080-<…>.mp4 · …-720-<…>.mp4 · …-poster-<…>.jpg
 * При няколко версии печели най-новата.
 *
 * И още: филмът стига до браузъра чак когато вратите отворят (19:25) —
 * страницата във фоайето не носи адреса му. Залата се опреснява сама точно
 * тогава (components/kino/Hall.tsx).
 */

const cache = new Map<string, { at: number; video: KinoVideoSource | null }>();
const CACHE_MS = 5 * 60_000;

/** Намира 1080p / 720p / постера по префикс (най-новите). Без вариант → null. */
export async function blobVideoByPrefix(prefix: string): Promise<KinoVideoSource | null> {
  const hit = cache.get(prefix);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.video;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix, limit: 100 });
    const newest = (re: RegExp) =>
      blobs
        .filter((b) => re.test(b.pathname.slice(prefix.length)))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]?.url ?? null;
    const video = blobVideo({
      v1080: newest(/^1080\b.*\.mp4$/i),
      v720: newest(/^720\b.*\.mp4$/i),
      poster: newest(/^poster\b.*\.(jpe?g|png|webp)$/i),
    });
    cache.set(prefix, { at: Date.now(), video });
    return video;
  } catch (e) {
    console.error("[kino/film] blob list", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Филмът за продукцията: от Blob, иначе NEXT_PUBLIC_KINO_FILM, иначе „на сухо“. */
export async function productionFilm(): Promise<KinoVideoSource> {
  return (await blobVideoByPrefix(KINO_BLOB_PREFIX.film)) ?? KINO.video;
}

/**
 * Видеото за залата в този момент. В продукцията — само от вратите до края
 * на филма. В прегледа (Vercel preview / локално), ако истинският филм още го
 * няма — черновата от Blob, иначе тийзърът.
 */
export async function hallVideo(opts: { phase: KinoPhase; preview: boolean }): Promise<KinoVideoSource> {
  const onScreen = opts.phase === "doors" || opts.phase === "film";
  if (!onScreen && !opts.preview) return { kind: "none" };
  const film = await productionFilm();
  if (film.kind !== "none" || !isKinoDemoEnv()) return film;
  return (await blobVideoByPrefix(KINO_BLOB_PREFIX.draft)) ?? KINO_TEST_VIDEO ?? film;
}
