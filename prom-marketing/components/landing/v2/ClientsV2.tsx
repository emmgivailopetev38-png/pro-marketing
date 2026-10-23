/* ---------------------------------------------------------------------------
   ClientsV2 — „Направено при истински клиенти“ (23.10.2026).

   Заменя измислените сценарии като доказателство: тук са само системи,
   които наистина са построени и работят. Данните и флагът за имената са в
   lib/site/clients.ts. Сървърен компонент — нищо не се анимира.
--------------------------------------------------------------------------- */

import { CLIENT_CASES, SHOW_CLIENT_NAMES } from "@/lib/site/clients";

export function ClientsV2() {
  return (
    <section id="klienti" className="v2-section" style={{ paddingBlock: "clamp(56px, 8vw, 104px)" }}>
      <div className="v2-wrap">
        <div className="v2-head">
          <p className="v2-eyebrow">Истински клиенти</p>
          <h2 className="v2-title-plain">
            Не сценарии. <span className="v2-grad">Направено и работи.</span>
          </h2>
          <p className="v2-sub">
            Пет български фирми, пет различни системи. Без обещания, които не се виждат: само
            какво е построено и какво върши днес.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CLIENT_CASES.map((c) => (
            <article
              key={c.name}
              className="v2-card flex min-w-0 flex-col gap-4 p-6"
              style={{ ["--v2-c" as string]: c.accent }}
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="v2-mono text-[10.5px] uppercase tracking-[0.22em]" style={{ color: c.accent }}>
                    {c.branch}
                    {c.city ? ` · ${c.city}` : ""}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--v2-ink)]" style={{ fontFamily: "var(--v2-font-display)" }}>
                    {SHOW_CLIENT_NAMES ? c.name : c.branch.split(" · ")[0]}
                  </h3>
                </div>
                <span
                  aria-hidden
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: c.accent, boxShadow: `0 0 12px ${c.accent}` }}
                />
              </header>

              <p className="text-[15px] leading-relaxed text-[var(--v2-muted)]">{c.built}</p>

              <p className="mt-auto border-t border-[var(--v2-line,rgba(255,255,255,0.08))] pt-4 text-sm font-semibold text-[var(--v2-ink)]">
                {c.result}
              </p>
            </article>
          ))}

          {/* Шестата карта е вратата: същото може да е твоето. */}
          <article className="v2-card flex min-w-0 flex-col justify-between gap-4 p-6">
            <div>
              <p className="v2-eyebrow">Твоята фирма</p>
              <h3 className="mt-3 text-xl font-bold text-[var(--v2-ink)]" style={{ fontFamily: "var(--v2-font-display)" }}>
                Кое при теб да тръгне само?
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--v2-muted)]">
                Телефонът, записванията, офертите, постовете или рекламите. Казваш кое боли най-много,
                казвам ти честно какво може и за колко време.
              </p>
            </div>
            <a href="/booking" className="v2-btn v2-btn-primary inline-flex w-fit items-center gap-2">
              Безплатен разговор <span className="v2-arrow" aria-hidden>→</span>
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
