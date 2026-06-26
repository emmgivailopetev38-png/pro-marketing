"use client";
/* =====================================================================
   NavbarV2 — the public Navbar redrawn in the "2050 / Luminescent Depth"
   visual language. Same content, links, data, icons, state & behaviour
   as components/landing/Navbar.tsx (1:1) — only the skin changes to the
   v2 system (depth-glass pill, conic neon edge, mono telemetry, Sora
   type via the v2 tokens). The mobile fullscreen menu gets a faint
   <NeuralCore/> as an atmospheric backdrop where it reads well.

   Tokens come from app/v2/v2-design.css; this component is rendered
   inside the .v2-scope root, so --v2-* variables resolve.
   ===================================================================== */
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Logo } from "../Logo";
import { NeuralCore } from "./NeuralCore";
import { openBookingPopup } from "@/lib/cal/embed";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/track";

const NAV = [
  { href: "#services", label: "Услуги" },
  { href: "#process", label: "Процес" },
  { href: "#industries", label: "За кого" },
  { href: "/demo", label: "Живо демо" },
  { href: "#faq", label: "Въпроси" },
  { href: "#kontakti", label: "Контакти" },
];

export function NavbarV2() {
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
    track("cta_clicked", { location: "mobile_menu", target: "booking" });
    void openBookingPopup();
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex justify-center px-4 transition-all duration-300",
        scrolled ? "pt-2" : "pt-4"
      )}
      style={{ fontFamily: "var(--v2-font-display)" }}
    >
      <nav
        className={cn(
          "v2-glow flex w-full max-w-6xl items-center justify-between rounded-full px-5 py-2.5 transition-all duration-300",
          scrolled
            ? "border shadow-[0_0_40px_-8px_var(--v2-glow-cyan)]"
            : "border border-transparent bg-transparent"
        )}
        style={
          scrolled
            ? {
                background: "rgba(7, 10, 22, 0.88)",
                backdropFilter: "blur(22px) saturate(125%)",
                WebkitBackdropFilter: "blur(22px) saturate(125%)",
                borderColor: "var(--v2-line)",
              }
            : undefined
        }
      >
        <a href="#top" aria-label="ProMarketing начало">
          <Logo />
        </a>
        <ul
          className="hidden items-center gap-7 text-sm md:flex"
          style={{ color: "var(--v2-muted)" }}
        >
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="v2-navlink transition-colors"
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
            className="v2-phone-pill hidden items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors md:inline-flex"
            style={{
              border: "1px solid var(--v2-line)",
              color: "var(--v2-muted)",
            }}
          >
            <Phone className="h-3.5 w-3.5" />
            <span style={{ fontFamily: "var(--v2-font-mono)", letterSpacing: "0.04em" }}>
              0877 399 963
            </span>
          </a>
          <a
            href="#kontakti"
            onClick={() => track("cta_clicked", { location: "navbar", target: "contact_form" })}
            className="v2-btn !hidden !px-4 !py-2 !text-sm md:!inline-flex"
            style={{
              borderColor: "var(--v2-line-bright)",
              color: "var(--v2-cyan)",
              background: "rgba(34, 211, 238, 0.06)",
            }}
          >
            📞 Остави контакт
          </a>
          <button
            type="button"
            onClick={() => {
              track("cta_clicked", { location: "navbar", target: "booking" });
              void openBookingPopup();
            }}
            className="v2-btn v2-btn-primary inline-flex !px-3 !py-1.5 !text-xs md:!px-4 md:!py-2 md:!text-sm"
          >
            Запази среща
            <span aria-hidden className="v2-arrow">→</span>
          </button>
          <button
            type="button"
            aria-label="Отвори меню"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5 md:hidden"
            style={{ color: "var(--v2-ink)" }}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {open && (
        <div
          className="v2-glass fixed inset-0 z-50 flex flex-col overflow-hidden px-6 pt-6 pb-10 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Мобилна навигация"
          style={{ background: "var(--v2-grad-surface)" }}
        >
          {/* Atmospheric 2050 backdrop — faint NeuralCore + aurora glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[38%] h-[120vw] w-[120vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.35]"
          >
            <NeuralCore radius={1.5} nodeCount={180} spin={0.6} />
          </div>
          <div className="v2-aurora" aria-hidden />

          <div className="relative z-[2] flex items-center justify-between">
            <a href="#top" aria-label="ProMarketing начало" onClick={() => setOpen(false)}>
              <Logo />
            </a>
            <button
              type="button"
              aria-label="Затвори меню"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5"
              style={{ color: "var(--v2-ink)" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul
            className="relative z-[2] mt-12 flex flex-col gap-2 text-2xl font-medium"
            style={{ color: "var(--v2-ink)" }}
          >
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="v2-mobile-link block rounded-lg px-2 py-3 transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="relative z-[2] mt-auto space-y-3">
            <button
              type="button"
              onClick={handleBooking}
              className="v2-btn v2-btn-primary is-lg w-full justify-center !text-base"
            >
              Запази среща
              <span aria-hidden className="v2-arrow">→</span>
            </button>
            <a
              href="#kontakti"
              onClick={() => setOpen(false)}
              className="v2-btn is-lg w-full justify-center !text-base"
              style={{
                borderColor: "var(--v2-line-bright)",
                color: "var(--v2-cyan)",
                background: "rgba(34, 211, 238, 0.06)",
              }}
            >
              📞 Остави контакт
            </a>
            <a
              href="tel:+359877399963"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-medium transition-colors hover:bg-white/5"
              style={{
                border: "1px solid var(--v2-line)",
                color: "var(--v2-ink)",
              }}
            >
              <Phone className="h-4 w-4" />
              <span style={{ fontFamily: "var(--v2-font-mono)", letterSpacing: "0.04em" }}>
                0877 399 963
              </span>
            </a>
          </div>
        </div>
      )}

      {/* scoped micro-styles for hover states the token classes don't cover */}
      <style>{`
        .v2-navlink:hover { color: var(--v2-ink); }
        .v2-phone-pill:hover { border-color: var(--v2-line-bright) !important; color: var(--v2-cyan) !important; }
        .v2-mobile-link:hover { color: var(--v2-cyan); }
      `}</style>
    </header>
  );
}
