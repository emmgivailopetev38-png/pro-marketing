import { NextResponse } from "next/server";
import { z } from "zod";
import { topicSchema } from "@/lib/trening/temi";
import { compareAnswer } from "@/lib/trening/comparison";
import { trainingAdminAuthorized, trainingRouteError } from "@/lib/trening/http";
import {
  assertActiveSession, createTrainingSession, finishTextSession, getTrainingSession,
  nextTrainingCard, saveTrainingAnswer, sessionCard,
} from "@/lib/trening/repository";

export const dynamic = "force-dynamic";
const sessionSchema = z.string().uuid();
const cardSchema = z.string().min(1).max(200);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), tema: topicSchema, card_id: cardSchema.optional() }),
  z.object({ action: z.literal("next"), sesia: sessionSchema }),
  z.object({ action: z.literal("answer"), sesia: sessionSchema, card_id: cardSchema, kazano: z.string().max(20000), attempt_id: z.string().uuid().optional() }),
  z.object({ action: z.literal("finish"), sesia: sessionSchema }),
]);

export async function POST(request: Request) {
  if (!await trainingAdminAuthorized()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Невалидна заявка за тренировка." }, { status: 400 });
  try {
    const input = parsed.data;
    if (input.action === "start") {
      // Проверка преди INSERT: грешна карта не оставя празна сесия в историята.
      if (input.card_id) sessionCard({ tema: input.tema }, input.card_id);
      const sesia = await createTrainingSession(input.tema, "tekst");
      const session = await getTrainingSession(sesia);
      return NextResponse.json({ sesia, card: await nextTrainingCard(session, input.card_id) });
    }
    const session = await getTrainingSession(input.sesia);
    if (input.action === "finish") {
      await finishTextSession(session);
      return NextResponse.json({ ok: true });
    }
    assertActiveSession(session, "text");
    if (input.action === "next") return NextResponse.json({ card: await nextTrainingCard(session) });
    const card = sessionCard(session, input.card_id);
    const comparison = compareAnswer(card.otgovor, input.kazano);
    const result = await saveTrainingAnswer({
      session,
      card_id: input.card_id,
      kazano: input.kazano,
      ocenka: comparison.ocenka,
      komentar: `${comparison.percent}% съвпадение с оригинала.`,
      attempt_id: input.attempt_id,
    });
    return NextResponse.json({ ...result, comparison });
  } catch (error) {
    return trainingRouteError(error);
  }
}
