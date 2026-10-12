"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TopicId, TopicProgress, TrainingCard, TrainingDashboard as DashboardData, TrainingHistory, TrainingMode } from "@/lib/trening/types";
import { TextPractice } from "./TextPractice";
import { VoicePractice } from "./VoicePractice";
import { formatDuration, formatTrainingDate, HistoryModal, modeLabels } from "./HistoryModal";
import { textRequest, trainingButton } from "./text-api";

type TextSession = { sesia: string; card: TrainingCard | null };

const modes: Array<{ id: TrainingMode; title: string; description: string }> = [
  { id: "uchi", title: "🎓 Обясни ми", description: "Чуй обяснението и упражни формулировката." },
  { id: "izpit", title: "❓ Изпитай ме", description: "Възпроизведи оригинала по памет." },
  { id: "rolya", title: "🎭 Ролева игра", description: "Упражни разговор с гласовия треньор." },
  { id: "tekst", title: "✍️ Без глас (безплатно)", description: "Напиши или продиктувай. Сравни с оригинала." },
];

export function TrainingDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [topic, setTopic] = useState<TopicProgress | null>(null);
  const [mode, setMode] = useState<TrainingMode | null>(null);
  const [textSession, setTextSession] = useState<TextSession | null>(null);
  const [history, setHistory] = useState<TrainingHistory | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const starting = useRef(false);

  function selectTopic(value: TopicProgress) {
    if (starting.current) return;
    setTopic(value);
    setMode(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function startText(tema: TopicId, card_id?: string) {
    if (starting.current) return;
    starting.current = true;
    setBusy(true);
    setError("");
    try {
      const session = await textRequest<TextSession>({ action: "start", tema, ...(card_id ? { card_id } : {}) });
      setTopic(data.topics.find((item) => item.id === tema) ?? null);
      setTextSession(session);
      setMode("tekst");
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Тренировката не започна. Опитай отново.");
    } finally {
      starting.current = false;
      setBusy(false);
    }
  }

  function finish() {
    setTopic(null);
    setMode(null);
    setTextSession(null);
    setError("");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7 break-words px-4 pb-36 pt-6 text-base sm:px-6 sm:pt-10 lg:px-10">
      <header className="space-y-3">
        <p className="text-base font-semibold text-[var(--color-accent-cyan)]">Малко всеки ден. Дума по дума.</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Тренировка <span className="text-[var(--color-text-secondary)]">· менторството на Георги</span></h1>
      </header>

      {(data.error || error) && <p role="alert" className="rounded-xl border border-amber-300/40 bg-amber-300/10 p-5 text-base leading-relaxed text-amber-100">{error || data.error}</p>}

      {topic ? (
        <section className="space-y-5" aria-label={`Тренировка: ${topic.label}`}>
          {mode !== "tekst" && (
            <button type="button" onClick={finish} className={trainingButton} disabled={busy}>← Всички теми</button>
          )}
          <h2 className="text-2xl font-semibold">{topic.emoji} {topic.label}</h2>
          {!mode ? (
            <div className="space-y-4">
              <p className="text-lg text-[var(--color-text-secondary)]">Как искаш да тренираш?</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {modes.filter((item) => item.id !== "rolya" || topic.id === "skript" || topic.id === "vazrazheniya").map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={busy}
                    onClick={() => item.id === "tekst" ? void startText(topic.id) : setMode(item.id)}
                    className={`${trainingButton} min-h-32 bg-[var(--color-bg-secondary)] text-left`}
                  >
                    <span className="block text-xl">{busy && item.id === "tekst" ? "Зареждане…" : item.title}</span>
                    <span className="mt-3 block text-base font-normal leading-relaxed text-[var(--color-text-secondary)]">{item.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : mode === "tekst" && textSession ? (
            <TextPractice key={textSession.sesia} sesia={textSession.sesia} initialCard={textSession.card} onFinished={finish} />
          ) : mode !== "tekst" ? (
            <VoicePractice key={`${topic.id}:${mode}`} tema={topic.id} temaIme={topic.label} rejim={mode} onFinished={() => router.refresh()} />
          ) : null}
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-cyan-300/30 bg-cyan-300/5 p-5 sm:p-7" aria-labelledby="training-focus">
            <h2 id="training-focus" className="text-xl font-semibold text-cyan-200">Днес фокус</h2>
            <p className="mt-3 text-xl leading-relaxed">{data.focus.zaglavie}</p>
            {data.focus.tochki.length > 0 && <ul className="mt-4 list-disc space-y-2 pl-6 text-lg leading-relaxed text-[var(--color-text-secondary)]">{data.focus.tochki.map((point, index) => <li key={index}>{point}</li>)}</ul>}
          </section>

          <section className="space-y-4" aria-labelledby="training-topics">
            <div>
              <h2 id="training-topics" className="text-2xl font-semibold">Избери тема</h2>
              <p className="mt-2 text-base leading-relaxed text-[var(--color-text-secondary)]">Напредъкът показва картите с точен последен отговор.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {data.topics.map((item) => (
                <button key={item.id} type="button" disabled={busy} onClick={() => selectTopic(item)} className={`${trainingButton} flex min-h-44 flex-col items-start gap-3 bg-[var(--color-bg-secondary)] px-4 text-left`}>
                  <span aria-hidden="true" className="text-3xl">{item.emoji}</span>
                  <span className="text-lg leading-snug [overflow-wrap:anywhere]">{item.label}</span>
                  <span className="mt-auto flex w-full flex-wrap items-center justify-between gap-x-2 text-base font-normal text-[var(--color-text-secondary)]"><span>{item.mastery}%</span><span>{item.total} карти</span></span>
                  <span aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-cyan-300" style={{ width: `${item.mastery}%` }} /></span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="training-weak">
            <h2 id="training-weak" className="text-2xl font-semibold">Слаби места</h2>
            {data.weakCards.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-lg leading-relaxed text-[var(--color-text-secondary)]">Тук ще се появят картите за повторение след първите ти отговори.</p> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.weakCards.map((card) => (
                  <button key={card.card_id} type="button" className={`${trainingButton} text-left`} disabled={busy} onClick={() => void startText(card.tema, card.card_id)}>
                    <span className="block text-lg">{card.zaglavie}</span>
                    <span className="mt-2 block text-base font-normal text-[var(--color-text-secondary)]">{data.topics.find((item) => item.id === card.tema)?.label} · {card.ocenka === 0 ? "За повторение" : "Още малко"} →</span>
                  </button>
                ))}
              </div>
            )}
            {busy && <p role="status" className="text-lg text-cyan-200">Зареждане на тренировката…</p>}
          </section>

          <section className="space-y-4" aria-labelledby="training-history">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="training-history" className="text-2xl font-semibold">История</h2>
              <button type="button" className={trainingButton} onClick={() => router.refresh()}>Обнови</button>
            </div>
            {data.history.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-lg text-[var(--color-text-secondary)]">Първата ти тренировка започва с избор на тема.</p> : (
              <ol className="space-y-3">
                {data.history.map((session) => (
                  <li key={session.id}>
                    <button type="button" onClick={() => setHistory(session)} className={`${trainingButton} w-full space-y-2 text-left`}>
                      <span className="block text-lg">{data.topics.find((item) => item.id === session.tema)?.label || session.tema} · {modeLabels[session.rejim]}</span>
                      <span className="block text-base font-normal text-[var(--color-text-secondary)]">{formatTrainingDate(session.created_at)} · {formatDuration(session.prodalzhitelnost_sek)}</span>
                      <span className="block text-base font-normal text-cyan-200">{session.answers} отговора · {session.percent}% точни · {session.zavarshena ? "Приключена" : "Неприключена"}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
      {history && <HistoryModal session={history} topicLabel={data.topics.find((item) => item.id === history.tema)?.label || history.tema} onClose={() => setHistory(null)} />}
    </div>
  );
}
