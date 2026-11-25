import { UEBINAR_LINKOVE } from "./linkove";

/**
 * Домейнът на уебинара — ivailopetev.com (вързан на 23.11.2026).
 *
 * На него живее само страницата за записване (/na-zhivo): началната му
 * страница Е лендингът, а всичко останало отива на основния сайт. Така
 * рекламите водят на чист адрес с името на Ивайло, без менюто и
 * страниците на promarketing.pw.
 *
 * Тук е и чисто новият Meta пиксел, който се учи само от уебинара —
 * зарежда се на лендинга вместо основния (виж MetaPixel.tsx).
 */

export const UEBINAR_HOSTS: readonly string[] = ["ivailopetev.com", "www.ivailopetev.com"];
export const UEBINAR_ORIGIN = "https://ivailopetev.com";
export const GLAVEN_ORIGIN = "https://promarketing.pw";

/** Пътят на лендинга в приложението (на основния сайт се отваря и директно). */
export const UEBINAR_PATH = "/na-zhivo";

/**
 * Подаръците за останалите до края (ivailopetev.com/podaraci). В приложението
 * живеят под /na-zhivo/podaraci — чистият адрес се пренаписва натам.
 */
export const PODARACI_PATH = "/podaraci";

/** /podaraci и /podaraci/… → вътрешният път /na-zhivo/podaraci… (иначе null). */
export function podaraciRewrite(pathname: string, search = ""): string | null {
  if (pathname !== PODARACI_PATH && !pathname.startsWith(`${PODARACI_PATH}/`)) return null;
  const p = pathname.replace(/\/+$/, "") || PODARACI_PATH;
  return `${UEBINAR_PATH}${p}${search}`;
}

/**
 * Meta пиксел „Ивайло Петев AI · уебинар (ivailopetev.com)“ — набор от данни
 * 29198929629764170 в портфолиото Top Helper, вързан към IVO 1AD.
 * Идентификаторът е публичен (вижда се в кода на всяка страница с пиксел).
 */
export const UEBINAR_PIXEL_ID = "29198929629764170";

/**
 * Иконите на уебинара (снимката на Ивайло), манифестът и картинката при
 * споделяне — public/ivailo/. Имената са нови (ikona*), за да не взима
 * браузърът старата иконка на Pro Marketing от кеша си.
 */
export const IVAILO_ASSETS = "/ivailo";

function chistHost(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "");
}

export function isUebinarHost(host: string | null | undefined): boolean {
  return UEBINAR_HOSTS.includes(chistHost(host));
}

export type UebinarHostAction =
  | { kind: "next" }
  | { kind: "rewrite"; to: string }
  | { kind: "redirect"; to: string; status: 307 | 308 };

/**
 * Какво става със заявка, дошла на домейна на уебинара.
 *   www.…            → без www (308)
 *   /                → показва лендинга (rewrite към /na-zhivo), адресът остава чист
 *   /podaraci…       → подаръците (rewrite към /na-zhivo/podaraci…)
 *   /na-zhivo        → / (един адрес за една страница)
 *   /na-zhivo/podaraci… → /podaraci… (чистият адрес)
 *   /api/…, /_next/… → минават (формата записва през /api/uebinar/register)
 *   всичко друго     → същият път на основния сайт
 * `search` е с въпросителната (както го дава `nextUrl.search`) — UTM и fbclid се пазят.
 */
export function uebinarHostAction(host: string, pathname: string, search = ""): UebinarHostAction {
  const h = chistHost(host);
  if (h.startsWith("www.")) {
    return { kind: "redirect", to: `${UEBINAR_ORIGIN}${pathname}${search}`, status: 308 };
  }
  if (pathname === "/") return { kind: "rewrite", to: `${UEBINAR_PATH}${search}` };
  const podaraci = podaraciRewrite(pathname, search);
  if (podaraci) return { kind: "rewrite", to: podaraci };
  if (pathname === UEBINAR_PATH || pathname === `${UEBINAR_PATH}/`) {
    return { kind: "redirect", to: `${UEBINAR_ORIGIN}/${search}`, status: 307 };
  }
  const vatreshen = `${UEBINAR_PATH}${PODARACI_PATH}`;
  if (pathname === vatreshen || pathname.startsWith(`${vatreshen}/`)) {
    const chist = pathname.slice(UEBINAR_PATH.length).replace(/\/+$/, "");
    return { kind: "redirect", to: `${UEBINAR_ORIGIN}${chist}${search}`, status: 307 };
  }
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) return { kind: "next" };
  // Кратките линкове от SMS-ите и писмата (виж linkove.ts); докато ги няма — лендингът.
  if (pathname === "/viber") return { kind: "redirect", to: UEBINAR_LINKOVE.viberKanal ?? `${UEBINAR_ORIGIN}/`, status: 307 };
  if (pathname === "/vlez") return { kind: "redirect", to: UEBINAR_LINKOVE.zoom ?? `${UEBINAR_ORIGIN}/`, status: 307 };
  // Иконите, манифестът и картинката при споделяне на уебинара (public/ivailo/).
  if (pathname.startsWith(`${IVAILO_ASSETS}/`)) return { kind: "next" };
  return { kind: "redirect", to: `${GLAVEN_ORIGIN}${pathname}${search}`, status: 307 };
}
