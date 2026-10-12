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
  /**
   * Връща се идентификаторът на агента, не подписан адрес — същата размяна като
   * при публичния гласов агент (03.09.2026): `ELEVENLABS_API_KEY` във Vercel е
   * остарял и `get-signed-url` връща 401. Треньорът е с `enable_auth: false`
   * и allowlist само за promarketing.pw, тоест ID-то е безполезно от чужд домейн.
   */
  const agentId = process.env.ELEVENLABS_TRAINER_AGENT_ID;
  if (!agentId) {
    return NextResponse.json({ error: "Гласовият треньор още не е настроен. Липсва ELEVENLABS_TRAINER_AGENT_ID." }, { status: 503 });
  }
  try {
    validateMode(tema.data, rejim.data);
    const sesia = await createTrainingSession(tema.data, rejim.data);
    return NextResponse.json({ agentId, sesia }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return trainingRouteError(error);
  }
}
