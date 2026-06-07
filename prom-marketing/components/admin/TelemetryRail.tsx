"use client";
import { useEffect, useState } from "react";

/** Subtly drifting value to give the console a "live telemetry" feel. */
function useDrift(initial: number, min: number, max: number, step: number, ms: number) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = setInterval(() => {
      setV((prev) => {
        let next = prev + (Math.random() - 0.5) * 2 * step;
        if (next < min) next = min;
        if (next > max) next = max;
        return next;
      });
    }, ms);
    return () => clearInterval(id);
  }, [min, max, step, ms]);
  return v;
}

function Seg({ label, value, tone, dot }: { label: string; value: string; tone: string; dot?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {dot && <span className="cc-livedot" style={{ background: tone, boxShadow: `0 0 10px ${tone}` }} />}
      <span className="hud-tag">{label}</span>
      <span className="cc-num text-[11px] font-semibold" style={{ color: tone }}>
        {value}
      </span>
    </span>
  );
}

export function TelemetryRail({ nodes }: { nodes: number }) {
  const sync = useDrift(99.7, 98.4, 100, 0.35, 2100);
  const io = useDrift(2.6, 1.1, 7.4, 0.7, 1300);
  const lat = useDrift(12, 7, 23, 2.5, 1600);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--color-accent-cyan)]/15 pt-3.5">
      <Seg label="Uplink" value="STABLE" tone="#22c55e" dot />
      <span className="hud-tag opacity-30">/</span>
      <Seg label="Sync" value={`${sync.toFixed(1)}%`} tone="#22d3ee" />
      <span className="hud-tag opacity-30">/</span>
      <Seg label="Nodes" value={String(nodes)} tone="#7dd3fc" />
      <span className="hud-tag opacity-30">/</span>
      <Seg label="I/O" value={`${io.toFixed(1)} MB/s`} tone="#a78bfa" />
      <span className="hud-tag opacity-30">/</span>
      <Seg label="Lat" value={`${Math.round(lat)}ms`} tone="#facc15" />
      <span className="hud-tag opacity-30">/</span>
      <Seg label="Core" value="NOMINAL" tone="#22c55e" />
    </div>
  );
}
