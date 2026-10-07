"use client";

import { useState } from "react";

/** Бутон „Копирай“ до заявките за AI — в печата (PDF) се скрива. */
export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          /* без достъп до клипборда — текстът се маркира и копира на ръка */
        }
      }}
    >
      {done ? "Копирано ✓" : "Копирай"}
    </button>
  );
}
