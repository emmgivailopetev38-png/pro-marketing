import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isUebinarHost, uebinarHostAction } from "@/lib/uebinar/domen";

export async function proxy(request: NextRequest) {
  // ivailopetev.com показва само страницата за записване за уебинара —
  // началната му страница е лендингът, останалото е на promarketing.pw.
  const host = request.headers.get("host");
  if (isUebinarHost(host)) {
    const todo = uebinarHostAction(host ?? "", request.nextUrl.pathname, request.nextUrl.search);
    if (todo.kind === "rewrite") return NextResponse.rewrite(new URL(todo.to, request.url));
    if (todo.kind === "redirect") return NextResponse.redirect(todo.to, todo.status);
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|mp4)$).*)",
  ],
};
