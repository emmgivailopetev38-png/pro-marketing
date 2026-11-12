"use client";

/* Калкулаторът на /targovci: колко сделки на месец → колко печели търговецът.
   Сметката е в lib/site/targovci.ts (smetka), тук е само екранът. */

import { useState } from "react";
import { PRIMER, USLUGI, evro, komisiona, smetka, type Izbor } from "@/lib/site/targovci";

const MESECI = 6;

export function Kalkulator() {
  const [izbor, setIzbor] = useState<Izbor>(PRIMER);
  const r = smetka(izbor, MESECI);
  const promeni = (id: string, d: number) =>
    setIzbor((s) => ({ ...s, [id]: Math.min(20, Math.max(0, (s[id] ?? 0) + d)) }));

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="v2-card flex flex-col gap-2 p-4 sm:p-6">
        <p className="v2-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">Сделки на месец · пример — сложи своите</p>
        {USLUGI.map((u) => {
          const n = izbor[u.id] ?? 0;
          const zaEdna = [u.cena ? evro(komisiona(u.cena)) : null, u.mesechno ? `${evro(komisiona(u.mesechno))}/мес` : null]
            .filter(Boolean)
            .join(" + ");
          return (
            <div key={u.id} className="flex items-center justify-between gap-3 border-b border-[var(--v2-line)] py-2.5 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[var(--v2-ink)]">{u.ime}</p>
                <p className="v2-mono text-[11px] text-[var(--v2-cyan-2)]">
                  твоите {zaEdna}
                  {u.primer ? " · по оферта" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label={`По-малко: ${u.ime}`}
                  onClick={() => promeni(u.id, -1)}
                  className="h-9 w-9 rounded-full border border-[var(--v2-line)] text-lg text-[var(--v2-ink)] hover:border-[var(--v2-cyan)]"
                >
                  −
                </button>
                <span className="w-6 text-center text-lg font-bold tabular-nums text-[var(--v2-ink)]" aria-live="polite">
                  {n}
                </span>
                <button
                  type="button"
                  aria-label={`Повече: ${u.ime}`}
                  onClick={() => promeni(u.id, 1)}
                  className="h-9 w-9 rounded-full border border-[var(--v2-line)] text-lg text-[var(--v2-ink)] hover:border-[var(--v2-cyan)]"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="v2-card v2-glow is-always flex flex-col justify-center gap-5 p-6" style={{ ["--v2-c" as string]: "var(--v2-mint)" }}>
        <div>
          <p className="text-sm text-[var(--v2-muted)]">Еднократно, всеки месец с това темпо</p>
          <p className="v2-grad text-[clamp(2.2rem,6vw,3.2rem)] font-extrabold leading-none tabular-nums">{evro(r.ednokratno)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--v2-muted)]">Месечни, които се трупат с всеки нов клиент</p>
          <p className="text-[clamp(1.6rem,4vw,2.2rem)] font-extrabold leading-none tabular-nums text-[var(--v2-ink)]">
            + {evro(r.mesechnoNaMesec)} <span className="text-base font-semibold text-[var(--v2-muted)]">всеки месец</span>
          </p>
        </div>
        <div className="border-t border-[var(--v2-line)] pt-4">
          <p className="text-sm text-[var(--v2-muted)]">Към {MESECI}-ия месец получаваш</p>
          <p className="text-[clamp(1.8rem,5vw,2.6rem)] font-extrabold leading-none tabular-nums" style={{ color: "var(--v2-mint)" }}>
            {evro(r.prezMesec)} <span className="text-base font-semibold text-[var(--v2-muted)]">на месец</span>
          </p>
        </div>
        <p className="v2-mono text-[10.5px] leading-relaxed text-[var(--v2-faint)]">
          Сметка, не обещание: 10 % от цените, които казваме на клиентите. Сайтът и маркетингът са по оферта — числата са пример.
        </p>
      </div>
    </div>
  );
}
