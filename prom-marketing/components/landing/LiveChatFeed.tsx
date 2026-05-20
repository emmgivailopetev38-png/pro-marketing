"use client";
import { useEffect, useState } from "react";

const MESSAGES = [
  { author: "Клиент", body: "Здравейте, искам да поръчам..." },
  { author: "AI Агент", body: "Здравейте! Веднага ви помагам. Кой продукт..." },
  { author: "Клиент", body: "Колко струва доставката?" },
  { author: "AI Агент", body: "До 24ч безплатно за поръчки над 50 лв ✓" },
];

export function LiveChatFeed() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const msg = MESSAGES[idx].body;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset between messages
    setTyped("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(msg.slice(0, i));
      if (i >= msg.length) {
        clearInterval(interval);
        setTimeout(() => setIdx((v) => (v + 1) % MESSAGES.length), 1800);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [idx]);

  const m = MESSAGES[idx];

  return (
    <div className="font-mono text-sm">
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
        {m.author}
      </div>
      <p className="text-[var(--color-text-primary)]">
        {typed}
        <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[var(--color-accent-cyan)] align-middle" />
      </p>
    </div>
  );
}
