import type { KinoVideoVariant } from "./config";

/**
 * Кой вариант на филма да тегли браузърът (прогресивно MP4 от Vercel Blob).
 *
 * 1080p — само ако екранът реално го показва (ширината на прозореца в пиксели
 * на устройството е ≥ 1600) и мрежата не е бавна / в режим „пести данни“.
 * Иначе 720p: на телефона е неразличимо, а е около 2–3 пъти по-леко — по-малко
 * буфериране за зрителя и по-малко трафик за нас.
 */
export function pickVariant(
  variants: readonly KinoVideoVariant[] | undefined,
  env: { devicePx: number; saveData?: boolean; slow?: boolean },
): KinoVideoVariant | null {
  if (!variants?.length) return null;
  const sorted = [...variants].sort((a, b) => a.height - b.height);
  const lightest = sorted[0];
  if (env.saveData || env.slow) return lightest;
  const want = env.devicePx >= 1600 ? 1080 : 720;
  const fit = sorted.filter((v) => v.height <= want);
  return fit.length ? fit[fit.length - 1] : lightest;
}

/** Мрежата и екранът на браузъра — за pickVariant. */
export function browserVideoEnv(): { devicePx: number; saveData: boolean; slow: boolean } {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return {
    devicePx: Math.round(window.innerWidth * (window.devicePixelRatio || 1)),
    saveData: !!conn?.saveData,
    slow: /2g|3g/.test(conn?.effectiveType ?? ""),
  };
}

// ── филмът във Vercel Blob: кой файл е „най-новият комплект“ ─────────────────

export interface BlobFile {
  pathname: string;
  url: string;
  uploadedAt: Date | string;
}

/**
 * „v2-1080-<случаен>.mp4“ → { ver: "v2", kind: "1080" }; „1080-<…>.mp4“ →
 * { ver: "", kind: "1080" }. Постерът е JPEG/PNG/WebP, видеото — MP4.
 */
export function parseVideoBlobName(rest: string): { ver: string; kind: "1080" | "720" | "poster" } | null {
  const m = rest.match(/^(?:(v[\w.]+)-)?(1080|720|poster)(?=[-.])/i);
  if (!m) return null;
  const kind = m[2].toLowerCase() as "1080" | "720" | "poster";
  const okExt = kind === "poster" ? /\.(jpe?g|png|webp)$/i.test(rest) : /\.mp4$/i.test(rest);
  return okExt ? { ver: (m[1] ?? "").toLowerCase(), kind } : null;
}

/**
 * От файловете под префикса избира комплекта (1080p + 720p + постер) на
 * НАЙ-НОВАТА версия — по времето на качване на видеото ѝ (постерът не мести
 * избора). Така „chernova-v3-…“ сменя „v2“ само с качването, без код.
 * `pin` („v2“) заковава версия. Без видео → null.
 */
export function pickVideoSet(
  files: readonly BlobFile[],
  prefix: string,
  pin: string | null = null,
): { version: string; v1080: string | null; v720: string | null; poster: string | null } | null {
  type Slot = { url: string; t: number };
  const groups = new Map<string, { videoAt: number; v1080?: Slot; v720?: Slot; poster?: Slot }>();
  for (const f of files) {
    if (!f.pathname.startsWith(prefix)) continue;
    const p = parseVideoBlobName(f.pathname.slice(prefix.length));
    if (!p) continue;
    const t = new Date(f.uploadedAt).getTime() || 0;
    const g = groups.get(p.ver) ?? { videoAt: 0 };
    const key = p.kind === "1080" ? "v1080" : p.kind === "720" ? "v720" : "poster";
    if (!g[key] || t > g[key]!.t) g[key] = { url: f.url, t };
    if (p.kind !== "poster") g.videoAt = Math.max(g.videoAt, t);
    groups.set(p.ver, g);
  }
  const want = pin ? pin.toLowerCase() : null;
  let best: [string, { videoAt: number; v1080?: Slot; v720?: Slot; poster?: Slot }] | null = null;
  for (const entry of groups) {
    const [ver, g] = entry;
    if (!g.v1080 && !g.v720) continue;
    if (want !== null && ver !== want) continue;
    if (!best || g.videoAt > best[1].videoAt) best = entry;
  }
  if (!best) return null;
  const [version, g] = best;
  return { version, v1080: g.v1080?.url ?? null, v720: g.v720?.url ?? null, poster: g.poster?.url ?? null };
}
