import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isUebinarHost, podaraciRewrite, uebinarHostAction } from "@/lib/uebinar/domen";

export async function proxy(request: NextRequest) {
  // ivailopetev.com показва само страницата за записване за уебинара и
  // подаръците (/podaraci) — началната му страница е лендингът, останалото
  // е на promarketing.pw.
  const host = request.headers.get("host");
  const { pathname, search } = request.nextUrl;
  if (isUebinarHost(host)) {
    const todo = uebinarHostAction(host ?? "", pathname, search);
    if (todo.kind === "rewrite") return NextResponse.rewrite(new URL(todo.to, request.url));
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
