"use client";
/* =====================================================================
   TradingDeck — cinematic "AI Trading Deck" showcase for /ai-trading.
   SIMULATED DATA ONLY (marketing demo). All numbers are deterministic,
   seeded via mulberry32 — the server render and the first client render
   are identical (no Math.random()/new Date() during render). Live ticks
   start only in useEffect after mount.

   Design language: app/v2/v2-design.css ("Luminescent Depth"). Extra
   page-specific styles live in the <style> block below, namespaced tdk-.
   ===================================================================== */

import { memo, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Database,
  Radar,
  ShieldCheck,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Deterministic PRNG (mulberry32, fixed seed)                        */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20260707;

/* ------------------------------------------------------------------ */
/*  Types & seeded data                                                 */
/* ------------------------------------------------------------------ */

type Side = "LONG" | "SHORT";

type Trade = {
  id: string;
  at: number; // seconds on the internal clock (negative = before mount)
  bot: string;
  side: Side;
  pair: string;
  pct: number;
};

type Bot = {
  id: number;
  codename: string;
  specialty: string;
  paused: boolean;
  pairs: string[];
  winRate: number;
  trades30: number;
  maxDD: number;
  roi30: number;
  curve: number[];
  lastSide: Side;
  lastPair: string;
  lastPct: number;
  lastAt: number;
};

type DeckState = {
  bots: Bot[];
  feed: Trade[];
  tradesToday: number;
  pnl: number;
  elapsed: number;
};

const BOT_DEFS: Array<{
  codename: string;
  specialty: string;
  pairs: string[];
  winRate: number;
  trades30: number;
  maxDD: number;
  roi30: number;
  drift: number;
  vol: number;
  paused: boolean;
  longBias: number;
  last: { side: Side; pair: string; pct: number; at: number };
}> = [
  {
    codename: "АТЛАС",
    specialty: "BTC/ETH тренд-следващ · дълги позиции",
    pairs: ["BTC/USDT", "ETH/USDT"],
    winRate: 68.4,
    trades30: 214,
    maxDD: 6.2,
    roi30: 14.8,
    drift: 0.45,
    vol: 1.7,
    paused: false,
    longBias: 0.88,
    last: { side: "LONG", pair: "BTC/USDT", pct: 1.8, at: -240 },
  },
  {
    codename: "СОКОЛ",
    specialty: "Скалпинг на волатилност · 1м таймфрейм",
    pairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
    winRate: 61.2,
    trades30: 1483,
    maxDD: 4.8,
    roi30: 9.3,
    drift: 0.3,
    vol: 2.2,
    paused: false,
    longBias: 0.52,
    last: { side: "SHORT", pair: "ETH/USDT", pct: 0.4, at: -35 },
  },
  {
    codename: "ОРАКУЛ",
    specialty: "Новинарски сентимент · крипто",
    pairs: ["BTC/USDT", "SOL/USDT", "DOGE/USDT"],
    winRate: 57.9,
    trades30: 342,
    maxDD: 8.1,
    roi30: 11.6,
    drift: 0.38,
    vol: 2.6,
    paused: false,
    longBias: 0.6,
    last: { side: "LONG", pair: "SOL/USDT", pct: 2.1, at: -95 },
  },
  {
    codename: "СФИНКС",
    specialty: "Mean-reversion · майор двойки",
    pairs: ["EUR/USD", "GBP/USD", "USD/JPY"],
    winRate: 52.3,
    trades30: 528,
    maxDD: 9.4,
    roi30: -1.7,
    drift: -0.07,
    vol: 1.9,
    paused: true,
    longBias: 0.5,
    last: { side: "SHORT", pair: "EUR/USD", pct: -0.6, at: -1560 },
  },
  {
    codename: "ТИТАН",
    specialty: "Breakout стратегия · индекси",
    pairs: ["NAS100", "SPX500", "DAX40"],
    winRate: 64.7,
    trades30: 189,
    maxDD: 7.3,
    roi30: 12.2,
    drift: 0.4,
    vol: 2.0,
    paused: false,
    longBias: 0.66,
    last: { side: "LONG", pair: "NAS100", pct: 1.2, at: -410 },
  },
  {
    codename: "ПЛУТОН",
    specialty: "Арбитраж между борси",
    pairs: ["BTC/USDT", "ETH/USDT"],
    winRate: 71.5,
    trades30: 906,
    maxDD: 2.9,
    roi30: 6.4,
    drift: 0.22,
    vol: 0.9,
    paused: false,
    longBias: 0.5,
    last: { side: "LONG", pair: "BTC/USDT", pct: 0.3, at: -12 },
  },
];

function genCurve(rng: () => number, drift: number, vol: number): number[] {
  const pts: number[] = [100];
  for (let i = 1; i < 60; i++) {
    const dip = rng() < 0.09 ? -vol * (1 + rng()) : 0; // occasional drawdown
    const next = pts[i - 1] + drift + (rng() - 0.5) * vol + dip;
    pts.push(Math.max(82, next));
  }
  return pts;
}

function buildInitialState(): DeckState {
  const rng = mulberry32(SEED);
  const bots: Bot[] = BOT_DEFS.map((d, i) => ({
    id: i,
    codename: d.codename,
    specialty: d.specialty,
    paused: d.paused,
    pairs: d.pairs,
    winRate: d.winRate,
    trades30: d.trades30,
    maxDD: d.maxDD,
    roi30: d.roi30,
    curve: genCurve(rng, d.drift, d.vol),
    lastSide: d.last.side,
    lastPair: d.last.pair,
    lastPct: d.last.pct,
    lastAt: d.last.at,
  }));

  // Seeded warm-start feed (as if the desk has been running before mount)
  const feed: Trade[] = [];
  let at = -8;
  for (let i = 0; i < 8; i++) {
    const live = bots.filter((b) => !b.paused);
    const bot = live[Math.floor(rng() * live.length)];
    const win = rng() < bot.winRate / 100;
    const pct = win ? +(0.2 + rng() * 2.1).toFixed(2) : -+(0.1 + rng() * 1.1).toFixed(2);
    const side: Side = rng() < 0.6 ? "LONG" : "SHORT";
    const pair = bot.pairs[Math.floor(rng() * bot.pairs.length)];
    feed.push({ id: `s${i}`, at, bot: bot.codename, side, pair, pct });
    at -= Math.floor(6 + rng() * 40);
  }

  return { bots, feed, tradesToday: 147, pnl: 642.8, elapsed: 0 };
}

const INITIAL_STATE: DeckState = buildInitialState();

const DISCLAIMER =
  "Симулирани данни с демонстрационна цел. Не е инвестиционен съвет. Търговията носи риск от загуба.";

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

function fmtEur(v: number): string {
  const sign = v < 0 ? "−" : "+";
  const s = Math.abs(v)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${s} €`;
}

function fmtPct(v: number): string {
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(v % 1 === 0 ? 0 : 1)}%`;
}

function fmtTradePct(v: number): string {
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;
}

function fmtInt(v: number): string {
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function agoLabel(sec: number): string {
  if (sec < 5) return "току-що";
  if (sec < 60) return `преди ${Math.floor(sec)} сек`;
  if (sec < 3600) return `преди ${Math.floor(sec / 60)} мин`;
  return `преди ${Math.floor(sec / 3600)} ч`;
}

/** Minute-granular label so memoized bot cards re-render at most 1×/min */
function agoLabelCoarse(sec: number): string {
  if (sec < 60) return "преди секунди";
  if (sec < 3600) return `преди ${Math.floor(sec / 60)} мин`;
  return `преди ${Math.floor(sec / 3600)} ч`;
}

/* ------------------------------------------------------------------ */
/*  Equity curve (inline SVG)                                           */
/* ------------------------------------------------------------------ */

const CURVE_W = 220;
const CURVE_H = 56;

function curvePaths(curve: number[]): { line: string; area: string } {
  const min = Math.min(...curve);
  const max = Math.max(...curve);
  const span = max - min || 1;
  const pad = 4;
  const pts = curve.map((v, i) => {
    const x = (i / (curve.length - 1)) * CURVE_W;
    const y = CURVE_H - pad - ((v - min) / span) * (CURVE_H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${CURVE_W},${CURVE_H} L0,${CURVE_H} Z`;
  return { line, area };
}

/* ------------------------------------------------------------------ */
/*  Bot card (memoized — only the traded bot re-renders per tick)       */
/* ------------------------------------------------------------------ */

const BotCard = memo(function BotCard({
  bot,
  lastAgo,
  delay,
  revealed,
}: {
  bot: Bot;
  lastAgo: string;
  delay: number;
  revealed: boolean;
}) {
  const { line, area } = useMemo(() => curvePaths(bot.curve), [bot.curve]);
  const up = bot.curve[bot.curve.length - 1] >= bot.curve[0];
  const stroke = up ? "var(--v2-mint)" : "#f87171";
  const gid = `tdk-g${bot.id}`;

  return (
    <article
      className={`v2-card tdk-bot v2-reveal${revealed ? " is-in" : ""}`}
      style={{ ["--d" as string]: `${delay}s` }}
    >
      <div className="tdk-bot-top">
        <div>
          <div className="v2-mono tdk-codename">{bot.codename}</div>
          <div className="tdk-specialty">{bot.specialty}</div>
        </div>
        {bot.paused ? (
          <span className="tdk-paused v2-mono">ПАУЗА · ПРЕОБУЧЕНИЕ</span>
        ) : (
          <span className="v2-status">LIVE</span>
        )}
      </div>

      <div className="tdk-curve" aria-hidden="true">
        <svg
          viewBox={`0 0 ${CURVE_W} ${CURVE_H}`}
          preserveAspectRatio="none"
          role="presentation"
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
          <path
            d={line}
            fill="none"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <dl className="tdk-metrics v2-mono">
        <div>
          <dt>Win-rate</dt>
          <dd>{bot.winRate.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Сделки 30д</dt>
          <dd>{fmtInt(bot.trades30)}</dd>
        </div>
        <div>
          <dt>Max DD</dt>
          <dd style={{ color: "#f87171" }}>−{bot.maxDD.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>ROI 30д*</dt>
          <dd style={{ color: bot.roi30 >= 0 ? "var(--v2-mint)" : "#f87171" }}>
            {fmtPct(bot.roi30)}
          </dd>
        </div>
      </dl>

      <div className="tdk-last v2-mono">
        <span className={`tdk-side ${bot.lastSide === "LONG" ? "is-long" : "is-short"}`}>
          {bot.lastSide}
        </span>
        <span className="tdk-last-pair">{bot.lastPair}</span>
        <span
          style={{ color: bot.lastPct >= 0 ? "var(--v2-mint)" : "#f87171" }}
        >
          {fmtTradePct(bot.lastPct)}
        </span>
        <span className="tdk-last-ago">· {lastAgo}</span>
      </div>
    </article>
  );
});

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: Database,
    title: "Данни",
    text: "Ботовете поглъщат цени, обеми, ордер-книги и новини от десетки източници в реално време.",
  },
  {
    icon: Radar,
    title: "Сигнал",
    text: "AI моделите откриват шаблони и генерират сигнали — всеки с вероятност и очаквано съотношение риск/печалба.",
  },
  {
    icon: Zap,
    title: "Изпълнение",
    text: "Ордерите се изпълняват за милисекунди, без емоции, без колебание — 24 часа, 7 дни в седмицата.",
  },
  {
    icon: ShieldCheck,
    title: "Риск мениджмънт",
    text: "Твърди лимити на позиция, автоматичен stop-loss и изключване на стратегии, които губят предимството си.",
  },
];

export function TradingDeck() {
  const [state, setState] = useState<DeckState>(INITIAL_STATE);
  const [revealed, setRevealed] = useState(false);
  const rngRef = useRef<() => number>(mulberry32(SEED ^ 0x9e3779b9));

  /* staggered entrance after mount */
  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* live simulation ticks — only after mount, throttled to one state
     update per tick; bot cards are memoized so only the bot that
     "traded" re-renders */
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tickMs = reduced ? 6000 : 2100;
    const tickS = tickMs / 1000;

    const iv = window.setInterval(() => {
      if (document.hidden) return; // don't burn CPU in background tabs
      const rng = rngRef.current;

      setState((prev) => {
        const elapsed = prev.elapsed + tickS;
        const live = prev.bots.filter((b) => !b.paused);
        const bot = live[Math.floor(rng() * live.length)];
        const def = BOT_DEFS[bot.id];

        const win = rng() < bot.winRate / 100;
        const pct = win
          ? +(0.2 + rng() * 2.1).toFixed(2)
          : -+(0.1 + rng() * 1.2).toFixed(2);
        const side: Side = rng() < def.longBias ? "LONG" : "SHORT";
        const pair = bot.pairs[Math.floor(rng() * bot.pairs.length)];

        const lastEq = bot.curve[bot.curve.length - 1];
        const nextEq = Math.max(82, lastEq + pct * 1.4);
        const updated: Bot = {
          ...bot,
          curve: [...bot.curve.slice(1), nextEq],
          winRate: Math.min(80, Math.max(45, +(bot.winRate + (win ? 0.05 : -0.07)).toFixed(1))),
          trades30: bot.trades30 + 1,
          roi30: +(bot.roi30 + pct * 0.04).toFixed(1),
          lastSide: side,
          lastPair: pair,
          lastPct: pct,
          lastAt: elapsed,
        };

        const trade: Trade = {
          id: `t${Math.round(elapsed * 10)}`,
          at: elapsed,
          bot: bot.codename,
          side,
          pair,
          pct,
        };

        return {
          bots: prev.bots.map((b) => (b.id === bot.id ? updated : b)),
          feed: [trade, ...prev.feed].slice(0, 14),
          tradesToday: prev.tradesToday + 1,
          pnl: +(prev.pnl + pct * (18 + rng() * 42)).toFixed(2),
          elapsed,
        };
      });
    }, tickMs);

    return () => window.clearInterval(iv);
  }, []);

  const { bots, feed, tradesToday, pnl, elapsed } = state;
  const avgWinRate =
    bots.reduce((sum, b) => sum + b.winRate, 0) / bots.length;

  const stats = [
    { label: "Активни ботове", value: "6", color: "var(--v2-ink)" },
    { label: "Сделки днес*", value: fmtInt(tradesToday), color: "var(--v2-ink)" },
    { label: "Win-rate среден*", value: `${avgWinRate.toFixed(1)}%`, color: "var(--v2-cyan)" },
    {
      label: "Симулиран P&L днес*",
      value: fmtEur(pnl),
      color: pnl >= 0 ? "var(--v2-mint)" : "#f87171",
    },
  ];

  return (
    <>
      <style>{tdkCss}</style>
      <div className="v2-aurora" aria-hidden="true" />

      {/* ============================ HERO ============================ */}
      <section className="v2-section tdk-hero">
        <div className="v2-grid tdk-hero-grid" aria-hidden="true" />
        <div className="v2-wrap">
          <div className={`v2-reveal${revealed ? " is-in" : ""}`}>
            <div className="tdk-chiprow">
              <span className="v2-eyebrow">// AI TRADING DECK · LIVE SIMULATION</span>
            </div>
            <div className="tdk-chiprow">
              <span className="tdk-demo-chip v2-mono">
                <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />
                ДЕМО · СИМУЛИРАНИ ДАННИ
              </span>
              <span className="v2-status">СИМУЛАЦИЯ РАБОТИ</span>
            </div>
          </div>

          <h1
            className={`v2-title-plain tdk-title v2-reveal${revealed ? " is-in" : ""}`}
            style={{ ["--d" as string]: "0.08s" }}
          >
            AI ботове, които <span className="v2-grad">търгуват, докато ти спиш.</span>
          </h1>

          <p
            className={`v2-sub v2-reveal${revealed ? " is-in" : ""}`}
            style={{ ["--d" as string]: "0.16s" }}
          >
            AI екип анализира пазарите 24/7 — стратегиите се тестват непрекъснато,
            печелившите се скалират, а губещите се изключват автоматично.
          </p>

          <p
            className={`tdk-disclaimer v2-reveal${revealed ? " is-in" : ""}`}
            style={{ ["--d" as string]: "0.22s" }}
          >
            <AlertTriangle size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>{DISCLAIMER}</span>
          </p>

          <div
            className={`tdk-stats v2-reveal${revealed ? " is-in" : ""}`}
            style={{ ["--d" as string]: "0.3s" }}
          >
            {stats.map((s) => (
              <div key={s.label} className="v2-glass tdk-stat">
                <div className="tdk-stat-label v2-mono">{s.label}</div>
                <div className="tdk-stat-value" style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= BOTS + TRADE FEED ===================== */}
      <section className="v2-section tdk-deck-section">
        <div className="v2-wrap">
          <div className={`v2-head v2-reveal${revealed ? " is-in" : ""}`}>
            <span className="v2-eyebrow">// ФЛОТИЛИЯТА</span>
            <h2 className="v2-title-plain tdk-h2">
              Шест бота. <span className="v2-grad">Една мисия.</span>
            </h2>
            <p className="v2-sub">
              Всеки бот е специализиран в различна стратегия и пазар — заедно покриват
              крипто, валути и индекси без прекъсване.
            </p>
          </div>

          <div className="tdk-deck">
            <div className="tdk-bots">
              {bots.map((b, i) => (
                <BotCard
                  key={b.id}
                  bot={b}
                  lastAgo={agoLabelCoarse(elapsed - b.lastAt)}
                  delay={0.06 + i * 0.07}
                  revealed={revealed}
                />
              ))}
            </div>

            <aside
              className={`v2-glass tdk-feed v2-reveal${revealed ? " is-in" : ""}`}
              style={{ ["--d" as string]: "0.2s" }}
              aria-label="Поток от симулирани сделки"
            >
              <div className="tdk-feed-head">
                <span className="tdk-feed-title">
                  <Activity size={15} strokeWidth={2.2} aria-hidden="true" />
                  Поток от сделки
                </span>
                <span className="v2-status">LIVE</span>
              </div>
              <ol className="tdk-feed-list">
                {feed.map((t) => (
                  <li key={t.id} className="tdk-row v2-mono">
                    <span className="tdk-row-time">{agoLabel(elapsed - t.at)}</span>
                    <span className="tdk-row-bot">{t.bot}</span>
                    <span
                      className={`tdk-side ${t.side === "LONG" ? "is-long" : "is-short"}`}
                    >
                      {t.side}
                    </span>
                    <span className="tdk-row-pair">{t.pair}</span>
                    <span
                      className="tdk-row-pct"
                      style={{ color: t.pct >= 0 ? "var(--v2-mint)" : "#f87171" }}
                    >
                      {fmtTradePct(t.pct)}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="tdk-feed-note v2-mono">* симулирани сделки · демо</p>
            </aside>
          </div>
        </div>
      </section>

      {/* =========================== КАК РАБОТИ ======================== */}
      <section className="v2-section tdk-how">
        <div className="v2-wrap">
          <div className={`v2-head is-center v2-reveal${revealed ? " is-in" : ""}`}>
            <span className="v2-eyebrow">// КАК РАБОТИ</span>
            <h2 className="v2-title-plain tdk-h2">
              От сурови данни до <span className="v2-grad">изпълнена сделка</span>
            </h2>
          </div>

          <div className="tdk-steps">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className={`v2-card tdk-step v2-reveal${revealed ? " is-in" : ""}`}
                  style={{ ["--d" as string]: `${0.08 + i * 0.08}s` }}
                >
                  <div className="tdk-step-icon">
                    <Icon size={20} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="tdk-step-num v2-mono">0{i + 1}</div>
                  <h3 className="tdk-step-title">{s.title}</h3>
                  <p className="tdk-step-text">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================== CTA ============================ */}
      <section className="v2-section tdk-cta">
        <div className="v2-wrap">
          <div
            className={`v2-glass v2-glow is-always tdk-cta-card v2-reveal${revealed ? " is-in" : ""}`}
          >
            <span className="v2-eyebrow">// СЛЕДВАЩА СТЪПКА</span>
            <h2 className="v2-title-plain tdk-h2" style={{ marginBottom: 12 }}>
              Искаш достъп до <span className="v2-grad">AI трейдинг системата?</span>
            </h2>
            <p className="v2-sub" style={{ marginInline: "auto", marginBottom: 28 }}>
              Започни с безплатната книга — как AI променя търговията — или запази
              директен разговор с екипа ни.
            </p>
            <div className="tdk-cta-btns">
              <Link href="/trading" className="v2-btn v2-btn-primary is-lg">
                Вземи безплатната книга
                <ArrowRight size={18} className="v2-arrow" aria-hidden="true" />
              </Link>
              <Link href="/booking" className="v2-btn is-lg">
                Запази разговор
              </Link>
            </div>
            <p className="tdk-disclaimer tdk-disclaimer-center">
              <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" />
              <span>{DISCLAIMER}</span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page-specific styles (namespaced tdk-)                              */
/* ------------------------------------------------------------------ */

const tdkCss = `
.tdk-hero { padding-block: clamp(48px, 7vw, 96px) clamp(56px, 8vw, 110px); }
.tdk-hero-grid { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.tdk-title { max-width: 820px; }

.tdk-chiprow {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  margin-bottom: 14px;
}
.tdk-demo-chip {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.09);
  border: 1px solid rgba(251, 191, 36, 0.45);
  border-radius: 8px; padding: 5px 10px;
  text-transform: uppercase;
}
.tdk-disclaimer {
  display: flex; align-items: flex-start; gap: 8px;
  margin-top: 16px; max-width: 640px;
  font-size: 12.5px; line-height: 1.55;
  color: var(--v2-faint);
}
.tdk-disclaimer svg { flex-shrink: 0; margin-top: 2px; color: #fbbf24; }
.tdk-disclaimer-center { margin-inline: auto; justify-content: center; text-align: left; margin-top: 26px; }

.tdk-stats {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px; margin-top: 34px;
}
.tdk-stat { padding: 18px 20px; }
.tdk-stat-label {
  font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--v2-faint); margin-bottom: 8px;
}
.tdk-stat-value {
  font-family: var(--v2-font-display);
  font-weight: 700; font-size: clamp(1.35rem, 2.4vw, 1.8rem);
  letter-spacing: -0.02em; line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.tdk-deck-section { padding-block: clamp(40px, 6vw, 90px); }
.tdk-h2 { font-size: clamp(1.65rem, 3.4vw, 2.5rem); }

.tdk-deck {
  display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
  gap: 20px; align-items: start;
}
.tdk-bots {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.tdk-bot { display: flex; flex-direction: column; gap: 14px; }
.tdk-bot-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.tdk-codename {
  font-size: clamp(1.15rem, 1.8vw, 1.4rem); font-weight: 700;
  letter-spacing: 0.08em; color: var(--v2-ink);
}
.tdk-specialty { font-size: 12.5px; color: var(--v2-muted); margin-top: 4px; line-height: 1.45; }
.tdk-paused {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 7px; padding: 4px 8px;
  white-space: nowrap;
}
.tdk-paused::before {
  content: ""; width: 6px; height: 6px; border-radius: 50%;
  background: #fbbf24; box-shadow: 0 0 8px #fbbf24;
}
.tdk-curve { border-radius: 10px; overflow: hidden; background: rgba(4, 6, 13, 0.5); border: 1px solid var(--v2-line); }
.tdk-curve svg { display: block; width: 100%; height: 64px; }

.tdk-metrics {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px; margin: 0;
}
.tdk-metrics dt {
  font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--v2-faint); margin-bottom: 4px; white-space: nowrap;
}
.tdk-metrics dd {
  margin: 0; font-size: 13px; font-weight: 600; color: var(--v2-ink);
  font-variant-numeric: tabular-nums;
}
.tdk-last {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 11.5px; color: var(--v2-muted);
  border-top: 1px solid var(--v2-line); padding-top: 12px;
}
.tdk-last-pair { color: var(--v2-ink); }
.tdk-last-ago { color: var(--v2-faint); }

.tdk-side {
  display: inline-flex; align-items: center;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
  border-radius: 6px; padding: 3px 7px;
}
.tdk-side.is-long { color: var(--v2-mint); background: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.35); }
.tdk-side.is-short { color: #f87171; background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.35); }

.tdk-feed { padding: 20px; position: sticky; top: 100px; }
.tdk-feed-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; margin-bottom: 6px;
}
.tdk-feed-title {
  display: inline-flex; align-items: center; gap: 8px;
  font-weight: 600; font-size: 15px; color: var(--v2-ink);
}
.tdk-feed-title svg { color: var(--v2-cyan); }
.tdk-feed-list { list-style: none; margin: 0; padding: 0; }
.tdk-row {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 0; font-size: 11.5px;
  border-bottom: 1px solid var(--v2-line);
  animation: tdk-in 0.45s var(--v2-ease);
}
.tdk-row:last-child { border-bottom: none; }
.tdk-row-time { color: var(--v2-faint); min-width: 92px; font-size: 10.5px; }
.tdk-row-bot { color: var(--v2-cyan); min-width: 58px; font-weight: 600; }
.tdk-row-pair { color: var(--v2-muted); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tdk-row-pct { font-weight: 700; font-variant-numeric: tabular-nums; }
.tdk-feed-note { margin: 12px 0 0; font-size: 10px; color: var(--v2-faint); letter-spacing: 0.08em; }
@keyframes tdk-in {
  from { opacity: 0; transform: translateY(-7px); }
  to { opacity: 1; transform: none; }
}

.tdk-how { padding-block: clamp(40px, 6vw, 90px); }
.tdk-steps {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.tdk-step { position: relative; }
.tdk-step-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 42px; height: 42px; border-radius: 12px;
  color: var(--v2-cyan);
  background: rgba(34, 211, 238, 0.09);
  border: 1px solid var(--v2-line-bright);
  margin-bottom: 16px;
}
.tdk-step-num {
  position: absolute; top: 20px; right: 22px;
  font-size: 11px; color: var(--v2-faint); letter-spacing: 0.14em;
}
.tdk-step-title { font-size: 17px; font-weight: 700; color: var(--v2-ink); margin: 0 0 8px; }
.tdk-step-text { font-size: 13.5px; line-height: 1.6; color: var(--v2-muted); margin: 0; }

.tdk-cta { padding-block: clamp(40px, 6vw, 100px) clamp(72px, 9vw, 130px); }
.tdk-cta-card {
  text-align: center; padding: clamp(36px, 5.5vw, 64px) clamp(20px, 4vw, 56px);
}
.tdk-cta-btns {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 14px;
}
.tdk-cta-btns a { text-decoration: none; }

/* ---------- responsive ---------- */
@media (max-width: 1020px) {
  .tdk-deck { grid-template-columns: minmax(0, 1fr); }
  .tdk-feed { position: static; }
}
@media (max-width: 900px) {
  .tdk-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tdk-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .tdk-bots { grid-template-columns: minmax(0, 1fr); }
  .tdk-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 12px; }
}
@media (max-width: 480px) {
  .tdk-steps { grid-template-columns: minmax(0, 1fr); }
  .tdk-stats { gap: 10px; }
  .tdk-stat { padding: 14px 16px; }
  .tdk-row-time { min-width: 78px; }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .tdk-row { animation: none !important; }
  .tdk-paused::before { box-shadow: none; }
}
`;
