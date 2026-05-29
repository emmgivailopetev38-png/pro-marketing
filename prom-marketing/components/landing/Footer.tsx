import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-[var(--color-text-secondary)]">
            AI автоматизации, които превръщат рутината в растеж.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Сайт
          </h4>
          <ul className="space-y-2 text-sm">
            <li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" href="#services">Услуги</a></li>
            <li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" href="#process">Процес</a></li>
            <li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" href="#industries">За кого</a></li>
            <li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" href="#faq">Въпроси</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Контакти
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                className="font-mono text-[var(--color-accent-cyan)] hover:text-[var(--color-text-primary)]"
                href="tel:+359877399963"
              >
                +359 877 399 963
              </a>
            </li>
            <li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" href="mailto:ivailopetev38@gmail.com">ivailopetev38@gmail.com</a></li>
            <li className="text-[var(--color-text-secondary)]">Пловдив, България</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Правни
          </h4>
          <ul className="space-y-2 text-sm">
            <li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" href="/privacy">Поверителност</a></li>
            <li><a className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" href="/terms">Условия</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-[var(--color-border-default)] px-6 pt-6 text-xs text-[var(--color-text-tertiary)]">
        © {year} ProMarketing LTD. Всички права запазени.
      </div>
    </footer>
  );
}
