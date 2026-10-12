import type { StoredTrainingCard, TrainingAnswer, TrainingTranscriptEntry } from "./types";

/** Отговорите са източникът на истина и при приключване по време на последния запис. */
export function buildTextTranscript(
  cards: StoredTrainingCard[],
  answers: TrainingAnswer[],
): TrainingTranscriptEntry[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  return [...answers]
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    .flatMap((answer) => [
      { role: "agent", message: byId.get(answer.card_id)?.vapros ?? answer.card_id },
      { role: "user", message: answer.kazano ?? "" },
    ]);
}
