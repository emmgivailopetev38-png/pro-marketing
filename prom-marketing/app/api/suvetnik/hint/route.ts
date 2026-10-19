import { NextResponse } from "next/server";
import { suvetnikAuthorized } from "@/lib/suvetnik/http";
import { BARZ_MODEL, GeminiGreshka, geminiKlyuch, potok } from "@/lib/suvetnik/gemini";
import { METOD } from "@/lib/suvetnik/metod";
import { hintSchema, sglobiZayavka } from "@/lib/suvetnik/zayavka";
import type { HintZaiavka } from "@/lib/suvetnik/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/suvetnik/hint — следващият ход за Ивайло, поточно, ред по ред
 * (КАЖИ / ТОН / ТЕХНИКА …). „КАЖИ“ идва първо, за да се вижда за под секунда.
 */
export async function POST(request: Request) {
  if (!(await suvetnikAuthorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!geminiKlyuch()) {
    return NextResponse.json({ error: "Липсва GEMINI_API_KEY във Vercel — съветникът няма „мозък“." }, { status: 503 });
  }
  const parsed = hintSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидна заявка." }, { status: 400 });

  const user = sglobiZayavka(parsed.data as HintZaiavka);
  const enc = new TextEncoder();
  const nachalo = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let parvo = 0;
      try {
        for await (const parche of potok({ system: METOD, user, model: BARZ_MODEL, mislene: "minimal", maxTokens: 500, signal: request.signal })) {
          if (!parvo) parvo = Date.now() - nachalo;
          controller.enqueue(enc.encode(parche));
        }
      } catch (error) {
        if (!request.signal.aborted) {
          const msg = error instanceof GeminiGreshka ? error.message : "Мозъкът не отговори. Опитай пак.";
          console.error("[suvetnik/hint]", error);
          controller.enqueue(enc.encode(`\nГРЕШКА: ${msg}`));
        }
      } finally {
        if (parvo) console.info(`[suvetnik/hint] първо парче след ${parvo} ms, общо ${Date.now() - nachalo} ms`);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
