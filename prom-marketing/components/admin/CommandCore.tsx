"use client";
// Animated "command core" — a glowing neural core with orbiting department
// nodes and data pulses. Lives behind the dashboard header for the 2035 feel.
// Canvas-based, lightweight, pauses when tab hidden, respects reduced-motion.
import { useEffect, useRef } from "react";

const COLORS = ["#34e7e4", "#38bdf8", "#5b7cfa", "#9b7bff", "#c861f7", "#ecc879"];

export function CommandCore() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      w = r.width;
      h = r.height;
      cv.width = Math.max(1, Math.floor(w * DPR));
      cv.height = Math.max(1, Math.floor(h * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 8;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * 0.78;
      const cy = h * 0.5;
      const R = Math.max(48, Math.min(w * 0.19, h * 0.46));

      // core glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.7);
      g.addColorStop(0, "rgba(150,240,255,0.85)");
      g.addColorStop(0.28, "rgba(52,231,228,0.42)");
      g.addColorStop(0.6, "rgba(91,124,250,0.18)");
      g.addColorStop(1, "rgba(8,12,22,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.7, 0, Math.PI * 2);
      ctx.fill();

      // rotating rings
      for (let k = 0; k < 2; k++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * (k === 0 ? 0.3 : -0.2));
        ctx.strokeStyle = k === 0 ? "rgba(120,200,255,0.45)" : "rgba(155,123,255,0.30)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 7]);
        ctx.beginPath();
        ctx.ellipse(0, 0, R * (0.62 + k * 0.32), R * (0.4 + k * 0.2), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash([]);

      // orbiting nodes + lines + inbound pulses
      for (let i = 0; i < N; i++) {
        const a = t * 0.5 + (i * Math.PI * 2) / N;
        const nx = cx + Math.cos(a) * R * 1.15;
        const ny = cy + Math.sin(a) * R * 0.72;
        const col = COLORS[i % COLORS.length];

        ctx.strokeStyle = "rgba(91,124,250,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // pulse travelling toward the core
        const pf = (t * 0.45 + i / N) % 1;
        const px = nx + (cx - nx) * pf;
        const py = ny + (cy - ny) * pf;
        ctx.fillStyle = col;
        ctx.globalAlpha = 1 - pf;
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // node
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(nx, ny, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // bright core dot
      ctx.fillStyle = "rgba(220,250,255,0.95)";
      ctx.shadowColor = "#34e7e4";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    if (reduce) {
      render();
      return () => window.removeEventListener("resize", resize);
    }

    const loop = () => {
      t += 0.016;
      render();
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
      aria-hidden="true"
    />
  );
}
