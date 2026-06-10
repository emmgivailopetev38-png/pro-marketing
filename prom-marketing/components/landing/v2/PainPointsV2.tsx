"use client";
/* =====================================================================
   PainPointsV2 — "2050" redesign of components/landing/PainPoints.tsx.
   Same content, data, copy and the count-up interactivity preserved 1:1.
   Reskinned to the "Luminescent Depth" language via v2-* classes.
   "Burning / manual" hours read in violet, "saved / with-AI" read in cyan
   (mint reserved for the live status pulse only). A NeuralCore anchors the
   total-hero as the signature centerpiece.
   ===================================================================== */
import { useEffect, useRef, useState } from "react";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

interface PainPoint {
  icon: string;
  task: string;
  detail: string;
  hoursManual: number;       // часове на месец на ръка
  hoursWithAi: number;       // часове на месец надзор + поправки
}

const PAINS: PainPoint[] = [
  {
    icon: "💬",
    task: "Отговори в Messenger / Viber / Instagram",
    detail: "На едни и същи въпроси по 50 пъти на ден",
    hoursManual: 88,
    hoursWithAi: 6,
  },
  {
    icon: "📱",
    task: "Постове и reels всеки ден",
    detail: "Текст, визия, хаштагове, календар — ръчно",
    hoursManual: 66,
    hoursWithAi: 8,
  },
  {
    icon: "✉️",
    task: "Проследяващи имейли до лидове",
    detail: '"Кога ще се чуем", "имаш ли време", "напомням"',
    hoursManual: 33,
    hoursWithAi: 2,
  },
  {
    icon: "📅",
    task: "Запис на срещи и потвърждения",
    detail: "Обаждания за час, преразпределения, неявяване",
    hoursManual: 44,
    hoursWithAi: 3,
  },
  {
    icon: "🎯",
    task: "Сортиране на лидове по приоритет",
    detail: "Кой е готов да купи, кой губи времето ти",
    hoursManual: 44,
    hoursWithAi: 4,
  },
  {
    icon: "⭐",
    task: "Отговор на ревюта и коментари",
    detail: "Google, Booking, TripAdvisor, Facebook",
    hoursManual: 15,
    hoursWithAi: 2,
  },
  {
    icon: "📊",
    task: "Седмични отчети и анализи",
    detail: "Excel формули, графики, обобщение за директора",
    hoursManual: 16,
    hoursWithAi: 1,
  },
  {
    icon: "🧾",
    task: "Фактуриране и счетоводна администрация",
    detail: "Издаване, изпращане, проследяване на плащания",
    hoursManual: 44,
    hoursWithAi: 4,
  },
];

const totalManual = PAINS.reduce((s, p) => s + p.hoursManual, 0);
const totalWithAi = PAINS.reduce((s, p) => s + p.hoursWithAi, 0);
const totalSaved = totalManual - totalWithAi;
const avgPercent = Math.round((totalSaved / totalManual) * 100);

export function PainPointsV2() {
  const [displayed, setDisplayed] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [counted, setCounted] = useState(false);

  // Count-up the total — same easing/duration as the original, but only
  // fires once the hero scrolls into view (graceful: runs anyway after mount).
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setCounted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCounted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!counted) return;
    let raf: number;
    const start = performance.now();
    const duration = 1800;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.floor(totalSaved * eased));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [counted]);

  // Lightweight reveal: toggle .is-in on .v2-reveal nodes as they enter.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = document.querySelectorAll<HTMLElement>(".v2-pp .v2-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section className="v2-pp v2-section relative overflow-hidden">
      <div className="v2-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="v2-wrap">
        {/* Header */}
        <div className="v2-head v2-reveal max-w-3xl">
          <span className="v2-eyebrow">{"// колко часа седят в рутина"}</span>
          <h2 className="v2-title-plain mt-4" style={{ overflowWrap: "break-word", hyphens: "auto" }}>
            Колко часа от месеца<br />
            <span className="v2-grad">горят</span> в ръчна работа?
          </h2>
          <p className="v2-sub">
            Един човек прави едни и същи задачи всеки ден — отнема му часове, които не остават
            за стратегия и растеж. AI агент ги поема{" "}
            <span className="font-semibold" style={{ color: "var(--v2-ink)" }}>за минути</span>.
            Ето колко време ще си върнеш:
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PAINS.map((p, i) => {
            const saved = p.hoursManual - p.hoursWithAi;
            const pct = Math.round((saved / p.hoursManual) * 100);
            return (
              <div
                key={p.task}
                className="v2-reveal h-full"
                style={{ ["--d" as string]: `${(i % 2) * 0.08 + Math.floor(i / 2) * 0.06}s` }}
              >
                <div className="v2-card v2-glow h-full">
                  <div
                    className="absolute right-0 top-0 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      fontFamily: "var(--v2-font-mono)",
                      background: "rgba(34,211,238,0.14)",
                      color: "var(--v2-cyan)",
                      borderBottomLeftRadius: "0.75rem",
                    }}
                  >
                    −{pct}%
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-3xl" aria-hidden>{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-lg font-bold leading-tight"
                        style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-ink)" }}
                      >
                        {p.task}
                      </h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--v2-faint)" }}>{p.detail}</p>
                    </div>
                  </div>

                  {/* Time comparison */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: "rgba(124,58,237,0.30)",
                        background: "rgba(124,58,237,0.08)",
                      }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-[0.2em]"
                        style={{ fontFamily: "var(--v2-font-mono)", color: "var(--v2-violet-2)" }}
                      >
                        Ръчно / месец
                      </p>
                      <p
                        className="mt-1 text-2xl font-extrabold line-through decoration-2"
                        style={{
                          fontFamily: "var(--v2-font-display)",
                          color: "var(--v2-violet-2)",
                          textDecorationColor: "rgba(167,139,250,0.6)",
                        }}
                      >
                        {p.hoursManual}ч
                      </p>
                      <p className="mt-0.5 text-[10px]" style={{ color: "var(--v2-faint)" }}>
                        ≈ {Math.round(p.hoursManual / 22 * 10) / 10}ч/ден
                      </p>
                    </div>
                    <div
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: "var(--v2-line-bright)",
                        background: "rgba(34,211,238,0.08)",
                      }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-[0.2em]"
                        style={{ fontFamily: "var(--v2-font-mono)", color: "var(--v2-cyan)" }}
                      >
                        С AI / месец
                      </p>
                      <p
                        className="mt-1 text-2xl font-extrabold"
                        style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-cyan)" }}
                      >
                        {p.hoursWithAi}ч
                      </p>
                      <p className="mt-0.5 text-[10px]" style={{ color: "var(--v2-faint)" }}>
                        само надзор + одобрение
                      </p>
                    </div>
                  </div>

                  {/* Visual progress bar */}
                  <div className="mt-4">
                    <div
                      className="h-2 w-full overflow-hidden rounded-full"
                      style={{ background: "rgba(4,6,13,0.6)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: "var(--v2-grad-accent)",
                          boxShadow: "0 0 8px var(--v2-glow-cyan)",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="mt-4 flex items-center justify-between border-t pt-3"
                    style={{ borderColor: "var(--v2-line)" }}
                  >
                    <span
                      className="text-[10px] uppercase tracking-[0.2em]"
                      style={{ fontFamily: "var(--v2-font-mono)", color: "var(--v2-faint)" }}
                    >
                      Спестено време
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-cyan)" }}
                    >
                      {saved}ч ({pct}%) / месец
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total hero */}
        <div
          ref={heroRef}
          className="v2-reveal v2-glass v2-glow is-always relative mt-12 overflow-hidden p-8 md:p-12"
          style={{
            ["--v2-c" as string]: "var(--v2-cyan)",
            borderColor: "var(--v2-line-bright)",
            background:
              "linear-gradient(135deg, rgba(34,211,238,0.10) 0%, rgba(124,58,237,0.07) 100%), var(--v2-bg-2)",
            boxShadow: "var(--v2-shadow-card), 0 0 60px -10px var(--v2-glow-cyan)",
          }}
        >
          {/* NeuralCore — signature centerpiece, behind the numbers */}
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-[420px] w-[420px] opacity-60 md:right-0 md:opacity-70"
            aria-hidden
          >
            <NeuralCore nodeCount={180} radius={1.25} spin={0.7} />
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:items-center md:gap-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{ fontFamily: "var(--v2-font-mono)", color: "var(--v2-cyan)" }}
                >
                  Общо спестено време / месец
                </span>
                <span className="v2-status">System online</span>
              </div>
              <p
                className="mt-3 text-5xl font-extrabold leading-none tracking-tight md:text-7xl"
                style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-cyan)" }}
              >
                {displayed}ч <span className="text-3xl md:text-5xl">({avgPercent}%)</span>
              </p>
              <p className="mt-3 text-sm md:text-base" style={{ color: "var(--v2-muted)" }}>
                ≈{" "}
                <span className="font-bold" style={{ color: "var(--v2-ink)" }}>
                  {Math.round(totalSaved / 22)} работни дни
                </span>{" "}
                всеки месец, които оставят на човек да върши{" "}
                <span className="font-bold" style={{ color: "var(--v2-ink)" }}>
                  стратегическа работа
                </span>
                , а не рутина.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center md:gap-6">
              <Stat label="Ръчно/мес" value={`${totalManual}ч`} color="var(--v2-violet-2)" />
              <Stat label="С AI/мес" value={`${totalWithAi}ч`} color="var(--v2-cyan)" />
              <Stat label="Свободни дни" value={`${Math.round(totalSaved / 8)}д`} color="var(--v2-cyan-2)" />
            </div>
          </div>

          <p className="relative mt-8 text-center text-xs" style={{ color: "var(--v2-faint)" }}>
            * Часовете са усреднени за малки и средни фирми в България. Изчисленията предполагат
            22 работни дни в месеца.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p
        className="text-[9px] uppercase tracking-[0.2em]"
        style={{ fontFamily: "var(--v2-font-mono)", color: "var(--v2-faint)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-lg font-bold md:text-2xl"
        style={{ fontFamily: "var(--v2-font-display)", color }}
      >
        {value}
      </p>
    </div>
  );
}
