import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 pb-10 pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Top row — brand + CTA */}
        <div className="mb-12 grid gap-10 border-b border-[var(--color-border-default)] pb-12 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <div>
            <Logo />
            <p className="mt-5 max-w-md text-base text-[var(--color-text-secondary)]">
              AI автоматизации, които превръщат рутината в растеж.
              Изграждаме AI агенти, CRM системи и софтуер по поръчка за български бизнеси.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                ⏱️ 12-15ч/седмица спестено
              </span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-300">
                🤖 24/7 AI агенти
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end md:justify-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              Готов ли си?
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-6 py-3 text-sm font-semibold text-[var(--color-bg-void)] shadow-[0_0_30px_rgba(6,182,212,0.35)] transition-shadow hover:shadow-[0_0_50px_rgba(6,182,212,0.55)]"
            >
              Запази безплатна консултация
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        {/* Middle row — 4 columns */}
        <div className="mb-12 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              Контакт
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  className="font-mono text-[var(--color-accent-cyan)] transition-colors hover:text-[var(--color-text-primary)]"
                  href="tel:+359877399963"
                >
                  +359 877 399 963
                </a>
              </li>
              <li>
                <a
                  className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                  href="mailto:emmgivailopetev38@gmail.com"
                >
                  emmgivailopetev38@gmail.com
                </a>
              </li>
              <li className="text-[var(--color-text-secondary)]">Пловдив, България</li>
              <li className="pt-2 text-xs text-[var(--color-text-tertiary)]">
                Работно време: пон-пет 9:00 — 19:00
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              Сайт
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" href="#services">
                  Услуги
                </a>
              </li>
              <li>
                <a className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" href="#crm">
                  CRM
                </a>
              </li>
              <li>
                <a className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" href="#industries">
                  За кого
                </a>
              </li>
              <li>
                <a className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" href="#faq">
                  Въпроси
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              Услуги
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="text-[var(--color-text-secondary)]">AI чат агенти</li>
              <li className="text-[var(--color-text-secondary)]">AI CRM</li>
              <li className="text-[var(--color-text-secondary)]">Софтуер по поръчка</li>
              <li className="text-[var(--color-text-secondary)]">Гласови AI агенти</li>
              <li className="text-[var(--color-text-secondary)]">Имейл и SMS автоматизация</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              Правни
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" href="/privacy">
                  Поверителност
                </a>
              </li>
              <li>
                <a className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" href="/terms">
                  Условия
                </a>
              </li>
              <li>
                <a className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" href="/cookies">
                  Бисквитки
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-text-tertiary)]">
          <p>© {year} ProMarketing LTD. Всички права запазени.</p>
          <p className="font-mono">EOOD · ЕИК 207223552 · ДДС BG207223552</p>
        </div>
      </div>
    </footer>
  );
}
