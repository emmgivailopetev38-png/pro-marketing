/**
 * Записването за уебинара — малките правила, които формата и сървърът споделят.
 *
 * 28.11.2026 (Ивайло: „обходи целия записващ процес… препращанията към Viber
 * може и да не работят“). Какво показаха данните:
 *   • след „Записан си“ човекът натиска бутона за Viber, връща се и страницата
 *     вече не помни, че е записан → записва се пак (един човек 3 пъти за 7 мин.);
 *   • бутонът водеше през нашия адрес /viber (пренасочване) — така телефонът
 *     не отваря Viber направо, а първо уеб страницата на Viber;
 *   • при измислен телефон Notifier отказва човека и опитът се повтаряше на
 *     всеки 5 минути (стотици еднакви грешки).
 * Чисти функции, без достъп до браузър или база — за да се тестват.
 */

/** Колко време след записването човек се смята за „току-що върнал се“ (потвърждението се отваря само). */
export const SKORO_MS = 60 * 60 * 1000;

/** Ключът в localStorage: по един за всяко обучение (slug-ът носи и темата). */
export function zapisanKlyuch(slug: string): string {
  return `pm_uebinar_zapisan:${slug}`;
}

export interface Zapisan {
  /** Малкото име, за поздрава („Иван, ще се видим на живо“). */
  ime: string;
  /** Кога се е записал (ms). */
  ts: number;
}

/** Какво се пази в браузъра след успешно записване. */
export function zapisanStoinost(ime: string, now: number): string {
  const malko = ime.trim().split(/\s+/)[0] ?? "";
  return JSON.stringify({ ime: malko.slice(0, 40), ts: now });
}

/** Чете записа от браузъра; всичко съмнително → null (формата се показва както обикновено). */
export function prochetiZapisan(raw: string | null | undefined): Zapisan | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as { ime?: unknown; ts?: unknown };
    if (typeof j.ts !== "number" || !Number.isFinite(j.ts) || j.ts <= 0) return null;
    return { ime: typeof j.ime === "string" ? j.ime.slice(0, 40) : "", ts: j.ts };
  } catch {
    return null;
  }
}

/**
 * Директният линк към канала за приложението Viber — същият, който ползва и
 * страницата invite.viber.com (viber://community_invite?data=<g2>). Резерва за
 * случаите, когато вграденият браузър на Facebook/Instagram не отваря Viber
 * от обикновения линк.
 */
export function viberDeepLink(invite: string | null | undefined): string | null {
  if (!invite) return null;
  const m = /^https:\/\/invite\.viber\.com\/\?(?:[^#]*&)?g2=([^&#]+)/.exec(invite);
  if (!m) return null;
  try {
    // decodeURIComponent пази „+“ (searchParams би го обърнал в интервал).
    return `viber://community_invite?data=${encodeURIComponent(decodeURIComponent(m[1]))}`;
  } catch {
    return null;
  }
}

/** Вграденият браузър на Facebook, Instagram, Messenger, TikTok… — от него приложенията се отварят по-трудно. */
export function eVgradenBrauzar(ua: string | null | undefined): boolean {
  return /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Instagram|musical_ly|TikTok|Snapchat|Line\//i.test(ua ?? "");
}

/**
 * Бот ли е по User-Agent. Търсим истински роботи („Googlebot/2.1“, „AdsBot“,
 * „bot“ като отделна дума), а не всяко „bot“ вътре в дума: телефоните CUBOT
 * имат „CUBOT NOTE 30“ в User-Agent-а и досега минаваха за ботове — виждаха
 * „Записан си“, а нищо не се записваше.
 */
export function eBot(ua: string | null | undefined): boolean {
  return /[a-z]+bot(?:\/|;|$)|adsbot|(?<![a-z])bot\b|crawl|spider|slurp|headless|lighthouse/i.test(ua ?? "");
}

/**
 * Отказът на Notifier заради самия номер (400, поле phone: „Invalid recipient
 * phone number“). Нов опит със същия номер е безсмислен — виж kamNotifierSega.
 * `error` е във вида на kamNotifier: „<статус>: <началото на отговора>“.
 */
export function nevalidenTelefon(error: string | null | undefined): boolean {
  const e = error ?? "";
  return /^400:/.test(e) && /"path":\s*\[\s*"phone"\s*\]|Invalid recipient phone/i.test(e);
}

/**
 * Какво да види човекът, когато записването не мине. Сървърът връща 400 с
 * `error` („Invalid phone“ / „Invalid input“) — досега формата казваше за
 * всичко „опитай пак след малко“ и човекът пращаше същия грешен номер отново.
 */
export function zapisGreshka(status: number | null, kod: string | null | undefined): string {
  if (status === 400 && kod === "Invalid phone") return "Провери телефона. Напиши го така: 0888 123 456.";
  if (status === 400) return "Провери името, телефона и имейла и натисни пак.";
  if (status === 429) return "Много опити наведнъж. Изчакай минута и натисни пак.";
  return "Не успях да те запиша. Провери интернета и натисни пак.";
}
