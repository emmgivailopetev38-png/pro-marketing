"use client";
import { useState } from "react";
import { track } from "@/lib/analytics/track";
import { trackCustom } from "@/lib/meta/pixel-client";
import type { VslQuestion } from "@/lib/site/vsl";

const INPUT =
  "w-full rounded-xl border border-white/10 bg-[#0b0b0d] px-4 py-3 text-base text-white placeholder:text-[#5f5f68] outline-none transition focus:border-[#facc15]/60 focus:ring-2 focus:ring-[#facc15]/20";

/**
 * Въпросите преди срещата. Отговорите отиват при Георги (или при Ивайло с
 * `?ot=ivailo`) и в картона на човека — `/api/vsl/vaprosi`. Задължителни са
 * само името и телефонът (по телефона се намира картонът); всичко друго е
 * „каквото можеш“, за да не плаши.
 */
export function VslQuestions({
  vsl,
  questions,
  host,
  defaultName,
  ot,
}: {
  vsl: string;
  questions: VslQuestion[];
  host: string;
  defaultName: string | null;
  ot: string | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState(defaultName ?? "");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const first = host.split(" ")[0];
  const set = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    if (phone.replace(/\D/g, "").length < 9) {
      setError(`Напиши телефона, с който си записан — по него ${first} ще те разпознае.`);
      return;
    }
    setState("sending");
    setError(null);
    try {
      const r = await fetch("/api/vsl/vaprosi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vsl, name, phone, answers, ot: ot ?? undefined, website }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Не успяхме да ги изпратим. Опитай пак след малко.");
      setState("done");
      const filled = Object.values(answers).filter((v) => v.trim()).length;
      track("vsl_answers", { vsl, filled });
      trackCustom("VslAnswers", { vsl, filled });
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Не успяхме да ги изпратим. Опитай пак след малко.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-[#4ade80]/30 bg-[#4ade80]/[0.06] p-8 text-center">
        <p className="text-4xl">✅</p>
        <h3 className="mt-3 font-display text-2xl font-bold">Получихме ги, благодарим!</h3>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-[#c9c9d1]">
          {host} ще ги прочете преди срещата и ще дойде подготвен за теб. Ако се сетиш за още нещо — питай го направо на
          срещата.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-white/10 bg-[#111114] p-5 sm:p-8">
      {questions.map((q, i) => (
        <fieldset key={q.key}>
          <legend className="mb-2 flex gap-2 text-base font-semibold text-white">
            <span className="text-[#facc15]">{i + 1}.</span>
            {q.label}
          </legend>
          {q.choices ? (
            <div className="flex flex-wrap gap-2">
              {q.choices.map((ch) => {
                const on = answers[q.key] === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => set(q.key, on ? "" : ch)}
                    aria-pressed={on}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      on
                        ? "border-[#facc15] bg-[#facc15] font-semibold text-[#0b0b0d]"
                        : "border-white/15 text-[#d4d4d8] hover:border-[#facc15]/50"
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          ) : q.long ? (
            <textarea
              value={answers[q.key] ?? ""}
              onChange={(e) => set(q.key, e.target.value)}
              placeholder={q.hint}
              rows={q.key === "firma" || q.key === "sega" ? 5 : 3}
              maxLength={3000}
              className={`${INPUT} resize-y leading-relaxed`}
            />
          ) : (
            <input
              value={answers[q.key] ?? ""}
              onChange={(e) => set(q.key, e.target.value)}
              placeholder={q.hint}
              maxLength={300}
              className={INPUT}
            />
          )}
        </fieldset>
      ))}

      <div className="grid gap-4 border-t border-white/[0.08] pt-6 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white">Име *</span>
          <input
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white">Телефон, с който си записан *</span>
          <input
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={30}
            placeholder="08…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={INPUT}
          />
        </label>
      </div>

      {/* Капан за ботове — човек не го вижда. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        aria-hidden
      />

      {error && <p className="rounded-xl bg-[#f87171]/10 px-4 py-3 text-sm text-[#fca5a5]">{error}</p>}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-full bg-[#facc15] px-7 py-4 text-base font-bold text-[#0b0b0d] transition hover:bg-[#fde047] disabled:opacity-60"
      >
        {state === "sending" ? "Изпращам…" : `Изпрати на ${first} →`}
      </button>
      <p className="text-center text-xs leading-relaxed text-[#6b6b74]">
        Отговорите отиват само при {first} и се ползват за срещата ти ·{" "}
        <a href="/privacy" className="underline hover:text-[#a1a1aa]">
          Поверителност
        </a>
      </p>
    </form>
  );
}
