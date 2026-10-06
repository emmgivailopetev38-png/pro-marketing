/**
 * Събитието за календара — едно и също за .ics файла и за Google линка.
 * Чисто (без сървър), за да се ползва и от страниците, и от маршрута.
 */
import { KINO } from "./config";
import { kinoTimeline } from "./time";
import { googleCalendarUrl, type KinoCalendarEvent } from "./ics";

export function premiereEvent(hallUrl: string | null): KinoCalendarEvent {
  const tl = kinoTimeline();
  const link = hallUrl ?? `${KINO.site}/kino`;
  return {
    uid: `${KINO.screening.id}@promarketing.pw`,
    startMs: tl.premiereMs,
    endMs: tl.filmEndMs,
    title: `${KINO.title} · онлайн прожекция`,
    description: `${KINO.subtitle}. Около 50 минути, с въпросите накрая. Само веднъж — без запис.\n\nТвоята зала: ${link}\nВлез 5 минути по-рано и пусни звука. 🍿`,
    url: link,
    location: link,
    alarmsMinutes: [60, 10],
  };
}

export function premiereGoogleUrl(hallUrl: string | null): string {
  return googleCalendarUrl(premiereEvent(hallUrl));
}
