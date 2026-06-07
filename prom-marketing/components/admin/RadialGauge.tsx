"use client";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

/**
 * Instrument-style radial gauge — animated arc draw on mount, glowing.
 * `pct` (0-100) drives the arc fill; `display` is the big center readout.
 */
export function RadialGauge({
  pct,
  label,
  display,
  color = "#22d3ee",
  size = 138,
}: {
  pct: number;
  label: string;
  display: string;
  color?: string;
  size?: number;
}) {
  const stroke = 6;
  const r = (size - stroke * 2 - 6) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const [draw, setDraw] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDraw(clamped);
      return;
    }
    const t = setTimeout(() => setDraw(clamped), 90);
    return () => clearTimeout(t);
  }, [clamped]);

  const offset = circ - (draw / 100) * circ;
  const cx = size / 2;

  return (
    <div
      className="cc-panel flex flex-col items-center justify-center p-4"
      style={{ ["--cc"]: color } as CSSProperties}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.16}
            strokeWidth={stroke}
            strokeDasharray="1.5 7.5"
          />
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)",
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="cc-kpi-value text-center font-mono text-lg font-bold leading-none"
            style={{ ["--kpi"]: color } as CSSProperties}
          >
            {display}
          </span>
        </div>
      </div>
      <span className="hud-tag mt-2.5">{label}</span>
    </div>
  );
}
