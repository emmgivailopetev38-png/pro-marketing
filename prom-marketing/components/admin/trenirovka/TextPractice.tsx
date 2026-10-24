"use client";

import { useEffect, useRef, useState } from "react";
import type { Comparison } from "@/lib/trening/comparison";
import type { TrainingCard } from "@/lib/trening/types";
import { textRequest, trainingButton, trainingPrimary } from "./text-api";

type Props = {
  sesia: string;
  initialCard: TrainingCard | null;
  onFinished: () => void;
};

type AnswerResult = { comparison: Comparison; ok: true; tochni: number; obshto: number };

export function TextPractice({ sesia, initialCard, onFinished }: Props) {
  const [card, setCard] = useState(initialCard);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [explanation, setExplanation] = useState(false);
  const [busy, setBusy] = useState<"check" | "next" | "finish" | null>(null);
  const [error, setError] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const inFlight = useRef(false);
  const completed = useRef(false);
  const mounted = useRef(false);
  const pendingAnswer = useRef<Promise<AnswerResult> | null>(null);
  const closing = useRef(false);
  const attemptId = useRef<string | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const feedback = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mounted.current = true;
    window.speechSynthesis?.getVoices();
    const closeSession = () => {
      if (completed.current || closing.current) return;
      closing.current = true;
      const send = () => fetch("/api/trening/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "finish", sesia }),
          keepalive: true,
        }).catch(() => {});
      // A card already being checked must land before the transcript is built.
      if (pendingAnswer.current) void pendingAnswer.current.then(send, send);
      else void send();
    };
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted && closing.current) onFinished();
    };
    window.addEventListener("pagehide", closeSession);
    window.addEventListener("pageshow", restore);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", closeSession);
      window.removeEventListener("pageshow", restore);
      window.speechSynthesis?.cancel();
      // React development mode replays effects. Only finish a real unmount.
      queueMicrotask(() => { if (!mounted.current) closeSession(); });
    };
  }, [sesia, onFinished]);

  useEffect(() => {
    if (result) feedback.current?.focus();
  }, [result]);

  async function check() {
    if (!card || inFlight.current || result || !answer.trim()) return;
    inFlight.current = true;
    setBusy("check");
    setError("");
    attemptId.current ??= crypto.randomUUID();
    try {
      const request = textRequest<AnswerResult>({
        action: "answer", sesia, card_id: card.card_id, kazano: answer, attempt_id: attemptId.current,
      });
      pendingAnswer.current = request;
      setResult(await request);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Отговорът не е записан. Опитай отново.");
    } finally {
      inFlight.current = false;
      pendingAnswer.current = null;
      setBusy(null);
    }
  }

  function reset() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setResult(null);
    setAnswer("");
    setError("");
    setSpeechError("");
    attemptId.current = null;
    textarea.current?.focus();
  }

  async function next() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy("next");
    setError("");
    try {
      const data = await textRequest<{ card: TrainingCard | null }>({ action: "next", sesia });
      setCard(data.card);
      reset();
      setExplanation(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Картата не се зареди. Опитай отново.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  async function finish() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy("finish");
    setError("");
    try {
      await textRequest({ action: "finish", sesia });
      completed.current = true;
      onFinished();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Сесията не се приключи. Опитай отново.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  function speak() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSpeechError("Този браузър не поддържа прочитане на текста.");
      return;
    }
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    if (!card) return;
    setSpeechError("");
    const utterance = new SpeechSynthesisUtterance(card.otgovor);
    utterance.lang = "bg-BG";
    const voice = window.speechSynthesis.getVoices().find((item) => /^bg(?:[-_]|$)/i.test(item.lang));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (event) => {
      setSpeaking(false);
      if (event.error !== "canceled" && event.error !== "interrupted") {
        setSpeechError("Прочитането не е налично. Провери дали имаш български глас в настройките на телефона.");
      }
    };
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section className="space-y-5" aria-label="Тренировка без глас" aria-busy={busy !== null}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold">✍️ Без глас · безплатно</p>
        <button type="button" className={trainingButton} onClick={finish} disabled={busy !== null}>
          {busy === "finish" ? "Приключване…" : "Приключи"}
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-base text-red-200">{error}</p>}
      {!card ? (
        <p className="rounded-xl border border-dashed p-6 text-lg">В тази тема още няма карти.</p>
      ) : (
        <div className="space-y-6 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-5 sm:p-7">
          <div>
            <p className="text-base text-[var(--color-text-secondary)]">След тази карта: {card.ostavat} в текущия кръг</p>
            <h3 className="mt-2 text-2xl font-semibold leading-snug">{card.zaglavie}</h3>
            <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed">{card.vapros}</p>
          </div>
          <div>
            <label htmlFor="training-answer" className="mb-3 block text-base font-semibold">Твоят отговор</label>
            <textarea
              ref={textarea}
              id="training-answer"
              value={answer}
              onChange={(event) => { setAnswer(event.target.value); attemptId.current = null; }}
              readOnly={result !== null || busy !== null}
              maxLength={20000}
              rows={6}
              className="min-h-48 w-full resize-y rounded-xl p-4 text-lg leading-relaxed"
              placeholder="Напиши или използвай диктовката на клавиатурата…"
              autoCapitalize="sentences"
            />
            {!result && (
              <button type="button" onClick={check} disabled={!answer.trim() || busy !== null} className={`${trainingPrimary} mt-4 w-full`}>
                {busy === "check" ? "Проверка и запис…" : "Провери"}
              </button>
            )}
          </div>
          {result && (
            <div ref={feedback} tabIndex={-1} className="space-y-5 rounded-xl border border-cyan-300/30 p-4 sm:p-5" aria-live="polite">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <strong className="text-4xl text-cyan-200">{result.comparison.percent}%</strong>
                <span className="text-lg">съвпадение · {result.comparison.ocenka === 2 ? "Точно" : result.comparison.ocenka === 1 ? "Още малко" : "Повтори"}</span>
              </div>
              <p className="text-base text-[var(--color-text-secondary)]">Записано · {result.tochni} точни от {result.obshto} отговора в сесията</p>
              <div>
                <h4 className="text-lg font-semibold">Оригиналът</h4>
                <p className="mt-2 text-base text-[var(--color-text-secondary)]">В жълто са липсващите или разместени думи. Допълнителните думи също намаляват процента.</p>
                <p className="mt-4 whitespace-pre-wrap text-xl leading-loose">
                  {result.comparison.words.map((word, index) => word.matched
                    ? <span key={index}>{word.text}</span>
                    : <mark key={index} className="rounded bg-amber-200 px-0.5 text-slate-950">{word.text}</mark>)}
                </p>
              </div>
              <button type="button" onClick={speak} className={`${trainingButton} w-full`}>
                {speaking ? "⏹ Спри прочитането" : "🔊 Чуй оригинала"}
              </button>
              {speechError && <p role="status" className="text-base text-amber-200">{speechError}</p>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" className={trainingButton} onClick={reset} disabled={busy !== null}>Пак</button>
                <button type="button" className={trainingPrimary} onClick={next} disabled={busy !== null}>
                  {busy === "next" ? "Зареждане…" : "Следваща →"}
                </button>
              </div>
            </div>
          )}
          <div>
            <button type="button" className={`${trainingButton} w-full text-left`} aria-expanded={explanation} aria-controls="training-explanation" onClick={() => setExplanation(!explanation)}>
              {explanation ? "Скрий обяснението" : "Покажи обяснението"}
            </button>
            {explanation && <p id="training-explanation" className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-[var(--color-text-secondary)]">{card.obyasnenie || "Към тази карта още няма обяснение от Георги."}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
