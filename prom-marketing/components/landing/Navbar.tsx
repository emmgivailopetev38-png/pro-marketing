"use client";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <button
          type="button"
          onClick={() => void openBookingPopup()}
          className="relative inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-void)] transition-transform hover:scale-[1.03]"
        >
          Запази среща
          <span aria-hidden>→</span>
        </button>
      </nav>
    </header>
  );
}
