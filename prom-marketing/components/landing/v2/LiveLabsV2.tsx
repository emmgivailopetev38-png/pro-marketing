"use client";
/* =====================================================================
   LiveLabsV2 — двоен тийзър на началната страница към двете „живи"
   табла: /strategii (лаборатория за стратегии) и /ai-trading (трейдинг
   флота). Леки тикащи числа след mount + мини sparkline, за да се
   усеща живо без да е тежко. Данните са демонстрационни.
   ===================================================================== */
import { useEffect, useState } from "react";
import { FlaskConical, CandlestickChart, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/track";

const SPARK_STRAT = "0,26 10,24 20,25 30,21 40,22 50,18 60,19 70,14 80,15 90,10 100,6";
const SPARK_TRADE = "0,22 10,20 20,23 30,17 40,19 50,13 60,16 70,11 80,13 90,8 100,9";

export function LiveLabsV2() {
  const [roi, setRoi] = useState(147);
  const [trades, setTrades] = useState(312);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      setRoi((v) => +(v + Math.random() * 0.8).toFixed(1));
      setTrades((v) => v + (Math.random() > 0.5 ? 1 : 0));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="v2-section !pt-2" aria-label="Живи табла">
      <div className="v2-wrap">
        <div className="v2-head is-center">
          <p className="v2-eyebrow">// Прозрачност на живо</p>
          <h2 className="v2-title">Виж двигателя в движение</h2>
          <p className="v2-sub">
            Отваряме таблата си: стратегиите, които тестваме, и AI трейдинг
            флотата — на живо, пред всички. Демонстрационни данни.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Strategy Lab teaser */}
          <a
            href="/strategii"
            onClick={() => track("cta_clicked", { location: "live_labs", target: "/strategii" })}
            className="v2-card group block"
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{ borderColor: "rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.1)" }}
              >
                <FlaskConical className="h-6 w-6" style={{ color: "var(--v2-mint)" }} />
              </span>
              <span className="v2-status">Live</span>
            </div>
            <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--v2-ink)" }}>
              Лаборатория за стратегии
            </h3>
            <p className="v2-sub mt-2 !text-[15px]">
              72 маркетинг стратегии в тест. Печелившите се скалират
              експоненциално. Губещите се спират. Без емоции.
            </p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="v2-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--v2-faint)" }}>
                  Топ стратегия · ROI
                </p>
                <p className="v2-mono text-2xl font-bold" style={{ color: "var(--v2-mint)" }}>
                  +{roi}%
                </p>
              </div>
              <svg viewBox="0 0 100 30" className="h-10 w-32" aria-hidden preserveAspectRatio="none">
                <polyline
                  points={SPARK_STRAT}
                  fill="none"
                  stroke="var(--v2-mint)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="v2-mono mt-5 inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--v2-cyan)" }}>
              Отвори таблото
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </p>
          </a>

          {/* Trading Deck teaser */}
          <a
            href="/ai-trading"
            onClick={() => track("cta_clicked", { location: "live_labs", target: "/ai-trading" })}
            className="v2-card group block"
          >
            <div className="flex items-start justify-between gap-4">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{ borderColor: "rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.1)" }}
              >
                <CandlestickChart className="h-6 w-6" style={{ color: "var(--v2-violet-2)" }} />
              </span>
              <span className="v2-status">Live</span>
            </div>
            <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--v2-ink)" }}>
              AI Трейдинг флота
            </h3>
            <p className="v2-sub mt-2 !text-[15px]">
              6 AI бота анализират пазарите 24/7 — сделки, win-rate и криви
              на живо. Симулация с демонстрационна цел.
            </p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="v2-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--v2-faint)" }}>
                  Сделки днес · флота
                </p>
                <p className="v2-mono text-2xl font-bold" style={{ color: "var(--v2-violet-2)" }}>
                  {trades}
                </p>
              </div>
              <svg viewBox="0 0 100 30" className="h-10 w-32" aria-hidden preserveAspectRatio="none">
                <polyline
                  points={SPARK_TRADE}
                  fill="none"
                  stroke="var(--v2-violet-2)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="v2-mono mt-5 inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--v2-cyan)" }}>
              Отвори таблото
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}
