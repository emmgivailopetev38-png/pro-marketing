import { NextResponse } from "next/server";
import { contactFromTicket } from "@/lib/kino/token";
import { canPreview } from "@/lib/kino/viewer";
import { giftBlobUrl, hasGift } from "@/lib/kino/gift";
import { KINO } from "@/lib/kino/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/kino/gift?t=… — „Свали подаръка“ след надписите.
 * Проверява билета и отключването (сървърът, не браузърът) и пренасочва към
 * PDF-а във Vercel Blob. Адресът на файла се вижда едва след пренасочването.
 * Прегледът на Ивайло (админ бисквитка / демо) минава без отключване.
 */
export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t");
  const contactId = t ? contactFromTicket(t) : null;
  const preview = await canPreview();
  const headers = { "Cache-Control": "private, no-store" };

  if (!preview) {
    if (!contactId) {
      return NextResponse.json({ error: "Подаръкът е за хората с билет — отвори линка от имейла си." }, { status: 401, headers });
    }
    if (!(await hasGift(contactId))) {
      return NextResponse.json({ error: "Подаръкът се отключва след надписите — за изгледалите филма." }, { status: 403, headers });
    }
  }

  const url = await giftBlobUrl();
  if (!url) {
    return NextResponse.json({ error: `„${KINO.bonus.title}“ идва на имейла ти до 24 часа.` }, { status: 503, headers });
  }
  return NextResponse.redirect(url, { status: 302, headers });
}
