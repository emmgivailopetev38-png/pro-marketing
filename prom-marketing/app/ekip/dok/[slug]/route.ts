import { NextResponse } from "next/server";
import { getTeamActor } from "@/lib/team/session";
import { OFERTA_3900_HTML } from "@/lib/team/dokumenti/oferta-3900";

export const dynamic = "force-dynamic";

/**
 * Вътрешните документи на екипа (цялата оферта и т.н.) — само след вход в
 * /ekip. Не стоят в public/, за да не се отварят от случаен линк.
 */
const DOCS: Record<string, string> = {
  "oferta-3900": OFERTA_3900_HTML,
};

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const actor = await getTeamActor();
  if (!actor) return NextResponse.redirect(new URL("/ekip/login", request.url));
  const { slug } = await params;
  const html = DOCS[slug];
  if (!html) return new NextResponse("Няма такъв документ.", { status: 404 });
  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
