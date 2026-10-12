import { describe, expect, it } from "vitest";
import { buildTextTranscript } from "./transcript";
import type { StoredTrainingCard, TrainingAnswer } from "./types";

const card: StoredTrainingCard = {
  id: "card", tema: "skript", red: 1, zaglavie: "ПРИМЕР", obyasnenie: "", vapros: "Въпрос?", otgovor: "", iztochnik: "",
};
const answer: TrainingAnswer = {
  id: "first", created_at: "2026-10-12T10:00:00Z", sesia_id: "session", card_id: card.id,
  tema: "skript", rejim: "tekst", kazano: "Първи отговор", ocenka: 0, komentar: "",
};

describe("текстов transcript", () => {
  it("включва отговор, записан след приключването, и подрежда опитите хронологично", () => {
    const transcriptAtFinish = buildTextTranscript([card], [answer]);
    const lateAnswer = { ...answer, id: "late", created_at: "2026-10-12T10:01:00Z", kazano: "Последен отговор" };
    const reconciled = buildTextTranscript([card], [lateAnswer, answer]);
    expect(transcriptAtFinish).toHaveLength(2);
    expect(reconciled).toEqual([
      { role: "agent", message: "Въпрос?" },
      { role: "user", message: "Първи отговор" },
      { role: "agent", message: "Въпрос?" },
      { role: "user", message: "Последен отговор" },
    ]);
  });

  it("пази казаното и ако статичната карта вече е премахната", () => {
    expect(buildTextTranscript([], [answer])).toEqual([
      { role: "agent", message: "card" },
      { role: "user", message: "Първи отговор" },
    ]);
  });
});
