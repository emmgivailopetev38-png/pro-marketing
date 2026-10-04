"use client";
import { useEffect } from "react";
import { preloadBookingPopup } from "@/lib/cal/embed";

/**
 * Зарежда календара за срещи скрит, след като страницата се е заредила и
 * браузърът е свободен — да не бута първото изрисуване. Така „Запази среща“
 * се отваря веднага, а не след ~10 секунди празен екран. При пестене на
 * данни или бавна мрежа не се зарежда предварително.
 */
export function CalPreload() {
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (conn?.saveData || /2g/.test(conn?.effectiveType ?? "")) return;

    let idleId: number | undefined;
    const timer = window.setTimeout(() => {
      const run = () => void preloadBookingPopup();
      if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(run, { timeout: 4000 });
      else run();
    }, 3000);

    return () => {
      window.clearTimeout(timer);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
    };
  }, []);

  return null;
}
