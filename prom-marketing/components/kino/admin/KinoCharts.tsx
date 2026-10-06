"use client";
import { useRef, useState } from "react";

/* =====================================================================
   Графиките на /admin/kino — чист SVG, без библиотеки.
   Една серия = един цвят (#0891b2: циан в тъмния диапазон, валидиран за
   тъмната повърхност), линия 2 px + воал 10 %, мрежата — косми, текстът —
   в текстовите цветове, не в цвета на серията. Всяка графика има и таблица.
   ===================================================================== */

const SERIES = "#0891b2";
const GRID = "rgba(160, 175, 210, 0.14)";
const AXIS_TEXT = "rgba(180, 190, 215, 0.75)";

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function RetentionChart({
  data,
  entered,
  chapterStarts,
  offerAtMin,
  minuteLabels,
}: {
  data: number[];
  entered: number;
  chapterStarts: Array<{ minute: number; label: string }>;
  offerAtMin: number;
  /** „минута 12 · „Правец““ — подготвено на сървъра (функция не минава към клиента) */
  minuteLabels: string[];
}) {
  const W = 760;
  const H = 240;
  const pad = { l: 40, r: 16, t: 14, b: 26 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...data));
  const x = (m: number) => pad.l + (data.length <= 1 ? 0 : (m / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const line = data.map((v, m) => `${m === 0 ? "M" : "L"}${x(m).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const empty = data.every((v) => v === 0);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const m = Math.round(((px - pad.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, m)));
  }

  const ticks = [0, max / 2, max];
  const hv = hover != null ? data[hover] : null;

  return (
    <figure style={{ margin: 0 }}>
      <div style={{ position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label="Задържане по минути: колко души са гледали всяка минута от филма"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          style={{ display: "block", touchAction: "pan-y", overflow: "hidden" }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT} style={{ fontVariantNumeric: "tabular-nums" }}>
                {Math.round(t)}
              </text>
            </g>
          ))}
          {chapterStarts.map((c) => (
            <line key={c.minute} x1={x(c.minute)} x2={x(c.minute)} y1={y(0)} y2={y(0) + 5} stroke={AXIS_TEXT} strokeWidth={1} />
          ))}
          {[0, 10, 20, 30, 40].filter((m) => m < data.length).map((m) => (
            <text key={m} x={x(m)} y={H - 6} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>
              {m}′
            </text>
          ))}
          {offerAtMin < data.length && (
            <g>
              <line x1={x(offerAtMin)} x2={x(offerAtMin)} y1={pad.t} y2={y(0)} stroke="rgba(236,72,153,0.55)" strokeWidth={1} />
              <text x={x(offerAtMin) + 4} y={pad.t + 10} textAnchor="start" fontSize={11} fill={AXIS_TEXT}>
                бутоните
              </text>
            </g>
          )}
          {!empty && (
            <>
              <path d={area} fill={SERIES} fillOpacity={0.1} />
              <path d={line} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {/* подписи само на началото и на надписите */}
              <text x={x(0) + 6} y={y(data[0]) - 8} fontSize={11} fill="#e6e9f5">
                {data[0]} в началото
              </text>
              {offerAtMin < data.length && (
                <g>
                  <circle cx={x(offerAtMin)} cy={y(data[offerAtMin])} r={4.5} fill={SERIES} stroke="#0b0f1d" strokeWidth={2} />
                  <text x={x(offerAtMin) - 8} y={y(data[offerAtMin]) - 10} textAnchor="end" fontSize={11} fill="#e6e9f5">
                    {data[offerAtMin]} при надписите
                  </text>
                </g>
              )}
            </>
          )}
          {hover != null && !empty && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} stroke="rgba(230,233,245,0.45)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(data[hover])} r={4.5} fill={SERIES} stroke="#0b0f1d" strokeWidth={2} />
            </g>
          )}
          {empty && (
            <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={13} fill={AXIS_TEXT}>
              Още няма пулсове — кривата се появява с първите зрители в залата.
            </text>
          )}
        </svg>
        {hover != null && hv != null && !empty && (
          <div
            role="status"
            style={{
              position: "absolute",
              top: 6,
              left: `${Math.min(78, Math.max(2, (x(hover) / W) * 100 - 10))}%`,
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(10,14,26,0.94)",
              border: "1px solid rgba(120,160,220,0.3)",
              fontSize: 12,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
              {hv} зрители{entered ? ` · ${Math.round((hv / entered) * 100)} %` : ""}
            </div>
            <div style={{ color: AXIS_TEXT, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 2, background: SERIES, display: "inline-block" }} />
              {minuteLabels[hover]}
            </div>
          </div>
        )}
      </div>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer", fontSize: 12, color: AXIS_TEXT }}>Таблица по минути</summary>
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table className="cc-table" style={{ minWidth: 420 }}>
            <thead>
              <tr>
                <th>Минута</th>
                <th>Глава</th>
                <th style={{ textAlign: "right" }}>Зрители</th>
                <th style={{ textAlign: "right" }}>От влезлите</th>
              </tr>
            </thead>
            <tbody>
              {data.map((v, m) => (
                <tr key={m}>
                  <td className="cc-num">{m + 1}</td>
                  <td>{minuteLabels[m]}</td>
                  <td className="cc-num" style={{ textAlign: "right" }}>
                    {v}
                  </td>
                  <td className="cc-num" style={{ textAlign: "right" }}>
                    {entered ? `${Math.round((v / entered) * 100)} %` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** Задържането по глави — хоризонтални ленти, стойността на върха. */
export function ChapterBars({ rows }: { rows: Array<{ n: number; title: string; viewers: number; pct: number }> }) {
  return (
    <div role="list" style={{ display: "grid", gap: 8 }}>
      {rows.map((r) => (
        <div
          role="listitem"
          key={r.n}
          tabIndex={0}
          title={`Глава ${r.n} „${r.title}“ — ${r.viewers} зрители (${Math.round(r.pct * 100)} % от влезлите)`}
          style={{ display: "grid", gridTemplateColumns: "minmax(0, 190px) 1fr", gap: 10, alignItems: "center", fontSize: 12 }}
        >
          <span style={{ color: "#c9cee0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.n}. {r.title}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: "0 1 auto", width: `${Math.max(r.pct * 100, r.viewers ? 1.5 : 0)}%`, maxWidth: "calc(100% - 78px)", height: 12, background: SERIES, borderRadius: "0 4px 4px 0" }} />
            <span className="cc-num" style={{ whiteSpace: "nowrap", color: "#e6e9f5" }}>
              {Math.round(r.pct * 100)} % · {r.viewers}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Реакциите по минути — по една лента за всяка емоджи (малки множества, една ос). */
export function ReactionStrips({ rows, minutes, emojis }: { rows: Array<{ minute: number; counts: Record<string, number> }>; minutes: number; emojis: readonly string[] }) {
  const by = new Map(rows.map((r) => [r.minute, r.counts]));
  const max = Math.max(1, ...rows.flatMap((r) => emojis.map((e) => r.counts[e] ?? 0)));
  const W = 700;
  const rowH = 34;
  const colW = W / minutes;
  if (rows.length === 0) {
    return <p style={{ fontSize: 13, color: AXIS_TEXT, margin: 0 }}>Още няма реакции.</p>;
  }
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {emojis.map((e) => {
        const total = rows.reduce((s, r) => s + (r.counts[e] ?? 0), 0);
        return (
          <div key={e} style={{ display: "grid", gridTemplateColumns: "56px 1fr", alignItems: "end", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#c9cee0", whiteSpace: "nowrap" }}>
              {e} <span className="cc-num">{total}</span>
            </span>
            <svg viewBox={`0 0 ${W} ${rowH}`} width="100%" height={rowH} preserveAspectRatio="none" role="img" aria-label={`${e} по минути`}>
              <line x1={0} x2={W} y1={rowH - 0.5} y2={rowH - 0.5} stroke={GRID} strokeWidth={1} />
              {Array.from({ length: minutes }, (_, m) => {
                const v = by.get(m)?.[e] ?? 0;
                if (!v) return null;
                const h = Math.max(2, (v / max) * (rowH - 2));
                return (
                  <rect key={m} x={m * colW + 1} y={rowH - h} width={Math.max(1, colW - 2)} height={h} rx={1.5} fill={SERIES}>
                    <title>{`минута ${m + 1} · ${e} ${v}`}</title>
                  </rect>
                );
              })}
            </svg>
          </div>
        );
      })}
      <div style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 8, fontSize: 11, color: AXIS_TEXT }}>
        <span />
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span>0′</span>
          <span>{Math.round(minutes / 2)}′</span>
          <span>{minutes}′</span>
        </span>
      </div>
    </div>
  );
}
