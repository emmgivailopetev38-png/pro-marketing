import { NextResponse } from "next/server";
import { trainingAdminAuthorized, trainingRouteError } from "@/lib/trening/http";
import { modeSchema, topicSchema } from "@/lib/trening/temi";
import { createTrainingSession, validateMode } from "@/lib/trening/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await trainingAdminAuthorized()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const params = new URL(request.url).searchParams;
  const tema = topicSchema.safeParse(params.get("tema"));
  const rejim = modeSchema.safeParse(params.get("rejim"));
  if (!tema.success || !rejim.success || rejim.data === "tekst") {
    return NextResponse.json({ error: "Изберете валидна тема и гласов режим." }, { status: 400 });
  }
  const agentId = process.env.ELEVENLABS_TRAINER_AGENT_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!agentId || !apiKey) {
    return NextResponse.json({ error: "Гласовият треньор още не е настроен. Липсва ELEVENLABS_TRAINER_AGENT_ID или ELEVENLABS_API_KEY." }, { status: 503 });
  }
  try {
    validateMode(tema.data, rejim.data);
    const result = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store" },
    );
    if (!result.ok) {
      console.error("[trening/session] ElevenLabs", result.status);
      return NextResponse.json({ error: "Не успяхме да свържем гласовия треньор. Опитайте отново." }, { status: 502 });
    }
    const data = await result.json() as { signed_url?: string };
    if (!data.signed_url || typeof data.signed_url !== "string") {
      return NextResponse.json({ error: "Гласовият треньор не върна адрес за свързване." }, { status: 502 });
    }
    const sesia = await createTrainingSession(tema.data, rejim.data);
    return NextResponse.json({ signedUrl: data.signed_url, sesia }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return trainingRouteError(error);
  }
}
