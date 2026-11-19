import { NextResponse } from "next/server";
import { z } from "zod";
import { recordUebinarView } from "@/lib/uebinar/views";

export const dynamic = "force-dynamic";

const schema = z.object({
  k: z.string().trim().regex(/^[0-9a-fA-F]{8}$/),
  pct: z.number().int().min(0).max(100),
});

/** Ботове и автоматични браузъри — не са човекът от писмото. */
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse/i;

/**
 * POST /api/uebinar/track — маякът на плейъра в `/uebinar`.
 * Публичен като `/api/tracking/demo-view`: единственото, което може, е да
 * впише „гледа уебинара“ в картона, чийто id започва с `k`. Отговорът е
 * винаги един и същ — не издава кои ключове съществуват.
 */
export async function POST(request: Request) {
  const raw = await request.text().catch(() => "");
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  if (!BOT_UA.test(request.headers.get("user-agent") ?? "")) {
    await recordUebinarView(parsed.data.k.toLowerCase(), parsed.data.pct).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
