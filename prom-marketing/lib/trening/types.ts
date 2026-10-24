export type TopicId =
  | "skript"
  | "vazrazheniya"
  | "preramkirane"
  | "identichnost"
  | "istorii"
  | "prevencia"
  | "zatvaryane"
  | "principi";

export type TrainingMode = "uchi" | "izpit" | "rolya" | "tekst";
export type TrainingScore = 0 | 1 | 2;

export interface TrainingTopic {
  id: TopicId;
  label: string;
  emoji: string;
}

export interface StoredTrainingCard {
  id: string;
  tema: TopicId;
  red: number;
  zaglavie: string;
  obyasnenie: string;
  vapros: string;
  otgovor: string;
  iztochnik: string;
}

export interface TrainingCard {
  card_id: string;
  zaglavie: string;
  obyasnenie: string;
  vapros: string;
  otgovor: string;
  /** Карти след текущата, преди да започне повторение в тази сесия. */
  ostavat: number;
}

export interface TrainingAnswer {
  id: string;
  created_at: string;
  sesia_id: string | null;
  card_id: string;
  tema: TopicId;
  rejim: TrainingMode;
  kazano: string | null;
  ocenka: TrainingScore | null;
  komentar: string | null;
}

export interface TrainingTranscriptEntry {
  role: string;
  message: string;
}

export interface TrainingSession {
  id: string;
  created_at: string;
  tema: TopicId;
  rejim: TrainingMode;
  prodalzhitelnost_sek: number | null;
  zavarshena: boolean;
  transcript: unknown;
}

export interface TopicProgress extends TrainingTopic {
  total: number;
  mastery: number;
}

export interface WeakCard {
  card_id: string;
  tema: TopicId;
  zaglavie: string;
  ocenka: 0 | 1;
}

export interface TrainingHistory extends Omit<TrainingSession, "transcript"> {
  answers: number;
  correct: number;
  percent: number;
  transcript: TrainingTranscriptEntry[];
}

export interface TrainingDashboard {
  topics: TopicProgress[];
  focus: { zaglavie: string; tochki: string[] };
  weakCards: WeakCard[];
  history: TrainingHistory[];
  error?: string;
}
