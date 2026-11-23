"use client";

/* Томболата на живо — подарък №2 от обучението „Допълнителен доход с AI“.
   Цял екран (покрива менюто на админа), за да се споделя спокойно в Zoom.
   Печелившият се избира през crypto ПРЕДИ анимацията; въртенето е само
   за гледане. Всичко се пази в браузъра (ако страницата се презареди
   по средата на обучението, нищо не се губи). */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { izvadiImena, sluchaen } from "@/lib/uebinar/tombola";

const KEY = "pm_tombola_v1";
const BROI = 3;
const kluch = (s: string) => s.toLocaleLowerCase("bg-BG");

type Zapis = { tekst: string; mahnati: string[]; pechelivshi: string[]; etap: "imena" | "teglene" };

export function Tombola() {
  const [tekst, setTekst] = useState("");
  const [mahnati, setMahnati] = useState<string[]>([]);
  const [pechelivshi, setPechelivshi] = useState<string[]>([]);
  const [etap, setEtap] = useState<"imena" | "teglene">("imena");
  const [pokazvano, setPokazvano] = useState("");
  const [vartene, setVartene] = useState(false);
  const [kopirano, setKopirano] = useState(false);
  const [zareden, setZareden] = useState(false);
  const tajmer = useRef<number | undefined>(undefined);

  // Връщане след презареждане.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const z = JSON.parse(raw) as Partial<Zapis>;
        if (typeof z.tekst === "string") setTekst(z.tekst);
        if (Array.isArray(z.mahnati)) setMahnati(z.mahnati.filter((x) => typeof x === "string"));
        if (Array.isArray(z.pechelivshi)) setPechelivshi(z.pechelivshi.filter((x) => typeof x === "string").slice(0, BROI));
        if (z.etap === "teglene" || z.etap === "imena") setEtap(z.etap);
      }
    } catch {
      /* без запазване — работи и така */
    }
    setZareden(true);
  }, []);

  useEffect(() => {
    if (!zareden) return;
    try {
      const z: Zapis = { tekst, mahnati, pechelivshi, etap };
      window.localStorage.setItem(KEY, JSON.stringify(z));
    } catch {
      /* без запазване */
    }
  }, [zareden, tekst, mahnati, pechelivshi, etap]);

  useEffect(() => () => window.clearTimeout(tajmer.current), []);

  const vsichki = useMemo(() => izvadiImena(tekst), [tekst]);
  const imena = useMemo(() => {
    const m = new Set(mahnati.map(kluch));
    return vsichki.filter((n) => !m.has(kluch(n)));
  }, [vsichki, mahnati]);
  const ostavat = useMemo(() => {
    const p = new Set(pechelivshi.map(kluch));
    return imena.filter((n) => !p.has(kluch(n)));
  }, [imena, pechelivshi]);

  const gotovo = pechelivshi.length >= BROI || (pechelivshi.length > 0 && ostavat.length === 0);

  const fanfari = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void import("canvas-confetti").then(({ default: confetti }) => {
      const opts = { spread: 75, startVelocity: 48, ticks: 260, zIndex: 2147483600, colors: ["#ffd98a", "#e3122a", "#ffffff", "#b7791f"] };
      confetti({ ...opts, origin: { x: 0.2, y: 0.55 }, particleCount: 90, angle: 60 });
      confetti({ ...opts, origin: { x: 0.8, y: 0.55 }, particleCount: 90, angle: 120 });
      window.setTimeout(() => confetti({ ...opts, origin: { x: 0.5, y: 0.35 }, particleCount: 120, spread: 110 }), 260);
    });
  }, []);

  const tegli = useCallback(() => {
    if (vartene || gotovo || ostavat.length === 0) return;
    const pool = ostavat;
    const pobeditel = pool[sluchaen(pool.length)];
    const tiho = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const obshto = tiho ? 500 : 3800;
    const start = performance.now();
    setVartene(true);

    const krai = () => {
      setPokazvano(pobeditel);
      setPechelivshi((p) => [...p, pobeditel]);
      setVartene(false);
      fanfari();
    };
    if (tiho) {
      tajmer.current = window.setTimeout(krai, obshto);
      return;
    }
    let posleden = "";
    const stapka = () => {
      const minalo = performance.now() - start;
      if (minalo >= obshto) return krai();
      // Само за гледане — показваме разбъркани имена, като забавяме към края.
      let sl = pool[Math.floor(Math.random() * pool.length)];
      if (pool.length > 1 && sl === posleden) sl = pool[(pool.indexOf(sl) + 1) % pool.length];
      posleden = sl;
      setPokazvano(sl);
      const p = minalo / obshto;
      tajmer.current = window.setTimeout(stapka, 45 + Math.pow(p, 2.4) * 420);
    };
    stapka();
  }, [vartene, gotovo, ostavat, fanfari]);

  // Интервал / Enter — тегли (на сцената, не докато се пише).
  useEffect(() => {
    if (etap !== "teglene") return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "BUTTON" || t.tagName === "A")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        tegli();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [etap, tegli]);

  function otnachalo() {
    if (vartene) return;
    if (pechelivshi.length && !window.confirm("Да започнем ли тегленето отначало? Печелившите ще се изчистят.")) return;
    setPechelivshi([]);
    setPokazvano("");
  }

  async function kopiraj() {
    const t = pechelivshi.map((n, i) => `${i + 1}. ${n}`).join("\n");
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setKopirano(true);
    window.setTimeout(() => setKopirano(false), 2200);
  }

  return (
    <div className="tb" data-etap={etap}>
      <div className="tb-bar">
        <Link href="/admin" className="tb-link">
          ← Админ
        </Link>
        <div className="tb-bar-r">
          {etap === "teglene" ? (
            <>
              <button type="button" className="tb-link" onClick={() => setEtap("imena")} disabled={vartene}>
                Имената ({imena.length})
              </button>
              {pechelivshi.length ? (
                <button type="button" className="tb-link" onClick={kopiraj}>
                  {kopirano ? "✓ Копирано" : "Копирай печелившите"}
                </button>
              ) : null}
              <button type="button" className="tb-link" onClick={otnachalo} disabled={vartene || !pechelivshi.length}>
                Отначало
              </button>
            </>
          ) : null}
        </div>
      </div>

      {etap === "imena" ? (
        <div className="tb-in">
          <p className="tb-eyebrow">🎟️ Томбола · подарък №2</p>
          <h1 className="tb-h1 tb-h1-sm">Имената на участниците</h1>
          <p className="tb-sub">
            Постави ги по едно на ред — или целия запазен чат от Zoom (Чат → … → Запази чата). Имената се вадят сами, повторенията се махат.
          </p>
          <textarea
            className="tb-ta"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            rows={9}
            spellCheck={false}
            placeholder={"Мария Иванова\nПетър Петров\n19:45:12 From Стела Ж. to Everyone:"}
            aria-label="Имената на участниците"
          />
          {vsichki.length ? (
            <div className="tb-chips" aria-label="Участниците — клик маха или връща">
              {vsichki.map((n) => {
                const off = mahnati.some((m) => kluch(m) === kluch(n));
                return (
                  <button
                    type="button"
                    key={n}
                    className={off ? "off" : undefined}
                    onClick={() => setMahnati((m) => (off ? m.filter((x) => kluch(x) !== kluch(n)) : [...m, n]))}
                    aria-label={off ? `Върни ${n} в томболата` : `Махни ${n} от томболата`}
                    title={off ? "Върни в томболата" : "Махни от томболата (напр. водещия)"}
                  >
                    {n} <span aria-hidden>{off ? "↺" : "×"}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="tb-in-foot">
            <span>
              <b>{imena.length}</b> {imena.length === 1 ? "участник" : "участници"}
              {mahnati.length ? ` · махнати: ${mahnati.length}` : ""}
            </span>
            <button type="button" className="tb-btn" disabled={imena.length === 0} onClick={() => setEtap("teglene")}>
              КЪМ ТЕГЛЕНЕТО →
            </button>
          </div>
        </div>
      ) : (
        <div className="tb-stage">
          <p className="tb-eyebrow">🎟️ Томбола · само за останалите до края</p>
          <h1 className="tb-h1">
            30 минути <em>лично с Ивайло</em>
          </h1>
          <p className="tb-sub">
            {BROI} печеливши от <b>{imena.length}</b> {imena.length === 1 ? "участник" : "участници"}
          </p>

          <div className={`tb-slot${vartene ? " is-spin" : ""}${!vartene && pokazvano ? " is-win" : ""}`} aria-live="polite">
            <span key={vartene ? "spin" : pokazvano || "prazno"}>
              {pokazvano || (pechelivshi.length ? "Следващият е…" : "Кой ще е първият?")}
            </span>
          </div>

          <ol className="tb-winners">
            {Array.from({ length: BROI }, (_, i) => (
              <li key={i} className={pechelivshi[i] ? "on" : undefined}>
                <span className="n">{i + 1}</span>
                <b>{pechelivshi[i] ?? "…"}</b>
              </li>
            ))}
          </ol>

          {gotovo ? (
            <p className="tb-done">🎉 Честито! Ще ви пишем във Viber до 24 часа, за да си изберете час.</p>
          ) : (
            <button type="button" className="tb-btn tb-btn-big" onClick={tegli} disabled={vartene || ostavat.length === 0}>
              {vartene ? "ТЕГЛИМ…" : `ИЗТЕГЛИ №${pechelivshi.length + 1}`}
            </button>
          )}
          <p className="tb-hint">Интервал — тегли · печелившият се избира честно, със случайно число от браузъра</p>
        </div>
      )}

      <p className="tb-foot">
        🎁 Подаръците: <b>ivailopetev.com/podaraci</b>
      </p>
    </div>
  );
}
