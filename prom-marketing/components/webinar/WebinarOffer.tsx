"use client";
/* =====================================================================
   WebinarOffer — офертната страница след уебинара (/webinar/oferta).
   Две нива: Курсът (уебинар цена) и Пълното ниво (курс + менторство
   1-на-1 с −30%). Таймер до изтичане на офертата (48ч след събитието),
   подаръците-бонуси и гаранцията. Тук водят слайдът от презентацията
   и follow-up имейлите.
   ===================================================================== */
import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Crown, GraduationCap, ShieldCheck } from "lucide-react";
import { CheckoutButton } from "@/components/webinar/CheckoutButton";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { OFFERS, WEBINAR, WEBINAR_OFFER_HOURS } from "@/lib/webinar/config";

function OfferCountdown() {
  // Крайният срок: 48ч след старта на уебинара (+ продължителността).
  const deadline = useMemo(() => {
    if (!WEBINAR.dateISO) return null;
    return new Date(WEBINAR.dateISO).getTime() + (WEBINAR.durationMinutes + WEBINAR_OFFER_HOURS * 60) * 60000;
  }, []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!deadline) return null;
  const diff = deadline - now;
  if (diff <= 0) {
    return (
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-rose-400">
        Уебинар цените са изтекли — важат стандартните цени
      </p>
    );
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/40 bg-[rgba(251,191,36,0.1)] px-5 py-2.5">
      <Clock3 className="h-4.5 w-4.5 text-amber-300" style={{ height: 18, width: 18 }} />
      <span className="font-mono text-lg font-bold tabular-nums text-amber-300">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
      <span className="text-sm text-slate-300">до изтичане на офертата</span>
    </div>
  );
}

export function WebinarOffer() {
  const c = OFFERS.course;
  const m = OFFERS.mentorship;
  const fullRegular = m.priceEur; // 2000 — котвата на пълното ниво
  const fullWebinar = m.webinarPriceEur; // 1400 (−30%)

  return (
    <main className="min-h-screen bg-[var(--color-bg-void)] px-6 py-16 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(90vw 60vh at 25% 10%, rgba(52,211,153,0.12), transparent 60%), radial-gradient(80vw 60vh at 80% 85%, rgba(251,191,36,0.09), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl">
        {/* Хедър */}
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-300">
            Само за участници в обучението
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl text-[clamp(30px,4.6vw,50px)] font-bold leading-[1.1]">
            Избери своето ниво —{" "}
            <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              на уебинар цените
            </span>
          </h1>
          <div className="mt-6">
            <OfferCountdown />
          </div>
        </div>

        {/* Двете нива */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <SectionReveal>
            <div className="flex h-full flex-col rounded-[28px] border border-cyan-400/30 bg-[rgba(7,14,16,0.85)] p-8">
              <GraduationCap className="h-9 w-9 text-cyan-300" />
              <h2 className="mt-4 text-2xl font-bold">Ниво 1 · {c.name}</h2>
              <p className="mt-2 text-[15px] text-slate-400">{c.tagline}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {[
                  "4 модула · 20+ видео урока на български",
                  "Всички шаблони: лендинг, реклами, промптове, follow-up",
                  "Живи Q&A сесии всяка седмица",
                  "Общност + достъп завинаги",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[15px] text-slate-200">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-300" /> {t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-lg text-slate-500 line-through">{c.priceEur} €</span>
                <span className="text-5xl font-bold text-cyan-300">{c.webinarPriceEur} €</span>
              </div>
              <div className="mt-5">
                <CheckoutButton product="course-webinar">Взимам курса · {c.webinarPriceEur} €</CheckoutButton>
              </div>
            </div>
          </SectionReveal>

          <SectionReveal delay={100}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] border-2 border-amber-300/50 bg-[linear-gradient(160deg,rgba(251,191,36,0.1),rgba(124,58,237,0.08))] p-8 shadow-[0_0_80px_-20px_rgba(251,191,36,0.5)]">
              <span className="absolute right-5 top-5 rounded-full bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#3d2a00]">
                −30% · най-избирано
              </span>
              <Crown className="h-9 w-9 text-amber-300" />
              <h2 className="mt-4 text-2xl font-bold">Ниво 2 · Пълното ниво</h2>
              <p className="mt-2 text-[15px] text-slate-300">
                Курсът + {m.name} — не учиш сам: изграждаме ТВОЯТА машина за клиенти заедно, до
                резултат.
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {[
                  "Всичко от Ниво 1 (курсът с всички шаблони)",
                  "16 лични 1-на-1 сесии с мен — 4 месеца",
                  "Преглед на твоите реални фунии, реклами и агенти",
                  "Директна връзка с мен между сесиите",
                  "Завършваш с работеща система, не с бележки",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[15px] text-slate-200">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-amber-300" /> {t}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-lg text-slate-500 line-through">{fullRegular} €</span>
                <span className="text-5xl font-bold text-amber-300">{fullWebinar} €</span>
                <span className="text-sm font-bold text-emerald-300">спестяваш {fullRegular - fullWebinar} €</span>
              </div>
              <div className="mt-5">
                <CheckoutButton product="mentorship-webinar">
                  Взимам пълното ниво · {fullWebinar} €
                </CheckoutButton>
              </div>
            </div>
          </SectionReveal>
        </div>

        {/* Гаранция + бонуси */}
        <SectionReveal delay={150}>
          <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-emerald-300/25 bg-[rgba(52,211,153,0.05)] p-7 text-center">
            <p className="flex items-center justify-center gap-2 text-[15px] font-semibold text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-300" /> 14-дневна гаранция „връщане на парите” — без въпроси
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Плюс бонусите от уебинара: личният AI одит, библиотеката с шаблони и наградите за
              присъствалите до края — включени и в двете нива.
            </p>
            <p className="mt-4 text-xs text-slate-600">
              Плащане със Stripe ·{" "}
              <a href="/usloviya-kursove" className="underline underline-offset-2">Условия за курсове</a> · Въпрос?
              Отговори на имейла с офертата.
            </p>
          </div>
        </SectionReveal>
      </div>
    </main>
  );
}
