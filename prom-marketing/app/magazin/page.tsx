import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  Calendar,
  GraduationCap,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { CheckoutButton } from "@/components/webinar/CheckoutButton";
import { OFFERS } from "@/lib/webinar/config";

export const metadata: Metadata = {
  title: "Магазин — курсове, менторства и AI системи | ProMarketing",
  description:
    "Всичко на едно място: курс „AI Продажбена Машина” (500 €), менторски програми (2000 €), AI CRM системи и автоматизации за твоя бизнес. Директна покупка или разговор.",
};

/**
 * /magazin — директният магазин на ProMarketing.
 * Две секции: (1) продукти с мигновена покупка през Stripe;
 * (2) услуги/системи с фиксирани цени, които тръгват от разговор.
 * Цените идват от lib/webinar/config.ts и офертата на /plan.
 */

const SERVICES = [
  {
    icon: Bot,
    name: "AI CRM · Фаза 1 „Основата”",
    price: "2 200 €",
    desc: "CRM ядро + контакти + AI лийд капта от сайта и Meta — системата, върху която стъпва всичко.",
  },
  {
    icon: Rocket,
    name: "AI CRM · Фаза 2 „Автопилотът”",
    price: "2 900 €",
    desc: "AI агенти за чат и имейл, автоматичен follow-up, оферти и напомняния — продажбите тръгват сами.",
  },
  {
    icon: Sparkles,
    name: "AI CRM · Фаза 3 „Мащабът”",
    price: "3 600 €",
    desc: "Реклами + аналитика + AI отчети и оптимизация — пълният команден център.",
  },
  {
    icon: Wrench,
    name: "Цялата система от край до край",
    price: "7 400 €",
    desc: "И трите фази заедно (спестяваш 1 300 €) — от първия лийд до автоматичната продажба.",
  },
];

export default function MagazinPage() {
  const c = OFFERS.course;
  const m = OFFERS.mentorship;

  return (
    <main className="min-h-screen bg-[var(--color-bg-void)] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(90vw 60vh at 25% 10%, rgba(34,211,238,0.13), transparent 60%), radial-gradient(80vw 60vh at 85% 80%, rgba(124,58,237,0.14), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-24 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-[rgba(34,211,238,0.06)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300">
            Магазин · директни покупки и системи
          </span>
          <h1 className="mt-6 text-[clamp(32px,5vw,54px)] font-bold leading-[1.08] tracking-tight">
            Избери как да пораснеш:
            <br />
            <span className="text-cyan-300">курс, ментор или готова система.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] text-slate-400">
            Учиш се сам с курс, работиш 1-на-1 с ментор — или ние изграждаме системата вместо теб.
            Всички цени са крайни, плащане със Stripe, 14-дневна гаранция за курсовете.
          </p>
        </div>
      </section>

      {/* ── ДИРЕКТНИ ПОКУПКИ ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-300">
          ① Купи директно — започваш веднага
        </h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Курсът */}
          <div className="flex flex-col rounded-3xl border border-cyan-400/30 bg-[linear-gradient(160deg,rgba(34,211,238,0.09),rgba(124,58,237,0.05))] p-7">
            <GraduationCap className="h-8 w-8 text-cyan-300" />
            <h3 className="mt-4 text-xl font-bold">{c.name}</h3>
            <p className="mt-2 flex-1 text-[15px] text-slate-300">
              30-дневен курс: оферта, фуния, реклами, AI агенти и автоматични продажби — с всички
              наши шаблони. Учиш се сам, с живи Q&A сесии всяка седмица.
            </p>
            <p className="mt-5 text-4xl font-bold">{c.priceEur} €</p>
            <p className="mb-5 mt-1 text-xs text-slate-500">
              Еднократно · достъп завинаги · 14-дневна гаранция
            </p>
            <CheckoutButton product="course">Купи курса →</CheckoutButton>
          </div>

          {/* AI Менторство */}
          <div className="flex flex-col rounded-3xl border border-violet-400/30 bg-[linear-gradient(160deg,rgba(124,58,237,0.1),rgba(34,211,238,0.04))] p-7">
            <Sparkles className="h-8 w-8 text-violet-300" />
            <h3 className="mt-4 text-xl font-bold">{m.name}</h3>
            <p className="mt-2 flex-1 text-[15px] text-slate-300">
              {m.tagline} 16 лични сесии — изграждаме твоята AI система за клиенти заедно, до
              резултат.
            </p>
            <p className="mt-5 text-4xl font-bold">{m.priceEur} €</p>
            <p className="mb-5 mt-1 text-xs text-slate-500">
              4 месеца · 1-на-1 · купилите курса доплащат {m.upgradePriceEur} €
            </p>
            <CheckoutButton product="mentorship">Запази мястото си →</CheckoutButton>
          </div>

          {/* Трейдинг менторство */}
          <div className="flex flex-col rounded-3xl border border-emerald-400/30 bg-[linear-gradient(160deg,rgba(5,150,105,0.1),rgba(124,58,237,0.05))] p-7">
            <LineChart className="h-8 w-8 text-emerald-300" />
            <h3 className="mt-4 text-xl font-bold">Трейдинг Агент · Менторство 1-на-1</h3>
            <p className="mt-2 flex-1 text-[15px] text-slate-300">
              4 месеца, 16 лични сесии: твоята стратегия → правила → бектест → демо → собствен
              трейдинг агент, който разбираш и притежаваш.{" "}
              <Link href="/trading" className="text-emerald-300 underline underline-offset-2">
                Първо вземи безплатната книга
              </Link>
              .
            </p>
            <p className="mt-5 text-4xl font-bold">2 000 €</p>
            <p className="mb-5 mt-1 text-xs text-slate-500">
              4 месеца · 1-на-1 · техническо обучение, не финансов съвет
            </p>
            <CheckoutButton product="trading-mentorship">Запази мястото си →</CheckoutButton>
          </div>
        </div>
      </section>

      {/* ── СИСТЕМИ (изграждаме ние) ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-violet-300">
          ② Изграждаме вместо теб — AI CRM системи
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Готовите системи започват с 15-минутен разговор — така офертата пасва на бизнеса ти
          (пълните детайли са на{" "}
          <Link href="/plan" className="text-cyan-300 underline underline-offset-2">
            /plan
          </Link>
          ).
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div
              key={s.name}
              className="flex items-start gap-5 rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 transition hover:border-violet-400/35"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/30 bg-[rgba(124,58,237,0.1)]">
                <s.icon className="h-5.5 w-5.5 text-violet-300" style={{ height: 22, width: 22 }} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold text-white">{s.name}</h3>
                  <span className="font-mono text-lg font-bold text-violet-300">{s.price}</span>
                </div>
                <p className="mt-1.5 text-sm text-slate-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-accent-cyan)] px-8 py-4 font-bold text-[var(--color-bg-void)] shadow-[0_0_44px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_70px_rgba(34,211,238,0.65)]"
          >
            <Calendar className="h-5 w-5" /> Запази 15-мин разговор за система
          </Link>
          <Link
            href="/webinar"
            className="inline-flex items-center gap-2 rounded-full border-2 border-cyan-400/50 px-7 py-3.5 font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
          >
            Или ела на безплатното обучение →
          </Link>
        </div>
      </section>

      {/* Доверие + условия */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-6 text-center">
        <p className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-300" style={{ height: 18, width: 18 }} />
          Плащане със Stripe · 14-дневна гаранция за курсовете · фактура за всяка покупка
        </p>
        <p className="mt-4 text-xs text-slate-600">
          <Link href="/usloviya-kursove" className="underline underline-offset-2">Условия за курсове</Link> ·{" "}
          <Link href="/terms" className="underline underline-offset-2">Общи условия</Link> ·{" "}
          <Link href="/privacy" className="underline underline-offset-2">Поверителност</Link>
        </p>
      </section>
    </main>
  );
}
