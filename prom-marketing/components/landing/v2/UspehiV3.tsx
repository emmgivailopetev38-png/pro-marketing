/* ---------------------------------------------------------------------------
   UspehiV3 — „Резултати, които се виждат" на началната страница (03.11.2026).
   Числа само от CRM/Meta с дата + 2 видеа (4:5) + линк към /uspehi.
   Данните са в lib/site/uspehi.ts. Сървърен компонент; видеото е клиентско.
--------------------------------------------------------------------------- */

import Link from "next/link";
import { CHISLA, VIDEA, redChisla } from "@/lib/site/uspehi";
import { VideoKarta } from "@/components/uspehi/VideoKarta";

export function ChislaRed() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CHISLA.map((c) => (
        <div key={c.tekst} className="v2-card flex flex-col gap-1 p-5">
          <span className="v2-grad text-[clamp(2rem,4.5vw,3rem)] font-extrabold leading-none tracking-tight">{c.stoinost}</span>
          <span className="text-[14px] font-semibold leading-snug" style={{ color: "var(--v2-ink)" }}>{c.tekst}</span>
          <span className="v2-mono mt-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--v2-faint)" }}>{c.iztochnik}</span>
        </div>
      ))}
    </div>
  );
}

export function UspehiV3() {
  const dve = VIDEA.filter((v) => v.format === "4x5");
  return (
    <section id="uspehi" className="v2-section" style={{ paddingBlock: "clamp(48px, 7vw, 96px)" }}>
      <div className="v2-wrap">
        <div className="v2-head" style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
          <p className="v2-eyebrow">Успехи</p>
          <h2 className="v2-title-plain">Резултати, които се виждат</h2>
          <p className="v2-mono text-[12.5px] sm:text-sm" style={{ color: "var(--v2-muted)" }}>{redChisla()}</p>
        </div>

        <ChislaRed />

        <div className="mx-auto mt-8 grid max-w-[900px] gap-5 sm:grid-cols-2">
          {dve.map((v) => (
            <VideoKarta key={v.slug} v={v} kade="nachalo" />
          ))}
        </div>

        <p className="mt-7 text-sm">
          <Link href="/uspehi" className="text-[var(--v2-cyan)] underline decoration-[var(--v2-cyan)]/40 underline-offset-4">
            Всички успехи, видеа и галерия →
          </Link>
        </p>
      </div>
    </section>
  );
}
