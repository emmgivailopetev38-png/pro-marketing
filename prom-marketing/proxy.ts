import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isUebinarHost, podaraciRewrite, uebinarHostAction } from "@/lib/uebinar/domen";
import { AB_BISKVITKA_SEK, AB_COOKIE, abVarianta } from "@/lib/uebinar/ab";

export async function proxy(request: NextRequest) {
  // ivailopetev.com показва само страницата за записване за уебинара и
  // подаръците (/podaraci) — началната му страница е лендингът, останалото
  // е на promarketing.pw.
  const host = request.headers.get("host");
  const { pathname, search } = request.nextUrl;
  if (isUebinarHost(host)) {
    // A/B тестът на лендинга (60/40, бисквитка за 30 дни) — само за началната страница.
    const ab = pathname === "/" ? abVarianta(request.cookies.get(AB_COOKIE)?.value) : null;
    const todo = uebinarHostAction(host ?? "", pathname, search, ab?.varianta ?? "A");
    if (todo.kind === "rewrite") {
      const res = NextResponse.rewrite(new URL(todo.to, request.url));
      if (ab?.nova) res.cookies.set(AB_COOKIE, ab.varianta, { maxAge: AB_BISKVITKA_SEK, path: "/", sameSite: "lax", secure: true });
      return res;
    }
    if (todo.kind === "redirect") return NextResponse.redirect(todo.to, todo.status);
  }
  // Линковете между подаръците са /podaraci/… — да работят и на другите адреси.
  const podaraci = podaraciRewrite(pathname, search);
  if (podaraci) return NextResponse.rewrite(new URL(podaraci, request.url));
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|mp4)$).*)",
  ],
};
