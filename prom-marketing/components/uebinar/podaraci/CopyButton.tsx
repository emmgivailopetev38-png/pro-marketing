"use client";

import { useEffect, useRef, useState } from "react";

/** „Копирай“ за готовите съобщения — с резервен вариант за стари браузъри. */
export function CopyButton({ text, label = "Копирай" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (t.current) clearTimeout(t.current);
  }, []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setDone(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setDone(false), 2200);
  }

  return (
    <button type="button" className="pd-copy" data-done={done ? "1" : "0"} onClick={copy} aria-live="polite">
      <span aria-hidden>{done ? "✓" : "⧉"}</span> {done ? "Копирано" : label}
    </button>
  );
}
