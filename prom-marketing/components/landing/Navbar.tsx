"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { openBookingPopup } from "@/lib/cal/embed";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#services", label: "Услуги" },
  { href: "#process", label: "Процес" },
  { href: "#industries", label: "За кого" },
  { href: "#faq", label: "Въпроси" },
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
          <div className="mt-auto">
            <button
              type="button"
              onClick={handleBooking}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-5 py-3 text-base font-semibold text-[var(--color-bg-void)]"
            >
              Запази среща
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
