import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { getCards, getFocus, TEMI } from "./temi";
import { chooseNextCard, latestAnswers, toTrainingCard } from "./scheduling";
import { buildTextTranscript } from "./transcript";
import type {
  StoredTrainingCard, TopicId, TrainingAnswer, TrainingDashboard, TrainingMode,
  TrainingScore, TrainingSession, TrainingTranscriptEntry, WeakCard,
} from "./types";

export class TrainingError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "TrainingError";
  }
}

function databaseError(error: { message: string } | null) {
  if (!error) return;
  console.error("[trening/database]", error.message);
  throw new TrainingError("Тренировката няма достъп до базата. Проверете настройките и миграцията.", 503);
}

export function validateMode(tema: TopicId, rejim: TrainingMode) {
  if (rejim === "rolya" && tema !== "skript" && tema !== "vazrazheniya") {
    throw new TrainingError("Ролевата игра е достъпна за Скриптът и Възражения.");
  }
}

export async function createTrainingSession(tema: TopicId, rejim: TrainingMode): Promise<string> {
  validateMode(tema, rejim);
  const { data, error } = await createServiceClient().from("trening_sesii")
    .insert({ tema, rejim }).select("id").single();
  databaseError(error);
  if (!data?.id) throw new TrainingError("Сесията не беше създадена.", 503);
  return data.id;
}

export async function getTrainingSession(sesia: string): Promise<TrainingSession> {
  const { data, error } = await createServiceClient().from("trening_sesii")
    .select("id,created_at,tema,rejim,prodalzhitelnost_sek,zavarshena,transcript")
    .eq("id", sesia).maybeSingle();
  databaseError(error);
  if (!data) throw new TrainingError("Тази тренировъчна сесия не е намерена.", 404);
  return data as TrainingSession;
}

export function assertActiveSession(session: TrainingSession, mode: "voice" | "text") {
  if (session.zavarshena) throw new TrainingError("Тази тренировка вече е приключила.", 409);
  if ((mode === "text") !== (session.rejim === "tekst")) {
    throw new TrainingError("Този инструмент не е за избрания режим.", 409);
  }
}

export function sessionCard(session: Pick<TrainingSession, "tema">, cardId: string): StoredTrainingCard {
  const card = getCards().find((item) => item.id === cardId);
  if (!card) throw new TrainingError("Картата не е намерена.", 404);
  if (card.tema !== session.tema) throw new TrainingError("Картата е от друга тема.", 409);
  return card;
}

export async function getTrainingAnswers(filter: { tema?: TopicId; sesia?: string } = {}): Promise<TrainingAnswer[]> {
  const sb = createServiceClient();
  const { rows, error } = await allRows<TrainingAnswer>((from, to) => {
    let query = sb.from("trening_otgovori")
      .select("id,created_at,sesia_id,card_id,tema,rejim,kazano,ocenka,komentar")
      .order("created_at", { ascending: false }).order("id", { ascending: false });
    if (filter.tema) query = query.eq("tema", filter.tema);
    if (filter.sesia) query = query.eq("sesia_id", filter.sesia);
    return query.range(from, to);
  });
  databaseError(error ? { message: error } : null);
  return rows;
}

export async function nextTrainingCard(session: TrainingSession, requestedCardId?: string) {
  const cards = getCards().filter((card) => card.tema === session.tema);
  if (requestedCardId) return toTrainingCard(sessionCard(session, requestedCardId), Math.max(0, cards.length - 1));
  return chooseNextCard(cards, await getTrainingAnswers({ tema: session.tema }), session.id);
}

export async function saveTrainingAnswer(input: {
  session: TrainingSession;
  card_id: string;
  kazano: string;
  ocenka: TrainingScore;
  komentar: string;
  attempt_id?: string;
}) {
  const { session, card_id, kazano, ocenka, komentar, attempt_id } = input;
  const card = sessionCard(session, card_id);
  const sb = createServiceClient();
  const { error } = await sb.from("trening_otgovori").insert({
    ...(attempt_id ? { id: attempt_id } : {}),
    sesia_id: session.id,
    card_id,
    tema: card.tema,
    rejim: session.rejim,
    kazano,
    ocenka,
    komentar,
  });
  if (error?.code === "23505" && attempt_id) {
    const { data: previous, error: readError } = await sb.from("trening_otgovori")
      .select("sesia_id,card_id,kazano").eq("id", attempt_id).maybeSingle();
    databaseError(readError);
    if (!previous || previous.sesia_id !== session.id || previous.card_id !== card_id || previous.kazano !== kazano) {
      throw new TrainingError("Този опит вече е използван за друг отговор.", 409);
    }
  } else {
    databaseError(error);
  }
  const answers = await getTrainingAnswers({ sesia: session.id });
  return { ok: true as const, tochni: answers.filter((answer) => answer.ocenka === 2).length, obshto: answers.length };
}

export async function finishTextSession(session: TrainingSession) {
  if (session.rejim !== "tekst") throw new TrainingError("Гласовата сесия се приключва от ElevenLabs.", 409);
  if (session.zavarshena) return;
  const answers = await getTrainingAnswers({ sesia: session.id });
  const transcript = buildTextTranscript(getCards(), answers);
  const { error } = await createServiceClient().from("trening_sesii").update({
    zavarshena: true,
    prodalzhitelnost_sek: Math.max(0, Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000)),
    transcript,
  }).eq("id", session.id).eq("zavarshena", false);
  databaseError(error);
}

function normalizeTranscript(transcript: unknown): TrainingTranscriptEntry[] {
  if (!Array.isArray(transcript)) return [];
  return transcript.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object") return [];
    const value = entry as Record<string, unknown>;
    if (typeof value.message !== "string") return [];
    return [{ role: typeof value.role === "string" ? value.role : "agent", message: value.message }];
  });
}

export async function getTrainingDashboard(): Promise<TrainingDashboard> {
  const cards = getCards();
  const base: TrainingDashboard = {
    focus: getFocus(),
    topics: TEMI.map((topic) => ({ ...topic, total: cards.filter((card) => card.tema === topic.id).length, mastery: 0 })),
    weakCards: [],
    history: [],
  };
  try {
    const sb = createServiceClient();
    const [answers, { data: sessions, error }] = await Promise.all([
      getTrainingAnswers(),
      sb.from("trening_sesii").select("id,created_at,tema,rejim,prodalzhitelnost_sek,zavarshena,transcript")
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(10),
    ]);
    databaseError(error);
    const latest = latestAnswers(answers);
    base.topics = base.topics.map((topic) => {
      const mastered = cards.filter((card) => card.tema === topic.id && latest.get(card.id)?.ocenka === 2).length;
      return { ...topic, mastery: topic.total ? Math.round(mastered * 100 / topic.total) : 0 };
    });
    base.weakCards = cards.flatMap((card): WeakCard[] => {
      const ocenka = latest.get(card.id)?.ocenka;
      return ocenka === 0 || ocenka === 1 ? [{ card_id: card.id, tema: card.tema, zaglavie: card.zaglavie, ocenka }] : [];
    }).sort((a, b) => a.ocenka - b.ocenka ||
      (latest.get(a.card_id)?.created_at ?? "").localeCompare(latest.get(b.card_id)?.created_at ?? "")).slice(0, 10);
    base.history = (sessions as TrainingSession[] ?? []).map((session) => {
      const sessionAnswers = answers.filter((answer) => answer.sesia_id === session.id);
      const correct = sessionAnswers.filter((answer) => answer.ocenka === 2).length;
      return {
        ...session,
        answers: sessionAnswers.length,
        correct,
        percent: sessionAnswers.length ? Math.round(correct * 100 / sessionAnswers.length) : 0,
        // При затваряне на таба finish може да изпревари последния INSERT.
        // Историята винаги включва реално записаните текстови отговори.
        transcript: session.rejim === "tekst"
          ? buildTextTranscript(cards, sessionAnswers)
          : normalizeTranscript(session.transcript),
      };
    });
    return base;
  } catch (error) {
    console.error("[trening/dashboard]", error);
    return { ...base, error: "Тренировката няма достъп до базата. Проверете настройките и миграцията, преди да започнете." };
  }
}
