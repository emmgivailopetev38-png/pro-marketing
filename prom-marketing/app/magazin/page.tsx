import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  Calendar,
  GraduationCap,
  Headphones,
  LineChart,
  Megaphone,
  MonitorPlay,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { CheckoutButton } from "@/components/webinar/CheckoutButton";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { AgentChatViz, DashboardViz, LevelsViz } from "@/components/store/StoreViz";
import { OrderDialog } from "@/components/store/OrderDialog";
import { OFFERS } from "@/lib/webinar/config";

export const metadata: Metadata = {
  title: "Магазин — обучения, AI агенти и системи | ProMarketing",
  description:
    "Директният магазин на ProMarketing: курсове и менторства (директна покупка), AI чат и гласови агенти, CRM системи на нива, уебсайт + CRM + реклами пакети и абонаментна поддръжка.",
};

/**
 * /magazin — директният магазин на ProMarketing.
 * 4 категории: Обучения (директна покупка през Stripe) · AI Агенти ·
 * Системи на нива (CRM достъпи) · Пакети по бизнес (с живи демота).
 * Цените с котва идват от /plan; ориентировъчните са маркирани изрично.
 */

const LEVELS = [
  {
    icon: Bot,
    lvl: "Ниво 1",
    name: "CRM Основата",
    price: "2 200 €",
    desc: "CRM ядро, контакти, AI лийд капта от сайта и Meta. Достъпът, с който всичко започва.",
    color: "cyan",
  },
  {
    icon: Rocket,
    lvl: "Ниво 2",
    name: "CRM + AI Автопилот",
    price: "2 900 €",
    desc: "AI агенти за чат и имейл, автоматичен follow-up, оферти, напомняния — продажбите тръгват сами.",
    color: "violet",
  },
  {
    icon: Megaphone,
    lvl: "Ниво 3",
    name: "CRM + Реклами и Мащаб",
    price: "3 600 €",
    desc: "Управление на реклами, аналитика, AI отчети и оптимизация — пълният команден център.",
    color: "amber",
  },
  {
    icon: Wrench,
    lvl: "Всичко",
    name: "Уебсайт + CRM + Реклами + Цялата автоматизация",
    price: "7 400 €",
    desc: "Трите нива заедно + уебсайтът — от първата реклама до автоматичната продажба. Спестяваш 1 300 €.",
    color: "emerald",
    featured: true,
  },
];

const AGENTS = [
  {
    icon: Bot,
    name: "AI Чат Агент",
    price: "от 490 €",
    approx: true,
    desc: "Отговаря на клиентите ти в сайта, Messenger и Instagram за секунди — 24/7, на естествен български. Внедряване до 7 дни.",
  },
  {
    icon: Headphones,
    name: "AI Гласов Агент",
    price: "от 990 €",
    approx: true,
    desc: "Поема обаждания и гласови съобщения: отговаря, записва часове, потвърждава поръчки и звъни за напомняния — с човешки глас.",
  },
  {
    icon: LineChart,
    name: "Трейдинг Агент · обучение 1-на-1",
    price: "2 000 €",
    buy: "trading-mentorship" as const,
    desc: "4 месеца, 16 лични сесии: стратегия, правила, бектест, демо — собствен агент, който разбираш и притежаваш.",
  },
];

const VERTICALS = [
  {
    icon: Star,
    name: "За инфлуенсъри и лични марки",
    demo: "/demo/influencer",
    desc: "Фуния за продажба на курсове, консултации и мърч + AI отговори на съобщенията + съдържание на автопилот.",
  },
  {
    icon: ShoppingBag,
    name: "За онлайн магазини",
    demo: "/demo/shop",
    desc: "Реклами + изоставени колички + AI обслужване + CRM — машината за поръчки на магазина ти.",
  },
  {
    icon: Users,
    name: "За B2B и услуги",
    demo: "/demo/b2b",
    desc: "Лийдове от реклами и сайта → AI квалификация → оферти → follow-up до затваряне. Нищо не се губи.",
  },
];

const SUPPORT = [
  { name: "Поддръжка S", price: "149 €/мес", desc: "Мониторинг, дребни корекции, месечен отчет." },
  { name: "Поддръжка M", price: "199 €/мес", desc: "S + нови автоматизации всеки месец + приоритет." },
  { name: "Поддръжка L", price: "299 €/мес", desc: "M + управление на рекламите + тримесечна стратегия." },
];

const COLOR_MAP: Record<string, { border: string; text: string; bg: string }> = {
  cyan: { border: "border-cyan-400/35", text: "text-cyan-300", bg: "rgba(34,211,238,0.08)" },
  violet: { border: "border-violet-400/35", text: "text-violet-300", bg: "rgba(124,58,237,0.09)" },
  amber: { border: "border-amber-400/35", text: "text-amber-300", bg: "rgba(251,191,36,0.08)" },
  emerald: { border: "border-emerald-400/40", text: "text-emerald-300", bg: "rgba(52,211,153,0.09)" },
};

function CategoryHead({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <SectionReveal>
      <div className="mb-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300">{n}</p>
        <h2 className="mt-2 text-2xl font-bold md:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{sub}</p>
      </div>
    </SectionReveal>
  );
}

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
              "radial-gradient(90vw 60vh at 20% 10%, rgba(34,211,238,0.13), transparent 60%), radial-gradient(80vw 60vh at 85% 75%, rgba(124,58,237,0.15), transparent 60%), radial-gradient(60vw 40vh at 50% 100%, rgba(52,211,153,0.07), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-14 pt-24 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-[rgba(34,211,238,0.06)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300">
            <ShoppingBag className="h-3.5 w-3.5" /> Магазинът на ProMarketing
          </span>
          <h1 className="mt-6 text-[clamp(32px,5vw,54px)] font-bold leading-[1.08] tracking-tight">
            Агенти, обучения и системи —
            <br />
            <span className="text-cyan-300">избери своето ниво.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] text-slate-400">
            Учиш се сам, работиш с ментор — или ние строим вместо теб. Директна покупка със
            Stripe за обученията; системите тръгват от 15-минутен разговор.
          </p>
        </div>
      </section>

      {/* ① ОБУЧЕНИЯ */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <CategoryHead
          n="① Обучения · директна покупка"
          title="Научи се да строиш агенти и системи"
          sub="Започваш веднага след плащане. 14-дневна гаранция „връщане на парите” за курсовете."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionReveal>
            <div className="flex h-full flex-col rounded-3xl border border-emerald-400/30 bg-[rgba(52,211,153,0.06)] p-7">
              <MonitorPlay className="h-8 w-8 text-emerald-300" />
              <h3 className="mt-4 text-xl font-bold">Безплатно обучение · 23 юли</h3>
              <p className="mt-2 flex-1 text-[15px] text-slate-300">
                „AI Машината за Клиенти” — 90 минути на живо в Zoom: 4-те системи отвътре + 2
                подаръка при записване (стойност 140+ €).
              </p>
              <p className="mt-5 text-4xl font-bold text-emerald-300">0 €</p>
              <p className="mb-5 mt-1 text-xs text-slate-500">На живо · местата са ограничени</p>
              <Link
                href="/webinar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-7 py-4 font-bold text-[#062018] shadow-[0_0_44px_rgba(52,211,153,0.4)] transition hover:shadow-[0_0_70px_rgba(52,211,153,0.65)]"
              >
                Запази си място →
              </Link>
            </div>
          </SectionReveal>

          <SectionReveal delay={80}>
            <div className="flex h-full flex-col rounded-3xl border border-cyan-400/30 bg-[linear-gradient(160deg,rgba(34,211,238,0.09),rgba(124,58,237,0.05))] p-7">
              <GraduationCap className="h-8 w-8 text-cyan-300" />
              <h3 className="mt-4 text-xl font-bold">{c.name}</h3>
              <p className="mt-2 flex-1 text-[15px] text-slate-300">
                30-дневен курс: оферта, фуния, реклами, AI агенти, автоматични продажби — с всички
                наши шаблони и живи Q&A сесии.
              </p>
              <p className="mt-5 text-4xl font-bold">{c.priceEur} €</p>
              <p className="mb-5 mt-1 text-xs text-slate-500">Еднократно · достъп завинаги</p>
              <CheckoutButton product="course">Купи курса →</CheckoutButton>
            </div>
          </SectionReveal>

          <SectionReveal delay={160}>
            <div className="flex h-full flex-col rounded-3xl border border-violet-400/30 bg-[linear-gradient(160deg,rgba(124,58,237,0.1),rgba(34,211,238,0.04))] p-7">
              <Sparkles className="h-8 w-8 text-violet-300" />
              <h3 className="mt-4 text-xl font-bold">{m.name}</h3>
              <p className="mt-2 flex-1 text-[15px] text-slate-300">
                {m.tagline} Изграждаме твоята AI система за клиенти заедно — до резултат.
              </p>
              <p className="mt-5 text-4xl font-bold">{m.priceEur} €</p>
              <p className="mb-5 mt-1 text-xs text-slate-500">
                4 месеца · 16 сесии · купилите курса доплащат {m.upgradePriceEur} €
              </p>
              <CheckoutButton product="mentorship">Запази мястото си →</CheckoutButton>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ② AI АГЕНТИ */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <CategoryHead
          n="② AI Агенти · внедряваме или те учим"
          title="Работници, които не спят"
          sub="Чат, глас и трейдинг — агентът поема повтарящата се работа. Цените „от” са ориентир; финализираме заедно според обема."
        />
        <SectionReveal>
          <div className="mb-8 grid gap-5 md:grid-cols-2">
            <AgentChatViz />
            <DashboardViz />
          </div>
        </SectionReveal>
        <div className="grid gap-6 lg:grid-cols-3">
          {AGENTS.map((a, i) => (
            <SectionReveal key={a.name} delay={i * 80}>
              <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-7 transition hover:border-violet-400/35">
                <a.icon className="h-8 w-8 text-violet-300" />
                <h3 className="mt-4 text-lg font-bold">{a.name}</h3>
                <p className="mt-2 flex-1 text-[15px] text-slate-300">{a.desc}</p>
                <p className="mt-5 text-3xl font-bold">
                  {a.price}
                  {a.approx && <span className="ml-2 align-middle text-xs font-normal text-slate-500">ориентир</span>}
                </p>
                <div className="mt-4 space-y-2.5">
                  {"buy" in a && a.buy ? (
                    <CheckoutButton product={a.buy}>Запази мястото си →</CheckoutButton>
                  ) : (
                    <>
                      <OrderDialog service={`${a.name} (${a.price})`} />
                      <Link
                        href="/booking"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-violet-300/50 hover:text-violet-200"
                      >
                        Или първо разговор →
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ③ СИСТЕМИ НА НИВА */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <CategoryHead
          n="③ Системи · CRM достъпи на нива"
          title="Ние строим — ти управляваш"
          sub="Всяко ниво надгражда предишното. Започваш откъдето ти трябва; детайлите са на /plan."
        />
        <SectionReveal>
          <div className="mb-8 max-w-2xl">
            <LevelsViz />
          </div>
        </SectionReveal>
        <div className="grid gap-5 md:grid-cols-2">
          {LEVELS.map((l, i) => {
            const cm = COLOR_MAP[l.color];
            return (
              <SectionReveal key={l.name} delay={i * 70}>
                <div
                  className={`relative flex h-full items-start gap-5 overflow-hidden rounded-3xl border ${cm.border} p-6 transition hover:brightness-110 ${l.featured ? "md:col-span-1" : ""}`}
                  style={{ background: cm.bg }}
                >
                  {l.featured && (
                    <span className="absolute right-4 top-4 rounded-full bg-[linear-gradient(135deg,#34d399,#22d3ee)] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#062018]">
                      Най-изгодно
                    </span>
                  )}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${cm.border} bg-black/30`}>
                    <l.icon className={`h-5.5 w-5.5 ${cm.text}`} style={{ height: 22, width: 22 }} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-mono text-[10px] uppercase tracking-[0.24em] ${cm.text}`}>{l.lvl}</p>
                    <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="pr-16 font-bold text-white">{l.name}</h3>
                      <span className={`font-mono text-xl font-bold ${cm.text}`}>{l.price}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-300">{l.desc}</p>
                    <div className="mt-4">
                      <OrderDialog
                        service={`${l.lvl} · ${l.name} (${l.price})`}
                        buttonLabel="Поръчай нивото"
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
                      />
                    </div>
                  </div>
                </div>
              </SectionReveal>
            );
          })}
        </div>
        <SectionReveal delay={120}>
          <div className="mt-6 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 text-center text-sm text-slate-400">
            Искаш само <strong className="text-white">уебсайт + CRM</strong> без рекламите? Ориентир от{" "}
            <strong className="text-cyan-300">2 900 €</strong> — казваме точна цена след 15-минутния разговор.
          </div>
        </SectionReveal>
      </section>

      {/* ④ ПАКЕТИ ПО БИЗНЕС + ДЕМО */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <CategoryHead
          n="④ Пакети по бизнес · виж живото демо"
          title="Готови машини за твоя бранш"
          sub="Кликни демото — виждаш системата, която ще получиш, преди да говорим за цена."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {VERTICALS.map((v, i) => (
            <SectionReveal key={v.name} delay={i * 80}>
              <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-7 transition hover:border-cyan-400/35">
                <v.icon className="h-8 w-8 text-cyan-300" />
                <h3 className="mt-4 text-lg font-bold">{v.name}</h3>
                <p className="mt-2 flex-1 text-[15px] text-slate-300">{v.desc}</p>
                <div className="mt-5 flex flex-col gap-2.5">
                  <Link
                    href={v.demo}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent-cyan)] px-6 py-3.5 font-bold text-[var(--color-bg-void)] shadow-[0_0_36px_rgba(34,211,238,0.35)] transition hover:shadow-[0_0_60px_rgba(34,211,238,0.6)]"
                  >
                    Виж живото демо →
                  </Link>
                  <OrderDialog
                    service={v.name}
                    buttonLabel="Поръчай пакета"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
                  />
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* АБОНАМЕНТИ */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <CategoryHead
          n="⑤ Абонаменти"
          title="Системата жива — всеки месец"
          sub="След изграждането: поддръжка, нови автоматизации и управление на рекламите."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {SUPPORT.map((s, i) => (
            <SectionReveal key={s.name} delay={i * 70}>
              <div className="h-full rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 text-center transition hover:border-emerald-400/35">
                <h3 className="font-bold text-white">{s.name}</h3>
                <p className="mt-2 text-2xl font-bold text-emerald-300">{s.price}</p>
                <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ФИНАЛ */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-8 text-center">
        <SectionReveal>
          <div className="rounded-[28px] border border-cyan-400/25 bg-[rgba(7,14,16,0.8)] p-8">
            <h2 className="text-2xl font-bold">Не си сигурен кое ниво е за теб?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              15 минути разговор — казваме ти честно откъде да започнеш (често отговорът е
              безплатното обучение).
            </p>
            <Link
              href="/booking"
              className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-[var(--color-accent-cyan)] px-8 py-4 font-bold text-[var(--color-bg-void)] shadow-[0_0_44px_rgba(34,211,238,0.4)] transition hover:shadow-[0_0_70px_rgba(34,211,238,0.65)]"
            >
              <Calendar className="h-5 w-5" /> Запази 15-мин разговор
            </Link>
          </div>
        </SectionReveal>
        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
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
