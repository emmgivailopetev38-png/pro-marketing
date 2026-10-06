import "server-only";
import { list } from "@vercel/blob";
import { KINO, KINO_BLOB_PREFIX, KINO_TEST_VIDEO, blobVideo, type KinoVideoSource } from "./config";
import { pickVideoSet } from "./video";
import type { KinoPhase } from "./time";
import { isKinoDemoEnv } from "./token";

/**
 * Откъде залата взима филма. Адресите НЕ са в кода (репото е публично):
 * сървърът ги намира във Vercel Blob по префикса с BLOB_READ_WRITE_TOKEN.
 * Файловете се качват със scripts/kino-video.sh (или от двигателя) със
 * случаен суфикс:
 *   kino/film/valnata-film-1080-<…>.mp4 · …-720-<…>.mp4 · …-poster-<…>.jpg
 *   kino/film/chernova-v2-1080-<…>.mp4 · …  (черновите — с версия)
 * Печели комплектът на най-новата версия (по качването на видеото ѝ) —
 * следващата чернова (v3) влиза в залата само с качването, без код.
 *
 * И още: филмът стига до браузъра чак когато вратите отворят (19:25) —
 * страницата във фоайето не носи адреса му. Залата се опреснява сама точно
 * тогава (components/kino/Hall.tsx).
 */

const cache = new Map<string, { at: number; video: KinoVideoSource | null }>();
const CACHE_MS = 5 * 60_000;

/** Намира 1080p / 720p / постера по префикс (комплектът на най-новата версия). Без видео → null. */
export async function blobVideoByPrefix(prefix: string, pin: string | null = null): Promise<KinoVideoSource | null> {
  const key = `${prefix}|${pin ?? ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.video;
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const files: Array<{ pathname: string; url: string; uploadedAt: Date }> = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, limit: 1000, cursor });
      files.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    const set = pickVideoSet(files, prefix, pin);
    const video = set ? blobVideo(set) : null;
    cache.set(key, { at: Date.now(), video });
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
  return (await blobVideoByPrefix(KINO_BLOB_PREFIX.draft, KINO_BLOB_PREFIX.draftPin)) ?? KINO_TEST_VIDEO ?? film;
}
