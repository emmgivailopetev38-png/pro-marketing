"use client";
/* Лентата със срока на /obuchenie-az — живо броене до 16.11.2026, 16:00.
   Сървърът рисува статичния срок (без разминаване при хидратация); броенето
   тръгва в браузъра и се опреснява на всяка минута. */
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { countdownText, OBUCHENIE_AZ_DEADLINE } from "@/lib/leads/obuchenie-az";

export function Countdown() {
  const [text, setText] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => setText(countdownText(new Date(), OBUCHENIE_AZ_DEADLINE));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const over = text === null;
  return (
    <div
      role="timer"
      aria-live="polite"
      className="flex items-center justify-center gap-2 px-4 py-2.5 text-center text-[13.5px] font-semibold sm:text-sm"
      style={{
        background: over ? "rgba(147,163,196,0.12)" : "linear-gradient(90deg, rgba(34,211,238,0.16), rgba(124,58,237,0.18))",
        borderBottom: "1px solid var(--v2-line)",
        color: "var(--v2-ink)",
      }}
    >
      <Clock className="h-4 w-4 shrink-0" style={{ color: "var(--v2-cyan)" }} aria-hidden />
      <span>
        {text === undefined
          ? "Срок за заявления: 16.11.2026, 16:00 ч."
          : over
            ? "Приемът приключи — остави телефон за следващия"
            : text}
      </span>
    </div>
  );
}
