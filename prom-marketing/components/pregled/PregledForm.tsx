"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnswerRow, ReviewItem, Verdict } from "@/lib/pregled/types";

/**
 * Живата част на /pregled/<ключ>.
 *
 * Правилата, по които е направена:
 *   - всяко натискане се записва ВЕДНАГА (upsert), за да не се губи нищо,
 *     ако човекът затвори телефона по средата;
 *   - бележката се записва 700 ms след последната буква и при излизане от полето;
 *   - „Одобри всички“ одобрява само тези, които не са изрично върнати;
 *   - „Изпрати избора“ праща всички отговори наведнъж и чак тогава
 *     сървърът известява собственика — един имейл, не тринайсет.
 */

type Answer = { verdict: Verdict | null; comment: string };
type SaveState = "idle" | "saving" | "saved" | "error";

interface Props {
  reviewKey: string;
  items: ReviewItem[];
  initialAnswers: AnswerRow[];
}

function initialState(items: ReviewItem[], rows: AnswerRow[]): Record<string, Answer> {
  const byCode = new Map(rows.map((r) => [r.item_code, r]));
  const out: Record<string, Answer> = {};
  for (const it of items) {
    const r = byCode.get(it.code);
    out[it.code] = { verdict: r?.verdict ?? null, comment: r?.comment ?? "" };
  }
  return out;
}

export function PregledForm({ reviewKey, items, initialAnswers }: Props) {
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => initialState(items, initialAnswers));
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ approved: number; rejected: number; pending: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Истината живее в ref-а (за да не се чете стар state в обработчиците),
  // а state-ът е огледало за рендера. Ref-ът се пипа само в обработчици.
  const answersRef = useRef<Record<string, Answer>>(initialState(items, initialAnswers));
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});
  const doneRef = useRef<HTMLDivElement | null>(null);

  const save = useCallback(
    async (payload: { code: string; verdict: Verdict | null; comment: string }[]) => {
      const codes = payload.map((p) => p.code);
      setSaveState((s) => ({ ...s, ...Object.fromEntries(codes.map((c) => [c, "saving" as SaveState])) }));
      try {
        const res = await fetch(`/api/pregled/${encodeURIComponent(reviewKey)}/otgovor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payload }),
        });
        const json = await res.json().catch(() => ({}));
        const ok = res.ok && json?.ok;
        setSaveState((s) => ({ ...s, ...Object.fromEntries(codes.map((c) => [c, (ok ? "saved" : "error") as SaveState])) }));
      } catch {
        setSaveState((s) => ({ ...s, ...Object.fromEntries(codes.map((c) => [c, "error" as SaveState])) }));
      }
    },
    [reviewKey]
  );

  const commit = (updated: Record<string, Answer>) => {
    answersRef.current = updated;
    setAnswers(updated);
  };

  const flushTimer = (code: string) => {
    const t = timers.current[code];
    if (t) {
      clearTimeout(t);
      delete timers.current[code];
    }
  };

  const setVerdict = (code: string, verdict: Verdict) => {
    const prev = answersRef.current[code];
    const next: Answer = { ...prev, verdict: prev.verdict === verdict ? null : verdict }; // второ натискане = отказ
    commit({ ...answersRef.current, [code]: next });
    flushTimer(code);
    void save([{ code, ...next }]);
  };

  const setComment = (code: string, comment: string) => {
    const next: Answer = { ...answersRef.current[code], comment };
    commit({ ...answersRef.current, [code]: next });
    flushTimer(code);
    timers.current[code] = setTimeout(() => {
      delete timers.current[code];
      void save([{ code, ...answersRef.current[code] }]);
    }, 700);
  };

  const commentBlur = (code: string) => {
    if (timers.current[code]) {
      flushTimer(code);
      void save([{ code, ...answersRef.current[code] }]);
    }
  };

  const approveAll = () => {
    const codes = items.filter((it) => answersRef.current[it.code].verdict !== "rejected").map((it) => it.code);
    if (!codes.length) return;
    const updated = { ...answersRef.current };
    for (const c of codes) updated[c] = { ...updated[c], verdict: "approved" };
    commit(updated);
    void save(codes.map((code) => ({ code, ...updated[code] })));
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    for (const code of Object.keys(timers.current)) flushTimer(code);
    const current = answersRef.current;
    const payload = items.map((it) => ({ code: it.code, verdict: current[it.code].verdict, comment: current[it.code].comment }));
    try {
      const res = await fetch(`/api/pregled/${encodeURIComponent(reviewKey)}/izprati`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.ok) {
        setDone({ approved: json.approved, rejected: json.rejected, pending: json.pending });
        setSaveState(Object.fromEntries(items.map((it) => [it.code, "saved" as SaveState])));
        setTimeout(() => doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      } else {
        setSubmitError("Не успяхме да изпратим. Опитайте пак след малко — изборът Ви е запазен.");
      }
    } catch {
      setSubmitError("Няма връзка. Опитайте пак след малко — изборът Ви е запазен.");
    } finally {
      setSubmitting(false);
    }
  };

  // Един клип свири в даден момент — иначе на телефона се чуват два гласа.
  const onPlay = (code: string) => {
    for (const [c, v] of Object.entries(videos.current)) {
      if (c !== code && v && !v.paused) v.pause();
    }
  };

  useEffect(() => {
    const t = timers.current;
    return () => {
      for (const id of Object.values(t)) clearTimeout(id);
    };
  }, []);

  const counts = useMemo(() => {
    let ok = 0;
    let ne = 0;
    for (const it of items) {
      const v = answers[it.code]?.verdict;
      if (v === "approved") ok++;
      else if (v === "rejected") ne++;
    }
    return { ok, ne, ostavat: items.length - ok - ne };
  }, [answers, items]);

  const allDecided = counts.ostavat === 0;

  return (
    <>
      <div className="pg-lenta" role="status" aria-live="polite">
        <div className="pg-broi">
          <span className="ok">
            Одобрени <b>{counts.ok}</b>
          </span>
          <span>
            Върнати <b>{counts.ne}</b>
          </span>
          <span>
            Остават <b>{counts.ostavat}</b>
          </span>
        </div>
        <div className="pg-lenta-butoni">
          <button type="button" className="pg-b pg-b-tih" onClick={approveAll} disabled={counts.ostavat === 0 && counts.ok > 0}>
            Одобри всички
          </button>
          <button type="button" className="pg-b pg-b-zlato" onClick={submit} disabled={submitting}>
            {submitting ? "Изпраща се…" : "Изпрати избора"}
          </button>
        </div>
      </div>

      <section className="pg-sekcia">
        <h2 className="pg-h2">Клиповете</h2>
        <p className="pg-vodesht">
          Кодът горе вляво (Ш01, В03…) е името на сцената — така ще си говорим за нея. Всеки клип е започнат от
          истинската снимка на кутията, за да е шоколадът точно Вашият.
        </p>

        <div className="pg-klipove">
          {items.map((it) => {
            const a = answers[it.code];
            const st = saveState[it.code] ?? "idle";
            const cls = a.verdict === "approved" ? "e-ok" : a.verdict === "rejected" ? "e-ne" : "";
            return (
              <article key={it.code} className={`pg-karta ${cls}`} id={`klip-${it.code}`}>
                <div className="pg-ekran">
                  <span className="pg-nomer">{it.code}</span>
                  <video
                    ref={(el) => {
                      videos.current[it.code] = el;
                    }}
                    src={it.video}
                    poster={it.poster}
                    controls
                    preload="metadata"
                    playsInline
                    onPlay={() => onPlay(it.code)}
                  />
                </div>
                <h3 className="pg-ime">{it.name}</h3>
                {it.line ? (
                  <p className="pg-replika">„{it.line}“</p>
                ) : (
                  <p className="pg-replika nyama">{it.sound || "Без глас"}</p>
                )}
                <p className="pg-rolya">{it.about}</p>
                {it.tags?.length ? (
                  <div className="pg-znachki">
                    {it.tags.map((t) => (
                      <span key={t} className="pg-znachka">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="pg-izbor">
                  <button
                    type="button"
                    className={`pg-b pg-b-ok ${a.verdict === "approved" ? "e-on" : ""}`}
                    aria-pressed={a.verdict === "approved"}
                    onClick={() => setVerdict(it.code, "approved")}
                  >
                    {a.verdict === "approved" ? "✓ Одобрен" : "✓ Одобрявам"}
                  </button>
                  <button
                    type="button"
                    className={`pg-b pg-b-ne ${a.verdict === "rejected" ? "e-on" : ""}`}
                    aria-pressed={a.verdict === "rejected"}
                    onClick={() => setVerdict(it.code, "rejected")}
                  >
                    {a.verdict === "rejected" ? "✗ Върнат" : "✗ Не този"}
                  </button>
                </div>
                <textarea
                  className="pg-belezhka"
                  value={a.comment}
                  maxLength={1500}
                  placeholder={
                    a.verdict === "rejected"
                      ? "Какво да променим? Кадър, дума, темпо…"
                      : "Бележка по желание: какво Ви харесва или какво да променим"
                  }
                  onChange={(e) => setComment(it.code, e.target.value)}
                  onBlur={() => commentBlur(it.code)}
                  aria-label={`Бележка към ${it.code} ${it.name}`}
                />
                <div className={`pg-sastoyanie ${st === "saved" ? "e-ok" : st === "error" ? "e-greshka" : ""}`}>
                  {st === "saving" && "Запазва се…"}
                  {st === "saved" && "Запазено ✓"}
                  {st === "error" && "Не се записа — проверете връзката"}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="pg-final" id="izprati">
        <h3>Готови ли сте?</h3>
        <p>
          {allDecided
            ? "Всички клипове имат отговор. Натиснете бутона и Ивайло получава избора Ви веднага."
            : `Остават ${counts.ostavat} без отговор. Може да изпратите и така — ще ги отбележим като „без отговор“ и ще Ви попитаме за тях.`}
        </p>
        <button type="button" className="pg-b pg-b-zlato" onClick={submit} disabled={submitting}>
          {submitting ? "Изпраща се…" : "Изпрати избора"}
        </button>
        {submitError ? (
          <p style={{ marginTop: 12, color: "#e08a8a" }}>{submitError}</p>
        ) : null}
        {done ? (
          <div className="pg-gotovo" ref={doneRef}>
            <h4>Готово, благодаря!</h4>
            <p>
              Ивайло получи избора Ви: <b>{done.approved}</b> одобрени, <b>{done.rejected}</b> за преправяне
              {done.pending ? `, ${done.pending} без отговор` : ""}.
            </p>
            <p>
              Одобрените клипове влизат в графика. За върнатите ще получите нова версия по бележките Ви. Ако
              промените нещо тук, натиснете „Изпрати избора“ отново.
            </p>
          </div>
        ) : null}
      </section>
    </>
  );
}
