"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./liniyata.module.css";
import { MESECHNA_CEL, V_KRAGCHETO, ZA_SVIVANE, chislo, naDen, tablica, zaCelta } from "@/lib/admin/liniyata";

/* Геометрията на картината (viewBox 760×500). Центърът и посоката на линията
   са записани и в liniyata.module.css (въртенето и бягащото число). */
const C = { x: 250, y: 290 };
const R = 190; // червеното кръгче
const DIR = { x: 0.8834, y: -0.4687 }; // линията тръгва нагоре-надясно
const ANG = -27.95; // ъгълът на линията в градуси
const pt = (d: number) => ({ x: C.x + DIR.x * d, y: C.y + DIR.y * d });
const LINE_START = pt(R);
const LINE_END = { x: 740, y: 30 };
const SHEET_A = pt(R + 26); // към големите — там, накъдето бягат
const SHEET_B = pt(-(R + 26)); // от другата страна

const RINGS = [
  { r: 58, cap: 4, dur: 34, back: false, slots: [0, 1, 2, 3] },
  { r: 115, cap: 6, dur: 48, back: true, slots: [0, 1, 2, 3, 4, 5] },
  // 6 постоянни + 2 места за новите (3 и 7), за да не скачат другите
  { r: 170, cap: 8, dur: 64, back: false, slots: [0, 1, 2, 4, 5, 6, 3, 7] },
] as const;
const EXTRA_RING = 2;
const BASE = V_KRAGCHETO.length; // 16 — постоянните; отгоре най-много 2 нови

const BIG_MS = 1400; // колко стои „старата картинка“
const SHRINK_MS = 2600; // колкото е преходът в CSS

const BYAGASHTI = ["50 000", "300 000/мес", "18 000", "8 000", "80 000"];

const sEuro = (t: string) => (t.includes("/мес") ? t.replace("/мес", " €/мес") : `${t} €`);

/** Зигзагът „ток“ по листа (локални координати, листът е 12×130). */
const ZAP = "M0,-62 L4,-48 L-4,-36 L5,-22 L-3,-8 L4,6 L-5,20 L3,34 L-4,48 L0,62";

type Flyer = { id: number; text: string; phase: "big" | "shrink" };

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

export function LiniyataCeni() {
  const narrow = useNarrow();
  const [orbit, setOrbit] = useState<string[]>(V_KRAGCHETO);
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [pulse, setPulse] = useState<string | null>(null);
  const [caption, setCaption] = useState("Натисни число — гледай как се смалява и влиза при другите.");
  const [esc, setEsc] = useState(0);
  const [delays, setDelays] = useState<Record<string, string>>({});
  const ringRefs = useRef<(SVGGElement | null)[]>([]);
  const idRef = useRef(0);

  const fly = useCallback(
    (text: string) => {
      if (flyer) {
        setQueue((q) => [...q, text]);
        return;
      }
      idRef.current += 1;
      setFlyer({ id: idRef.current, text, phase: "big" });
      setCaption(`${sEuro(text)} — старата картинка: голямо, ясно, неподвижно, на дебела линия.`);
    },
    [flyer],
  );

  // big → shrink → в кръгчето
  useEffect(() => {
    if (!flyer) return;
    if (flyer.phase === "big") {
      const t = setTimeout(() => {
        setFlyer((f) => (f && f.id === flyer.id ? { ...f, phase: "shrink" } : f));
        setCaption("Стесняваш линията… смалява се… влиза в кръгчето.");
      }, BIG_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      const text = flyer.text;
      // отрицателно закъснение, за да е новото число изправено като другите
      const anim = ringRefs.current[EXTRA_RING]?.getAnimations?.()[0];
      const ms = typeof anim?.currentTime === "number" ? anim.currentTime : 0;
      const dur = RINGS[EXTRA_RING].dur;
      setDelays((d) => ({ ...d, [text]: `-${((ms / 1000) % dur).toFixed(3)}s` }));
      setOrbit((o) => {
        if (o.includes(text)) return o;
        const extra = [...o.slice(BASE), text].slice(-2);
        return [...o.slice(0, BASE), ...extra];
      });
      setPulse(text);
      setCaption(`${sEuro(text)} — малко число. Върти се при другите.`);
      setFlyer(null);
    }, SHRINK_MS);
    return () => clearTimeout(t);
  }, [flyer]);

  // следващото от опашката („Всички едно след друго“)
  useEffect(() => {
    if (flyer || queue.length === 0) return;
    const t = setTimeout(() => {
      const [next, ...rest] = queue;
      setQueue(rest);
      idRef.current += 1;
      setFlyer({ id: idRef.current, text: next, phase: "big" });
      setCaption(`${sEuro(next)} — старата картинка: голямо, ясно, неподвижно, на дебела линия.`);
    }, 500);
    return () => clearTimeout(t);
  }, [flyer, queue]);

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(null), 1900);
    return () => clearTimeout(t);
  }, [pulse]);

  // разпределяне по пръстените: 4 / 6 / останалите
  const rings = RINGS.map((ring, ri) => {
    const from = RINGS.slice(0, ri).reduce((n, x) => n + x.cap, 0);
    return { ...ring, items: orbit.slice(from, from + ring.cap), from };
  });

  const big = flyer?.phase === "big";
  const start = narrow ? { x: 330, y: 66 } : { x: 548, y: 96 };
  const flyerTransform = big
    ? `translate(${start.x}px, ${start.y}px) scale(1)`
    : `translate(${C.x + 6}px, ${C.y - 8}px) scale(${15 / 56})`;

  const viewBox = narrow ? "20 30 590 470" : "0 0 760 500";
  const rows = tablica();
  const zaOsem = zaCelta(8000);

  return (
    <div className="space-y-6">
      {/* ── Линията ── */}
      <section className="cc-panel space-y-4 p-4 md:p-6">
        <div className={s.chips}>
          {ZA_SVIVANE.map((t) => (
            <button key={t} type="button" className={s.chip} onClick={() => fly(t)}>
              Свий {sEuro(t)}
            </button>
          ))}
          <button
            type="button"
            className={`${s.chip} ${s.chipAll}`}
            disabled={!!flyer || queue.length > 0}
            onClick={() => {
              const [first, ...rest] = ZA_SVIVANE;
              setQueue(rest);
              fly(first);
            }}
          >
            ▶ Всички едно след друго · 20 сек
          </button>
        </div>

        <div className={s.stage}>
          <svg
            className={s.svg}
            viewBox={viewBox}
            role="img"
            aria-label="Червено кръгче, в което всички цени от 300 до 300 000 евро се въртят еднакво малки; тънка линия нагоре и два червени ограничителя"
          >
            <defs>
              <radialGradient id="lin-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#b8322a" stopOpacity="0.16" />
                <stop offset="70%" stopColor="#b8322a" stopOpacity="0.07" />
                <stop offset="100%" stopColor="#b8322a" stopOpacity="0" />
              </radialGradient>
              <linearGradient
                id="lin-line"
                gradientUnits="userSpaceOnUse"
                x1={LINE_START.x}
                y1={LINE_START.y}
                x2={LINE_END.x}
                y2={LINE_END.y}
              >
                <stop offset="0%" stopColor="#e0675b" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#e0675b" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="lin-sheet" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7d1610" />
                <stop offset="50%" stopColor="#d23a2c" />
                <stop offset="100%" stopColor="#7d1610" />
              </linearGradient>
            </defs>

            {/* линията — тънка докрай, никъде не дебелее */}
            <line
              x1={LINE_START.x}
              y1={LINE_START.y}
              x2={LINE_END.x}
              y2={LINE_END.y}
              stroke="url(#lin-line)"
              strokeWidth={1.5}
            />

            {/* старата картинка: дебела линия, която изтънява */}
            {flyer && (
              <line
                key={`thick-${flyer.id}`}
                x1={LINE_START.x}
                y1={LINE_START.y}
                x2={LINE_END.x}
                y2={LINE_END.y}
                className={`${s.thick} ${big ? "" : s.thickThin}`}
              />
            )}

            {/* кръгчето */}
            <circle cx={C.x} cy={C.y} r={R} fill="url(#lin-core)" className={s.ring} />
            <circle cx={C.x} cy={C.y} r={R - 9} className={s.dash} />

            {/* ограничителите — червен лист с ток, от двете страни */}
            {[SHEET_A, SHEET_B].map((p, i) => (
              <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${ANG})`}>
                <g className={i === 0 ? s.flash : undefined}>
                  <rect x={-6} y={-65} width={12} height={130} rx={3} fill="url(#lin-sheet)" className={s.sheet} />
                  <path d={ZAP} className={s.zap} />
                </g>
              </g>
            ))}

            {/* числата — еднакво малки, въртят се игриво */}
            {rings.map((ring, ri) => (
              <g
                key={ri}
                ref={(el) => {
                  ringRefs.current[ri] = el;
                }}
                className={ring.back ? s.spinBack : s.spin}
                style={{ animationDuration: `${ring.dur}s` }}
              >
                {ring.items.map((t, i) => {
                  const a = (ring.slots[i] / ring.cap) * Math.PI * 2 + ri * 0.7;
                  const x = C.x + ring.r * Math.cos(a);
                  const y = C.y + ring.r * Math.sin(a);
                  const isExtra = ring.from + i >= BASE;
                  return (
                    <g key={t} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
                      <g
                        className={ring.back ? s.counterBack : s.counter}
                        style={{
                          animationDuration: `${ring.dur}s`,
                          animationDelay: isExtra ? delays[t] : undefined,
                        }}
                      >
                        <g className={s.wobble} style={{ animationDelay: `${-((i * 0.37 + ri * 0.9) % 2.8).toFixed(2)}s` }}>
                          <text
                            className={`${s.num} ${pulse === t ? s.pulse : ""}`}
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            {t}
                          </text>
                        </g>
                      </g>
                    </g>
                  );
                })}
              </g>
            ))}

            {/* едно опитва да избяга нагоре — удря листа и се връща малко */}
            <g className={s.escaper} onAnimationIteration={() => setEsc((e) => (e + 1) % BYAGASHTI.length)}>
              <text className={`${s.num} ${s.escaperText}`} textAnchor="middle" dominantBaseline="central">
                {BYAGASHTI[esc]}
              </text>
            </g>

            {/* свиването */}
            {flyer && (
              <g key={flyer.id} className={`${s.flyer} ${s.flyerIn}`} style={{ transform: flyerTransform }}>
                <text
                  className={`${s.flyerText} ${big ? "" : s.flyerTextSmall}`}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {flyer.text}
                </text>
              </g>
            )}
          </svg>
        </div>
        <p className={s.caption} aria-live="polite">
          {caption}
        </p>
      </section>

      {/* ── Менторските ── */}
      <section className="cc-panel space-y-4 p-4 md:p-6">
        <div>
          <p className="hud text-[var(--color-accent-cyan)]">Една · пет · десет</p>
          <h2 className="font-display text-xl font-bold">Менторските — всичките малки</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Натисни сума — и тя влиза в кръгчето.</p>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Цена</th>
                <th>1</th>
                <th>5</th>
                <th>10</th>
                <th>за {chislo(MESECHNA_CEL)}/мес</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.cena.value} className={row.cena.value === 8000 ? s.rowStart : undefined}>
                  <td>
                    <span className={s.price}>{chislo(row.cena.value)} €</span>
                    {row.cena.label && <span className={s.lbl}>{row.cena.label}</span>}
                  </td>
                  {row.sumi.map((x, ci) => (
                    <td key={x.broi}>
                      <button
                        type="button"
                        className={s.sum}
                        style={{ animationDelay: `${-((ri * 0.5 + ci * 0.8) % 3.2).toFixed(2)}s` }}
                        onClick={() => fly(chislo(x.suma))}
                        title="Свий го в кръгчето"
                      >
                        {chislo(x.suma)}
                      </button>
                    </td>
                  ))}
                  <td>
                    <span className={s.count}>
                      {row.zaCelta} бр. · {naDen(row.zaCelta).toString().replace(".", ",")}/ден
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={s.eq}>
          <p>
            <b>{chislo(MESECHNA_CEL)} €</b> на месец = <b>{zaOsem} × 8 000 €</b> — под 2 на работен ден.
          </p>
          <p>
            = 6 клоузъра × 6–7 сделки на месец. Най-добрият клоузър на Минчев прави 10–12.
          </p>
          <p>
            = <b>6 × 50 000 €</b>. Нормално.
          </p>
        </div>
      </section>

      {/* ── Вторник ── */}
      <section className="cc-panel cc-panel-accent space-y-2 p-4 md:p-6">
        <p className="hud text-[var(--color-accent-cyan)]">Вторник · срещата</p>
        <p className="text-lg">
          Показал си всичко. Пита „колко?“ → <b>„Стартовата програма е 8 000 €.“</b> → мълчиш.
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Всяка сутрин, 20 секунди: „▶ Всички едно след друго“ → гледаш ги как влизат → казваш на глас „осем хиляди евро“.
        </p>
      </section>
    </div>
  );
}
