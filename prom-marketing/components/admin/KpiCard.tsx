// KPI tile — command-center style (glass, color accent bar, hover glow).
import type { CSSProperties } from "react";
import { Sparkline, type SparklinePoint } from "./charts/Sparkline";
import { AnimatedNumber } from "./AnimatedNumber";

export interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  /** Comparison number vs previous period — positive arrows green, negative red. */
  delta?: number | null;
  /** Accent color (drives the top bar, glow and value color). */
  color?: string;
  /** Optional sparkline below the value. */
  trend?: SparklinePoint[];
  trendColor?: string;
  /** Make the whole card clickable. */
  href?: string;
}

export function KpiCard({ label, value, hint, delta, color, trend, trendColor, href }: KpiCardProps) {
  const kpiColor = color ?? "#06b6d4";
  const deltaTone =
    delta == null
      ? null
      : delta > 0
        ? "text-emerald-300"
        : delta < 0
          ? "text-red-300"
          : "text-[var(--color-text-tertiary)]";
  const deltaArrow = delta == null ? "" : delta > 0 ? "▲" : delta < 0 ? "▼" : "•";

  const body = (
    <div className="cc-kpi p-4" style={{ "--kpi": kpiColor } as CSSProperties}>
      <div className="flex items-start justify-between gap-2">
        <p className="hud">{label}</p>
        {delta != null && (
          <span className={`font-mono text-[10px] ${deltaTone}`}>
            {deltaArrow} {Math.abs(delta)}
          </span>
        )}
      </div>
      <p className="cc-kpi-value mt-2.5 font-mono text-[27px] font-bold leading-none tabular-nums">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </p>
      {hint && (
        <p className="mt-1.5 text-[11px] leading-tight text-[var(--color-text-tertiary)]">{hint}</p>
      )}
      {trend && trend.length > 0 && (
        <div className="mt-2 -mx-1">
          <Sparkline points={trend} color={trendColor ?? kpiColor} height={32} />
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)]/60"
      >
        {body}
      </a>
    );
  }
  return body;
}
