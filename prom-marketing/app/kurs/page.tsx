import type { Metadata } from "next";
import Link from "next/link";
import { Check, Clock3, GraduationCap, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { CheckoutButton } from "@/components/webinar/CheckoutButton";
import { OFFERS } from "@/lib/webinar/config";

export const metadata: Metadata = {
  title: `${OFFERS.course.name} — 30-дневен курс | ProMarketing`,
  description:
    "Изгради сам своята AI система за клиенти: реклами, фуния, AI агенти и автоматични продажби — за 30 дни, с шаблоните, които използваме на клиенти.",
};

const MODULES = [
  {
    n: "Седмица 1",
    title: "Основата: оферта и фуния",
    points: [
      "Офертата, на която се казва „да” — позициониране и цена",
      "Лендинг страница с една цел (шаблонът ни, готов за копиране)",
      "Lead magnet, който събира правилните хора",
    ],
  },
  {
    n: "Седмица 2",
    title: "Реклами, които се плащат сами",
    points: [
      "Meta Ads от нулата: кампания, публики, бюджет",
      "AI креативи и текстове за минути — с нашите промптове",
      "Как да четеш числата: кога да спреш и кога да наливаш",
    ],
  },
  {
    n: "Седмица 3",
    title: "AI агентите: отговор за секунди",
    points: [
      "AI чат на сайта и в Messenger/Instagram — стъпка по стъпка",
      "Автоматична квалификация и запис на срещи",
      "Follow-up машината: ден 2, 5, 10 — до „да” или „не”",
    ],
  },
  {
    n: "Седмица 4",
    title: "Автоматични продажби и мащаб",
    points: [
      "Плащания с 1 линк (Stripe) и автоматичен онбординг",
      "CRM-ът, който се попълва сам — виждаш всичко в едно",
      "Скалиране: от първата продажба към предвидим поток",
    ],
  },
];

const INCLUDED = [
  "4 модула · 20+ видео урока на български",
  "Всички шаблони: лендинг, реклами, промптове, follow-up",
  "Живи Q&A сесии всяка седмица по време на курса",
  "Общност на участниците — въпроси и отговори всеки ден",
  "Достъп завинаги + всички бъдещи обновявания",
  "Сертификат за завършен курс",
];

export default function KursPage() {
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
              "radial-gradient(90vw 70vh at 30% 10%, rgba(34,211,238,0.14), transparent 60%), radial-gradient(80vw 60vh at 85% 80%, rgba(124,58,237,0.16), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-24 text-center md:pt-28">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-[rgba(34,211,238,0.06)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300">
            <GraduationCap className="h-3.5 w-3.5" /> 30-дневен курс · на български
          </span>
          <h1 className="mt-6 text-[clamp(32px,5vw,56px)] font-bold leading-[1.08] tracking-tight">
            {c.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">{c.tagline}</p>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] text-slate-400">
            Същата система, която внедряваме на клиенти за хиляди евро — разглобена на стъпки, с
            всички шаблони, за да я изградиш сам за 30 дни.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4">
            <CheckoutButton product="course">Запиши се · {c.priceEur} €</CheckoutButton>
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4" /> 14-дневна гаранция: не ти хареса — връщаме парите.
            </p>
          </div>
        </div>
      </section>

      {/* МОДУЛИ */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold md:text-4xl">30 дни · 4 модула · 1 работеща система</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {MODULES.map((mod) => (
            <div key={mod.n} className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-7 transition hover:border-cyan-400/35">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">{mod.n}</p>
              <h3 className="mt-2 text-lg font-bold">{mod.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {mod.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[15px] text-slate-300">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* КАКВО ВКЛЮЧВА + ЦЕНА */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-8">
            <h2 className="text-2xl font-bold">Какво получаваш</h2>
            <ul className="mt-5 space-y-3">
              {INCLUDED.map((i) => (
                <li key={i} className="flex items-start gap-3 text-[15px] text-slate-300">
                  <Sparkles className="mt-0.5 h-4.5 w-4.5 shrink-0 text-violet-300" style={{ height: 18, width: 18 }} />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-cyan-400/30 bg-[linear-gradient(160deg,rgba(34,211,238,0.1),rgba(124,58,237,0.08))] p-8 shadow-[0_0_80px_-24px_rgba(34,211,238,0.5)]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">Инвестиция</p>
              <p className="mt-3 text-5xl font-bold">
                {c.priceEur} €
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Еднократно · достъп завинаги. Участниците в уебинара получават специална цена от{" "}
                <strong className="text-cyan-300">{c.webinarPriceEur} €</strong> — обявена на живо.
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                <Clock3 className="h-4 w-4 text-cyan-300" /> Една спестена оперативна седмица покрива курса.
              </p>
            </div>
            <div className="mt-8">
              <CheckoutButton product="course">Купи курса · {c.priceEur} €</CheckoutButton>
            </div>
          </div>
        </div>
      </section>

      {/* СЛЕДВАЩО СТЪПАЛО */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-violet-400/25 bg-[rgba(124,58,237,0.08)] p-8 text-center md:p-10">
          <Zap className="mx-auto h-8 w-8 text-violet-300" />
          <h2 className="mt-4 text-2xl font-bold">Искаш да не си сам в изграждането?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-slate-300">
            „{m.name}” — {m.tagline} Купилите курса получават кредит и доплащат само разликата.
          </p>
          <Link
            href="/mentor"
            className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-violet-300/50 px-7 py-3.5 font-semibold text-violet-200 transition hover:bg-violet-400/10"
          >
            Виж програмата →
          </Link>
        </div>
        <p className="mt-10 text-center text-xs text-slate-600">
          ProMarketing · promarketing.pw · <Link href="/terms" className="underline underline-offset-2">Условия</Link>
        </p>
      </section>
    </main>
  );
}
