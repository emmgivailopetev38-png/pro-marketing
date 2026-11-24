import { NextResponse } from "next/server";
import { getTeamActor } from "@/lib/team/session";
import { asistentPrompt, type ChatTurn } from "@/lib/team/asistent";
import { cyal, DALBOK_MODEL, GeminiGreshka } from "@/lib/suvetnik/gemini";

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
    const answer = (await cyal({ system, user, model: DALBOK_MODEL, maxTokens: 1200, mislene: "low" })).trim();
    return NextResponse.json({ answer: answer || "Не успях да отговоря — пробвай пак или натисни „🛠 Корекция / въпрос към Ивайло“." });
  } catch (e) {
    const status = e instanceof GeminiGreshka ? e.status : 500;
    console.error("[ekip/asistent]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Асистентът не отговори в момента. Пробвай след малко или пиши на Ивайло с бутона „🛠 Корекция“." }, { status });
  }
}
