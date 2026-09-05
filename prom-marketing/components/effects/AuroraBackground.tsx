"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface Props {
  className?: string;
  intensity?: "subtle" | "normal" | "intense";
}

/**
 * Трите размазани петна светлина зад героя.
 *
 * Blur върху 80vh елемент с mix-blend-mode и transform анимация е
 * най-скъпото нещо на страницата за GPU-то. Затова (05.09.2026):
 *   • слоевете са на собствен композитен слой (`will-change`, `translateZ`)
 *     и с `contain: paint`, за да не влачат репейнт на съседите;
 *   • размазването е малко по-малко (48/48/64 вместо 60/60/80 px) — при
 *     петна с този размер окото не вижда разлика, а цената пада с квадрата;
 *   • на слаба машина (≤ 4 ядра или ≤ 4 GB) третото петно отпада и нищо не
 *     се движи — там точно тази анимация правеше героя да „заеква".
 */
export function AuroraBackground({ className, intensity = "normal" }: Props) {
  const reduced = useReducedMotion();
  const [lowEnd, setLowEnd] = useState(false);
  const opacity = intensity === "subtle" ? 0.45 : intensity === "intense" ? 0.85 : 0.65;

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    setLowEnd(cores <= 4 || mem <= 4);
  }, []);

  const still = reduced || lowEnd;
  const layer = { willChange: still ? undefined : "transform", transform: "translateZ(0)", contain: "paint" } as const;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute -top-1/3 -left-1/4 h-[80vh] w-[80vh] rounded-full"
        style={{
          ...layer,
          background: "radial-gradient(circle, rgba(6,182,212,0.55) 0%, transparent 60%)",
          filter: "blur(48px)",
          opacity,
          animation: still ? "none" : "aurora-drift 22s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute top-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full"
        style={{
          ...layer,
          background: "radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 60%)",
          filter: "blur(48px)",
          opacity,
          animation: still ? "none" : "aurora-drift 28s ease-in-out infinite reverse",
          mixBlendMode: "screen",
        }}
      />
      {!lowEnd && (
        <div
          className="absolute bottom-0 left-1/3 h-[55vh] w-[55vh] rounded-full"
          style={{
            ...layer,
            background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 60%)",
            filter: "blur(64px)",
            opacity: opacity * 0.7,
            animation: still ? "none" : "aurora-drift 34s ease-in-out infinite",
            mixBlendMode: "screen",
          }}
        />
      )}
      <div className="absolute inset-0 grid-overlay opacity-40" />
    </div>
  );
}
