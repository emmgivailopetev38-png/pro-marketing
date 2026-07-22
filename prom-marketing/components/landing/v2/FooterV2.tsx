import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

/* =====================================================================
   FooterV2 — the original Footer, redrawn in the "2050" "Luminescent
   Depth" language. ALL content is preserved 1:1: brand line, both
   status pills, the booking CTA, the four columns (Контакт / Сайт /
   Услуги / Правни) with every link, the phone/email/address, working
   hours, copyright, and the EOOD · ЕИК · ДДС line. Only the skin
   changes — depth-glass shell, neon conic edges, holographic accents,
   Sora/JetBrains type via the v2 tokens — plus a faint NeuralCore
   breathing behind the brand + CTA block. No "лв/лева" present to
   convert. Stays a server component (only new Date(), no hooks/state).
   ===================================================================== */

export function FooterV2() {
  const year = new Date().getFullYear();
  return (
    <footer className="v2-scope relative overflow-hidden border-t border-[var(--v2-line)] bg-[var(--v2-void)]/60 pb-12 pt-24">
      {/* Engineered grid + signature aurora-style top glow */}
      <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-[1] h-72"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--v2-glow-cyan) 0%, transparent 60%)",
          opacity: 0.16,
        }}
      />

      <div className="v2-wrap">
        {/* Top row — brand + CTA, on a depth-glass panel with a living core */}
        <div
          className="v2-glass v2-glow is-always relative mb-12 grid gap-10 overflow-hidden p-6 md:grid-cols-[1.4fr_1fr] md:items-center md:gap-16 md:p-9"
          style={{ ["--v2-c" as string]: "var(--v2-cyan)" }}
        >
          {/* Living neural core breathing behind the brand block */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 opacity-30"
          >
            <NeuralCore radius={1.2} nodeCount={160} spin={0.6} />
          </div>

          <div className="relative z-[1]">
            <Logo />
            <p className="v2-sub mt-5 max-w-md">
              AI автоматизации, които превръщат рутината в растеж.
              Изграждаме AI агенти, CRM системи и софтуер по поръчка за български бизнеси.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="v2-mono rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] px-3 py-1 text-[11px] text-[var(--v2-mint)]">
                ⏱️ 12-15ч/седмица спестено
              </span>
              <span className="v2-mono rounded-full border border-[var(--v2-line-bright)] bg-[color-mix(in_srgb,var(--v2-cyan)_10%,transparent)] px-3 py-1 text-[11px] text-[var(--v2-cyan)]">
                🤖 24/7 AI агенти
              </span>
            </div>
          </div>

          <div className="relative z-[1] flex flex-col items-start gap-4 md:items-end md:justify-center">
            <p className="v2-mono text-xs uppercase tracking-[0.2em] text-[var(--v2-faint)]">
              Готов ли си?
            </p>
            <Link href="/booking" className="v2-btn v2-btn-primary is-lg">
              Запази безплатна консултация
              <span className="v2-arrow" aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* Middle row — 4 columns */}
        <div className="mb-12 grid gap-10 border-y border-[var(--v2-line)] py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <h4 className="v2-mono mb-3 text-xs uppercase tracking-[0.2em] text-[var(--v2-faint)]">
              Контакт
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  className="v2-mono text-[var(--v2-cyan)] transition-colors hover:text-[var(--v2-ink)]"
                  href="tel:+359877399963"
                >
                  +359 877 399 963
                </a>
              </li>
              <li>
                <a
                  className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]"
                  href="mailto:ivailopetev38@gmail.com"
                >
                  ivailopetev38@gmail.com
                </a>
              </li>
              <li className="text-[var(--v2-muted)]">Пловдив, България</li>
              <li className="pt-2 text-xs text-[var(--v2-faint)]">
                Работно време: пон-пет 9:00 — 19:00
              </li>
            </ul>
          </div>

          <div>
            <h4 className="v2-mono mb-3 text-xs uppercase tracking-[0.2em] text-[var(--v2-faint)]">
              Сайт
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/jarvis">
                  Jarvis
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/strategii">
                  Лаборатория за стратегии
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/ai-trading">
                  AI Трейдинг ботове
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/demo">
                  Живо демо
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/plan">
                  План и цени
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/model">
                  Продуктов модел
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/magazin">
                  Магазин
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/trading">
                  Трейдинг книга
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/partneri">
                  Партньори
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="v2-mono mb-3 text-xs uppercase tracking-[0.2em] text-[var(--v2-faint)]">
              Услуги
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="text-[var(--v2-muted)]">AI чат агенти</li>
              <li className="text-[var(--v2-muted)]">AI CRM</li>
              <li className="text-[var(--v2-muted)]">Софтуер по поръчка</li>
              <li className="text-[var(--v2-muted)]">Гласови AI агенти</li>
              <li className="text-[var(--v2-muted)]">Имейл и SMS автоматизация</li>
            </ul>
          </div>

          <div>
            <h4 className="v2-mono mb-3 text-xs uppercase tracking-[0.2em] text-[var(--v2-faint)]">
              Правни
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/privacy">
                  Поверителност
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/terms">
                  Условия
                </a>
              </li>
              <li>
                <a className="text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]" href="/cookies">
                  Бисквитки
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--v2-faint)]">
          <p>© {year} ProMarketing LTD. Всички права запазени.</p>
          <p className="v2-mono">EOOD · ЕИК 207223552 · ДДС BG207223552</p>
        </div>
      </div>
    </footer>
  );
}
