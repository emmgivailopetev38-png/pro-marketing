import { describe, expect, it } from "vitest";
import { chooseNextCard, latestAnswers } from "./scheduling";
import type { StoredTrainingCard, TrainingAnswer, TrainingScore } from "./types";

function card(id: string, red: number): StoredTrainingCard {
  return { id, red, tema: "skript", zaglavie: id, obyasnenie: "", vapros: "Въпрос", otgovor: "Оригинал", iztochnik: "" };
}

function answer(card_id: string, ocenka: TrainingScore, day: number, sesia_id = "old"): TrainingAnswer {
  return {
    id: `${card_id}-${day}`, card_id, ocenka, sesia_id,
    created_at: `2026-10-${String(day).padStart(2, "0")}T10:00:00Z`,
    tema: "skript", rejim: "tekst", kazano: "", komentar: "",
  };
}

describe("редът на картите", () => {
  const cards = [card("a", 1), card("b", 2), card("c", 3), card("d", 4)];

  it("първо връща никога неотговаряна карта по red", () => {
    const next = chooseNextCard([...cards].reverse(), [answer("a", 0, 1)], "now");
    expect(next?.card_id).toBe("b");
    expect(next?.ostavat).toBe(3);
  });

  it("използва последната оценка, не най-слабата историческа", () => {
    const answers = [answer("a", 0, 1), answer("b", 1, 2), answer("c", 0, 3), answer("d", 2, 1), answer("a", 2, 5)];
    expect(chooseNextCard(cards, answers, "now")?.card_id).toBe("c");
    expect(latestAnswers(answers).get("a")?.ocenka).toBe(2);
    expect(latestAnswers(answers.reverse()).get("a")?.ocenka).toBe(2);
  });

  it("поставя оценка 1 пред вече точните карти", () => {
    const answers = [answer("a", 2, 1), answer("b", 2, 2), answer("c", 1, 3), answer("d", 2, 1)];
    expect(chooseNextCard(cards, answers, "now")?.card_id).toBe("c");
  });

  it("след оценките 0 и 1 избира най-отдавна отговаряната", () => {
    const answers = [answer("a", 2, 4), answer("b", 2, 3), answer("c", 2, 1), answer("d", 2, 2)];
    expect(chooseNextCard(cards, answers, "now")?.card_id).toBe("c");
  });

  it("пропуска вече отговаряните в сесията дори да са слаби", () => {
    const answers = [answer("a", 0, 1, "now"), answer("b", 2, 2, "now"), answer("c", 2, 3), answer("d", 2, 4, "now")];
    const next = chooseNextCard(cards, answers, "now");
    expect(next?.card_id).toBe("c");
    expect(next?.ostavat).toBe(0);
  });

  it("разрешава повторение след като всички са отговаряни в сесията", () => {
    const answers = cards.map((entry, index) => answer(entry.id, index === 2 ? 0 : 2, index + 1, "now"));
    expect(chooseNextCard(cards, answers, "now")?.card_id).toBe("c");
  });

  it("връща null за празна тема и работи с единствена карта", () => {
    expect(chooseNextCard([], [], "now")).toBeNull();
    expect(chooseNextCard([cards[0]], [answer("a", 2, 1, "now")], "now")?.ostavat).toBe(0);
  });

  it("решава еднакъв timestamp с устойчив вторичен ред", () => {
    const old = { ...answer("a", 0, 1), id: "a" };
    const newer = { ...answer("a", 2, 1), id: "b" };
    expect(latestAnswers([newer, old]).get("a")?.ocenka).toBe(2);
  });
});
