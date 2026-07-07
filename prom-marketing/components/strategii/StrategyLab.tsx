"use client";
/* =====================================================================
   StrategyLab — „Лаборатория за стратегии" board for /strategii.
   72 deterministic (seeded PRNG) simulated marketing strategies that
   "tick" live after mount. Pure client component, styled 1:1 with the
   v2 "Luminescent Depth 2050" design system (app/v2/v2-design.css);
   board-specific styles are namespaced `slab-` in the <style> block.
   ALL DATA IS SIMULATED — the page carries a visible demo disclaimer.
   ===================================================================== */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  FlaskConical,
  Globe,
  Mail,
  Megaphone,
  MessageCircle,
  Music2,
  Play,
  RefreshCw,
  Rocket,
  Search,
  SearchX,
  Send,
  Split,
  Users,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Deterministic data generation (seeded — server & client identical) */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Band = "scale" | "promise" | "watch" | "kill";

interface Strategy {
  id: number;
  name: string;
  channel: string;
  icon: LucideIcon;
  roi: number;
  budget: number;
  spark: number[];
  killDays: number; // only meaningful for the "kill" band
}

interface ChannelDef {
  label: string;
  icon: LucideIcon;
  tactics: string[]; // exactly 6 per channel → 12 × 6 = 72
}

const CHANNELS: ChannelDef[] = [
  {
    label: "Meta Ads",
    icon: Megaphone,
    tactics: [
      "видео фуния",
      "карусел оферта",
      "lead form кампания",
      "ретаргет с отзиви",
      "флаш промо 48ч",
      "lookalike 3% аудитория",
    ],
  },
  {
    label: "TikTok",
    icon: Music2,
    tactics: [
      "UGC видео фуния",
      "преди/след серия",
      "спарк реклами",
      "куиз лендинг",
      "криейтър колаборация",
      "тренд хак кампания",
    ],
  },
  {
    label: "Google",
    icon: Search,
    tactics: [
      "бранд защита",
      "Performance Max фийд",
      "търсене с висок интент",
      "конкурентни ключови думи",
      "дисплей ремаркетинг",
      "in-stream видео",
    ],
  },
  {
    label: "Email",
    icon: Mail,
    tactics: [
      "5-дневен реактивиращ цикъл",
      "изоставена количка серия",
      "VIP сегмент оферта",
      "бюлетин A/B тест",
      "win-back кампания",
      "пост-покупка ъпсел",
    ],
  },
  {
    label: "SEO",
    icon: Globe,
    tactics: [
      "програматик лендинги",
      "сравнителни статии",
      "локално SEO пакет",
      "FAQ схема разширение",
      "линк билдинг цикъл",
      "дълга опашка клъстер",
    ],
  },
  {
    label: "Инфлуенсъри",
    icon: Users,
    tactics: [
      "микро-инфлуенсър мрежа",
      "амбасадор програма",
      "продуктово ревю цикъл",
      "giveaway колаборация",
      "афилиейт структура",
      "сторита такеовър",
    ],
  },
  {
    label: "YouTube Shorts",
    icon: Play,
    tactics: [
      "хук тест серия",
      "туториал фуния",
      "преди/след кадри",
      "коментар-към-лид бот",
      "шорт → лендинг цикъл",
      "ремикс на дълги видеа",
    ],
  },
  {
    label: "Messenger бот",
    icon: MessageCircle,
    tactics: [
      "чатбот квалификация",
      "куиз диалог",
      "наложен пост отговори",
      "количка напомняне",
      "VIP клуб абонамент",
      "автоматичен FAQ поток",
    ],
  },
  {
    label: "Ретаргетинг",
    icon: RefreshCw,
    tactics: [
      "динамичен продуктов фийд",
      "7-дневна гореща аудитория",
      "видео гледания 75%",
      "оферта стълбица",
      "социално доказателство",
      "крос-канален цикъл",
    ],
  },
  {
    label: "Landing A/B",
    icon: Split,
    tactics: [
      "куиз лендинг тест",
      "дълга vs къса страница",
      "видео hero тест",
      "ценова котва тест",
      "форма в 2 стъпки",
      "отзиви блок вариации",
    ],
  },
  {
    label: "UGC видео",
    icon: Video,
    tactics: [
      "клиентски отзиви цикъл",
      "разопаковане серия",
      "проблем/решение скеч",
      "дует формат",
      "стрийт интервю",
      "кейс видео поредица",
    ],
  },
  {
    label: "Viber",
    icon: Send,
    tactics: [
      "broadcast промо",
      "стикер кампания",
      "клуб общност",
      "напомняне за количка",
      "флаш код оферта",
      "анкета сегментация",
    ],
  },
];

/* Distribution: 8 exponential + 18 strong + 20 promising + 12 neutral + 14 losers = 72 */
const BANDS_PLAN: Array<{ min: number; max: number; count: number }> = [
  { min: 90, max: 340, count: 8 },
  { min: 35, max: 80, count: 18 },
  { min: 10, max: 35, count: 20 },
  { min: -10, max: 10, count: 12 },
  { min: -45, max: -10, count: 14 },
];

function bandOf(roi: number): Band {
  if (roi >= 80) return "scale";
  if (roi >= 10) return "promise";
  if (roi >= -10) return "watch";
  return "kill";
}

function buildStrategies(): Strategy[] {
  const rng = mulberry32(20260707);

  // ROI pool according to the plan, then a seeded shuffle
  const rois: number[] = [];
  for (const b of BANDS_PLAN) {
    for (let i = 0; i < b.count; i++) rois.push(b.min + rng() * (b.max - b.min));
  }
  for (let i = rois.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rois[i], rois[j]] = [rois[j], rois[i]];
  }

  const out: Strategy[] = [];
  let id = 1;
  for (const ch of CHANNELS) {
    for (const tactic of ch.tactics) {
      const roi = rois[id - 1];
      const band = bandOf(roi);
      const budget =
        band === "scale"
          ? 1500 + rng() * 4500
          : band === "promise"
            ? 800 + rng() * 2200
            : band === "watch"
              ? 300 + rng() * 900
              : 200 + rng() * 700;

      // 30-point history drifting from ~0 toward the current ROI
      const spark: number[] = [];
      let v = roi * (0.04 + rng() * 0.08);
      for (let p = 0; p < 30; p++) {
        const drift = (roi - v) / (30 - p);
        v += drift + (rng() - 0.5) * Math.max(2, Math.abs(roi) * 0.07);
        spark.push(v);
      }
      spark[29] = roi;

      out.push({
        id,
        name: `${ch.label} · ${tactic}`,
        channel: ch.label,
        icon: ch.icon,
        roi,
        budget,
        spark,
        killDays: 1 + Math.floor(rng() * 3),
      });
      id++;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers (deterministic — no locale APIs)                */
/* ------------------------------------------------------------------ */

function fmtInt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function fmtRoi(roi: number): string {
  const r = Math.round(roi);
  return `${r > 0 ? "+" : ""}${r}%`;
}

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                        */
/* ------------------------------------------------------------------ */

function Sparkline({ points, roi }: { points: number[]; roi: number }) {
  const w = 110;
  const h = 30;
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    if (p < min) min = p;
    if (p > max) max = p;
  }
  const span = max - min || 1;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${(i * step).toFixed(1)},${(h - 3 - ((p - min) / span) * (h - 6)).toFixed(1)}`)
    .join(" ");
  const color = roi >= 10 ? "var(--v2-mint)" : roi <= -10 ? "#f87171" : "var(--v2-muted)";
  return (
    <svg
      className="slab-spark"
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden
      preserveAspectRatio="none"
    >
      <polyline
        points={path}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle
        cx={w}
        cy={h - 3 - ((points[points.length - 1] - min) / span) * (h - 6)}
        r="2"
        fill={color}
      />
    </svg>
  );
}

function StatusBadge({ band, killDays }: { band: Band; killDays: number }) {
  if (band === "scale") {
    return (
      <span className="slab-badge is-scale">
        <span className="slab-dot" aria-hidden />
        СКАЛИРАМЕ ЕКСПОНЕНЦИАЛНО
      </span>
    );
  }
  if (band === "promise") {
    return <span className="slab-badge is-promise">ТЕСТВАМЕ · ОБЕЩАВАЩА</span>;
  }
  if (band === "watch") {
    return <span className="slab-badge is-watch">НАБЛЮДАВАМЕ</span>;
  }
  return (
    <span className="slab-badge is-kill">
      СПИРАМЕ СКОРО
      <em>{killDays === 1 ? "спира след 1 ден" : `спира след ${killDays} дни`}</em>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Live feed                                                          */
/* ------------------------------------------------------------------ */

interface FeedItem {
  key: number;
  text: string;
  tone: "up" | "down" | "info";
}

function makeFeedItem(s: Strategy, key: number): FeedItem {
  const band = bandOf(s.roi);
  if (band === "scale") {
    const bump = 10 + Math.floor(Math.random() * 25);
    return {
      key,
      tone: "up",
      text: `⚡ Стратегия #${s.id} премина ${fmtRoi(s.roi)} → бюджетът увеличен с ${bump}%`,
    };
  }
  if (band === "kill") {
    return { key, tone: "down", text: `🛑 Стратегия #${s.id} маркирана за спиране — ROI под прага` };
  }
  if (band === "watch") {
    return { key, tone: "info", text: `🔬 Стратегия #${s.id} влезе в нова A/B итерация` };
  }
  const realloc = 50 * (2 + Math.floor(Math.random() * 8));
  return { key, tone: "up", text: `📈 Стратегия #${s.id} на ${fmtRoi(s.roi)} — реалокация +€${realloc}` };
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type FilterKey = "all" | "winners" | "testing" | "losers";
type SortKey = "roi" | "budget" | "name";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Всички" },
  { key: "winners", label: "Печеливши" },
  { key: "testing", label: "В тест" },
  { key: "losers", label: "Губещи" },
];

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "roi", label: "по ROI" },
  { key: "budget", label: "по бюджет" },
  { key: "name", label: "по име" },
];

const PAGE_SIZE = 12;

export function StrategyLab() {
  const initial = useMemo(buildStrategies, []);
  const [strategies, setStrategies] = useState<Strategy[]>(initial);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("roi");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const stratRef = useRef(strategies);
  stratRef.current = strategies;

  /* Entrance reveals */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".v2-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Live ticking + feed (skipped entirely for prefers-reduced-motion) */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tick = setInterval(() => {
      setStrategies((prev) => {
        const next = [...prev];
        const n = 3 + Math.floor(Math.random() * 5);
        for (let k = 0; k < n; k++) {
          const i = Math.floor(Math.random() * next.length);
          const s = next[i];
          const band = bandOf(s.roi);
          let roi = s.roi;
          let budget = s.budget;
          if (band === "scale") {
            roi *= 1 + 0.002 + Math.random() * 0.006; // multiplicative — exponential feel
            budget *= 1 + Math.random() * 0.004;
          } else if (band === "promise") {
            roi += (Math.random() - 0.35) * 1.2;
          } else if (band === "watch") {
            roi += (Math.random() - 0.5) * 0.8;
          } else {
            roi = Math.max(-45, roi - Math.random() * 0.5);
          }
          roi = Math.min(roi, 990);
          next[i] = { ...s, roi, budget, spark: [...s.spark.slice(1), roi] };
        }
        return next;
      });
    }, 1200);

    let feedKey = 1;
    const feedTimer = setInterval(() => {
      const list = stratRef.current;
      const s = list[Math.floor(Math.random() * list.length)];
      const item = makeFeedItem(s, feedKey++);
      setFeed((prev) => [item, ...prev].slice(0, 4));
    }, 3400);

    return () => {
      clearInterval(tick);
      clearInterval(feedTimer);
    };
  }, []);

  /* Derived metrics */
  const winners = strategies.filter((s) => s.roi >= 10).length;
  const losers = strategies.filter((s) => s.roi < -10).length;
  const roiIndex = strategies.reduce((a, s) => a + s.roi, 0) / strategies.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = strategies.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (filter === "winners") return s.roi >= 10;
      if (filter === "testing") return s.roi >= -10 && s.roi < 10;
      if (filter === "losers") return s.roi < -10;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "roi") return b.roi - a.roi || a.id - b.id;
      if (sort === "budget") return b.budget - a.budget || a.id - b.id;
      return a.name.localeCompare(b.name, "bg") || a.id - b.id;
    });
    return list;
  }, [strategies, filter, sort, query]);

  const shown = filtered.slice(0, visible);

  const filterCount = (key: FilterKey): number => {
    if (key === "all") return strategies.length;
    if (key === "winners") return winners;
    if (key === "testing") return strategies.filter((s) => s.roi >= -10 && s.roi < 10).length;
    return losers;
  };

  return (
    <div ref={rootRef} className="slab-root">
      <div className="v2-aurora" aria-hidden />

      <style>{`
        .slab-root { position: relative; }

        /* --- header chips / stats ------------------------------------ */
        .slab-demo-chip {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--v2-font-mono); font-size: 10.5px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.45);
          background: rgba(251, 191, 36, 0.07);
          border-radius: 7px; padding: 5px 10px; margin-left: 12px;
          vertical-align: middle; white-space: nowrap;
        }
        .slab-headrow { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }

        .slab-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-top: clamp(28px, 4vw, 44px);
        }
        @media (max-width: 860px) { .slab-stats { grid-template-columns: repeat(2, 1fr); } }
        .slab-stat {
          padding: clamp(14px, 2vw, 22px);
          display: flex; flex-direction: column; gap: 6px;
        }
        .slab-stat b {
          font-family: var(--v2-font-mono); font-weight: 700;
          font-size: clamp(1.5rem, 3vw, 2.1rem); line-height: 1;
          color: var(--v2-ink); font-variant-numeric: tabular-nums;
          transition: color 0.4s var(--v2-ease);
        }
        .slab-stat.is-mint b { color: var(--v2-mint); }
        .slab-stat.is-red b { color: #f87171; }
        .slab-stat.is-cyan b { color: var(--v2-cyan); }
        .slab-stat span {
          font-family: var(--v2-font-mono); font-size: 10.5px;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--v2-faint);
        }

        /* --- live feed ------------------------------------------------ */
        .slab-feed {
          margin-top: 18px; display: flex; flex-direction: column; gap: 8px;
          min-height: 34px;
        }
        .slab-feed-item {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--v2-font-mono); font-size: 12px;
          color: var(--v2-muted); padding: 7px 12px;
          border: 1px solid var(--v2-line); border-radius: 10px;
          background: var(--v2-glass); width: fit-content; max-width: 100%;
          animation: slab-slide-in 0.5s var(--v2-ease) both;
        }
        .slab-feed-item.is-up { border-color: rgba(52, 211, 153, 0.3); color: #a7e8cf; }
        .slab-feed-item.is-down { border-color: rgba(248, 113, 113, 0.3); color: #f5b4b4; }
        @keyframes slab-slide-in {
          from { opacity: 0; transform: translateX(-14px); }
          to { opacity: 1; transform: none; }
        }

        /* --- board shell ---------------------------------------------- */
        .slab-board { margin-top: clamp(28px, 4vw, 44px); padding: 0; overflow: hidden; }
        .slab-board-head {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          padding: 16px clamp(14px, 2.4vw, 26px);
          border-bottom: 1px solid var(--v2-line);
        }
        .slab-live {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--v2-font-mono); font-size: 11px;
          letter-spacing: 0.18em; color: var(--v2-mint);
        }
        .slab-live i {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--v2-mint); box-shadow: 0 0 10px var(--v2-mint);
          animation: slab-pulse 1.3s ease-in-out infinite;
        }
        @keyframes slab-pulse { 50% { opacity: 0.25; transform: scale(0.8); } }

        /* --- controls -------------------------------------------------- */
        .slab-controls {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 14px clamp(14px, 2.4vw, 26px);
          border-bottom: 1px solid var(--v2-line);
        }
        .slab-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .slab-tab {
          font-family: var(--v2-font-mono); font-size: 11.5px;
          letter-spacing: 0.06em; color: var(--v2-muted);
          background: transparent; border: 1px solid var(--v2-line);
          border-radius: var(--v2-r-pill); padding: 8px 14px; cursor: pointer;
          transition: color 0.25s var(--v2-ease), border-color 0.25s var(--v2-ease),
            background 0.25s var(--v2-ease);
          min-height: 36px;
        }
        .slab-tab em { font-style: normal; opacity: 0.55; margin-left: 5px; }
        .slab-tab:hover { color: var(--v2-ink); border-color: var(--v2-line-bright); }
        .slab-tab.is-active {
          color: #04121a; background: var(--v2-grad-accent);
          border-color: transparent; font-weight: 700;
        }
        .slab-tab.is-active em { opacity: 0.75; }

        .slab-sorts { display: flex; gap: 6px; margin-left: auto; flex-wrap: wrap; }
        @media (max-width: 720px) { .slab-sorts { margin-left: 0; } }

        .slab-search {
          position: relative; display: flex; align-items: center;
          flex: 1 1 190px; min-width: 160px; max-width: 280px;
        }
        .slab-search svg { position: absolute; left: 11px; opacity: 0.5; }
        .slab-search input {
          width: 100%; min-height: 36px;
          font-family: var(--v2-font-mono); font-size: 12px;
          color: var(--v2-ink); background: var(--v2-glass);
          border: 1px solid var(--v2-line); border-radius: var(--v2-r-pill);
          padding: 8px 14px 8px 32px; outline: none;
          transition: border-color 0.25s var(--v2-ease);
        }
        .slab-search input::placeholder { color: var(--v2-faint); }
        .slab-search input:focus { border-color: var(--v2-line-bright); }

        /* --- rows ------------------------------------------------------ */
        .slab-cols, .slab-row {
          display: grid;
          grid-template-columns: 44px minmax(0, 1.6fr) 120px 96px 96px minmax(190px, 1fr);
          gap: 14px; align-items: center;
          padding: 12px clamp(14px, 2.4vw, 26px);
        }
        .slab-cols {
          font-family: var(--v2-font-mono); font-size: 10px;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--v2-faint); border-bottom: 1px solid var(--v2-line);
          padding-block: 10px;
        }
        .slab-row {
          border-bottom: 1px solid var(--v2-line);
          transition: background 0.3s var(--v2-ease), box-shadow 0.3s var(--v2-ease),
            transform 0.3s var(--v2-ease);
        }
        .slab-row:last-child { border-bottom: 0; }
        .slab-row:hover {
          background: var(--v2-glass-2);
          box-shadow: inset 3px 0 0 var(--v2-cyan), 0 0 30px -12px var(--v2-glow-cyan);
          transform: translateX(2px);
        }
        .slab-rank {
          font-family: var(--v2-font-mono); font-size: 11px; color: var(--v2-faint);
        }
        .slab-name {
          display: flex; align-items: center; gap: 10px; min-width: 0;
          font-weight: 600; font-size: 14px; color: var(--v2-ink);
        }
        .slab-name .slab-name-text {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .slab-ico {
          flex: 0 0 auto; display: grid; place-items: center;
          width: 30px; height: 30px; border-radius: 9px;
          color: var(--v2-cyan); border: 1px solid var(--v2-line);
          background: var(--v2-glass);
        }
        .slab-roi {
          font-family: var(--v2-font-mono); font-weight: 700; font-size: 14px;
          font-variant-numeric: tabular-nums; display: inline-flex;
          align-items: center; gap: 4px;
          transition: color 0.4s var(--v2-ease);
        }
        .slab-roi.is-up { color: var(--v2-mint); }
        .slab-roi.is-down { color: #f87171; }
        .slab-roi.is-flat { color: var(--v2-muted); }
        .slab-budget {
          font-family: var(--v2-font-mono); font-size: 12.5px; color: var(--v2-muted);
          font-variant-numeric: tabular-nums;
        }

        .slab-badge {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: var(--v2-font-mono); font-size: 9.5px;
          letter-spacing: 0.1em; padding: 4px 9px; border-radius: 7px;
          white-space: nowrap;
        }
        .slab-badge em {
          font-style: normal; opacity: 0.7; letter-spacing: 0.02em;
          text-transform: lowercase;
        }
        .slab-badge.is-scale { color: var(--v2-mint); border: 1px solid rgba(52, 211, 153, 0.4); background: rgba(52, 211, 153, 0.07); }
        .slab-badge.is-promise { color: var(--v2-cyan); border: 1px solid rgba(34, 211, 238, 0.35); background: rgba(34, 211, 238, 0.06); }
        .slab-badge.is-watch { color: var(--v2-muted); border: 1px solid var(--v2-line); background: var(--v2-glass); }
        .slab-badge.is-kill { color: #f87171; border: 1px solid rgba(248, 113, 113, 0.4); background: rgba(248, 113, 113, 0.07); }
        .slab-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--v2-mint); box-shadow: 0 0 8px var(--v2-mint);
          animation: slab-pulse 1.3s ease-in-out infinite;
        }

        .slab-spark { display: block; width: 110px; height: 30px; }

        .slab-more-wrap { display: flex; justify-content: center; padding: 18px; }
        .slab-empty {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 48px 20px; color: var(--v2-faint);
          font-family: var(--v2-font-mono); font-size: 13px;
        }

        /* --- mobile re-flow -------------------------------------------- */
        @media (max-width: 860px) {
          .slab-cols { display: none; }
          .slab-row {
            grid-template-columns: minmax(0, 1fr) auto;
            grid-template-areas:
              "name roi"
              "spark budget"
              "status status";
            row-gap: 10px; padding-block: 14px;
          }
          .slab-row:hover { transform: none; }
          .slab-rank { display: none; }
          .slab-name { grid-area: name; }
          .slab-roi { grid-area: roi; justify-self: end; }
          .slab-spark-cell { grid-area: spark; }
          .slab-budget { grid-area: budget; justify-self: end; }
          .slab-status-cell { grid-area: status; }
        }

        /* --- footer note / CTA ------------------------------------------ */
        .slab-note {
          margin-top: 26px; font-family: var(--v2-font-mono);
          font-size: 11px; letter-spacing: 0.04em; color: var(--v2-faint);
          text-align: center;
        }
        .slab-cta {
          margin-top: clamp(48px, 7vw, 90px); text-align: center;
          padding: clamp(36px, 5vw, 64px) clamp(20px, 4vw, 48px);
        }
        .slab-cta-btns {
          display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
          margin-top: 28px;
        }

        @media (prefers-reduced-motion: reduce) {
          .slab-live i, .slab-dot { animation: none !important; }
          .slab-feed-item { animation: none !important; }
          .slab-row, .slab-tab, .slab-roi, .slab-stat b { transition: none !important; }
        }
      `}</style>

      <section className="v2-section" style={{ paddingBlock: "clamp(40px, 6vw, 80px)" }}>
        <div className="v2-wrap">
          {/* ---------- Header ---------- */}
          <div className="v2-head">
            <div className="slab-headrow v2-reveal">
              <span className="v2-eyebrow">{"// STRATEGY LAB · LIVE"}</span>
              <span className="slab-demo-chip">ДЕМО · СИМУЛИРАНИ ДАННИ</span>
            </div>
            <h1 className="v2-title-plain v2-reveal" style={{ "--d": "0.08s" } as React.CSSProperties}>
              72 стратегии в тест. <span className="v2-grad">В реално време.</span>
            </h1>
            <p className="v2-sub v2-reveal" style={{ "--d": "0.16s" } as React.CSSProperties}>
              Всяка стратегия се тества от AI екипа денонощно. Печелившите се скалират
              експоненциално — бюджетът им расте автоматично. Губещите се спират без
              емоции. Никакви догадки, само данни.
            </p>
          </div>

          {/* ---------- Summary stats ---------- */}
          <div className="slab-stats v2-reveal" style={{ "--d": "0.2s" } as React.CSSProperties}>
            <div className="v2-card slab-stat">
              <b>{strategies.length}</b>
              <span>Активни стратегии</span>
            </div>
            <div className="v2-card slab-stat is-mint">
              <b>{winners}</b>
              <span>На печалба</span>
            </div>
            <div className="v2-card slab-stat is-red">
              <b>{losers}</b>
              <span>На загуба</span>
            </div>
            <div className="v2-card slab-stat is-cyan">
              <b>{roiIndex >= 0 ? "+" : ""}{roiIndex.toFixed(1)}%</b>
              <span>Общ ROI индекс</span>
            </div>
          </div>

          {/* ---------- Live feed ---------- */}
          <div className="slab-feed" aria-live="polite">
            {feed.map((f) => (
              <div key={f.key} className={`slab-feed-item is-${f.tone}`}>
                {f.text}
              </div>
            ))}
            {feed.length === 0 && (
              <div className="slab-feed-item">
                <Zap size={13} /> Хермес анализира резултатите от последния цикъл…
              </div>
            )}
          </div>

          {/* ---------- Board ---------- */}
          <div className="v2-glass slab-board v2-reveal" style={{ "--d": "0.26s" } as React.CSSProperties}>
            <div className="slab-board-head">
              <span className="slab-live">
                <i aria-hidden /> LIVE ТАБЛО
              </span>
              <span className="v2-mono" style={{ fontSize: 11, color: "var(--v2-faint)" }}>
                <FlaskConical size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
                {filtered.length} от {strategies.length} стратегии · цикъл на оптимизация: 1.2s
              </span>
            </div>

            <div className="slab-controls">
              <div className="slab-tabs" role="tablist" aria-label="Филтър по статус">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.key}
                    className={`slab-tab${filter === f.key ? " is-active" : ""}`}
                    onClick={() => {
                      setFilter(f.key);
                      setVisible(PAGE_SIZE);
                    }}
                  >
                    {f.label}
                    <em>{filterCount(f.key)}</em>
                  </button>
                ))}
              </div>

              <div className="slab-sorts" aria-label="Сортиране">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={`slab-tab${sort === s.key ? " is-active" : ""}`}
                    onClick={() => setSort(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <label className="slab-search">
                <Search size={13} aria-hidden />
                <input
                  type="search"
                  placeholder="Търси стратегия…"
                  aria-label="Търси стратегия"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisible(PAGE_SIZE);
                  }}
                />
              </label>
            </div>

            <div className="slab-cols" aria-hidden>
              <span>#</span>
              <span>Стратегия</span>
              <span>30 дни</span>
              <span>ROI</span>
              <span>Бюджет</span>
              <span>Статус</span>
            </div>

            <div>
              {shown.map((s, idx) => {
                const band = bandOf(s.roi);
                const Icon = s.icon;
                return (
                  <div key={s.id} className="slab-row">
                    <span className="slab-rank">#{String(idx + 1).padStart(2, "0")}</span>
                    <span className="slab-name">
                      <span className="slab-ico">
                        <Icon size={15} />
                      </span>
                      <span className="slab-name-text">{s.name}</span>
                    </span>
                    <span className="slab-spark-cell">
                      <Sparkline points={s.spark} roi={s.roi} />
                    </span>
                    <span
                      className={`slab-roi ${s.roi >= 10 ? "is-up" : s.roi < -10 ? "is-down" : "is-flat"}`}
                    >
                      {s.roi >= 10 ? (
                        <ArrowUpRight size={13} />
                      ) : s.roi < -10 ? (
                        <ArrowDownRight size={13} />
                      ) : (
                        <Activity size={13} />
                      )}
                      {fmtRoi(s.roi)}
                    </span>
                    <span className="slab-budget">€{fmtInt(s.budget)}</span>
                    <span className="slab-status-cell">
                      <StatusBadge band={band} killDays={s.killDays} />
                    </span>
                  </div>
                );
              })}

              {shown.length === 0 && (
                <div className="slab-empty">
                  <SearchX size={22} />
                  Няма стратегии по този филтър.
                </div>
              )}
            </div>

            {visible < filtered.length && (
              <div className="slab-more-wrap">
                <button
                  type="button"
                  className="v2-btn"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Покажи още {Math.min(PAGE_SIZE, filtered.length - visible)}
                  <ChevronDown size={15} className="v2-arrow" />
                </button>
              </div>
            )}
          </div>

          <p className="slab-note">
            Таблото показва симулирани илюстративни данни за демонстрация на системата.
          </p>

          {/* ---------- CTA ---------- */}
          <div className="v2-card v2-glow is-always slab-cta v2-reveal">
            <span className="v2-eyebrow" style={{ justifyContent: "center" }}>
              {"// СЛЕДВАЩА СТЪПКА"}
            </span>
            <h2 className="v2-title-plain" style={{ fontSize: "clamp(1.6rem, 3.6vw, 2.6rem)" }}>
              Искаш този двигател <span className="v2-grad">за твоя бизнес?</span>
            </h2>
            <p className="v2-sub" style={{ marginInline: "auto" }}>
              Същата система от тестове, скалиране и безмилостно спиране на губещото —
              настроена за твоите продукти и твоя пазар.
            </p>
            <div className="slab-cta-btns">
              <Link href="/booking" className="v2-btn v2-btn-primary is-lg">
                <Rocket size={17} />
                Запази стратегическа сесия
              </Link>
              <Link href="/demo" className="v2-btn is-lg">
                Виж живото демо
                <ArrowUpRight size={16} className="v2-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
