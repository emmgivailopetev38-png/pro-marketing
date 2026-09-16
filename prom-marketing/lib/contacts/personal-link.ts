/**
 * Личният линк на един контакт — `promarketing.pw/z/<код>`.
 *
 * Смисълът му е да махне единствената пречка между съобщението и часа:
 * човекът, който отвори линка, вече е разпознат. Не пише име, не пише имейл,
 * не търси нищо — вижда своята страница и избира час. Всяко поле по пътя яде
 * срещи.
 *
 * Кодът е HMAC от `contact_id`, скъсен до 10 знака. Тоест:
 *   · не се познава по чужд код кой е следващият (за разлика от пореден номер);
 *   · не иска колона в базата и миграция — сметката е детерминирана;
 *   · сменя ли се тайната, старите линкове умират наведнъж, което е желаното
 *     поведение при изтекла тайна.
 *
 * Обратната посока (код → контакт) е търсене: кодовете на всички контакти се
 * смятат и се сравняват. При 308 картона това са 308 HMAC-а, тоест под
 * милисекунда — по-евтино от заявката, която ги е донесла.
 */

import { createHmac, timingSafeEqual } from "crypto";

/** Дължината на кода в hex знаци. 16^10 ≈ 1,1 трилиона — колизия няма. */
const CODE_LENGTH = 10;

/**
 * Тайната, с която се подписват кодовете.
 *
 * Пада обратно към `INTERNAL_SEND_TOKEN`, който вече стои във Vercel — така
 * линковете тръгват, без Ивайло да слага нов env. Отделният `ZATOPLI_LINK_SECRET`
 * съществува, за да могат линковете да се обезсилят, без да се пипа токенът
 * на имейл канала.
 */
function secret(): string | null {
  return process.env.ZATOPLI_LINK_SECRET || process.env.INTERNAL_SEND_TOKEN || null;
}

export function isPersonalLinkConfigured(): boolean {
  return secret() !== null;
}

/**
 * Кодът за този контакт. `null`, ако тайната липсва — тогава опашката показва
 * съобщение без линк, вместо линк, който води до 404.
 */
export function linkCodeFor(contactId: string): string | null {
  const s = secret();
  if (!s || !contactId) return null;
  return createHmac("sha256", s).update(`zatopli:${contactId}`).digest("hex").slice(0, CODE_LENGTH);
}

/** Пълният адрес към личната страница. */
export function personalLinkFor(contactId: string, siteUrl?: string): string | null {
  const code = linkCodeFor(contactId);
  if (!code) return null;
  const base = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://promarketing.pw").replace(/\/+$/, "");
  return `${base}/z/${code}`;
}

/** Сравнение на кодове в константно време — кодът е тайна като всяка друга. */
export function codesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Намира контакта по код.
 *
 * `ids` е списъкът с всички id-та (един `select("id")`). При двусмислие връща
 * `null`: колизия при 10 hex знака е практически невъзможна, но ако се случи,
 * по-добре 404, отколкото чужда страница пред грешния човек.
 */
export function contactIdForCode(code: string, ids: string[]): string | null {
  const clean = (code ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(clean) || clean.length !== CODE_LENGTH) return null;

  let found: string | null = null;
  for (const id of ids) {
    const c = linkCodeFor(id);
    if (c && codesMatch(c, clean)) {
      if (found) return null; // колизия — никому страницата
      found = id;
    }
  }
  return found;
}
