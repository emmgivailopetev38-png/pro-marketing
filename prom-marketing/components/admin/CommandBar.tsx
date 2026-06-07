"use client";
import { useEffect, useState } from "react";

/** Subtly drifting value for the "live console" feel. */
function useDrift(initial: number, min: number, max: number, step: number, ms: number) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setV((p) => Math.min(max, Math.max(min, p + (Math.random() - 0.5) * 2 * step))),
      ms
    );
    return () => clearInterval(id);
  }, [min, max, step, ms]);
  return v;
}

function Seg({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="hud-tag">{label}</span>
      <span className="cc-num text-[11px] font-semibold" style={{ color: tone }}>
        {value}
      </span>
    </span>
  );
}

/** Persistent command-deck status bar shown at the top of every admin board. */
export function CommandBar({ section }: { section: string }) {
  const [clock, setClock] = useState("--:--:--");
  const sync = useDrift(99.7, 98.6, 100, 0.3, 2300);
  const lat = useDrift(12, 7, 22, 2, 1700);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("bg-BG", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cc-bar">
      <span className="inline-flex items-center gap-2">
        <span className="cc-livedot" />
        <span className="hud-tag text-emerald-300">SYSTEM ONLINE</span>
      </span>
      <span className="cc-bar-sep" />
      <span className="hud-tag" style={{ color: "#7dd3fc" }}>
        {"// "}
        {section}
      </span>
      <span className="ml-auto hidden items-center gap-4 lg:inline-flex">
        <Seg label="Sync" value={`${sync.toFixed(1)}%`} tone="#22d3ee" />
        <Seg label="Lat" value={`${Math.round(lat)}ms`} tone="#facc15" />
        <Seg label="Uplink" value="STABLE" tone="#22c55e" />
      </span>
      <span className="cc-num ml-4 text-[11px] text-[var(--color-text-secondary)]">{clock}</span>
    </div>
  );
}
