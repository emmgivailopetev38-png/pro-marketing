"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Мекото сияние, което следва курсора.
 *
 * До 05.09.2026 rAF цикълът вървеше НЕПРЕКЪСНАТО — 60 пъти в секунда се
 * местеше 480px размазан слой с mix-blend-mode, дори когато мишката не е
 * мръднала от минута. Това е постоянна GPU работа върху цялата страница.
 * Сега цикълът тръгва при движение и спира, щом сиянието стигне курсора.
 */
export function SpotlightCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const [coarse, setCoarse] = useState(false);

  // Touch devices have no cursor — never mount the spotlight there.
  useEffect(() => {
    setCoarse(window.matchMedia?.("(pointer: coarse)").matches ?? false);
  }, []);

  useEffect(() => {
    if (reduced || coarse) return;
    const dot = dotRef.current;
    if (!dot) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let raf = 0;
    let running = false;

    const tick = () => {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      dot.style.transform = `translate3d(${cx - 240}px, ${cy - 240}px, 0)`;
      // Стигна ли курсора — спира, докато мишката не мръдне пак.
      if (Math.abs(mx - cx) + Math.abs(my - cy) < 0.4) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    dot.style.transform = `translate3d(${cx - 240}px, ${cy - 240}px, 0)`;
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced, coarse]);

  if (reduced || coarse) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[1] h-[480px] w-[480px] rounded-full will-change-transform"
      style={{
        background:
          "radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(124,58,237,0.10) 40%, transparent 70%)",
        mixBlendMode: "screen",
        filter: "blur(14px)",
      }}
    />
  );
}
