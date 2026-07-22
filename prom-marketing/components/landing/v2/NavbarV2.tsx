"use client";
/* =====================================================================
   NavbarV2 — the public Navbar in the "2050 / Luminescent Depth" visual
   language. Full site navigation: primary links + "Разгледай" mega
   dropdown reaching every public page (demo, Jarvis, strategy lab,
   AI trading deck, plan, model, webinar, courses, shop, trading book,
   audit, partners, booking). Anchor links are absolute ("/#services")
   so the navbar works from any page, not just the homepage.

   Tokens come from app/v2/v2-design.css; this component is rendered
   inside the .v2-scope root, so --v2-* variables resolve.
   ===================================================================== */
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Phone,
  ChevronDown,
  MonitorPlay,
  Bot,
  FlaskConical,
  CandlestickChart,
  Map,
  Boxes,
  BookOpen,
  ShoppingBag,
  LineChart,
  Radar,
  Handshake,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "../Logo";
import { NeuralCore } from "./NeuralCore";
import { openBookingPopup } from "@/lib/cal/embed";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/track";

const NAV = [
  { href: "/#services", label: "Услуги" },
  { href: "/jarvis", label: "Jarvis", isNew: true },
  { href: "/strategii", label: "Стратегии", isNew: true },
  { href: "/ai-trading", label: "AI Трейдинг", isNew: true },
  { href: "/#kontakti", label: "Контакти" },
];

type ExploreItem = {
  href: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  color: string;
  isNew?: boolean;
};

const EXPLORE: ExploreItem[] = [
  { href: "/jarvis", label: "Jarvis", sub: "асистентът от бъдещето", icon: Bot, color: "#22d3ee", isNew: true },
  { href: "/strategii", label: "Лаборатория за стратегии", sub: "72 стратегии в тест · на живо", icon: FlaskConical, color: "#34d399", isNew: true },
  { href: "/ai-trading", label: "AI Трейдинг ботове", sub: "трейдинг флотата на живо", icon: CandlestickChart, color: "#a78bfa", isNew: true },
  { href: "/demo", label: "Живо демо", sub: "системата отвътре", icon: MonitorPlay, color: "#22d3ee" },
  { href: "/plan", label: "План и цени", sub: "фази · пакети · поддръжка", icon: Map, color: "#67e8f9" },
  { href: "/model", label: "Продуктов модел", sub: "как строим системата", icon: Boxes, color: "#7c3aed" },
  { href: "/kurs", label: "Курсове", sub: "AI умения за бизнеса", icon: BookOpen, color: "#fbbf24" },
  { href: "/magazin", label: "Магазин", sub: "курсове · агенти · системи", icon: ShoppingBag, color: "#fbbf24" },
  { href: "/trading", label: "Трейдинг книга", sub: "безплатна книга + разговор", icon: LineChart, color: "#a78bfa" },
  { href: "/automation-audit", label: "AI Одит", sub: "безплатен одит на процесите", icon: Radar, color: "#d946ef" },
  { href: "/partneri", label: "Партньори", sub: "работи с нас", icon: Handshake, color: "#67e8f9" },
  { href: "/booking", label: "Резервация", sub: "избери час за среща", icon: Calendar, color: "#22d3ee" },
];

function NewDot() {
  return (
    <span
      aria-label="ново"
      className="ml-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
      style={{ background: "var(--v2-mint)", boxShadow: "0 0 6px var(--v2-mint)" }}
    />
  );
}

export function NavbarV2() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [explore, setExplore] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!explore) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExplore(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [explore]);

  const openExplore = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setExplore(true);
  };
  const scheduleCloseExplore = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setExplore(false), 160);
  };

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
          scrolled || explore
            ? "border shadow-[0_0_40px_-8px_var(--v2-glow-cyan)]"
            : "border border-transparent bg-transparent"
        )}
        style={
          scrolled || explore
            ? {
                background: "rgba(7, 10, 22, 0.88)",
                backdropFilter: "blur(22px) saturate(125%)",
                WebkitBackdropFilter: "blur(22px) saturate(125%)",
                borderColor: "var(--v2-line)",
              }
            : undefined
        }
      >
        <a href="/" aria-label="ProMarketing начало">
          <Logo />
        </a>
        <ul
          className="hidden items-center gap-6 text-sm md:flex"
          style={{ color: "var(--v2-muted)" }}
        >
          {NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="v2-navlink transition-colors">
                {item.label}
                {item.isNew && <NewDot />}
              </a>
            </li>
          ))}
          <li
            className="relative"
            onMouseEnter={openExplore}
            onMouseLeave={scheduleCloseExplore}
          >
            <button
              type="button"
              className="v2-navlink inline-flex items-center gap-1 transition-colors"
              aria-expanded={explore}
              aria-haspopup="true"
              onClick={() => setExplore((v) => !v)}
            >
              Разгледай
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", explore && "rotate-180")}
              />
            </button>
            {explore && (
              <div
                className="absolute right-0 top-[calc(100%+18px)] w-[560px] rounded-2xl border p-3"
                style={{
                  background: "rgba(7, 10, 22, 0.96)",
                  backdropFilter: "blur(24px) saturate(130%)",
                  WebkitBackdropFilter: "blur(24px) saturate(130%)",
                  borderColor: "var(--v2-line-bright)",
                  boxShadow: "0 30px 80px -30px rgba(0,0,0,0.95), 0 0 44px -10px var(--v2-glow-cyan)",
                }}
                role="menu"
                aria-label="Всички страници"
              >
                <p
                  className="v2-mono px-3 pb-2 pt-1 text-[10px] uppercase tracking-[0.24em]"
                  style={{ color: "var(--v2-faint)" }}
                >
                  // Цялата екосистема
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {EXPLORE.map((it) => (
                    <a
                      key={it.href}
                      href={it.href}
                      role="menuitem"
                      onClick={() => {
                        setExplore(false);
                        track("cta_clicked", { location: "navbar_explore", target: it.href });
                      }}
                      className="v2-explore-item group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-110"
                        style={{ borderColor: `${it.color}44`, background: `${it.color}12` }}
                      >
                        <it.icon className="h-4 w-4" style={{ color: it.color }} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className="flex items-center text-[13px] font-semibold leading-tight"
                          style={{ color: "var(--v2-ink)" }}
                        >
                          <span className="truncate">{it.label}</span>
                          {it.isNew && <NewDot />}
                        </span>
                        <span
                          className="block truncate text-[11px]"
                          style={{ color: "var(--v2-faint)" }}
                        >
                          {it.sub}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </li>
        </ul>
        <div className="flex items-center gap-2">
          <a
            href="tel:+359877399963"
            aria-label="Обади се: 0877 399 963"
            className="v2-phone-pill hidden items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors lg:inline-flex"
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
            <a href="/" aria-label="ProMarketing начало" onClick={() => setOpen(false)}>
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

          <div className="relative z-[2] mt-8 flex-1 overflow-y-auto pb-6">
            <p
              className="v2-mono mb-2 px-2 text-[10px] uppercase tracking-[0.24em]"
              style={{ color: "var(--v2-faint)" }}
            >
              // Начало
            </p>
            <ul
              className="flex flex-col text-lg font-medium"
              style={{ color: "var(--v2-ink)" }}
            >
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="v2-mobile-link block rounded-lg px-2 py-2.5 transition-colors"
                  >
                    {item.label}
                    {item.isNew && <NewDot />}
                  </a>
                </li>
              ))}
            </ul>

            <p
              className="v2-mono mb-2 mt-6 px-2 text-[10px] uppercase tracking-[0.24em]"
              style={{ color: "var(--v2-faint)" }}
            >
              // Разгледай всичко
            </p>
            <ul className="grid grid-cols-1 gap-1">
              {EXPLORE.map((it) => (
                <li key={it.href}>
                  <a
                    href={it.href}
                    onClick={() => {
                      setOpen(false);
                      track("cta_clicked", { location: "mobile_menu_explore", target: it.href });
                    }}
                    className="v2-mobile-link flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                      style={{ borderColor: `${it.color}44`, background: `${it.color}12` }}
                    >
                      <it.icon className="h-4 w-4" style={{ color: it.color }} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="flex items-center text-[15px] font-semibold leading-tight"
                        style={{ color: "var(--v2-ink)" }}
                      >
                        <span className="truncate">{it.label}</span>
                        {it.isNew && <NewDot />}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: "var(--v2-faint)" }}>
                        {it.sub}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-[2] mt-auto space-y-3 pt-3">
            <button
              type="button"
              onClick={handleBooking}
              className="v2-btn v2-btn-primary is-lg w-full justify-center !text-base"
            >
              Запази среща
              <span aria-hidden className="v2-arrow">→</span>
            </button>
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
        .v2-explore-item:hover { background: rgba(34, 211, 238, 0.07); }
      `}</style>
    </header>
  );
}
