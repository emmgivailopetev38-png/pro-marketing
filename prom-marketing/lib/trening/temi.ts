import "server-only";
import { z } from "zod";
import rawCards from "@/data/trening/karti.json";
import rawFocus from "@/data/trening/fokus.json";
import type { StoredTrainingCard, TrainingTopic } from "./types";

export const topicSchema = z.enum([
  "skript", "vazrazheniya", "preramkirane", "identichnost",
  "istorii", "prevencia", "zatvaryane", "principi",
]);

export const modeSchema = z.enum(["uchi", "izpit", "rolya", "tekst"]);

export const TEMI: TrainingTopic[] = [
  { id: "skript", emoji: "📜", label: "Скриптът" },
  { id: "vazrazheniya", emoji: "🛡️", label: "Възражения" },
  { id: "preramkirane", emoji: "🔄", label: "Прерамкиране" },
  { id: "identichnost", emoji: "🦋", label: "Нова идентичност" },
  { id: "istorii", emoji: "📖", label: "Историите" },
  { id: "prevencia", emoji: "🧯", label: "Превенция" },
  { id: "zatvaryane", emoji: "🤝", label: "Затваряне" },
  { id: "principi", emoji: "🧭", label: "Принципите" },
];

const cardSchema = z.object({
  id: z.string().min(1),
  tema: topicSchema,
  red: z.number().int(),
  zaglavie: z.string(),
  obyasnenie: z.string(),
  vapros: z.string(),
  otgovor: z.string(),
  iztochnik: z.string(),
});

/** Статичният файл остава на сървъра; текстът се връща само след админ достъп. */
export function getCards(): StoredTrainingCard[] {
  const cards = z.array(cardSchema).parse(rawCards);
  if (new Set(cards.map((card) => card.id)).size !== cards.length) {
    throw new Error("Картите за тренировка съдържат повторени идентификатори.");
  }
  return cards.sort((a, b) => a.red - b.red || a.id.localeCompare(b.id));
}

export function getFocus() {
  return z.object({ zaglavie: z.string(), tochki: z.array(z.string()) }).parse(rawFocus);
}
