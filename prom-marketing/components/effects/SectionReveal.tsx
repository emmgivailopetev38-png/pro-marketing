"use client";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "header" | "footer";
}

export function SectionReveal({ children, className, delay = 0, as: Tag = "div" }: Props) {
  const reduced = useReducedMotion();
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  const style: CSSProperties = reduced
    ? {}
    : {
        transitionDelay: `${delay}ms`,
        transitionDuration: "700ms",
        transitionProperty: "opacity, transform",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      };

  return (
    <Tag
      ref={ref as never}
      style={style}
      className={cn(
        reduced ? "" : visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
    >
      {children}
    </Tag>
  );
}
