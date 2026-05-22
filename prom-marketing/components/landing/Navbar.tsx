"use client";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { openBookingPopup } from "@/lib/cal/embed";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#services", label: "Услуги" },
  { href: "#process", label: "Процес" },
  { href: "#industries", label: "За кого" },
  { href: "#faq", label: "Въпроси" },
  { href: "#kontakti", label: "Контакти" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleBooking = () => {
    setOpen(false);
    void openBookingPopup();
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4 transition-all duration-300",
        scrolled ? "pt-2" : "pt-4"
      )}
    >
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-300",
          scrolled ? "glass shadow-[0_0_30px_rgba(6,182,212,0.08)]" : "bg-transparent"
        )}
      >
        <a href="#top" aria-label="ProMarketing начало">
          <Logo />
        </a>
        <ul className="hidden md:flex items-center gap-7 text-sm text-[var(--color-text-secondary)]">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="transition-colors hover:text-[var(--color-text-primary)]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a
            href="tel:+359877399963"
            aria-label="Обади се: 0877 399 963"
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-cyan)] hover:text-[var(--color-accent-cyan)]"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="font-mono">0877 399 963</span>
          </a>
          <a
            href="tel:+359877399963"
            aria-label="Обади се"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-default)] text-[var(--color-accent-cyan)] transition-colors hover:bg-white/5"
          >
            <Phone className="h-4 w-4" />
          </a>
          <a
            href="#kontakti"
            className="hidden md:inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.03]"
            style={{
              borderColor: "var(--color-accent-cyan)",
              color: "var(--color-accent-cyan)",
              background: "rgba(0, 212, 255, 0.06)",
            }}
          >
            📞 Остави контакт
          </a>
          <button
            type="button"
            onClick={() => void openBookingPopup()}
            className="relative inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-void)] transition-transform hover:scale-[1.03]"
          >
            Запази среща
            <span aria-hidden>→</span>
          </button>
          <button
            type="button"
            aria-label="Отвори меню"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-white/5"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {open && (
        <div
          className="glass fixed inset-0 z-50 flex flex-col px-6 pt-6 pb-10 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Мобилна навигация"
        >
          <div className="flex items-center justify-between">
            <a href="#top" aria-label="ProMarketing начало" onClick={() => setOpen(false)}>
              <Logo />
            </a>
            <button
              type="button"
              aria-label="Затвори меню"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-white/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="mt-12 flex flex-col gap-2 text-2xl font-medium text-[var(--color-text-primary)]">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 transition-colors hover:text-[var(--color-accent-cyan)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-3">
            <button
              type="button"
              onClick={handleBooking}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-5 py-3 text-base font-semibold text-[var(--color-bg-void)]"
            >
              Запази среща
              <span aria-hidden>→</span>
            </button>
            <a
              href="#kontakti"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-base font-semibold"
              style={{
                borderColor: "var(--color-accent-cyan)",
                color: "var(--color-accent-cyan)",
                background: "rgba(0, 212, 255, 0.06)",
              }}
            >
              📞 Остави контакт
            </a>
            <a
              href="tel:+359877399963"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border-bright)] px-5 py-3 text-base font-medium text-[var(--color-text-primary)] hover:bg-white/5"
            >
              <Phone className="h-4 w-4" />
              <span className="font-mono">0877 399 963</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
