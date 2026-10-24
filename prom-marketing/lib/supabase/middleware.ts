import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, readSession } from "@/lib/admin/session";
import { isDemoAdminPath } from "@/lib/admin/demo-paths";

/**
 * Две затворени зони с една бисквитка:
 *   /admin — само собственикът (общата парола). Човек от екипа, който попадне
 *            тук, отива в своята зона, не на страницата за вход.
 *   /ekip  — екипът и собственикът (той също може да звъни от телефона).
 * Страниците за вход и двата auth API-я са отворени.
 */
export async function updateSession(request: NextRequest) {
  const url = request.nextUrl.clone();
  const path = url.pathname;
  const token = request.cookies.get(ADMIN_COOKIE)?.value ?? null;

  if (path.startsWith("/ekip")) {
    if (path === "/ekip/login") return NextResponse.next({ request });
    if (!readSession(token)) {
      url.pathname = "/ekip/login";
      url.search = "";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  const isAdminRoute = path.startsWith("/admin");
  const isLoginPage = path === "/admin/login";
  const isAuthApi = path === "/api/admin/auth";

  if (!isAdminRoute || isLoginPage || isAuthApi) {
    return NextResponse.next({ request });
  }

  const session = readSession(token);
  // Човек от екипа с модул „Демо“ отваря само трите демо страници; дали има
  // модула го проверява layout-ът (getAdminViewer). Всичко друго под /admin
  // го връща в неговата зона — без страница за вход, той вече е влязъл.
  if (session?.kind === "member" && isDemoAdminPath(path)) {
    return NextResponse.next({ request });
  }
  if (session?.kind === "member") {
    url.pathname = "/ekip";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (!session) {
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
