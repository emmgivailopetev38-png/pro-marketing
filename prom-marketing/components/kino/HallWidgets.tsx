"use client";
import { useEffect, useRef, useState } from "react";
import { costOfWaiting } from "@/lib/kino/people";
import { formatEur } from "@/lib/kino/pricing";
import { postJson } from "@/lib/kino/browser";
import { NUMBER_QUESTION, NUMBER_MAX_HOURS, cleanHours } from "@/lib/kino/questions";
import { track } from "@/lib/analytics/track";

/* Малките неща под екрана: калкулаторът, въпросите, „Твоето число“. */

/**
 * „Колко ти струва чакането“ — запитвания седмично × 52 × % клиенти ×
 * стойност на клиента. Сметката е по числата на човека; отива в CRM-а чак
 * когато спре да ги пипа (2,5 s), и само ако ги е пипал.
 */
export function WaitingCalculator({ token }: { token: string | null }) {
  const [inquiries, setInquiries] = useState(5);
  const [rate, setRate] = useState(20);
  const [value, setValue] = useState(300);
  const touched = useRef(false);
  const r = costOfWaiting({ inquiriesPerWeek: inquiries, closeRatePct: rate, clientValueEur: value });

  useEffect(() => {
    if (!touched.current || !token) return;
    const id = window.setTimeout(() => {
      void postJson("/api/kino/track", { k: "ev", t: token, type: "calc", meta: { inquiries, rate, value } });
      track("kino_calc", { yearly: Math.round(r.yearlyEur) });
    }, 2500);
    return () => window.clearTimeout(id);
  }, [inquiries, rate, value, token, r.yearlyEur]);

  const num = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    touched.current = true;
    set(Number(e.target.value.replace(",", ".")) || 0);
  };

  return (
    <div className="k-panel">
      <p className="k-h3">🧮 Колко ти струва чакането?</p>
      <p className="k-muted" style={{ margin: "6px 0 0", fontSize: "0.9rem" }}>
        Груба сметка по твоите числа — не обещание. Колко клиенти си отиват, защото никой не вдига навреме.
      </p>
      <div className="k-calc-grid">
        <label className="k-field">
          <span className="k-label">Запитвания седмично, които изпускаш</span>
          <input className="k-input" type="number" inputMode="numeric" min={0} value={inquiries} onChange={num(setInquiries)} />
        </label>
        <label className="k-field">
          <span className="k-label">От тях стават клиенти (%)</span>
          <input className="k-input" type="number" inputMode="numeric" min={0} max={100} value={rate} onChange={num(setRate)} />
        </label>
        <label className="k-field">
          <span className="k-label">Един клиент ти носи (€)</span>
          <input className="k-input" type="number" inputMode="numeric" min={0} value={value} onChange={num(setValue)} />
        </label>
      </div>
      <div className="k-calc-out" aria-live="polite">
        <span className="k-muted" style={{ fontSize: "0.85rem" }}>
          Чакането ти струва около
        </span>
        <div className="k-calc-big">{formatEur(Math.round(r.yearlyEur))} на година</div>
        <span className="k-muted" style={{ fontSize: "0.88rem" }}>
          ≈ {formatEur(Math.round(r.monthlyEur))} на месец · {Math.round(r.clientsPerYear)} клиента годишно
        </span>
      </div>
    </div>
  );
}

/**
 * „Твоето число“ (сцена 9.7) — полето под филма: колко часа седмично отиват в
 * повтаряща се работа. Отива в картона (kino_number) — Димитър го вижда първо
 * в списъците, а поканата го връща на човека („точно тези часове…“). Може да
 * се поправи — важи последното.
 */
export function NumberBox({
  token,
  pos,
  saved,
  onSaved,
}: {
  token: string | null;
  pos: () => number;
  saved: number | null;
  onSaved: (hours: number) => void;
}) {
  const [value, setValue] = useState(saved != null ? String(saved) : "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typed = cleanHours(value);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (typed == null || value.trim() === "") return setError("Само числото — например 10.");
    setError(null);
    if (typed === saved) return; // вече е записано
    if (!token) return onSaved(typed); // прегледът — без запис
    setSending(true);
    const { ok, data } = await postJson<{ hours?: number; error?: string }>("/api/kino/answers", {
      kind: "number",
      t: token,
      hours: typed,
      pos: Math.round(pos()),
    });
    setSending(false);
    if (!ok) return setError(data.error ?? "Не се записа. Опитай пак.");
    onSaved(data.hours ?? typed);
    track("kino_number", { hours: typed });
  }

  return (
    <form className="k-panel k-number" onSubmit={send} noValidate>
      <span className="k-kicker">Твоето число</span>
      <label className="k-h3" htmlFor="k-number-in" style={{ display: "block", marginTop: 6 }}>
        {NUMBER_QUESTION}
      </label>
      <div className="k-number-row">
        <input
          id="k-number-in"
          className="k-input"
          type="number"
          inputMode="decimal"
          min={0}
          max={NUMBER_MAX_HOURS}
          step="0.5"
          placeholder="10"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <span className="k-muted">часа седмично</span>
        <button type="submit" className="k-btn k-btn--primary" disabled={sending}>
          {sending ? "…" : saved != null && typed === saved ? "✓ Записано" : "Запиши"}
        </button>
      </div>
      <div aria-live="polite">
        {error ? (
          <p className="k-error" style={{ marginTop: 10 }}>
            {error}
          </p>
        ) : saved != null ? (
          <p className="k-muted" style={{ margin: "10px 0 0" }}>
            ≈ {Math.round(saved * 52)} часа в годината. Ще ни трябва след малко.
          </p>
        ) : (
          <p className="k-muted" style={{ margin: "10px 0 0" }}>
            Само числото — на око е достатъчно.
          </p>
        )}
      </div>
    </form>
  );
}

/** Въпрос към Ивайло → картонът в CRM-а + живият списък в Режисьорската кабина (/admin/kino). */
export function QuestionBox({ token, pos }: { token: string | null; pos: () => number }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (q.length < 2) return setError("Напиши въпроса си.");
    if (!token) return setError("Въпросите се пращат с личния линк от билета.");
    setError(null);
    setState("sending");
    const { ok } = await postJson("/api/kino/track", { k: "q", t: token, text: q, pos: Math.round(pos()) });
    if (!ok) {
      setState("idle");
      return setError("Не стигна до нас — опитай пак.");
    }
    track("kino_question");
    setText("");
    setState("sent");
  }

  return (
    <form className="k-panel k-form" style={{ marginTop: 0 }} onSubmit={send}>
      <p className="k-h3">❓ Въпрос към Ивайло</p>
      <p className="k-muted" style={{ margin: 0, fontSize: "0.9rem" }}>
        Напиши въпроса си — ще го обсъдим на срещата после.
      </p>
      <textarea
        className="k-textarea"
        value={text}
        maxLength={1000}
        onChange={(e) => {
          setText(e.target.value);
          if (state === "sent") setState("idle");
        }}
        placeholder="Например: колко време отнема да тръгне първият AI служител?"
        aria-label="Твоят въпрос"
      />
      <div aria-live="polite">
        {error && <p className="k-error">{error}</p>}
        {state === "sent" && <p className="k-ok">Получих го — ще го обсъдим на срещата. 🙌</p>}
      </div>
      <button type="submit" className="k-btn" disabled={state === "sending"}>
        {state === "sending" ? "Изпращаме…" : "Изпрати въпроса"}
      </button>
    </form>
  );
}
