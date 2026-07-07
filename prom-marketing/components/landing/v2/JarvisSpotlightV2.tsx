"use client";
/* =====================================================================
   JarvisSpotlightV2 — секцията „Запознай се с Jarvis" на началната
   страница. Живо неврално ядро + конзола, в която Jarvis „изпълнява"
   задачи на живо (типографски симулирани), и CTA към /jarvis.
   Използва v2 дизайн езика (Luminescent Depth).
   ===================================================================== */
import { useEffect, useRef, useState } from "react";
import { Bot, ArrowRight, Zap } from "lucide-react";
import { NeuralCore } from "./NeuralCore";
import { track } from "@/lib/analytics/track";

const TASKS = [
  "Отговорих на 14 нови запитвания в Messenger и Instagram.",
  "Насрочих 3 срещи и изпратих потвърждения по имейл.",
  "Генерирах 5 видеа за TikTok и ги качих по график.",
  "Преместих 2 сделки напред във фунията и уведомих екипа.",
  "Оптимизирах рекламния бюджет: +18% ефективност.",
  "Издадох фактура и засякох плащането автоматично.",
  "Подготвих дневния отчет: лидове, продажби, разходи.",
];

export function JarvisSpotlightV2() {
  const [line, setLine] = useState(0);
  const [typed, setTyped] = useState("");
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(TASKS[line]);
      const t = setTimeout(() => setLine((l) => (l + 1) % TASKS.length), 3200);
      return () => clearTimeout(t);
    }
    const full = TASKS[line];
    if (typed.length < full.length) {
      const t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 26);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped("");
      setLine((l) => (l + 1) % TASKS.length);
    }, 2100);
    return () => clearTimeout(t);
  }, [typed, line, inView]);

  return (
    <section ref={rootRef} className="v2-section !pt-6" aria-label="Jarvis — AI асистентът">
      <div className="v2-wrap">
        <div
          className="v2-glass v2-glow is-always relative grid items-center gap-8 overflow-hidden p-6 md:grid-cols-[1fr_1.25fr] md:gap-12 md:p-10"
          style={{ ["--v2-c" as string]: "var(--v2-cyan)" }}
        >
          {/* Living core */}
          <div className="relative mx-auto h-56 w-56 md:h-80 md:w-80">
            <NeuralCore radius={1.35} nodeCount={220} spin={0.8} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                className="v2-mono rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.3em]"
                style={{
                  borderColor: "var(--v2-line-bright)",
                  color: "var(--v2-cyan)",
                  background: "rgba(4, 6, 13, 0.72)",
                  textShadow: "0 0 12px var(--v2-glow-cyan)",
                }}
              >
                Jarvis
              </span>
            </div>
          </div>

          <div className="relative z-[1]">
            <p className="v2-eyebrow">// Запознай се с Jarvis</p>
            <h2 className="v2-title-plain !text-[clamp(1.7rem,4vw,2.9rem)]">
              Асистентът от бъдещето, който{" "}
              <span className="v2-grad">работи вместо теб</span>
            </h2>
            <p className="v2-sub">
              Jarvis управлява целия ти бизнес двигател — отговаря на клиенти,
              насрочва срещи, пуска реклами, издава фактури и докладва. 24/7,
              без почивен ден.
            </p>

            {/* Live console */}
            <div
              className="v2-mono mt-6 rounded-xl border p-4 text-[13px]"
              style={{
                borderColor: "var(--v2-line)",
                background: "rgba(4, 6, 13, 0.6)",
                color: "var(--v2-mint)",
                minHeight: 74,
              }}
            >
              <span className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--v2-faint)" }}>
                <Zap className="h-3 w-3" style={{ color: "var(--v2-cyan)" }} />
                Jarvis · изпълнени задачи · на живо
              </span>
              <span aria-live="polite">
                {typed}
                <span className="jsv-caret" aria-hidden>▊</span>
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/jarvis"
                onClick={() => track("cta_clicked", { location: "jarvis_spotlight", target: "/jarvis" })}
                className="v2-btn v2-btn-primary"
              >
                <Bot className="h-4 w-4" />
                Говори с Jarvis
                <span aria-hidden className="v2-arrow">→</span>
              </a>
              <a
                href="/demo"
                onClick={() => track("cta_clicked", { location: "jarvis_spotlight", target: "/demo" })}
                className="v2-btn"
                style={{
                  borderColor: "var(--v2-line-bright)",
                  color: "var(--v2-cyan)",
                  background: "rgba(34, 211, 238, 0.06)",
                }}
              >
                Виж цялата система
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .jsv-caret { animation: jsv-blink 0.9s steps(1) infinite; color: var(--v2-cyan); }
        @keyframes jsv-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .jsv-caret { animation: none; } }
      `}</style>
    </section>
  );
}
