/**
 * Безплатният филм-уебинар „ВЪЛНАТА“ — версията без офертата (32 мин), същата,
 * която отива в YouTube. Пуска се по имейл като подарък: първото писмо на всеки
 * нов лийд и едно писмо в топлия кръг (`lib/email/lead-steps.ts`, `warm-steps.ts`).
 *
 * Видеото е във Vercel Blob (store „kino-video“, папка `uebinar/`). Адресите НЕ
 * са в кода (репото е публично) — идват от средата и стигат до браузъра едва
 * когато човекът е минал през формата или е дошъл с личния си линк.
 */

export const UEBINAR = {
  title: "ВЪЛНАТА",
  tagline: "Изпуснахме компютрите. Сега изпускаме AI.",
  minutes: 32,
  /** Четвъртините, които влизат в картона: 0 = пусна филма, 100 = стигна края. */
  milestones: [0, 25, 50, 75, 100] as const,
} as const;

export type UebinarMilestone = (typeof UEBINAR.milestones)[number];

export interface UebinarVideo {
  v720: string;
  v1080: string | null;
  poster: string | null;
}

/** Видеото от средата — null, ако още не е качено (страницата казва „скоро“). */
export function uebinarVideo(): UebinarVideo | null {
  const v720 = process.env.UEBINAR_VIDEO_720?.trim();
  if (!v720) return null;
  return {
    v720,
    v1080: process.env.UEBINAR_VIDEO_1080?.trim() || null,
    poster: process.env.UEBINAR_POSTER?.trim() || null,
  };
}
