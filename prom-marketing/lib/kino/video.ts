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
