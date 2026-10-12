import { NextResponse } from "next/server";
import { z } from "zod";
import { guardVoice } from "@/lib/voice/guard";
import { topicSchema } from "@/lib/trening/temi";
import { assertActiveSession, getTrainingSession, nextTrainingCard, TrainingError } from "@/lib/trening/repository";
import { trainingRouteError } from "@/lib/trening/http";

export const dynamic = "force-dynamic";
const schema = z.object({ sesia: z.string().uuid(), tema: topicSchema });

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const guard = guardVoice(request, body);
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Невалидна сесия или тема." }, { status: 400 });
  try {
    const session = await getTrainingSession(parsed.data.sesia);
    assertActiveSession(session, "voice");
    if (session.tema !== parsed.data.tema) throw new TrainingError("Темата не съвпада с тази на сесията.", 409);
    const card = await nextTrainingCard(session);
    if (!card) throw new TrainingError("В тази тема още няма карти.", 404);
    return NextResponse.json(card);
  } catch (error) {
    return trainingRouteError(error);
  }
}
