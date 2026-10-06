"use client";
import { useState } from "react";
import { WARMUP_LEVELS, WARMUP_START } from "@/lib/kino/questions";
import { postJson } from "@/lib/kino/browser";
import { track } from "@/lib/analytics/track";

/** „Докато чакаш — 3 въпроса“. Отговорите влизат в картона в CRM-а. */
export function WarmupQuestions({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const timeEater = String(fd.get("timeEater") ?? "").trim();
    const level = String(fd.get("level") ?? "") || undefined;
    const start = String(fd.get("start") ?? "") || undefined;
    if (!timeEater && !level && !start) return setError("Отговори поне на един въпрос — всеки помага.");
    setError(null);
    setState("sending");
    const { ok, data } = await postJson<{ ok?: boolean; error?: string }>("/api/kino/answers", {
      kind: "warmup",
      t: token,
      timeEater: timeEater || undefined,
      level,
      start,
    });
    if (!ok || data.ok === false) {
      setState("idle");
      return setError(data.error ?? "Не стигна до нас — опитай пак.");
    }
    track("kino_warmup", { level, start });
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="k-panel" role="status">
        <p className="k-h3">Благодаря! 🙌</p>
        <p className="k-lead" style={{ marginTop: 6 }}>
          Ще го имам предвид, когато подготвям живата част след филма. До премиерата!
        </p>
      </div>
    );
  }

  return (
    <form className="k-form k-panel" onSubmit={onSubmit} noValidate>
      <label className="k-field">
        <span className="k-label">1. Какво ти яде най-много време в бизнеса?</span>
        <textarea className="k-textarea" name="timeEater" maxLength={600} placeholder="Например: обаждания за едно и също, оферти, социалните мрежи…" />
      </label>
      <fieldset className="k-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="k-label" style={{ marginBottom: 6 }}>
          2. На кое ниво с AI си днес?
        </legend>
        <div className="k-choices">
          {WARMUP_LEVELS.map((c) => (
            <label className="k-choice" key={c.id}>
              <input type="radio" name="level" value={c.id} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="k-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="k-label" style={{ marginBottom: 6 }}>
          3. Кога искаш да започнеш?
        </legend>
        <div className="k-choices k-choices--2">
          {WARMUP_START.map((c) => (
            <label className="k-choice" key={c.id}>
              <input type="radio" name="start" value={c.id} />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-live="polite">{error && <p className="k-error">{error}</p>}</div>
      <button type="submit" className="k-btn k-btn--primary" disabled={state === "sending"}>
        {state === "sending" ? "Изпращаме…" : "Изпрати отговорите"}
      </button>
    </form>
  );
}
