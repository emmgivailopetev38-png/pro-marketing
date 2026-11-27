/**
 * Линковете на уебинара (25.11.2026):
 *   ivailopetev.com/viber → Viber каналът „Ивайло Петев · Допълнителен доход с AI“ (до 25.11 „AI България ·
 *     Пари с AI“; правилото
 *     „Viber каналът навсякъде“; там отиват и постовете за уебинара);
 *   ivailopetev.com/vlez  → страницата за влизане на Notifier за срещата в Zoom
 *     (неделя, 29.11, 19:00; ID 824 5666 3063): човекът пише имейла си и влиза,
 *     а Notifier вижда кой е влязъл и докога е стоял.
 * Докато е null, адресът води към лендинга. Сменят се тук, с PR.
 */
import { VIBER_KANAL } from "@/lib/seo/site";

export const UEBINAR_LINKOVE = {
  viberKanal: VIBER_KANAL as string | null,
  zoom: "https://notifierbg.com/bg/join/xzwxpbyr" as string | null,
  /**
   * ivailopetev.com/razgovor — „Запишете си разговор“ от презентацията на уебинара (лентата на
   * ~25 слайда и последният слайд). Ивайло, 27.11.2026: към календара на основния сайт.
   */
  razgovor: "https://promarketing.pw/booking" as string | null,
  /**
   * Уебинарът в Notifier (notifierbg.com) — SMS-ите и кой е влязъл в Zoom.
   * Записаните се пращат с POST /api/v1/webinars/<id>/registrants (ключът е
   * NOTIFIER_API_KEY във Vercel). null = още не е създаден.
   */
  notifierWebinar: "jsqnoesq8eqkq5e0yi08ylt2" as string | null,
};
