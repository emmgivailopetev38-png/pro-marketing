import { NextResponse } from "next/server";
import { suvetnikAuthorized } from "@/lib/suvetnik/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/suvetnik/token?n=2 — еднократни токени за ElevenLabs Scribe v2 Realtime.
 * Ключът остава на сървъра; браузърът получава токени, валидни 15 минути за едно свързване.
 * По един токен на поток: микрофонът (Ивайло) и звукът от таба (клиентът).
 */
export async function GET(request: Request) {
  if (!(await suvetnikAuthorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const apiKey = process.env.ELEVENLABS_STT_KEY || process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Липсва ELEVENLABS_API_KEY във Vercel." }, { status: 503 });
  }
  const n = Math.min(2, Math.max(1, Number(new URL(request.url).searchParams.get("n")) || 1));
  const tokens: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      cache: "no-store",
    });
    if (!r.ok) {
      const status = r.status;
      console.error("[suvetnik/token] ElevenLabs", status);
      const error = status === 401 || status === 403
        ? "Ключът на ElevenLabs е стар или без право „Speech to Text“ (401). Трябва нов ключ във Vercel."
        : `ElevenLabs върна ${status}. Опитай пак след малко.`;
      return NextResponse.json({ error }, { status: 502 });
    }
    const data = (await r.json()) as { token?: string };
    if (!data.token) return NextResponse.json({ error: "ElevenLabs не върна токен." }, { status: 502 });
    tokens.push(data.token);
  }
  return NextResponse.json({ tokens }, { headers: { "Cache-Control": "no-store" } });
}
