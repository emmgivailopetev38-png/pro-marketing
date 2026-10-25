/* ---------------------------------------------------------------------------
   DovolniKlientiV3 — „Какво казват клиентите“ (25.10.2026).

   Веднага след героя: само истински скрийншоти на съобщения от клиенти —
   едро, без имена (правилото е в lib/site/otzivi.ts). Под всяка снимка:
   „клиент · дейност“ и канал/дата. Сървърен компонент, само v2 токени,
   без призив — единствено тих линк към случаите (#klienti).
--------------------------------------------------------------------------- */

import Image from "next/image";
import { OTZIVI, redSChisla, type Otziv } from "@/lib/site/otzivi";

function OtzivCard({ o }: { o: Otziv }) {
  return (
    <figure
      className="v2-card flex min-w-0 flex-col gap-4 p-4 sm:p-5"
      style={{ ["--v2-c" as string]: "var(--v2-cyan)" }}
    >
      <Image
        src={o.snimka.src}
        alt={`Съобщение от клиент: „${o.text}“`}
        width={o.snimka.width}
        height={o.snimka.height}
        loading="lazy"
        sizes="(max-width: 640px) 420px, 640px"
        className="h-auto w-full max-w-[420px] self-center rounded-xl border border-[var(--v2-line)] sm:max-w-full"
      />

      <figcaption className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--v2-line)] pt-3">
        <span className="text-sm font-semibold text-[var(--v2-ink)]">{o.etiket}</span>
        <span className="v2-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--v2-faint)]">
          {o.kanal} · {o.data}
        </span>
      </figcaption>
    </figure>
  );
}

export function DovolniKlientiV3() {
  return (
    <section id="otzivi" className="v2-section" style={{ paddingBlock: "clamp(48px, 7vw, 96px)" }}>
      <div className="v2-wrap">
        <div className="v2-head" style={{ marginBottom: "clamp(28px, 4vw, 44px)" }}>
          <p className="v2-eyebrow">Доволни клиенти</p>
          <h2 className="v2-title-plain">Какво казват клиентите</h2>
          <p className="v2-mono text-[12.5px] text-[var(--v2-muted)] sm:text-sm">{redSChisla()}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {OTZIVI.map((o) => (
            <OtzivCard key={o.id} o={o} />
          ))}
        </div>

        <p className="mt-6 text-sm">
          <a
            href="#klienti"
            className="text-[var(--v2-cyan)] underline decoration-[var(--v2-cyan)]/40 underline-offset-4"
          >
            Виж случаите →
          </a>
        </p>
      </div>
    </section>
  );
}
