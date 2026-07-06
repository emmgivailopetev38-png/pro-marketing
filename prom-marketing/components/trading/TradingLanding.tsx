"use client";
/* =====================================================================
   TradingLanding — лендинг на трейдинг фунията (/trading).
   Call-first модел: безплатна книга → телефон → личен разговор →
   менторство (4 м · 2000 €). DFY офертата НЕ се показва — тя живее
   само в разговора. Тон: инженерен, честен, с ясни рискове — това
   филтрира качествени лийдове И пази рекламния акаунт.
   ===================================================================== */
import { useState } from "react";
import {
  BookOpen,
  Bot,
  CalendarCheck,
  Check,
  ChevronDown,
  LineChart,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  TestTube2,
  Workflow,
} from "lucide-react";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { TiltCard } from "@/components/effects/TiltCard";
import { ScrollProgress } from "@/components/effects/ScrollProgress";
import { track } from "@/lib/analytics/track";
import { track as pixelTrack } from "@/lib/meta/pixel-client";
import { TRADING, TRADING_DISCLAIMER } from "@/lib/trading/config";

/* ── Формата: име + имейл + телефон (call-first) ───────────────────── */
function BookForm({ location }: { location: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    track("trading_book_submitted", { location });
    try {
      const res = await fetch("/api/trading/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, email, phone }),
      });
      if (!res.ok) throw new Error("bad status");
      pixelTrack("Lead", { params: { content_name: "trading_book" } });
      window.location.href = "/trading/blagodaria";
    } catch {
      setState("error");
    }
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-3.5 text-[15px] text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:bg-[rgba(167,139,250,0.06)]";

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={input} placeholder="Твоето име" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      <input className={input} placeholder="Имейл (там пристига книгата)" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input className={input} placeholder="Телефон (за 15-мин разговор — задължително)" type="tel" required minLength={6} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      <button
        type="submit"
        disabled={state === "sending"}
        className="tr-cta group flex w-full items-center justify-center gap-2.5 rounded-full px-7 py-4 text-base font-bold text-white disabled:opacity-60"
      >
        {state === "sending" ? "Изпращаме книгата…" : "Изпрати ми книгата безплатно"}
        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
      </button>
      {state === "error" && <p className="text-sm text-rose-400">Нещо се обърка — опитай пак след малко.</p>}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-violet-300" />
        Книгата + един кратък разговор. Без спам, без обвързване.
      </p>
    </form>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-4 text-left transition hover:border-violet-400/35"
    >
      <span className="flex items-center justify-between gap-4 text-[15px] font-semibold text-white">
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-violet-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </span>
      {open && <span className="mt-2 block text-sm leading-relaxed text-slate-400">{a}</span>}
    </button>
  );
}

const FAQS = [
  {
    q: "Гарантирате ли печалба?",
    a: "Не — и бягай от всеки, който го прави. Учим те да ИЗГРАДИШ система: стратегия с правила, бектест, демо, чак тогава изпълнение. Дали стратегията ти е печеливша, решават пазарът и тестовете — не обещанията.",
  },
  {
    q: "Трябва ли да мога да програмирам?",
    a: "Не. AI асистентите пишат кода — ти трябва да разбираш логиката на своята стратегия. Точно това е новото: агент можеше да си построи само програмист, вече може всеки дисциплиниран човек.",
  },
  {
    q: "С колко капитал трябва да разполагам?",
    a: "За обучението — с нула: всичко се строи на исторически данни и демо сметка. Реален капитал влиза чак когато системата ти е доказана на демо, и тогава започваш с малко.",
  },
  {
    q: "Какво точно е менторството?",
    a: `${TRADING.mentorship.months} месеца, 16 лични 1-на-1 сесии: минаваме заедно целия цикъл върху ТВОЯТА стратегия — правила, бектест, демо, изпълнение. Завършваш със собствен агент, който разбираш и притежаваш.`,
  },
  {
    q: "Защо първо разговор, а не направо плащане?",
    a: "Защото работим лично и местата са малко. В 15 минути преценяваме честно дали можем да ти помогнем — ако не, ти го казваме и оставаш с книгата.",
  },
];

const STEPS = [
  { icon: BookOpen, t: "1 · Книгата (днес)", b: "Пълната карта: архитектура, правила, бектест, демо, инструменти по нива." },
  { icon: PhoneCall, t: "2 · 15-мин разговор (до 24ч)", b: "Къде си, какво търгуваш, какво искаш да автоматизираш. Честна преценка — става ли за теб." },
  { icon: Workflow, t: "3 · Изграждаме агента ти", b: "4 месеца 1-на-1: стратегия → правила → бектест → демо → изпълнение. Твоят агент, твоя собственост." },
];

export function TradingLanding() {
  const m = TRADING.mentorship;
  return (
    <div className="min-h-screen bg-[var(--color-bg-void)] text-white">
      <ScrollProgress />

      {/* Топ-бар */}
      <div className="relative z-[5] border-b border-violet-400/20 bg-[rgba(14,8,28,0.95)] px-4 py-2.5 text-center backdrop-blur">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300 md:text-xs">
          📕 Безплатна книга + личен разговор · местата за менторството са ограничени
        </p>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(90vw 70vh at 20% 10%, rgba(124,58,237,0.18), transparent 55%), radial-gradient(80vw 60vh at 85% 85%, rgba(5,150,105,0.12), transparent 60%), repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 80px)",
          }}
        />
        <div className="relative z-[2] mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-violet-400/40 bg-[rgba(124,58,237,0.1)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-violet-300">
              <LineChart className="h-3.5 w-3.5" />
              Техническо обучение · не сигнали, не обещания
            </span>

            <h1 className="font-display text-[clamp(34px,5.2vw,58px)] font-bold leading-[1.07] tracking-tight" lang="bg">
              Изгради своя{" "}
              <span className="tr-gradient-text">трейдинг агент</span>
              <br />
              <span className="font-light text-slate-300">— търгувай по система, не по емоция.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-slate-300 md:text-lg">{TRADING.subtitle}</p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
              {["Без обещания за печалба", "Без чужди „сигнали”", "Без нужда да си програмист"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-black text-rose-400">✕</span>
                  {t}
                </span>
              ))}
            </div>

            <ul className="mt-7 space-y-2.5">
              {[
                "Емоцията е най-скъпият проблем на трейдъра — агентът я няма",
                "Стратегия с правила → бектест → демо → чак тогава реално",
                "AI пише кода вместо теб — ти проектираш логиката",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] text-slate-200">
                  <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-violet-400/15">
                    <Check className="h-3 w-3 text-violet-300" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Формата */}
          <div className="lg:justify-self-end">
            <TiltCard className="w-full max-w-md" maxTiltDeg={4}>
              <div
                id="kniga"
                className="relative overflow-hidden rounded-3xl border border-violet-400/30 bg-[rgba(12,8,22,0.88)] p-6 shadow-[0_0_80px_-18px_rgba(124,58,237,0.55)] backdrop-blur-xl md:p-8"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3), transparent 70%)" }}
                />
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-violet-300">Безплатната книга</p>
                <h2 className="mt-2 text-2xl font-bold leading-snug">„{TRADING.book.title}”</h2>
                <ul className="mt-4 mb-5 space-y-2">
                  {TRADING.book.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                      {b}
                    </li>
                  ))}
                </ul>
                <BookForm location="hero" />
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ЗА КОГО Е / ЗА КОГО НЕ Е — филтърът */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <SectionReveal>
            <div className="h-full rounded-3xl border border-emerald-400/25 bg-[rgba(5,150,105,0.06)] p-8">
              <h2 className="flex items-center gap-3 text-xl font-bold">
                <Check className="h-6 w-6 text-emerald-300" /> За теб е, ако…
              </h2>
              <ul className="mt-5 space-y-3 text-[15px] text-slate-300">
                <li>• Търгуваш (или сериозно учиш) и губиш от емоции и недисциплина</li>
                <li>• Имаш идеи за стратегии, но не и начин да ги тестваш като хората</li>
                <li>• Искаш система, която РАЗБИРАШ — не черна кутия с чужди обещания</li>
                <li>• Готов си да минеш през бектест и демо, преди да пипнеш реални пари</li>
              </ul>
            </div>
          </SectionReveal>
          <SectionReveal delay={100}>
            <div className="h-full rounded-3xl border border-rose-400/25 bg-[rgba(190,18,60,0.05)] p-8">
              <h2 className="flex items-center gap-3 text-xl font-bold">
                <ShieldAlert className="h-6 w-6 text-rose-300" /> НЕ е за теб, ако…
              </h2>
              <ul className="mt-5 space-y-3 text-[15px] text-slate-300">
                <li>• Търсиш „сигурни сигнали” и пари без усилие — това не съществува</li>
                <li>• Планираш да търгуваш с пари, които не можеш да загубиш</li>
                <li>• Очакваш ботът да компенсира липсата на стратегия</li>
                <li>• Не си готов да следваш процес от 4 месеца</li>
              </ul>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ПРОЦЕСЪТ */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <SectionReveal>
          <h2 className="text-center text-3xl font-bold md:text-4xl">Пътят — 3 стъпки</h2>
        </SectionReveal>
        <div className="mt-10 space-y-4">
          {STEPS.map((step, i) => (
            <SectionReveal key={step.t} delay={i * 80}>
              <div className="flex items-start gap-5 rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 transition hover:border-violet-400/30">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/35 bg-[rgba(124,58,237,0.1)]">
                  <step.icon className="h-5 w-5 text-violet-300" />
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

      {/* МЕНТОРСТВОТО */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <SectionReveal>
          <div className="relative overflow-hidden rounded-[28px] border border-violet-400/30 bg-[linear-gradient(150deg,rgba(124,58,237,0.13),rgba(5,150,105,0.06))] p-8 md:p-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-violet-300">Основната програма</p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{m.name}</h2>
            <p className="mt-2 max-w-2xl text-[15px] text-slate-300">{m.tagline}</p>
            <div className="mt-6 grid gap-6 md:grid-cols-[1.3fr_1fr]">
              <ul className="space-y-3">
                {m.includes.map((inc) => (
                  <li key={inc} className="flex items-start gap-3 text-[15px] text-slate-200">
                    <Bot className="mt-0.5 h-4.5 w-4.5 shrink-0 text-violet-300" style={{ height: 18, width: 18 }} />
                    {inc}
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-white/10 bg-[rgba(0,0,0,0.3)] p-6 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">Инвестиция</p>
                <p className="mt-2 text-4xl font-bold">{m.priceEur} €</p>
                <p className="mt-1 text-sm text-slate-400">{m.months} месеца · 16 лични сесии</p>
                <a
                  href="#kniga"
                  onClick={() => track("cta_clicked", { location: "trading_mentorship", target: "book_form" })}
                  className="tr-cta mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-bold text-white"
                >
                  Започни с книгата →
                </a>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <CalendarCheck className="h-3.5 w-3.5" /> Влиза се само след личния разговор
                </p>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ВОДЕЩИЯТ + FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <SectionReveal>
          <div className="mb-10 flex items-center gap-5 rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6">
            <TestTube2 className="h-9 w-9 shrink-0 text-violet-300" />
            <p className="text-[15px] leading-relaxed text-slate-300">
              Водещ: <strong className="text-white">{TRADING.host.name}</strong> — {TRADING.host.role}. Строим агенти
              и автоматизации всеки ден; трейдинг агентът е същото инженерство, приложено към пазара.
            </p>
          </div>
          <h2 className="text-center text-3xl font-bold">Честните въпроси</h2>
        </SectionReveal>
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <Faq key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* ФИНАЛЕН CTA + ДИСКЛЕЙМЪР */}
      <section className="mx-auto max-w-xl px-6 pb-24 pt-8 text-center">
        <SectionReveal>
          <h2 className="text-3xl font-bold leading-tight">
            Започни с книгата.
            <br />
            <span className="tr-gradient-text">Остальното е разговор.</span>
          </h2>
        </SectionReveal>
        <div className="mx-auto mt-8 max-w-md rounded-3xl border border-violet-400/30 bg-[rgba(12,8,22,0.88)] p-6 text-left shadow-[0_0_80px_-18px_rgba(124,58,237,0.55)] backdrop-blur-xl md:p-8">
          <BookForm location="final" />
        </div>
        <p className="mx-auto mt-10 max-w-lg text-xs leading-relaxed text-slate-600">⚠️ {TRADING_DISCLAIMER}</p>
        <p className="mt-4 text-xs text-slate-600">
          ProMarketing · promarketing.pw ·{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-slate-400">Поверителност</a> ·{" "}
          <a href="/usloviya-kursove" className="underline underline-offset-2 hover:text-slate-400">Условия</a>
        </p>
      </section>

      {/* Мобилен sticky CTA */}
      <a
        href="#kniga"
        onClick={() => track("cta_clicked", { location: "trading_sticky", target: "book_form" })}
        className="tr-cta fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold text-white md:hidden"
      >
        Вземи книгата безплатно →
      </a>

      <style>{`
        .tr-cta {
          background: linear-gradient(120deg, #7c3aed, #6d28d9 55%, #059669);
          background-size: 200% 100%;
          box-shadow: 0 0 44px rgba(124, 58, 237, 0.45);
          transition: box-shadow .3s, background-position .6s;
        }
        .tr-cta:hover {
          background-position: 100% 0;
          box-shadow: 0 0 70px rgba(124, 58, 237, 0.7);
        }
        .tr-gradient-text {
          background: linear-gradient(120deg, #a78bfa, #34d399);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </div>
  );
}
