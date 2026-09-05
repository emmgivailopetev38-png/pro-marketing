"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface Props {
  density?: number;
  maxLinkDist?: number;
  className?: string;
}

/**
 * Полето от частици зад героя — 2D canvas, само на настолен браузър.
 *
 * Три неща, поправени на 05.09.2026, защото полето „мигаше" при зареждане:
 *   • `resize` разпръскваше частиците наново при ВСЯКО събитие resize — а то
 *     идва и при появата на скролбар, и при смяна на зуум, и при отваряне на
 *     конзолата. Сега се презасяват само ако размерът наистина е сменен, и
 *     дори тогава старите позиции се мащабират, а не се хвърлят.
 *   • `getBoundingClientRect` се четеше на всеки кадър — layout на 60 Hz.
 *     Размерът се кешира.
 *   • Цикълът вървеше и когато героят е далеч под скрола, и в скрит таб.
 *     Спира, когато не е в кадър или страницата е скрита.
 */
export function ParticleField({ density = 40, maxLinkDist = 140, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();
  const [coarse, setCoarse] = useState(false);

  // Mobile/touch: skip the O(n²) canvas loop entirely.
  useEffect(() => {
    setCoarse(window.matchMedia?.("(pointer: coarse), (max-width: 820px)").matches ?? false);
  }, []);

  useEffect(() => {
    if (reduced || coarse) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let inView = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const size = { w: 0, h: 0 };
    let particles: Array<{ x: number; y: number; vx: number; vy: number }> = [];
    let mouse = { x: -9999, y: -9999 };

    const seed = (w: number, h: number) =>
      Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w === size.w && h === size.h) return;
      if (w === 0 || h === 0) return;
      if (particles.length === 0) {
        particles = seed(w, h);
      } else {
        // Същите частици, разтеглени към новия размер — не нов случаен облак.
        const sx = w / size.w;
        const sy = h / size.h;
        for (const p of particles) {
          p.x *= sx;
          p.y *= sy;
        }
      }
      size.w = w;
      size.h = h;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      mouse = { x: -9999, y: -9999 };
    };

    const draw = () => {
      if (!running) return;
      const { w, h } = size;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(125, 211, 252, 0.7)";
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxLinkDist) {
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.22 * (1 - d / maxLinkDist)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const a = particles[i];
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < maxLinkDist * 1.4) {
          ctx.strokeStyle = `rgba(236, 72, 153, ${0.35 * (1 - dm / (maxLinkDist * 1.4))})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const sync = () => {
      if (inView && document.visibilityState === "visible") start();
      else stop();
    };

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        sync();
      },
      { rootMargin: "80px" }
    );

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", sync);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    io.observe(canvas);
    sync();

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [density, maxLinkDist, reduced, coarse]);

  if (reduced || coarse) return null;

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-auto absolute inset-0 ${className ?? ""}`} />;
}
