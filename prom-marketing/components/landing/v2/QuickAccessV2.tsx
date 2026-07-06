"use client";
/* =====================================================================
   QuickAccessV2 — лентата „бърз достъп” на началната страница: където
   и да е тръгнал клиентът, оттук стига до всичко с 1 клик — демо,
   магазин, безплатното обучение, трейдинг агента и консултация.
   ===================================================================== */
import { MonitorPlay, ShoppingBag, GraduationCap, LineChart, Calendar } from "lucide-react";
import { track } from "@/lib/analytics/track";
import { openBookingPopup } from "@/lib/cal/embed";

const ITEMS = [
  { icon: MonitorPlay, label: "Живо демо", sub: "виж системата отвътре", href: "/demo", color: "#22d3ee" },
  { icon: GraduationCap, label: "Безплатно обучение", sub: "23 юли · 19:00 · Zoom", href: "/webinar", color: "#34d399" },
  { icon: ShoppingBag, label: "Магазин", sub: "курсове · агенти · системи", href: "/magazin", color: "#fbbf24" },
  { icon: LineChart, label: "Трейдинг агент", sub: "безплатна книга", href: "/trading", color: "#a78bfa" },
];

export function QuickAccessV2() {
  return (
    <section aria-label="Бърз достъп" className="relative z-[2] mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map((it) => (
          <a
            key={it.href}
            href={it.href}
            onClick={() => track("cta_clicked", { location: "quick_access", target: it.href })}
            className="qa-card group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 backdrop-blur-sm"
            style={{ ["--qa" as never]: it.color }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-110"
              style={{ borderColor: `${it.color}55`, background: `${it.color}14` }}
            >
              <it.icon className="h-5 w-5" style={{ color: it.color }} />
            </span>
            <span>
              <span className="block text-[15px] font-bold text-white">{it.label}</span>
              <span className="block text-xs text-slate-400">{it.sub}</span>
            </span>
          </a>
        ))}
        <button
          type="button"
          onClick={() => { track("cta_clicked", { location: "quick_access", target: "booking" }); void openBookingPopup(); }}
          className="qa-card group flex items-center gap-3.5 rounded-2xl border border-cyan-400/40 bg-[rgba(34,211,238,0.07)] p-4 text-left backdrop-blur-sm"
          style={{ ["--qa" as never]: "#22d3ee" }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/50 bg-[rgba(34,211,238,0.15)] transition-transform group-hover:scale-110">
            <Calendar className="h-5 w-5 text-cyan-300" />
          </span>
          <span>
            <span className="block text-[15px] font-bold text-white">Консултация</span>
            <span className="block text-xs text-slate-400">15 мин · безплатна</span>
          </span>
        </button>
      </div>
      <style>{`
        .qa-card { transition: border-color .25s, box-shadow .25s, transform .25s; }
        .qa-card:hover {
          border-color: color-mix(in srgb, var(--qa) 55%, transparent);
          box-shadow: 0 0 34px -8px var(--qa);
          transform: translateY(-2px);
        }
      `}</style>
    </section>
  );
}
