"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const CHARS = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_+";

interface Props {
  text: string;
  durationMs?: number;
  className?: string;
}

export function TextScramble({ text, durationMs = 900, className }: Props) {
  const [out, setOut] = useState(text);
  const startedRef = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || startedRef.current) return;
    startedRef.current = true;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const revealed = Math.floor(t * text.length);
      let next = "";
      for (let i = 0; i < text.length; i++) {
        if (i < revealed) next += text[i];
        else if (text[i] === " ") next += " ";
        else next += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      setOut(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, durationMs, reduced]);

  return <span className={className}>{out}</span>;
}
