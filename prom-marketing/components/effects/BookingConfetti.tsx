"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function BookingConfetti() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const fire = () => {
      const opts = {
        spread: 80,
        ticks: 200,
        gravity: 0.7,
        scalar: 0.9,
        colors: ["#06b6d4", "#7c3aed", "#ec4899", "#f5f7ff"],
      };
      confetti({ ...opts, origin: { x: 0.25, y: 0.4 }, particleCount: 80, angle: 60 });
      confetti({ ...opts, origin: { x: 0.75, y: 0.4 }, particleCount: 80, angle: 120 });
    };
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string };
      if (data?.type === "bookingSuccessful" || data?.type === "calcom:booking_successful") {
        fire();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [reduced]);
  return null;
}
