"use client";
import { useMagnetic } from "@/hooks/use-magnetic";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}

export function MagneticButton({ children, className, strength = 0.35, radius = 60 }: Props) {
  const reduced = useReducedMotion();
  const ref = useMagnetic<HTMLDivElement>(reduced ? 0 : strength, radius);
  return (
    <div ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </div>
  );
}
