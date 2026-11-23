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
 * Meta пиксел „Ивайло Петев AI · уебинар (ivailopetev.com)“ — набор от данни
 * 29198929629764170 в портфолиото Top Helper, вързан към IVO 1AD.
 * Идентификаторът е публичен (вижда се в кода на всяка страница с пиксел).
 */
export const UEBINAR_PIXEL_ID = "29198929629764170";

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
 *   /na-zhivo        → / (един адрес за една страница)
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
  if (pathname === UEBINAR_PATH || pathname === `${UEBINAR_PATH}/`) {
    return { kind: "redirect", to: `${UEBINAR_ORIGIN}/${search}`, status: 307 };
  }
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) return { kind: "next" };
  return { kind: "redirect", to: `${GLAVEN_ORIGIN}${pathname}${search}`, status: 307 };
}
