"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Loader2, AlertTriangle } from "lucide-react";

/**
 * Бутонът, с който Ивайло говори на агента.
 *
 * Агентът в ElevenLabs е ЧАСТЕН — затова първо се иска подписан адрес от
 * /api/voice/session (който проверява админ бисквитката), и чак тогава се
 * зарежда говорителят. Няма agent-id в HTML-а: ако имаше, всеки, който отвори
 * кода на страницата, щеше да може да говори с CRM-а.
 */

const WIDGET_SRC = "https://unpkg.com/@elevenlabs/convai-widget-embed";

type State = "idle" | "loading" | "ready" | "error";

export function VoiceButton() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");
  const holder = useRef<HTMLDivElement>(null);

  // Скриптът се зарежда веднъж и остава — второ натискане не го дублира.
  useEffect(() => {
    if (state !== "ready") return;
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = WIDGET_SRC;
    s.async = true;
    s.type = "text/javascript";
    document.body.appendChild(s);
  }, [state]);

  async function start() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/voice/session", { cache: "no-store" });
      const data = (await res.json()) as { signed_url?: string; error?: string; detail?: string };

      if (!res.ok || !data.signed_url) {
        setState("error");
        setMessage(
          data.error === "not_configured"
            ? "Липсват ELEVENLABS_API_KEY и ELEVENLABS_AGENT_ID във Vercel."
            : "Не мога да отворя разговор в момента."
        );
        return;
      }

      // Елементът се създава ръчно, защото signed-url се знае чак сега.
      if (holder.current) {
        holder.current.innerHTML = "";
        const el = document.createElement("elevenlabs-convai");
        el.setAttribute("signed-url", data.signed_url);
        holder.current.appendChild(el);
      }
      setState("ready");
    } catch {
      setState("error");
      setMessage("Няма връзка със сървъра.");
    }
  }

  return (
    <div>
      {state !== "ready" && (
        <button
          type="button"
          onClick={start}
          disabled={state === "loading"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 22px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 999,
            border: "none",
            cursor: state === "loading" ? "wait" : "pointer",
            background: state === "error" ? "#7f1d1d" : "#2563eb",
            color: "#fff",
            // Пръст, не мишка: 44px е минимумът за натискане на телефон.
            minHeight: 48,
          }}
        >
          {state === "loading" ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
          {state === "loading" ? "Свързвам…" : state === "error" ? "Опитай пак" : "Говори с агента"}
        </button>
      )}

      {message && (
        <p style={{ marginTop: 12, color: "#fca5a5", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} />
          {message}
        </p>
      )}

      <div ref={holder} style={{ marginTop: 16 }} />
    </div>
  );
}
