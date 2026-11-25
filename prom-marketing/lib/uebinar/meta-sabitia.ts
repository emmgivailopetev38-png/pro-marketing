/**
 * Всички събития на пиксела на уебинара (Ивайло, 25.11.2026: „да следи
 * всички данни, за всеки случай“). Всяко събитие тръгва и от браузъра
 * (fbq), и от сървъра (Conversions API) със същия event_id, така че Meta го
 * брои веднъж, а когато браузърът е блокиран (iPhone, блокер), пак стига.
 *
 * CompleteRegistration НЕ е тук — праща го /api/uebinar/register (с имейл,
 * телефон и име). Тук са анонимните действия на страницата.
 */

/** Стандартните събития на Meta (fbq('track', …)). */
export const STANDARTNI = ["PageView", "ViewContent"] as const;

/** Нашите събития (fbq('trackCustom', …)) — за аудитории и анализ. */
export const NASHI = [
  "OtvoriFormata", // натиснат бутон за записване (mesto = кой бутон)
  "Skrol", // стигнал до procent от страницата (25/50/75/90)
  "VremeNaStranicata", // стоял sekundi на страницата (15/60/180)
  "GledaVideo", // пуснал видео отзив (video)
  "KlikViber", // натиснал линка към Viber канала
  "KlikKalendar", // натиснал „Добави в календара“
] as const;

export type SabitieIme = (typeof STANDARTNI)[number] | (typeof NASHI)[number];

export function eStandartno(ime: string): boolean {
  return (STANDARTNI as readonly string[]).includes(ime);
}

export function ePozvoleno(ime: unknown): ime is SabitieIme {
  return typeof ime === "string" && ((STANDARTNI as readonly string[]).includes(ime) || (NASHI as readonly string[]).includes(ime));
}

/**
 * Параметрите от браузъра → само прости стойности (низ до 120 знака, число),
 * до 8 ключа с имена от букви, цифри и „_“. Всичко друго се маха.
 */
export function chistiParametri(raw: unknown): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= 8) break;
    if (!/^[a-z_][a-z0-9_]{0,39}$/i.test(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 120);
  }
  return out;
}

/** fbclid от адреса на страницата (за fbc, когато бисквитката _fbc още я няма). */
export function fbclidOt(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("fbclid");
  } catch {
    return null;
  }
}

/** Адресът на страницата — само от нашите домейни (иначе null). */
export function nashAdres(url: unknown): string | null {
  if (typeof url !== "string" || url.length > 1000) return null;
  return /^https:\/\/(www\.)?(ivailopetev\.com|promarketing\.pw)(\/|$)/.test(url) ? url : null;
}
