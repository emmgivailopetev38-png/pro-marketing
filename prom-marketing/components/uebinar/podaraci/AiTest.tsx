"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BANDOVE, GOTOVNOST, KATEGORII, STAPKI, VAPROSI, smetni } from "@/lib/uebinar/ai-test";
import { track } from "@/lib/analytics/track";
import { trackCustom } from "@/lib/meta/pixel-client";
import { PODARACI_BASE } from "@/lib/uebinar/podaraci";

const BUKVI = ["А", "Б", "В", "Г"];
const R = 92;
const OBIKOLKA = 2 * Math.PI * R;
const CVETOVE = { nisko: "#16a34a", sredno: "#e0a030", visoko: "#e3122a" } as const;

/** Тестът „Виж дали AI ще замени работата ти“ — един въпрос на екран, резултат с кръг.
    Нищо не се записва: отговорите живеят само в паметта на страницата. */
export function AiTest() {
  const [stap, setStap] = useState<number>(-1); // -1 = начало, 0..9 = въпрос, 10 = резултат
  const [otgovori, setOtgovori] = useState<Record<string, number>>({});
  const [kragat, setKragat] = useState(0); // процентът на кръга — тръгва от 0 и се пълни
  const kartata = useRef<HTMLDivElement | null>(null);
  const zaglavie = useRef<HTMLHeadingElement | null>(null);
  const zaklyuchen = useRef(false); // срещу двоен клик — да не прескочи въпрос
  const tajmer = useRef<number | undefined>(undefined);

  const krai = stap >= VAPROSI.length;
  const rez = useMemo(() => (krai ? smetni(otgovori) : null), [krai, otgovori]);

  // Нова стъпка: отключи, покажи картата цялата (на телефон) и дай фокус на въпроса.
  useEffect(() => {
    zaklyuchen.current = false;
    if (stap < 0) return;
    const el = kartata.current;
    if (el) {
      const top = el.getBoundingClientRect().top;
      if (top < 56 || top > window.innerHeight * 0.42) {
        const tiho = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: tiho ? "auto" : "smooth", block: "start" });
      }
    }
    zaglavie.current?.focus({ preventScroll: true });
  }, [stap]);

  useEffect(() => {
    if (!rez) return;
    const id = window.setTimeout(() => setKragat(rez.procent), 120);
    trackCustom("AiTestResult", { band: rez.band, procent: rez.procent });
    track("podaraci_test_result", { band: rez.band, procent: rez.procent, gotovnost: rez.gotovnost });
    return () => window.clearTimeout(id);
  }, [rez]);

  useEffect(() => () => window.clearTimeout(tajmer.current), []);

  const izberi = useCallback((id: string, v: number) => {
    if (zaklyuchen.current) return;
    zaklyuchen.current = true;
    setOtgovori((o) => ({ ...o, [id]: v }));
    // Кратка пауза, за да се види изборът, после следващият въпрос.
    tajmer.current = window.setTimeout(() => setStap((s) => s + 1), 260);
  }, []);

  // От клавиатурата: 1–4 (или А–Г) избира отговор.
  useEffect(() => {
    if (stap < 0 || stap >= VAPROSI.length) return;
    const v = VAPROSI[stap];
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      const i = ["1", "2", "3", "4"].indexOf(k) >= 0 ? Number(k) - 1 : BUKVI.indexOf(k);
      if (i >= 0 && i < v.opcii.length) {
        e.preventDefault();
        izberi(v.id, v.opcii[i].v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stap, izberi]);

  function otnachalo() {
    setOtgovori({});
    setKragat(0);
    setStap(0);
  }

  if (stap < 0) {
    return (
      <div className="pd-test-card pd-start" ref={kartata}>
        <h2 className="pd-q">Отговаряй честно — резултатът е само за теб.</h2>
        <ul>
          <li>
            <span aria-hidden>⏱</span> 3 минути
          </li>
          <li>
            <span aria-hidden>🔒</span> Без регистрация
          </li>
          <li>
            <span aria-hidden>📊</span> Резултат веднага
          </li>
        </ul>
        <button type="button" className="nz-btn" onClick={() => setStap(0)}>
          ЗАПОЧНИ ТЕСТА
        </button>
        <p className="pd-fine">Ориентировъчен тест, не научна оценка. Нищо от отговорите ти не се записва.</p>
      </div>
    );
  }

  if (!krai) {
    const v = VAPROSI[stap];
    const izbran = otgovori[v.id];
    const pct = Math.round((stap / VAPROSI.length) * 100);
    return (
      <div className="pd-test-card" ref={kartata}>
        <div className="pd-prog">
          <span aria-live="polite">
            Въпрос {stap + 1} от {VAPROSI.length}
          </span>
          <div className="pd-prog-bar" aria-hidden>
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
        <h2 className="pd-q" key={v.id} ref={zaglavie} tabIndex={-1}>
          {v.q}
        </h2>
        <div className="pd-opts" role="group" aria-label={v.q} key={`${v.id}-o`}>
          {v.opcii.map((o, i) => (
            <button
              key={o.t}
              type="button"
              className="pd-opt"
              aria-pressed={izbran === o.v}
              style={{ animationDelay: `${60 + i * 50}ms` }}
              onClick={() => izberi(v.id, o.v)}
            >
              <span className="pd-opt-k" aria-hidden>
                {BUKVI[i]}
              </span>
              {o.t}
            </button>
          ))}
        </div>
        <div className="pd-test-foot">
          <button type="button" className="pd-back" disabled={stap === 0} onClick={() => setStap((s) => Math.max(0, s - 1))}>
            ← Назад
          </button>
          <span className="pd-keys">
            Може и с клавишите <kbd>1</kbd>–<kbd>4</kbd>
          </span>
        </div>
      </div>
    );
  }

  const r = rez!;
  const b = BANDOVE[r.band];
  return (
    <div className="pd-test-card pd-res" ref={kartata}>
      <div className="pd-gauge" role="img" aria-label={`${r.procent} процента от задачите ти AI вече може да върши или ускори`}>
        <svg viewBox="0 0 220 220" aria-hidden>
          <circle className="track" cx="110" cy="110" r={R} fill="none" strokeWidth="16" />
          <circle
            className="bar"
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke={CVETOVE[r.band]}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={OBIKOLKA}
            strokeDashoffset={OBIKOLKA * (1 - kragat / 100)}
          />
        </svg>
        <div className="pd-gauge-in">
          <b>{r.procent}%</b>
          <span>от задачите ти AI вече може да върши или ускори</span>
        </div>
      </div>
      <span className={`pd-band pd-band-${r.band}`}>AI риск: {b.etiket}</span>
      <h2 ref={zaglavie} tabIndex={-1}>
        {b.zaglavie}
      </h2>
      <p className="pd-res-txt">{b.tekst}</p>

      {r.kategorii.length > 0 ? (
        <div className="pd-res-sec">
          <h3>Какво AI вече може вместо теб</h3>
          <ul>
            {r.kategorii.slice(0, 4).map((k) => (
              <li key={k}>
                <span className="k" aria-hidden>
                  ✦
                </span>
                <span>
                  <b>{KATEGORII[k].ime}:</b> {KATEGORII[k].primer}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="pd-res-ready">{GOTOVNOST[r.gotovnost]}</p>

      <div className="pd-res-sec">
        <h3>Какво да направиш от утре</h3>
        <ul>
          {STAPKI.map((s, i) => (
            <li key={s}>
              <span className="k" aria-hidden>
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pd-actions">
        <Link className="nz-btn pd-btn-sm" href={PODARACI_BASE}>
          ВСИЧКИ ПОДАРЪЦИ
        </Link>
        <button type="button" className="pd-ghost pd-ghost-dark" onClick={otnachalo}>
          <span aria-hidden>↺</span> Направи го отново
        </button>
      </div>
      <p className="pd-fine">Ориентировъчен тест по това, което AI инструментите правят днес. Нищо от отговорите ти не се записва.</p>
    </div>
  );
}
