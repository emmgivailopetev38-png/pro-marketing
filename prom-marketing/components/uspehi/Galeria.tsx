"use client";

/* Галерия „Зад кадър" за /uspehi: истински кадри + слайдове от презентацията.
   Филтър по категория и увеличение при клик (Esc / клик затваря). */

import Image from "next/image";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Snimka } from "@/lib/site/uspehi";

const KAT: { k: "vsichki" | Snimka["kategoria"]; t: string }[] = [
  { k: "vsichki", t: "Всички" },
  { k: "teren", t: "На терен" },
  { k: "prezentacia", t: "Презентацията на срещите" },
  { k: "sabitia", t: "Събития" },
];

export function Galeria({ snimki }: { snimki: Snimka[] }) {
  const [kat, setKat] = useState<(typeof KAT)[number]["k"]>("vsichki");
  const [otvorena, setOtvorena] = useState<Snimka | null>(null);
  const vidimi = snimki.filter((s) => kat === "vsichki" || s.kategoria === kat);
  const imaKat = new Set(snimki.map((s) => s.kategoria));

  useEffect(() => {
    if (!otvorena) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtvorena(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [otvorena]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Филтър на галерията">
        {KAT.filter((c) => c.k === "vsichki" || imaKat.has(c.k)).map((c) => (
          <button
            key={c.k}
            type="button"
            role="tab"
            aria-selected={kat === c.k}
            onClick={() => setKat(c.k)}
            className="v2-mono rounded-full px-4 py-2 text-[12px] uppercase tracking-[0.14em] transition"
            style={{
              border: "1px solid var(--v2-line)",
              background: kat === c.k ? "var(--v2-cyan)" : "var(--v2-glass)",
              color: kat === c.k ? "#04121a" : "var(--v2-muted)",
            }}
          >
            {c.t}
          </button>
        ))}
      </div>

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {vidimi.map((s) => (
          <figure key={s.src} className="v2-card break-inside-avoid overflow-hidden p-0" style={{ padding: 0 }}>
            <button type="button" onClick={() => setOtvorena(s)} className="block w-full" aria-label={`Увеличи: ${s.etiket}`}>
              <Image src={s.src} alt={s.alt} width={s.width} height={s.height} loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" className="h-auto w-full transition duration-500 hover:scale-[1.02]" />
            </button>
            <figcaption className="border-t px-4 py-3 text-sm font-semibold" style={{ borderColor: "var(--v2-line)", color: "var(--v2-ink)" }}>
              {s.etiket}
            </figcaption>
          </figure>
        ))}
      </div>

      {otvorena && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={otvorena.etiket}
          onClick={() => setOtvorena(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(2,4,10,0.92)", backdropFilter: "blur(6px)" }}
        >
          <button type="button" aria-label="Затвори" className="absolute right-4 top-4 rounded-full p-2" style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
            <X className="h-6 w-6" />
          </button>
          <figure className="flex max-h-full max-w-5xl flex-col items-center gap-3">
            <Image src={otvorena.src} alt={otvorena.alt} width={otvorena.width} height={otvorena.height} sizes="90vw" className="h-auto max-h-[82vh] w-auto rounded-2xl" />
            <figcaption className="text-center text-sm font-semibold text-white">{otvorena.etiket}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
