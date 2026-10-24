import { NextResponse } from "next/server";
import { z } from "zod";
import { recordDemoView } from "@/lib/crm/demo-views";

export const dynamic = "force-dynamic";

const schema = z.object({
  k: z.string().trim().regex(/^[0-9a-fA-F]{8}$/),
  path: z.string().trim().min(5).max(80),
});

/**
 * Ботове и автоматични браузъри — те не са човекът, на когото е писмото.
 * Viber/WhatsApp/Telegram нарочно ги няма: прегледите им не пускат JS, а
 * вграденият им браузър е истински човек.
 */
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse/i;

/**
 * POST /api/tracking/demo-view — публичен маяк от /demo/* страниците.
 * Без auth по дизайн (като offer-view): единственото, което може да направи,
 * е да впише „отвори демото“ в картона, чийто id започва с `k`. Не чете и не
 * връща нищо за контакта — дори дали такъв има.
 */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  // Отговорът е винаги един и същ — да не издава кои ключове съществуват.
  if (!BOT_UA.test(request.headers.get("user-agent") ?? "")) await recordDemoView(parsed.data.k, parsed.data.path);
  return NextResponse.json({ ok: true });
}
