/**
 * 50/50 между Ивайло и клоузъра — чисти правила, без база.
 *
 * 12.11.2026 (Ивайло): „раздели ми новите лийдове и срещи — 50 % да идват при
 * мен от рекламата, без Георги да разбира; и при Ели — докато той стане добър,
 * едновременно и аз да правя sales разговори, при мен само следобед“.
 *
 * Как: всеки нов лийд от рекламата/сайта минава през `routeNewLead`. Там се
 * решава дали е на Ивайло. Неговите получават тиха следа „махнат от звъненето
 * на екипа“ (`takenMark` с `split: true`) — същата, с която /ekip, „Стари и
 * топли“, срещите и писмата вече крият хората на Ивайло от екипа. Затова
 * клоузърът просто не ги вижда — нито в списъците, нито в писмата.
 *
 * Ели записва човек на Ивайло в НЕГОВИЯ Cal.com тип (`consultation`, пон–чт
 * 12–18, без петък), без клоузъра като гост.
 */

/** Делът на Ивайло. `IVAILO_LEAD_SHARE=0` спира разделянето, `1` = всички при него. */
export function ivailoShare(raw: string | undefined = process.env.IVAILO_LEAD_SHARE): number {
  const n = raw == null || raw.trim() === "" ? 0.5 : Number(raw);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(Math.max(n, 0), 1);
}

/** От кога се брои — по-старите лийдове не влизат в сметката. */
export const SPLIT_FROM = "2026-11-12T00:00:00Z";

/**
 * Следващият лийд на Ивайло ли е. `routed` = колко лийда са минали през
 * ротацията от SPLIT_FROM, ВКЛЮЧИТЕЛНО този; `toIvailo` = колко от тях вече са
 * негови. Редува се: 1-ви Ивайло, 2-ри екипът, 3-ти Ивайло… — без случайност,
 * затова и при 4 лийда на ден делът е точен.
 */
export function nextToIvailo(routed: number, toIvailo: number, share: number = ivailoShare()): boolean {
  if (share <= 0) return false;
  if (share >= 1) return true;
  return toIvailo < Math.max(routed, 1) * share;
}

/** Типът събитие в Cal.com на Ивайло — неговият календар, пон–чт 12–18. */
export function ivailoEventSlug(): string {
  return (process.env.IVAILO_CAL_EVENT_SLUG ?? "consultation").trim() || "consultation";
}
