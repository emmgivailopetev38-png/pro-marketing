import type { StoredTrainingCard, TrainingAnswer, TrainingCard } from "./types";

/** Един последен отговор на карта, независимо от реда на входните редове. */
export function latestAnswers(answers: TrainingAnswer[]): Map<string, TrainingAnswer> {
  const latest = new Map<string, TrainingAnswer>();
  for (const answer of answers) {
    const previous = latest.get(answer.card_id);
    if (!previous || answer.created_at > previous.created_at ||
      (answer.created_at === previous.created_at && answer.id > previous.id)) {
      latest.set(answer.card_id, answer);
    }
  }
  return latest;
}

/** Първо непоказаните в сесията; след пълния кръг пак всички са допустими. */
export function chooseNextCard(
  cards: StoredTrainingCard[],
  answers: TrainingAnswer[],
  sessionId: string,
): TrainingCard | null {
  const latest = latestAnswers(answers);
  const answeredHere = new Set(answers.filter((a) => a.sesia_id === sessionId).map((a) => a.card_id));
  const remaining = cards.filter((card) => !answeredHere.has(card.id));
  const candidates = remaining.length > 0 ? remaining : cards;
  const priority = (card: StoredTrainingCard) => {
    const answer = latest.get(card.id);
    if (!answer) return 0;
    if (answer.ocenka === 0) return 1;
    if (answer.ocenka === 1) return 2;
    return 3;
  };
  const ordered = [...candidates].sort((a, b) => {
    const group = priority(a) - priority(b);
    if (group) return group;
    // Никога неотговаряните се учат по авторския ред. За останалите — най-отдавнашният опит.
    if (priority(a) !== 0) {
      const age = (latest.get(a.id)?.created_at ?? "").localeCompare(latest.get(b.id)?.created_at ?? "");
      if (age) return age;
    }
    return a.red - b.red || a.id.localeCompare(b.id);
  });
  const card = ordered[0];
  return card ? toTrainingCard(card, Math.max(0, candidates.length - 1)) : null;
}

export function toTrainingCard(card: StoredTrainingCard, ostavat: number): TrainingCard {
  return {
    card_id: card.id,
    zaglavie: card.zaglavie,
    obyasnenie: card.obyasnenie,
    vapros: card.vapros,
    otgovor: card.otgovor,
    ostavat,
  };
}
