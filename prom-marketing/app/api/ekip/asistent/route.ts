import { NextResponse } from "next/server";
import { getTeamActor } from "@/lib/team/session";
import { asistentPrompt, type ChatTurn } from "@/lib/team/asistent";
import { BARZ_MODEL, cyal, DALBOK_MODEL, GeminiGreshka } from "@/lib/suvetnik/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST {turns:[{role,text}]} → {answer} — AI асистентът на екипа (само след вход в /ekip). */
export async function POST(request: Request) {
  const actor = await getTeamActor();
  if (!actor) return NextResponse.json({ error: "Влез отново в системата." }, { status: 401 });
  const raw = (await request.json().catch(() => null)) as { turns?: unknown } | null;
  const turns: ChatTurn[] = Array.isArray(raw?.turns)
    ? (raw!.turns as Array<Record<string, unknown>>)
        .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.text === "string" && t.text.trim())
        .map((t) => ({ role: t.role as ChatTurn["role"], text: String(t.text).slice(0, 2000) }))
        .slice(-12)
    : [];
  if (!turns.length || turns.at(-1)?.role !== "user") return NextResponse.json({ error: "Напиши въпрос." }, { status: 400 });
  try {
    const { system, user } = await asistentPrompt(actor, turns);
    // Моделът понякога е претоварен (503 на 24.11.2026) — тогава следващият по ред, не грешка към човека.
    const models = [...new Set([DALBOK_MODEL, BARZ_MODEL, "gemini-flash-latest", "gemini-2.5-flash"])];
    let answer = "";
    let last: unknown = null;
    for (const model of models) {
      try {
        answer = (await cyal({ system, user, model, maxTokens: 1500, mislene: "low" }))
          // Балончето показва чист текст — остатъците от Markdown се махат.
          .replace(/^#{1,6}\s*/gm, "")
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/^>\s?/gm, "")
          .trim();
        if (answer) break;
      } catch (e) {
        last = e;
        // Невалиден ключ → няма смисъл от друг модел.
        if (e instanceof GeminiGreshka && e.status === 503 && /GEMINI_API_KEY/.test(e.message)) break;
      }
    }
    if (!answer && last) throw last;
    return NextResponse.json({ answer: answer || "Не успях да отговоря — пробвай пак или натисни „🛠 Корекция / въпрос към Ивайло“." });
  } catch (e) {
    const status = e instanceof GeminiGreshka ? e.status : 500;
    console.error("[ekip/asistent]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Асистентът не отговори в момента. Пробвай след малко или пиши на Ивайло с бутона „🛠 Корекция“." }, { status });
  }
}
