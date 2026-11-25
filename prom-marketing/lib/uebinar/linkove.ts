/**
 * Линковете на уебинара (25.11.2026):
 *   ivailopetev.com/viber → Viber каналът „AI България · Пари с AI“ (правилото
 *     „Viber каналът навсякъде“; там отиват и постовете за уебинара);
 *   ivailopetev.com/vlez  → срещата в Zoom (неделя, 29.11, 19:00).
 * Докато е null, адресът води към лендинга. Сменят се тук, с PR.
 */
import { VIBER_KANAL } from "@/lib/seo/site";

export const UEBINAR_LINKOVE = {
  viberKanal: VIBER_KANAL as string | null,
  zoom: null as string | null,
  /**
   * Уебинарът в Notifier (notifierbg.com) — SMS-ите и кой е влязъл в Zoom.
   * Записаните се пращат с POST /api/v1/webinars/<id>/registrants (ключът е
   * NOTIFIER_API_KEY във Vercel). null = още не е създаден.
   */
  notifierWebinar: null as string | null,
};
