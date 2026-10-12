import { NextResponse } from "next/server";
import { z } from "zod";
import { guardVoice } from "@/lib/voice/guard";
import { assertActiveSession, getTrainingSession, saveTrainingAnswer } from "@/lib/trening/repository";
import { trainingRouteError } from "@/lib/trening/http";

export const dynamic = "force-dynamic";
const schema = z.object({
  sesia: z.string().uuid(),
  card_id: z.string().min(1).max(200),
  kazano: z.string().max(20000),
  ocenka: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  komentar: z.string().max(4000),
});

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const guard = guardVoice(request, body);
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни за отговора. Оценката трябва да е 0, 1 или 2." }, { status: 400 });
  try {
    const session = await getTrainingSession(parsed.data.sesia);
    assertActiveSession(session, "voice");
    const { card_id, kazano, ocenka, komentar } = parsed.data;
    return NextResponse.json(await saveTrainingAnswer({ session, card_id, kazano, ocenka, komentar }));
  } catch (error) {
    return trainingRouteError(error);
  }
}
