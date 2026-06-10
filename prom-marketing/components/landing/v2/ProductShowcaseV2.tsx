"use client";
/* =====================================================================
   ProductShowcaseV2 — "Виж системата на живо"
   ---------------------------------------------------------------------
   An immersive, single-screen MOCK of the 2035 command CRM/ERP so a
   visitor literally sees the product in action → "искам това".

   What's inside (all one cohesive "live workspace" frame, NOT a carousel
   — that's CRMShowcaseV2 — and NOT an agent roster — that's
   LiveDashboardsV2):
     · HUD window chrome with "SYSTEM ONLINE" telemetry + ticking clock
     · a row of KPI cards that count up when the section scrolls into view
     · a left command/agent rail (live task lines)
     · a central revenue area-spark that animates its path
     · a right "live data" table with streaming rows (leads/deals)
     · a big "Запази демо" CTA with inline phone-ONLY capture
       (POST /api/leads/submit, exactly like AiAudit.tsx)

   Skin is 100% the v2 "Luminescent Depth" language — depth-glass panels,
   neon conic edges (.v2-glow), holographic title, Sora/JetBrains type via
   the --v2-* tokens. Renders inside .v2-scope so tokens resolve.

   Client component: count-up + IntersectionObserver + live clock +
   streaming table + the capture form all need state/effects.

   ⚠️ Every company/person here is FICTIONAL (consistent house set:
   Хотел Аврора, Ресторант Веда, Бутик Нова, Имоти Хоризонт,
   Авто Сервиз Делта, Клиника Лумина). Never a real client.
   ===================================================================== */
import { useEffect, useRef, useState } from "react";
import {
  Phone, ArrowRight, Check, Loader2, Cpu, Activity, Sparkles,
  Users, Wallet, CalendarCheck, Gauge, type LucideIcon,
} from "lucide-react";
import { track } from "@/lib/analytics/track";

/* ----------------------------------------------------------------------
   1 · COUNT-UP — eases a number to its target once `run` flips true.
   Pure rAF, respects prefers-reduced-motion (snaps instantly).
---------------------------------------------------------------------- */
function useCountUp(target: number, run: boolean, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion → duration 0 so the first frame lands on the target
    // (keeps all setState calls inside the rAF callback, never sync-in-effect).
    const dur = reduce ? 0 : duration;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur);
      // easeOutExpo — fast then settle, feels "instrument-grade"
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return value;
}

/* IntersectionObserver: returns true once the node enters the viewport. */
function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Defer out of the effect body so we never setState synchronously.
      const raf = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ----------------------------------------------------------------------
   2 · KPI MODEL — illustrative numbers that mirror the real /admin board.
---------------------------------------------------------------------- */
type Kpi = {
  label: string;
  icon: LucideIcon;
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delta: string;
  color: string;
};

const KPIS: Kpi[] = [
  { label: "Активни клиенти", icon: Users, target: 81, delta: "▲ 14", color: "var(--v2-cyan)" },
  { label: "Pipeline", icon: Wallet, target: 124500, prefix: "€", delta: "▲ €18k", color: "var(--v2-violet-2)" },
  { label: "Конверсия", icon: Gauge, target: 42, suffix: "%", delta: "▲ 5%", color: "var(--v2-mint)" },
  { label: "Срещи / месец", icon: CalendarCheck, target: 23, delta: "▲ 7", color: "#facc15" },
];

function formatKpi(v: number, k: Kpi) {
  const n = Math.round(v);
  const body = n.toLocaleString("bg-BG");
  return `${k.prefix ?? ""}${body}${k.suffix ?? ""}`;
}

function KpiCard({ kpi, run, delay }: { kpi: Kpi; run: boolean; delay: number }) {
  const v = useCountUp(kpi.target, run, 1400 + delay * 120);
  const Icon = kpi.icon;
  return (
    <div
      className="v2-reveal is-in relative overflow-hidden rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-3.5 transition-colors hover:border-[var(--v2-line-bright)]"
      style={{ ["--d" as string]: `${delay * 0.06}s` }}
    >
      {/* corner sheen tinted to the KPI hue */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-40 blur-2xl"
        style={{ background: `color-mix(in srgb, ${kpi.color} 60%, transparent)` }}
      />
      <div className="relative flex items-center justify-between">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-[8px]"
          style={{ background: `color-mix(in srgb, ${kpi.color} 16%, transparent)`, color: kpi.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="v2-mono text-[9px] font-semibold" style={{ color: "var(--v2-mint)" }}>
          {kpi.delta}
        </span>
      </div>
      <p
        className="relative mt-2.5 text-2xl font-bold leading-none tabular-nums md:text-[27px]"
        style={{ color: kpi.color, fontFamily: "var(--v2-font-display)" }}
      >
        {formatKpi(v, kpi)}
      </p>
      <p className="relative mt-1.5 v2-mono text-[9px] uppercase tracking-[0.16em] text-[var(--v2-faint)]">
        {kpi.label}
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------------
   3 · LEFT RAIL — command/agent task lines (static, illustrative).
---------------------------------------------------------------------- */
const RAIL: Array<{ agent: string; task: string; color: string }> = [
  { agent: "Sales Agent", task: "Оферта · Хотел Аврора", color: "var(--v2-mint)" },
  { agent: "Email Agent", task: "12 follow-up писма", color: "var(--v2-violet-2)" },
  { agent: "Booking Agent", task: "Потвърждава 2 огледа", color: "#facc15" },
  { agent: "Analytics Agent", task: "Седмичен отчет · готов", color: "var(--v2-cyan)" },
  { agent: "Chat Agent", task: "Разговор · 4 клиента", color: "#fb923c" },
];

/* ----------------------------------------------------------------------
   4 · CENTER — revenue area-spark (animates path on mount-in-view).
   30 illustrative points, last 30 days.
---------------------------------------------------------------------- */
const SPARK = [
  6, 8, 7, 11, 9, 13, 10, 14, 17, 13, 19, 16, 15, 18, 22,
  20, 17, 15, 19, 23, 27, 24, 22, 28, 33, 29, 31, 37, 34, 41,
];

function RevenueSpark({ run }: { run: boolean }) {
  const max = Math.max(...SPARK);
  const w = 100;
  const h = 42;
  const step = w / (SPARK.length - 1);
  const coords = SPARK.map((v, i) => [i * step, h - 4 - (v / max) * (h - 10)] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const total = useCountUp(48720, run, 1600);
  return (
    <div className="rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-4">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="v2-mono text-[9px] uppercase tracking-[0.18em] text-[var(--v2-faint)]">
            Приходи · 30 дни
          </p>
          <p
            className="mt-1 text-xl font-bold tabular-nums md:text-2xl"
            style={{ color: "var(--v2-cyan)", fontFamily: "var(--v2-font-display)" }}
          >
            €{Math.round(total).toLocaleString("bg-BG")}
          </p>
        </div>
        <span className="v2-mono rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)] px-2 py-0.5 text-[10px] text-[var(--v2-mint)]">
          ▲ 18.2%
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-24 w-full">
        <defs>
          <linearGradient id="ps-spark-v2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--v2-cyan)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--v2-cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#ps-spark-v2)" opacity={run ? 1 : 0} style={{ transition: "opacity 0.9s ease 0.5s" }} />
        <path
          d={line}
          fill="none"
          stroke="var(--v2-cyan)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            filter: "drop-shadow(0 0 4px var(--v2-glow-cyan))",
            strokeDasharray: 1,
            strokeDashoffset: run ? 0 : 1,
            transition: "stroke-dashoffset 1.8s var(--v2-ease)",
          }}
        />
      </svg>
    </div>
  );
}

/* ----------------------------------------------------------------------
   5 · RIGHT — "live data" table; one new row streams in on an interval.
   Fictional companies only.
---------------------------------------------------------------------- */
type Row = { name: string; activity: string; value: string; stage: string; color: string };

const ROW_POOL: Row[] = [
  { name: "Хотел Аврора", activity: "Запитване · резервация", value: "€2,400", stage: "Оферта", color: "#facc15" },
  { name: "Ресторант Веда", activity: "Обаждане · 4:12 мин", value: "€1,200", stage: "Преговори", color: "#fb923c" },
  { name: "Бутик Нова", activity: "Изоставена количка → SMS", value: "€340", stage: "В контакт", color: "var(--v2-violet-2)" },
  { name: "Имоти Хоризонт", activity: "Квалифициран купувач", value: "€5,800", stage: "Спечелен", color: "var(--v2-mint)" },
  { name: "Авто Сервиз Делта", activity: "Записан час · вторник", value: "€180", stage: "Discovery", color: "var(--v2-cyan)" },
  { name: "Клиника Лумина", activity: "Реактивиран клиент", value: "€760", stage: "Оферта", color: "#facc15" },
];

function LiveTable({ run }: { run: boolean }) {
  // Start with 4 rows, then cycle a "new lead" to the top every few seconds.
  const [rows, setRows] = useState<Row[]>(() => ROW_POOL.slice(0, 4));
  const cursor = useRef(4);
  useEffect(() => {
    if (!run) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = setInterval(() => {
      setRows((prev) => {
        const next = ROW_POOL[cursor.current % ROW_POOL.length];
        cursor.current += 1;
        return [next, ...prev.slice(0, 3)];
      });
    }, 2600);
    return () => clearInterval(id);
  }, [run]);

  return (
    <div className="rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="v2-mono text-[9px] uppercase tracking-[0.18em] text-[var(--v2-faint)]">
          Входящ поток · на живо
        </p>
        <span className="v2-mono inline-flex items-center gap-1 text-[9px] text-[var(--v2-mint)]">
          <span
            className="h-1 w-1 animate-pulse rounded-full bg-[var(--v2-mint)]"
            style={{ boxShadow: "0 0 5px var(--v2-mint)" }}
          />
          stream
        </span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div
            key={`${r.name}-${i}-${r.stage}`}
            className="ps-row grid grid-cols-[1fr_auto] items-center gap-2 rounded-[10px] border border-[var(--v2-line)] bg-white/[0.02] px-2.5 py-2"
            style={i === 0 && run ? { animation: "ps-row-in 0.5s var(--v2-ease)" } : undefined}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }}
                />
                <p className="truncate text-[12px] font-semibold text-[var(--v2-ink)]">{r.name}</p>
              </div>
              <p className="truncate pl-3 text-[10px] text-[var(--v2-faint)]">{r.activity}</p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="v2-mono text-[11px] font-semibold text-[var(--v2-muted)]">{r.value}</span>
              <span
                className="v2-mono rounded-full px-1.5 py-0.5 text-[8.5px] uppercase tracking-wider"
                style={{
                  border: `1px solid color-mix(in srgb, ${r.color} 40%, transparent)`,
                  background: `color-mix(in srgb, ${r.color} 12%, transparent)`,
                  color: r.color,
                }}
              >
                {r.stage}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   6 · LIVE CLOCK — ticking HH:MM:SS for the HUD telemetry strip.
---------------------------------------------------------------------- */
function HudClock() {
  const [now, setNow] = useState<string>("--:--:--");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    // First paint on next frame (not sync-in-effect), then tick every second.
    const raf = requestAnimationFrame(() => setNow(fmt()));
    const id = setInterval(() => setNow(fmt()), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);
  return <span className="v2-mono tabular-nums">{now}</span>;
}

/* ----------------------------------------------------------------------
   7 · CTA — phone-ONLY capture (mirrors AiAudit.tsx submit contract).
---------------------------------------------------------------------- */
function DemoCta() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 6) return;
    setStatus("submitting");
    track("product_demo_submit", {});
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: "Заявка за демо на системата · от секция „Виж системата на живо“ (/v2)",
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("done");
        track("product_demo_lead", {});
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center sm:flex-row sm:text-left">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(34,211,238,0.12)" }}
        >
          <Check className="h-5 w-5" style={{ color: "var(--v2-cyan)" }} />
        </span>
        <div>
          <p className="text-base font-bold text-[var(--v2-ink)]" style={{ fontFamily: "var(--v2-font-display)" }}>
            Заявката е приета — обаждаме се днес.
          </p>
          <p className="mt-0.5 text-sm text-[var(--v2-muted)]">
            Показваме ти системата на живо и я нагласяме за твоя бизнес.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-[var(--v2-r-pill)] border border-[var(--v2-line)] bg-[var(--v2-void)]/60 px-4 transition focus-within:border-[var(--v2-line-bright)]">
          <Phone className="h-4 w-4 shrink-0" style={{ color: "var(--v2-cyan)" }} />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            required
            autoComplete="tel"
            placeholder="Телефон за обаждане"
            aria-label="Телефон за обаждане"
            className="w-full bg-transparent py-3.5 text-sm text-[var(--v2-ink)] outline-none placeholder:text-[var(--v2-faint)]"
          />
        </div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="v2-btn v2-btn-primary is-lg shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Изпращам…
            </>
          ) : (
            <>
              Запази демо
              <ArrowRight className="v2-arrow h-4 w-4" />
            </>
          )}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2.5 text-[12px] text-[#fca5a5]">
          Грешка — опитай пак или звънни на{" "}
          <a href="tel:+359877399963" className="underline">+359 877 399 963</a>.
        </p>
      )}
      <p className="v2-mono mt-2.5 text-[10px] uppercase tracking-[0.16em] text-[var(--v2-faint)]">
        Само телефон · безплатно демо · отговор в работния ден
      </p>
    </form>
  );
}

/* ----------------------------------------------------------------------
   8 · SECTION
---------------------------------------------------------------------- */
export function ProductShowcaseV2() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);

  return (
    <section id="produkt" className="v2-section scroll-mt-20 overflow-hidden">
      {/* Engineered grid + signature aurora glow backdrop (coherent with siblings) */}
      <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 75% 25%, var(--v2-glow-cyan) 0%, transparent 55%), radial-gradient(ellipse at 20% 85%, var(--v2-glow-violet) 0%, transparent 55%)",
          opacity: 0.15,
        }}
      />

      <div className="v2-wrap">
        {/* ---- Header --------------------------------------------------- */}
        <div className="v2-head is-center">
          <span className="v2-eyebrow v2-reveal is-in" style={{ ["--d" as string]: "0.04s" }}>
            {"// продуктът на живо"}
          </span>
          <h2 className="v2-title v2-reveal is-in" style={{ ["--d" as string]: "0.1s" }}>
            Виж системата на живо
          </h2>
          <p className="v2-sub v2-reveal is-in" style={{ ["--d" as string]: "0.16s" }}>
            Това не е скрийншот. Под линията е{" "}
            <span className="font-semibold text-[var(--v2-cyan)]">истинският команден център</span>,
            който изграждаме за теб — KPI на живо, AI екип в действие и входящ поток от клиенти,
            който се пълни сам.
          </p>
        </div>

        {/* ---- The product window -------------------------------------- */}
        <div
          ref={ref}
          className="v2-reveal is-in relative mx-auto mt-2 max-w-[1080px] overflow-hidden rounded-[var(--v2-r)] border border-[var(--v2-line)] bg-[var(--v2-bg-2)]/70"
          style={{
            ["--d" as string]: "0.2s",
            boxShadow: "var(--v2-shadow-card), 0 0 70px -22px var(--v2-glow-cyan)",
          }}
        >
          {/* HUD chrome — traffic lights · path · SYSTEM ONLINE · clock */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--v2-line)] bg-[var(--v2-void)]/60 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--v2-mint)]/60" />
              <span className="ml-3 hidden v2-mono text-[10px] text-[var(--v2-faint)] sm:inline">
                promarketing.pw/admin · mission-control
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="v2-status">SYSTEM ONLINE</span>
              <span className="hidden items-center gap-1.5 rounded-[7px] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 px-2 py-1 text-[10px] text-[var(--v2-faint)] sm:inline-flex">
                <Cpu className="h-3 w-3" style={{ color: "var(--v2-cyan)" }} />
                <HudClock />
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="relative p-4 md:p-5">
            {/* faint living glow behind the panels */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--v2-glow-cyan), transparent 65%)" }}
            />

            {/* KPI row */}
            <div className="relative grid grid-cols-2 gap-3 lg:grid-cols-4">
              {KPIS.map((k, i) => (
                <KpiCard key={k.label} kpi={k} run={inView} delay={i} />
              ))}
            </div>

            {/* 3-column workspace: rail · revenue · live table */}
            <div className="relative mt-3 grid gap-3 lg:grid-cols-[0.85fr_1.1fr_1.15fr]">
              {/* Left rail — AI команди / агенти */}
              <div className="rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="v2-mono text-[9px] uppercase tracking-[0.18em] text-[var(--v2-faint)]">
                    AI екип · команди
                  </p>
                  <Activity className="h-3 w-3" style={{ color: "var(--v2-cyan)" }} />
                </div>
                <div className="space-y-1.5">
                  {RAIL.map((r) => (
                    <div
                      key={r.agent}
                      className="flex items-center gap-2 rounded-[10px] border border-[var(--v2-line)] bg-white/[0.02] px-2.5 py-2"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full"
                        style={{ background: r.color, boxShadow: `0 0 6px ${r.color}` }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold" style={{ color: r.color }}>
                          {r.agent}
                        </p>
                        <p className="truncate text-[10px] text-[var(--v2-faint)]">{r.task}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5 rounded-[10px] border border-[rgba(52,211,153,0.22)] bg-[rgba(52,211,153,0.06)] px-2 py-1.5">
                  <Sparkles className="h-3 w-3" style={{ color: "var(--v2-mint)" }} />
                  <p className="v2-mono text-[9px] uppercase tracking-wider text-[var(--v2-mint)]">
                    6 агента · 0 почивки
                  </p>
                </div>
              </div>

              {/* Center — revenue spark */}
              <RevenueSpark run={inView} />

              {/* Right — live streaming table */}
              <LiveTable run={inView} />
            </div>
          </div>
        </div>

        {/* ---- CTA ------------------------------------------------------ */}
        <div
          className="v2-reveal is-in v2-glass v2-glow is-always relative mx-auto mt-6 max-w-[1080px] overflow-hidden p-5 md:p-6"
          style={{ ["--d" as string]: "0.26s" }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3
                className="text-xl font-bold leading-tight text-[var(--v2-ink)] md:text-2xl"
                style={{ fontFamily: "var(--v2-font-display)" }}
              >
                Искаш това на твоето табло?
              </h3>
              <p className="mt-1.5 text-sm text-[var(--v2-muted)]">
                Запази безплатно демо — показваме системата на живо и я нагласяме за{" "}
                <span className="text-[var(--v2-cyan)]">точно твоя бизнес</span>.
              </p>
            </div>
            <div className="w-full md:max-w-md">
              <DemoCta />
            </div>
          </div>
        </div>
      </div>

      {/* Local keyframe for the streaming-row entrance (scoped, namespaced) */}
      <style>{`
        @keyframes ps-row-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ps-row { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
