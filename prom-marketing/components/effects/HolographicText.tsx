"use client";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3";
}

export function HolographicText({ children, className, as: Tag = "span" }: Props) {
  return <Tag className={cn("text-holographic", className)}>{children}</Tag>;
}
