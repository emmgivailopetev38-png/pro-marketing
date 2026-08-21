import "server-only";

const GRAPH = "https://graph.facebook.com/v22.0";

export const META_PAGE_ID = process.env.META_PAGE_ID || "106080979260944"; // Pro Marketing LTD

/** Кеш за живота на ламбдата — не дърпаме токена при всяко събитие. */
let cached: { token: string; at: number } | null = null;
const TTL_MS = 10 * 60 * 1000;

/**
 * Връща токен на СТРАНИЦАТА.
 *
 * `META_PAGE_ACCESS_TOKEN` във Vercel е токен на СИСТЕМЕН ПОТРЕБИТЕЛ, не на
 * страница. Разликата е невидима на око — и двата са дълги низове, започващи
 * с EAA — но Meta отказва част от операциите със системен токен:
 *
 *   (#210) A page access token is required to request this resource.
 *
 * Точно това счупи абонирането на страницата за `leadgen` на 21.08.2026.
 * Вместо да караме човек да генерира втори токен и да го носи на ръка,
 * извличаме page токена от системния — Graph API го дава сам:
 *
 *   GET /{page-id}?fields=access_token&access_token={system_user_token}
 *
 * Ако конфигурираният токен ВЕЧЕ е page токен, заявката пак връща валиден
 * токен, така че кодът работи и в двата случая.
 */
export async function getPageAccessToken(): Promise<
  { ok: true; token: string; derived: boolean } | { ok: false; error: string }
> {
  const configured = process.env.META_PAGE_ACCESS_TOKEN;
  if (!configured) return { ok: false, error: "META_PAGE_ACCESS_TOKEN липсва" };

  if (cached && Date.now() - cached.at < TTL_MS) {
    return { ok: true, token: cached.token, derived: true };
  }

  try {
    const res = await fetch(
      `${GRAPH}/${META_PAGE_ID}?fields=access_token&access_token=${encodeURIComponent(configured)}`,
      { cache: "no-store" }
    );
    const body = await res.json();
    if (res.ok && typeof body?.access_token === "string" && body.access_token.length > 0) {
      cached = { token: body.access_token, at: Date.now() };
      return { ok: true, token: body.access_token, derived: true };
    }
    // Не успяхме да извлечем — пробваме с конфигурирания както си е.
    // По-добре опит с наличното, отколкото сигурен отказ.
    return { ok: true, token: configured, derived: false };
  } catch {
    return { ok: true, token: configured, derived: false };
  }
}
