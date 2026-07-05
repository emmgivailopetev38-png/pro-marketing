"use client";
/* =====================================================================
   WebinarLanding — лендинг на безплатното обучение „AI Машината за
   Клиенти”. Строен в "2050 / Luminescent Depth" езика на сайта, с
   пълния арсенал ефекти (Aurora, Particles, Holographic, Tilt,
   Magnetic, Reveal). Една цел на страницата: записване във формата.

   Съдържанието (дата, теми, бонуси, подарък) идва от
   lib/webinar/config.ts — тук няма хардкоднати оферти.
   ===================================================================== */
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Gift,
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
          className="min-w-[64px] rounded-2xl border border-cyan-400/25 bg-[rgba(7,10,22,0.7)] px-3 py-2 text-center backdrop-blur-md"
        >
          <div className="font-mono text-2xl font-bold text-cyan-300 tabular-nums">
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
    "w-full rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-[15px] text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:bg-[rgba(34,211,238,0.05)]";

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
          className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--color-accent-cyan)] px-7 py-4 text-base font-bold text-[var(--color-bg-void)] shadow-[0_0_44px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_70px_rgba(34,211,238,0.65)] disabled:opacity-60"
        >
          {state === "sending" ? "Запазваме мястото ти…" : "Запази безплатното си място"}
          <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </MagneticButton>
      {state === "error" && (
        <p className="text-sm text-rose-400">Нещо се обърка — опитай пак или ни пиши на сайта.</p>
      )}
      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" /> Без спам. Само обучението, подаръкът и напомняне.
      </p>
    </form>
  );
}

/* ── FAQ елемент ───────────────────────────────────────────────────── */
function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-4 text-left transition hover:border-cyan-400/30"
    >
      <span className="flex items-center justify-between gap-4 text-[15px] font-semibold text-white">
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-cyan-300 transition-transform ${open ? "rotate-180" : ""}`} />
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

export function WebinarLanding() {
  const dateLabel = webinarDateLabel();
  const bonusTotal = WEBINAR.bonuses.reduce((sum, b) => sum + parseInt(b.value), 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-white">
      <ScrollProgress />
      <SpotlightCursor />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="hidden sm:block">
          <AuroraBackground intensity="intense" />
        </div>
        <ParticleField className="z-[1] hidden sm:block" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 sm:hidden"
          style={{
            background:
              "radial-gradient(120vw 88vh at 50% 30%, rgba(34,211,238,0.18), transparent 58%), radial-gradient(95vw 70vh at 80% 90%, rgba(124,58,237,0.2), transparent 60%), var(--color-bg-void)",
          }}
        />

        <div className="relative z-[2] mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:pt-28">
          {/* Ляво — посланието */}
          <div>
            <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-[rgba(34,211,238,0.06)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
              Безплатно онлайн обучение · на живо в Zoom
            </span>

            <h1 className="font-display text-[clamp(34px,5.2vw,60px)] font-bold leading-[1.06] tracking-tight" lang="bg">
              <HolographicText>{WEBINAR.title}</HolographicText>
              <br />
              <span className="text-white">— реклами, продажби и обслужване</span>{" "}
              <span className="font-light text-slate-300">на пълен автопилот.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-slate-300 md:text-lg">{WEBINAR.subtitle}</p>

            <ul className="mt-7 space-y-2.5">
              {WEBINAR.secrets.map((sec) => (
                <li key={sec.n} className="flex items-start gap-3 text-[15px] text-slate-200">
                  <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-cyan-300" style={{ height: 18, width: 18 }} />
                  <span>
                    <strong className="text-white">{sec.title}</strong>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-cyan-300" />
                {dateLabel ?? "Датата се обявява скоро — запиши се за ранен достъп"}
              </span>
              <span className="inline-flex items-center gap-2">
                <MonitorPlay className="h-4 w-4 text-cyan-300" /> Zoom · {WEBINAR.durationMinutes} мин
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-300" /> Местата са ограничени
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
                className="relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-[rgba(7,10,22,0.82)] p-6 shadow-[0_0_80px_-20px_rgba(34,211,238,0.45)] backdrop-blur-xl md:p-8"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(34,211,238,0.22), transparent 70%)" }}
                />
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300">
                  Запази мястото си
                </p>
                <h2 className="mt-2 text-2xl font-bold leading-snug">
                  Влез безплатно + вземи <span className="text-cyan-300">подарък за 90 €</span> веднага
                </h2>
                <p className="mt-2 mb-5 text-sm text-slate-400">
                  „{GIFT.title}” пристига на имейла ти секунди след записването — още преди обучението.
                </p>
                <RegisterForm location="hero" />
              </div>
            </TiltCard>

            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-500 lg:max-w-md">
              <span className="flex text-cyan-300">
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
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300">На живо · стъпка по стъпка</p>
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
                <div className="group h-full rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-7 transition hover:border-cyan-400/35">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-cyan-300/80">{sec.n}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/40 to-transparent" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{sec.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-slate-400">{sec.body}</p>
                </div>
              </TiltCard>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ── ПОДАРЪКЪТ ────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-14">
        <SectionReveal>
          <div className="relative overflow-hidden rounded-[28px] border border-violet-400/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.14),rgba(34,211,238,0.07))] p-8 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3), transparent 70%)" }}
            />
            <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-300/30 bg-[rgba(124,58,237,0.18)] shadow-[0_0_50px_rgba(124,58,237,0.35)]">
                <Gift className="h-9 w-9 text-violet-200" />
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-violet-300">
                  Подарък веднага след записване · стойност 90 €
                </p>
                <h2 className="mt-2 text-2xl font-bold md:text-3xl">„{GIFT.title}” — още преди обучението</h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {GIFT.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[15px] text-slate-300">
                      <Sparkles className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ── БОНУСИ ЗА КРАЯ ───────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-14">
        <SectionReveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300">Само за оставащите до края</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Бонуси за <span className="text-cyan-300">{bonusTotal}+ €</span> — на живо
          </h2>
        </SectionReveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {WEBINAR.bonuses.map((b, i) => (
            <SectionReveal key={b.title} delay={i * 90}>
              <div className="h-full rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 transition hover:border-cyan-400/35">
                <p className="font-mono text-sm font-bold text-cyan-300">{b.value}</p>
                <p className="mt-2 text-[15px] font-semibold leading-snug text-white">{b.title}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ── ВОДЕЩИЯТ ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-16">
        <SectionReveal>
          <div className="grid items-center gap-10 rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.02)] p-8 md:grid-cols-[1fr_1.4fr] md:p-12">
            <div>
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-cyan-400/40 bg-[rgba(34,211,238,0.08)] font-display text-3xl font-bold text-cyan-300 shadow-[0_0_60px_rgba(34,211,238,0.3)]">
                ИП
              </div>
              <h2 className="mt-5 text-2xl font-bold">{WEBINAR.host.name}</h2>
              <p className="mt-1.5 text-[15px] text-slate-400">{WEBINAR.host.role}</p>
            </div>
            <div className="space-y-4 text-[15px] leading-relaxed text-slate-300">
              <p>
                Изграждам AI системи, които <strong className="text-white">в момента продават и обслужват</strong> за
                30+ български бизнеса — онлайн магазини, услуги, B2B. Не преподавам чужди слайдове: показвам
                собствените ни работещи системи, с реални числа.
              </p>
              <p>
                На обучението ще видиш на живо и нашето{" "}
                <a href="/demo" className="font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-4 hover:decoration-cyan-300">
                  интерактивно демо
                </a>{" "}
                — AI командният център, който даваме на клиентите си.
              </p>
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
            { icon: MonitorPlay, t: `3 · ${WEBINAR.durationMinutes} минути на живо`, b: "4-те системи отвътре + отговори на твоите въпроси в реално време." },
            { icon: Gift, t: "4 · Бонусите в края", b: `Награди за ${bonusTotal}+ € само за присъстващите до края — включително безплатен AI одит на твоя бизнес.` },
          ].map((step, i) => (
            <SectionReveal key={step.t} delay={i * 80}>
              <div className="flex items-start gap-5 rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-[rgba(34,211,238,0.08)]">
                  <step.icon className="h-5 w-5 text-cyan-300" />
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
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-cyan-400/25 bg-[rgba(7,10,22,0.82)] p-6 text-left shadow-[0_0_80px_-20px_rgba(34,211,238,0.45)] backdrop-blur-xl md:p-8">
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
        className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-6 py-3.5 text-[15px] font-bold text-[var(--color-bg-void)] shadow-[0_8px_40px_rgba(34,211,238,0.5)] md:hidden"
      >
        Запази безплатното си място →
      </a>
    </div>
  );
}
