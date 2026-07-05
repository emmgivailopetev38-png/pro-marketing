"use client";
/* =====================================================================
   WebinarLanding — лендинг на безплатното обучение „AI Машината за
   Клиенти”. v2: по-свежа палитра (изумрудено/тюркоаз + златни trust
   акценти върху тъмната основа), реална снимка на водещия с ефекти,
   анимирана визуализация на автоматизацията (жива фуния) и осезаем
   мокъп на подаръка. Една цел: записване във формата.

   Съдържанието (дата, теми, бонуси, подарък) идва от
   lib/webinar/config.ts — тук няма хардкоднати оферти.
   ===================================================================== */
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  FileText,
  Gift,
  Megaphone,
  MessageSquareText,
  MonitorPlay,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { ParticleField } from "@/components/effects/ParticleField";
import { HolographicText } from "@/components/effects/HolographicText";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { TiltCard } from "@/components/effects/TiltCard";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { SpotlightCursor } from "@/components/effects/SpotlightCursor";
import { track } from "@/lib/analytics/track";
import { WEBINAR, GIFT, webinarDateLabel } from "@/lib/webinar/config";

/* ── Обратно броене (рендира се само при обявена дата) ─────────────── */
function Countdown({ targetISO }: { targetISO: string }) {
  const target = useMemo(() => new Date(targetISO).getTime(), [targetISO]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const cells: Array<[number, string]> = [
    [d, "дни"],
    [h, "часа"],
    [m, "мин"],
    [s, "сек"],
  ];
  return (
    <div className="flex gap-3">
      {cells.map(([v, label]) => (
        <div
          key={label}
          className="min-w-[64px] rounded-2xl border border-emerald-300/30 bg-[rgba(7,16,18,0.75)] px-3 py-2 text-center backdrop-blur-md"
        >
          <div className="font-mono text-2xl font-bold text-emerald-300 tabular-nums">
            {String(v).padStart(2, "0")}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Формата за записване (heroto + финалът я преизползват) ────────── */
function RegisterForm({ location }: { location: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    track("webinar_register_submitted", { location });
    try {
      const res = await fetch("/api/webinar/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, email, phone }),
      });
      if (!res.ok) throw new Error("bad status");
      window.location.href = "/webinar/registriran";
    } catch {
      setState("error");
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3.5 text-[15px] text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-300/60 focus:bg-[rgba(52,211,153,0.06)]";

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className={input}
        placeholder="Твоето име"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />
      <input
        className={input}
        placeholder="Имейл (там пристига подаръкът и Zoom линкът)"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <input
        className={input}
        placeholder="Телефон (по желание — за напомняне)"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <MagneticButton className="block">
        <button
          type="submit"
          disabled={state === "sending"}
          className="wb-cta group flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-4 text-base font-bold text-[#062018] disabled:opacity-60"
        >
          {state === "sending" ? "Запазваме мястото ти…" : "Запази безплатното си място"}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </MagneticButton>
      {state === "error" && (
        <p className="text-sm text-rose-400">Нещо се обърка — опитай пак или ни пиши на сайта.</p>
      )}
      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> Без спам. Само обучението, подаръкът и напомняне.
      </p>
    </form>
  );
}

/* ── Жива визуализация: фунията на автопилот ──────────────────────── */
const FLOW_STEPS = [
  { icon: Megaphone, label: "Реклама", sub: "AI креативи", color: "#34d399" },
  { icon: Users, label: "Лийд", sub: "форма / чат", color: "#22d3ee" },
  { icon: Bot, label: "AI разговор", sub: "за 8 секунди", color: "#a78bfa" },
  { icon: FileText, label: "Оферта", sub: "до 24 часа", color: "#fbbf24" },
  { icon: CreditCard, label: "Продажба", sub: "с 1 линк", color: "#34d399" },
];

function FlowViz() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-300/20 bg-[linear-gradient(150deg,rgba(52,211,153,0.07),rgba(34,211,238,0.05)_45%,rgba(124,58,237,0.07))] p-7 md:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(52,211,153,0.25), transparent 70%)" }}
      />
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-300">
        Живата система · това изграждаме заедно
      </p>
      <h3 className="mt-2 text-xl font-bold text-white md:text-2xl">
        От реклама до пари в сметката — без ръчна работа
      </h3>

      <div className="relative mt-8">
        {/* линията с пулса */}
        <div className="absolute left-0 right-0 top-[26px] hidden h-[2px] bg-gradient-to-r from-emerald-400/50 via-cyan-400/50 to-violet-400/50 md:block">
          <span className="wb-pulse-dot" />
          <span className="wb-pulse-dot" style={{ animationDelay: "2s" }} />
        </div>
        <div className="grid gap-5 md:grid-cols-5">
          {FLOW_STEPS.map((s2, i) => (
            <div key={s2.label} className="relative flex flex-col items-center text-center">
              <div
                className="wb-node relative z-[1] flex h-[52px] w-[52px] items-center justify-center rounded-2xl border backdrop-blur-sm"
                style={{
                  borderColor: `${s2.color}55`,
                  background: `${s2.color}14`,
                  boxShadow: `0 0 24px ${s2.color}33`,
                  animationDelay: `${i * 0.35}s`,
                }}
              >
                <s2.icon className="h-6 w-6" style={{ color: s2.color }} />
              </div>
              <p className="mt-3 text-[15px] font-bold text-white">{s2.label}</p>
              <p className="text-xs text-slate-400">{s2.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-slate-300">
        <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-emerald-300" style={{ height: 18, width: 18 }} />
        Всяка стъпка я виждаш на живо на обучението — в система, която работи за реални български бизнеси.
      </p>
    </div>
  );
}

/* ── Мокъп на подаръка: осезаеми PDF страници ─────────────────────── */
function GiftViz() {
  const pages = [
    { t: "7-дневен план", lines: 6 },
    { t: "25 промпта", lines: 8 },
    { t: "Чеклист ×10", lines: 7 },
    { t: "Шаблон фуния", lines: 5 },
  ];
  return (
    <div className="relative mx-auto flex h-[280px] w-full max-w-md items-end justify-center">
      {pages.map((p, i) => (
        <div
          key={p.t}
          className="wb-page absolute bottom-2 w-[150px] rounded-xl border border-amber-200/25 bg-[linear-gradient(170deg,#fffdf5,#f4ead2)] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
          style={{
            left: `${8 + i * 21}%`,
            transform: `rotate(${(i - 1.5) * 7}deg)`,
            zIndex: i,
            animationDelay: `${i * 0.6}s`,
          }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#5b4a1e]">{p.t}</span>
          </div>
          {Array.from({ length: p.lines }).map((_, li) => (
            <div
              key={li}
              className="mb-1.5 h-1.5 rounded-full bg-[#d9c99a]"
              style={{ width: `${88 - ((li * 17) % 40)}%` }}
            />
          ))}
          <div className="mt-2 h-6 rounded-md bg-[linear-gradient(90deg,#0e7490,#0f766e)] opacity-80" />
        </div>
      ))}
      {/* стойност бадж */}
      <div className="wb-float absolute -top-1 right-2 z-10 rounded-full border border-amber-300/50 bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-4 py-2 text-sm font-black text-[#3d2a00] shadow-[0_0_40px_rgba(251,191,36,0.45)]">
        Стойност 90 € · 0 лв. за теб
      </div>
    </div>
  );
}

/* ── FAQ елемент ───────────────────────────────────────────────────── */
function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-4 text-left transition hover:border-emerald-300/35"
    >
      <span className="flex items-center justify-between gap-4 text-[15px] font-semibold text-white">
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-emerald-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </span>
      {open && <span className="mt-2 block text-sm leading-relaxed text-slate-400">{a}</span>}
    </button>
  );
}

const FAQS = [
  {
    q: "Наистина ли е безплатно?",
    a: "Да, изцяло. В края ще споделим как можем да помогнем и платено — но обучението и подаръкът носят пълна стойност сами по себе си, без да купуваш нищо.",
  },
  {
    q: "Трябват ли ми технически знания?",
    a: "Не. Всичко е показано на разбираем език, стъпка по стъпка. Ако ползваш имейл и Facebook — това е достатъчно ниво.",
  },
  {
    q: "Как ще вляза в обучението?",
    a: "В Zoom — от компютър, телефон или таблет. Линкът пристига на имейла, с който се записваш, плюс напомняне преди старта.",
  },
  {
    q: "Ще има ли запис?",
    a: "Бонусите и наградите са само за присъстващите на живо. Затова препоръчваме да си запазиш час-и-половина и да дойдеш лично.",
  },
  {
    q: "За какъв бизнес е подходящо?",
    a: "Онлайн магазини, услуги, B2B, фрийлансъри — всеки, при когото идват запитвания и има повтарящи се процеси. Примерите са от реални български бизнеси.",
  },
];

const HOST_CHIPS = [
  { icon: Users, text: "30+ бизнеса на автопилот" },
  { icon: Bot, text: "AI отговор за 8 секунди" },
  { icon: BadgeCheck, text: "Живи системи, реални числа" },
];

export function WebinarLanding() {
  const dateLabel = webinarDateLabel();
  const bonusTotal = WEBINAR.bonuses.reduce((sum, b) => sum + parseInt(b.value), 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-white">
      <ScrollProgress />
      <SpotlightCursor />

      {/* ── Топ-бар с датата (като при големите уебинари) ───────────── */}
      <div className="relative z-[5] border-b border-emerald-300/20 bg-[linear-gradient(90deg,rgba(6,24,18,0.95),rgba(8,20,24,0.95))] px-4 py-2.5 text-center backdrop-blur">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300 md:text-xs">
          {dateLabel
            ? `🔴 На живо · ${dateLabel} · пред твоя компютър, телефон или таблет`
            : "⚡ Датата се обявява всеки момент — записаните я получават първи, с подарък за 90 €"}
        </p>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="hidden sm:block">
          <AuroraBackground intensity="intense" />
        </div>
        <ParticleField className="z-[1] hidden sm:block" />
        {/* свеж изумруден воал върху аурората */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(90vw 70vh at 18% 12%, rgba(52,211,153,0.14), transparent 55%), radial-gradient(80vw 60vh at 85% 85%, rgba(251,191,36,0.07), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 sm:hidden"
          style={{
            background:
              "radial-gradient(120vw 88vh at 50% 30%, rgba(52,211,153,0.16), transparent 58%), radial-gradient(95vw 70vh at 80% 90%, rgba(34,211,238,0.16), transparent 60%), var(--color-bg-void)",
          }}
        />

        <div className="relative z-[2] mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:pt-28">
          {/* Ляво — посланието */}
          <div>
            <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-emerald-300/40 bg-[rgba(52,211,153,0.08)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              Безплатно онлайн обучение · на живо в Zoom
            </span>

            <h1 className="font-display text-[clamp(34px,5.2vw,60px)] font-bold leading-[1.06] tracking-tight" lang="bg">
              <HolographicText>{WEBINAR.title}</HolographicText>
              <br />
              <span className="text-white">— реклами, продажби и обслужване</span>{" "}
              <span className="wb-gradient-text font-light">на пълен автопилот.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-slate-300 md:text-lg">{WEBINAR.subtitle}</p>

            {/* възражения-килъри (по модела на топ уебинарите) */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              {["Без техничарски умения", "Без нает екип", "Без месеци проба-грешка"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-black text-rose-400">✕</span>
                  {t}
                </span>
              ))}
            </div>

            <ul className="mt-7 space-y-2.5">
              {WEBINAR.secrets.map((sec) => (
                <li key={sec.n} className="flex items-start gap-3 text-[15px] text-slate-200">
                  <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                    <Check className="h-3 w-3 text-emerald-300" />
                  </span>
                  <span>
                    <strong className="text-white">{sec.title}</strong>
                  </span>
                </li>
              ))}
            </ul>

            {/* Водещият — мини визитка за доверие */}
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-3.5 pr-5 backdrop-blur-sm md:max-w-md">
              <span className="wb-avatar-ring relative block h-14 w-14 shrink-0 overflow-hidden rounded-full">
                <Image
                  src="/images/ivailo/IMG_7309.jpeg"
                  alt="Ивайло Петев — водещ на обучението"
                  fill
                  sizes="56px"
                  priority
                  className="object-cover"
                />
              </span>
              <div className="text-sm">
                <p className="font-bold text-white">Води: {WEBINAR.host.name}</p>
                <p className="text-slate-400">{WEBINAR.host.role}</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                {dateLabel ?? "Датата се обявява скоро — запиши се за ранен достъп"}
              </span>
              <span className="inline-flex items-center gap-2">
                <MonitorPlay className="h-4 w-4 text-emerald-300" /> Zoom · {WEBINAR.durationMinutes} мин
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-300" /> Местата са ограничени
              </span>
            </div>

            {WEBINAR.dateISO && (
              <div className="mt-6">
                <Countdown targetISO={WEBINAR.dateISO} />
              </div>
            )}
          </div>

          {/* Дясно — формата */}
          <div className="lg:justify-self-end">
            <TiltCard className="w-full max-w-md" maxTiltDeg={4}>
              <div
                id="zapis"
                className="relative overflow-hidden rounded-3xl border border-emerald-300/30 bg-[rgba(6,14,15,0.85)] p-6 shadow-[0_0_80px_-18px_rgba(52,211,153,0.5)] backdrop-blur-xl md:p-8"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(52,211,153,0.25), transparent 70%)" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-16 -bottom-16 h-40 w-40 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(251,191,36,0.14), transparent 70%)" }}
                />
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-emerald-300">
                  Запази мястото си
                </p>
                <h2 className="mt-2 text-2xl font-bold leading-snug">
                  Влез безплатно + вземи{" "}
                  <span className="wb-gold-text">подарък за 90 €</span> веднага
                </h2>
                <p className="mt-2 mb-5 text-sm text-slate-400">
                  „{GIFT.title}” пристига на имейла ти секунди след записването — още преди обучението.
                </p>
                <RegisterForm location="hero" />
              </div>
            </TiltCard>

            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-500 lg:max-w-md">
              <span className="flex text-amber-300">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </span>
              30+ български бизнеса работят с нашите AI системи
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-[3] h-24"
          style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg-void))" }}
        />
      </section>

      {/* ── КАКВО ЩЕ НАУЧИШ ─────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-20">
        <SectionReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-300">На живо · стъпка по стъпка</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
            4-те системи, които показваме <HolographicText>отвътре</HolographicText>
          </h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Не теория от презентации — живи системи, които в момента работят за реални български бизнеси.
          </p>
        </SectionReveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {WEBINAR.secrets.map((sec, i) => (
            <SectionReveal key={sec.n} delay={i * 90}>
              <TiltCard className="h-full">
                <div className="group h-full rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-7 transition hover:border-emerald-300/40 hover:bg-[rgba(52,211,153,0.04)]">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-emerald-300/90">{sec.n}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-emerald-300/40 to-transparent" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{sec.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-slate-400">{sec.body}</p>
                </div>
              </TiltCard>
            </SectionReveal>
          ))}
        </div>

        {/* Живата фуния */}
        <SectionReveal delay={120}>
          <div className="mt-10">
            <FlowViz />
          </div>
        </SectionReveal>
      </section>

      {/* ── ПОДАРЪКЪТ ────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-14">
        <SectionReveal>
          <div className="relative overflow-hidden rounded-[28px] border border-amber-300/25 bg-[linear-gradient(135deg,rgba(251,191,36,0.09),rgba(52,211,153,0.06)_60%,rgba(34,211,238,0.05))] p-8 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(251,191,36,0.22), transparent 70%)" }}
            />
            <div className="relative grid items-center gap-10 md:grid-cols-2">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-[rgba(251,191,36,0.12)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-amber-300">
                  <Gift className="h-3.5 w-3.5" /> Подарък веднага след записване
                </p>
                <h2 className="mt-4 text-2xl font-bold md:text-3xl">
                  „{GIFT.title}” — <span className="wb-gold-text">още преди обучението</span>
                </h2>
                <ul className="mt-5 space-y-3">
                  {GIFT.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[15px] text-slate-200">
                      <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-slate-400">
                  Реални инструменти, с които започваш още днес — не брошура.
                </p>
              </div>
              <GiftViz />
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ── БОНУСИ ЗА КРАЯ ───────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-14">
        <SectionReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-300">Само за оставащите до края</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Бонуси за <span className="wb-gold-text">{bonusTotal}+ €</span> — раздават се на живо
          </h2>
        </SectionReveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {WEBINAR.bonuses.map((b, i) => (
            <SectionReveal key={b.title} delay={i * 90}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 transition hover:border-amber-300/45">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(251,191,36,0.2), transparent 70%)" }}
                />
                <p className="inline-block rounded-full bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-3 py-1 font-mono text-sm font-black text-[#3d2a00]">
                  {b.value}
                </p>
                <p className="mt-3 text-[15px] font-semibold leading-snug text-white">{b.title}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ── ВОДЕЩИЯТ ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <SectionReveal>
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.02)] p-8 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(60vw 40vh at 85% 15%, rgba(52,211,153,0.08), transparent 60%)",
              }}
            />
            <div className="relative grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
              {/* Снимката с ефекти */}
              <div className="relative mx-auto w-full max-w-[380px]">
                <div className="wb-photo-ring relative overflow-hidden rounded-[24px]">
                  <Image
                    src="/images/ivailo/IMG_7309.jpeg"
                    alt="Ивайло Петев · основател на ProMarketing и водещ на обучението"
                    width={760}
                    height={950}
                    sizes="(min-width: 768px) 380px, 90vw"
                    loading="eager"
                    className="block h-auto w-full object-cover"
                    style={{ aspectRatio: "4/5" }}
                  />
                  {/* тониращ воал за връзка с палитрата */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(3,8,8,0.55), transparent 45%), linear-gradient(120deg, rgba(52,211,153,0.10), transparent 50%)",
                    }}
                  />
                </div>
                {/* плаващи чипове за доверие */}
                <div className="wb-float absolute -left-3 top-6 hidden rounded-full border border-emerald-300/40 bg-[rgba(6,20,16,0.9)] px-3.5 py-2 text-xs font-semibold text-emerald-200 backdrop-blur md:block">
                  ✓ 30+ бизнеса на автопилот
                </div>
                <div
                  className="wb-float absolute -right-3 bottom-16 hidden rounded-full border border-amber-300/40 bg-[rgba(24,16,2,0.9)] px-3.5 py-2 text-xs font-semibold text-amber-200 backdrop-blur md:block"
                  style={{ animationDelay: "1.4s" }}
                >
                  ⚡ AI отговор за 8 секунди
                </div>
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-300">Твоят водещ</p>
                <h2 className="mt-2 text-3xl font-bold">{WEBINAR.host.name}</h2>
                <p className="mt-1.5 text-[15px] text-slate-400">{WEBINAR.host.role}</p>
                <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-300">
                  <p>
                    Изграждам AI системи, които <strong className="text-white">в момента продават и обслужват</strong>{" "}
                    за 30+ български бизнеса — онлайн магазини, услуги, B2B. Не преподавам чужди слайдове: показвам
                    собствените ни работещи системи, с реални числа.
                  </p>
                  <p>
                    На обучението ще видиш на живо и нашето{" "}
                    <a
                      href="/demo"
                      className="font-semibold text-emerald-300 underline decoration-emerald-300/40 underline-offset-4 hover:decoration-emerald-300"
                    >
                      интерактивно демо
                    </a>{" "}
                    — AI командният център, който даваме на клиентите си.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {HOST_CHIPS.map((chip) => (
                    <span
                      key={chip.text}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] px-3.5 py-2 text-sm text-slate-200"
                    >
                      <chip.icon className="h-4 w-4 text-emerald-300" />
                      {chip.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ── КАК ПРОТИЧА ──────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-4xl px-6 py-14">
        <SectionReveal>
          <h2 className="text-center text-3xl font-bold md:text-4xl">Как протича</h2>
        </SectionReveal>
        <div className="mt-10 space-y-4">
          {[
            { icon: Rocket, t: "1 · Записваш се (30 секунди)", b: "Име и имейл. Подаръкът „AI Стартов Пакет” пристига веднага." },
            { icon: CalendarDays, t: "2 · Получаваш Zoom линка и напомняне", b: dateLabel ? `Обучението е ${dateLabel}. Линкът и напомняне идват по имейл.` : "Щом датата се обяви, я получаваш първи — със Zoom линка и напомняне." },
            { icon: MessageSquareText, t: `3 · ${WEBINAR.durationMinutes} минути на живо`, b: "4-те системи отвътре + отговори на твоите въпроси в реално време." },
            { icon: Gift, t: "4 · Бонусите в края", b: `Награди за ${bonusTotal}+ € само за присъстващите до края — включително безплатен AI одит на твоя бизнес.` },
          ].map((step, i) => (
            <SectionReveal key={step.t} delay={i * 80}>
              <div className="flex items-start gap-5 rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 transition hover:border-emerald-300/30">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/35 bg-[rgba(52,211,153,0.09)]">
                  <step.icon className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{step.t}</h3>
                  <p className="mt-1 text-[15px] text-slate-400">{step.b}</p>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-3xl px-6 py-14">
        <SectionReveal>
          <h2 className="text-center text-3xl font-bold">Чести въпроси</h2>
        </SectionReveal>
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <Faq key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* ── ФИНАЛЕН CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="hidden sm:block">
          <AuroraBackground intensity="normal" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(70vw 50vh at 50% 60%, rgba(52,211,153,0.10), transparent 60%)",
          }}
        />
        <div className="relative z-[2] mx-auto max-w-xl text-center">
          <SectionReveal>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl">
              Мястото ти чака.
              <br />
              <HolographicText>Подаръкът — също.</HolographicText>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-slate-400">
              {dateLabel
                ? `На живо ${dateLabel} в Zoom. Безплатно.`
                : "Запиши се сега — датата се обявява скоро и ще я получиш първи."}
            </p>
          </SectionReveal>
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-emerald-300/30 bg-[rgba(6,14,15,0.85)] p-6 text-left shadow-[0_0_80px_-18px_rgba(52,211,153,0.5)] backdrop-blur-xl md:p-8">
            <RegisterForm location="final" />
          </div>
          <p className="mt-8 text-xs text-slate-600">
            ProMarketing · promarketing.pw ·{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-slate-400">Поверителност</a>
          </p>
        </div>
      </section>

      {/* ── Мобилен sticky CTA ──────────────────────────────────────── */}
      <a
        href="#zapis"
        onClick={() => track("cta_clicked", { location: "webinar_sticky", target: "register" })}
        className="wb-cta fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold text-[#062018] md:hidden"
      >
        Запази безплатното си място →
      </a>

      {/* ── Стилове на страницата (свежата палитра + анимации) ──────── */}
      <style>{`
        .wb-cta {
          background: linear-gradient(120deg, #34d399, #22d3ee 55%, #34d399);
          background-size: 200% 100%;
          box-shadow: 0 0 44px rgba(52, 211, 153, 0.45);
          transition: box-shadow .3s, background-position .6s;
        }
        .wb-cta:hover {
          background-position: 100% 0;
          box-shadow: 0 0 70px rgba(52, 211, 153, 0.7);
        }
        .wb-gradient-text {
          background: linear-gradient(120deg, #6ee7b7, #22d3ee);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .wb-gold-text {
          background: linear-gradient(120deg, #fde68a, #f59e0b);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .wb-avatar-ring::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid rgba(52, 211, 153, 0.7);
          box-shadow: 0 0 18px rgba(52, 211, 153, 0.45);
        }
        .wb-photo-ring {
          border: 1px solid rgba(52, 211, 153, 0.35);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px -18px rgba(52, 211, 153, 0.35);
        }
        .wb-node { animation: wbBreath 3.2s ease-in-out infinite; }
        @keyframes wbBreath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .wb-pulse-dot {
          position: absolute;
          top: -4px;
          left: 0;
          height: 10px;
          width: 10px;
          border-radius: 9999px;
          background: #6ee7b7;
          box-shadow: 0 0 16px rgba(110, 231, 183, 0.9);
          animation: wbTravel 4s linear infinite;
        }
        @keyframes wbTravel {
          0% { left: 0%; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .wb-float { animation: wbFloat 4.5s ease-in-out infinite; }
        @keyframes wbFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .wb-page { animation: wbPage 5s ease-in-out infinite; }
        @keyframes wbPage {
          0%, 100% { bottom: 8px; }
          50% { bottom: 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wb-node, .wb-pulse-dot, .wb-float, .wb-page { animation: none; }
        }
      `}</style>
    </div>
  );
}
