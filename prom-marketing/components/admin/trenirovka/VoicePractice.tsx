"use client";

// The browser entry arms the SDK's iOS audio unlock before the Start tap.
import { Conversation } from "@elevenlabs/client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, Volume2 } from "lucide-react";

type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "finished" | "error";

type Attempt = {
  cancelled: boolean;
  abort: AbortController;
  permissionStream: MediaStream | null;
  conversation: Conversation | null;
  startedAt: number | null;
  sesia: string | null;
  timeout: ReturnType<typeof setTimeout> | null;
};

type VoicePracticeProps = {
  tema: string;
  temaIme: string;
  rejim: "uchi" | "izpit" | "rolya";
  onFinished: () => void;
};

function releaseMicrophone(attempt: Attempt) {
  attempt.permissionStream?.getTracks().forEach((track) => track.stop());
  attempt.permissionStream = null;
}

function cancelAttempt(attempt: Attempt) {
  attempt.cancelled = true;
  attempt.abort.abort();
  releaseMicrophone(attempt);
  if (attempt.timeout) clearTimeout(attempt.timeout);
  attempt.timeout = null;
  const conversation = attempt.conversation;
  attempt.conversation = null;
  // A connection resolving after cancellation is closed in start() as well.
  return conversation?.endSession().catch(() => {});
}

function microphoneError(error: unknown) {
  if (typeof error === "object" && error !== null && "name" in error) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Разреши достъп до микрофона в настройките на Safari за този сайт и опитай пак.";
    }
    if (error.name === "NotFoundError") return "Не е намерен микрофон на това устройство.";
    if (error.name === "NotReadableError") {
      return "Микрофонът е зает. Затвори другия разговор и опитай пак.";
    }
  }
  return "Не успях да свържа разговора. Провери връзката си и опитай пак.";
}

export function VoicePractice({ tema, temaIme, rejim, onFinished }: VoicePracticeProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const mounted = useRef(false);
  const current = useRef<Attempt | null>(null);
  const connected = state === "listening" || state === "speaking";
  const active = state === "connecting" || connected;

  useEffect(() => {
    mounted.current = true;
    const onPageHide = () => {
      if (current.current) {
        void cancelAttempt(current.current);
        current.current = null;
        setState("finished");
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", onPageHide);
      if (current.current) void cancelAttempt(current.current);
      current.current = null;
    };
  }, []);

  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(() => {
      const startedAt = current.current?.startedAt;
      if (startedAt != null) setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [connected]);

  function stop() {
    const attempt = current.current;
    if (!attempt) return;
    current.current = null;
    void cancelAttempt(attempt);
    setState("finished");
    if (attempt.sesia) onFinished();
  }

  async function start() {
    // A synchronous guard also prevents a double tap before React re-renders.
    if (current.current) return;
    const attempt: Attempt = {
      cancelled: false,
      abort: new AbortController(),
      permissionStream: null,
      conversation: null,
      startedAt: null,
      sesia: null,
      timeout: null,
    };
    current.current = attempt;
    setState("connecting");
    setError("");
    setElapsed(0);

    const isCurrent = () => mounted.current && current.current === attempt && !attempt.cancelled;
    const finish = (message?: string) => {
      if (!isCurrent()) return;
      current.current = null;
      void cancelAttempt(attempt);
      setError(message ?? "");
      setState(message ? "error" : "finished");
      if (attempt.sesia) onFinished();
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        finish("Микрофонът не е достъпен. Отвори страницата през HTTPS в Safari или друг съвременен браузър.");
        return;
      }

      // Ask in the user-tap handler, before any fetch/await; never on mount.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isCurrent()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      attempt.permissionStream = stream;
      attempt.timeout = setTimeout(() => {
        finish("Свързването отне твърде дълго. Провери връзката си и опитай пак.");
      }, 30_000);

      const query = new URLSearchParams({ tema, rejim });
      const response = await fetch(`/api/trening/session?${query}`, {
        cache: "no-store",
        signal: attempt.abort.signal,
      });
      const data = (await response.json()) as { signedUrl?: string; sesia?: string; error?: string };
      if (!isCurrent()) return;
      if (!response.ok || !data.signedUrl || !data.sesia) {
        finish(response.status === 401 || response.status === 403
          ? "Сесията за вход е изтекла. Влез отново в администрацията."
          : data.error || "Не мога да отворя разговор в момента.");
        return;
      }
      attempt.sesia = data.sesia;

      const conversation = await Conversation.startSession({
        signedUrl: data.signedUrl,
        connectionType: "websocket",
        textOnly: false,
        dynamicVariables: { tema, tema_ime: temaIme, rejim, sesia: data.sesia },
        onConnect: () => {
          if (!isCurrent()) return;
          if (attempt.timeout) clearTimeout(attempt.timeout);
          attempt.timeout = null;
          attempt.startedAt = Date.now();
          setState("listening");
        },
        onModeChange: ({ mode }) => {
          if (isCurrent()) setState(mode);
        },
        onDisconnect: ({ reason }) => {
          finish(reason === "error" ? "Връзката прекъсна. Можеш да започнеш нов разговор." : undefined);
        },
        onError: () => finish("Възникна проблем с разговора. Опитай пак."),
      });

      releaseMicrophone(attempt);
      if (!isCurrent()) {
        // Stop/unmount can happen while the SDK is still creating its stream.
        await conversation.endSession();
        return;
      }
      attempt.conversation = conversation;
    } catch (cause) {
      finish(microphoneError(cause));
    } finally {
      if (attempt.cancelled) releaseMicrophone(attempt);
    }
  }

  const status = {
    idle: "Готов за разговор",
    connecting: "Свързване…",
    listening: "Слуша те",
    speaking: "Говори",
    finished: "Разговорът приключи",
    error: "Разговорът не е активен",
  }[state];
  const time = `${Math.floor(elapsed / 60).toString().padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6" aria-label="Гласова тренировка">
      <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
        Натисни „Започни“ и разреши микрофона. Говори спокойно, както по време на репетиция.
      </p>

      <div className="my-6 flex flex-wrap items-center justify-between gap-4 text-lg">
        <p role="status" className="flex items-center gap-3 font-medium text-[var(--color-text-primary)]">
          {state === "connecting" ? <Loader2 className="animate-spin" size={24} aria-hidden="true" />
            : state === "speaking" ? <Volume2 size={24} aria-hidden="true" />
              : <Mic size={24} aria-hidden="true" />}
          {status}
        </p>
        <span className="font-mono text-xl tabular-nums text-[var(--color-text-primary)]" aria-label={`Продължителност ${Math.floor(elapsed / 60)} минути и ${elapsed % 60} секунди`}>
          {time}
        </span>
      </div>

      {error && <p role="alert" className="mb-5 text-base leading-relaxed text-red-300">{error}</p>}

      {active ? (
        <button type="button" onClick={stop} className="flex min-h-16 w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-6 py-4 text-xl font-bold text-white transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-300">
          <Square size={24} fill="currentColor" aria-hidden="true" /> Стоп
        </button>
      ) : (
        <button type="button" onClick={() => void start()} className="flex min-h-16 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-xl font-bold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300">
          🎙 {state === "error" ? "Опитай пак" : "Започни"}
        </button>
      )}
      {state === "finished" && <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">Записът и анализът ще се появят в историята след обработката на разговора.</p>}
    </section>
  );
}
