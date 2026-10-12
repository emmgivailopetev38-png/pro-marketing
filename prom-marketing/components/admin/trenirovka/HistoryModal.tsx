"use client";

import { useEffect, useRef } from "react";
import type { TrainingHistory } from "@/lib/trening/types";
import { trainingButton } from "./text-api";

export const modeLabels = {
  uchi: "Обясни ми",
  izpit: "Изпитай ме",
  rolya: "Ролева игра",
  tekst: "Без глас",
};

export function formatTrainingDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia",
  }).format(new Date(value));
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} мин`;
}

export function HistoryModal({ session, topicLabel, onClose }: { session: TrainingHistory; topicLabel: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="training-history-title"
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-slate-600 bg-slate-950 p-0 text-base text-slate-100 shadow-2xl backdrop:bg-black/75"
    >
      <div className="flex max-h-[90dvh] flex-col">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-slate-700 p-5">
          <div className="min-w-0 flex-1">
            <h2 id="training-history-title" className="text-2xl font-semibold">{topicLabel}</h2>
            <p className="mt-2 text-base text-slate-300">{modeLabels[session.rejim]} · {formatTrainingDate(session.created_at)}</p>
          </div>
          <button type="button" className={trainingButton} onClick={onClose}>Затвори</button>
        </header>
        <div className="space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <p className="text-base text-slate-300">{formatDuration(session.prodalzhitelnost_sek)} · {session.answers} отговора · {session.percent}% точни</p>
          {session.transcript.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 p-5 text-lg leading-relaxed">
              {session.rejim === "tekst" ? "В тази сесия няма записани отговори." : "Транскриптът още не е получен. Отвори историята отново след малко."}
            </p>
          ) : (
            <ol className="space-y-4">
              {session.transcript.map((entry, index) => (
                <li key={index} className={`rounded-xl border p-4 ${entry.role === "user" ? "border-cyan-300/30 bg-cyan-300/5" : "border-slate-700 bg-slate-900"}`}>
                  <p className="mb-2 text-base font-semibold text-cyan-200">{entry.role === "user" ? "Ти" : entry.role === "agent" || entry.role === "assistant" ? "Треньор" : "Система"}</p>
                  <p className="whitespace-pre-wrap break-words text-lg leading-relaxed">{entry.message}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </dialog>
  );
}
