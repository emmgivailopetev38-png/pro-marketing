"use client";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface Props {
  className?: string;
  intensity?: "subtle" | "normal" | "intense";
}

export function AuroraBackground({ className, intensity = "normal" }: Props) {
  const reduced = useReducedMotion();
  const opacity = intensity === "subtle" ? 0.45 : intensity === "intense" ? 0.85 : 0.65;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="absolute -top-1/3 -left-1/4 h-[80vh] w-[80vh] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.55) 0%, transparent 60%)",
          filter: "blur(60px)",
          opacity,
          animation: reduced ? "none" : "aurora-drift 22s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute top-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.5) 0%, transparent 60%)",
          filter: "blur(60px)",
          opacity,
          animation: reduced ? "none" : "aurora-drift 28s ease-in-out infinite reverse",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[55vh] w-[55vh] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 60%)",
          filter: "blur(80px)",
          opacity: opacity * 0.7,
          animation: reduced ? "none" : "aurora-drift 34s ease-in-out infinite",
          mixBlendMode: "screen",
        }}
      />
      <div className="absolute inset-0 grid-overlay opacity-40" />
    </div>
  );
}
