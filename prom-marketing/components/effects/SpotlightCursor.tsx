"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function SpotlightCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const [coarse, setCoarse] = useState(false);

  // Touch devices have no cursor — never mount the spotlight rAF loop there.
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

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const tick = () => {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      dot.style.transform = `translate3d(${cx - 240}px, ${cy - 240}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    tick();
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
        filter: "blur(20px)",
      }}
    />
  );
}
