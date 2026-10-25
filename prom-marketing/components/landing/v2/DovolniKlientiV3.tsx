/* ---------------------------------------------------------------------------
   DovolniKlientiV3 — „Какво казват клиентите“ (25.10.2026).

   Веднага след героя: истински думи на истински клиенти, дословно, със
   снимката на съобщението, където я има. Данните и правилото за имената са
   в lib/site/otzivi.ts. Сървърен компонент, само v2 токени, без призив —
   единствено тих линк към случаите (#klienti).
--------------------------------------------------------------------------- */

import Image from "next/image";
import { OTZIVI, avtorNaOtziv, redSChisla, type Otziv } from "@/lib/site/otzivi";

function OtzivCard({ o, golyama }: { o: Otziv; golyama?: boolean }) {
  return (
    <figure
      className={`v2-card flex min-w-0 flex-col gap-4 p-6 ${golyama ? "lg:row-span-2" : ""}`}
      style={{ ["--v2-c" as string]: "var(--v2-cyan)" }}
    >
      {o.snimka ? (
        <Image
          src={o.snimka.src}
          alt={o.text}
          width={o.snimka.width}
          height={o.snimka.height}
          loading="lazy"
          sizes="(max-width: 640px) 100vw, 640px"
          className="h-auto w-full max-w-[400px] self-start rounded-xl border border-[var(--v2-line)] sm:max-w-full"
        />
      ) : null}

      <blockquote className="m-0 text-[15px] leading-relaxed text-[var(--v2-ink)] sm:text-base">
        „{o.text}“
      </blockquote>

      {o.dopalnenie ? (
        <p className="m-0 text-sm text-[var(--v2-muted)]">{o.dopalnenie}</p>
      ) : null}

      <figcaption className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-[var(--v2-line)] pt-4">
        <span className="text-sm font-semibold text-[var(--v2-ink)]">{avtorNaOtziv(o)}</span>
        <span className="v2-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--v2-faint)]">
          {o.kanal} · {o.data}
        </span>
      </figcaption>
    </figure>
  );
}

export function DovolniKlientiV3() {
  const [parvi, ...drugi] = OTZIVI;
  return (
    <section id="otzivi" className="v2-section" style={{ paddingBlock: "clamp(48px, 7vw, 96px)" }}>
      <div className="v2-wrap">
        <div className="v2-head" style={{ marginBottom: "clamp(28px, 4vw, 44px)" }}>
          <p className="v2-eyebrow">Доволни клиенти</p>
          <h2 className="v2-title-plain">Какво казват клиентите</h2>
          <p className="v2-mono text-[12.5px] text-[var(--v2-muted)] sm:text-sm">{redSChisla()}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <OtzivCard o={parvi} golyama />
          {drugi.map((o) => (
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
