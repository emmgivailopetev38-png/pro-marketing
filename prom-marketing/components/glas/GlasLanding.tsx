/* =====================================================================
   GlasLanding — /glas: лендингът на рекламата за гласовия агент.
   ---------------------------------------------------------------------
   Едно нещо се иска от страницата: човекът да си остави данните и да
   ГОВОРИ с агента още сега. Затова формата стои разгъната в героя, а
   не зад бутон, и се повтаря най-долу за онези, които първо са чели.

   Аудиторията е трафик от Meta — хора с онлайн магазин или бизнес, при
   който телефонът звъни повече, отколкото някой може да вдигне. Текстът
   говори през тяхната загуба (пропуснатата поръчка, фалшивият наложен
   платеж), не през нашите функции.

   Цените са тук нарочно: рекламата е за бизнеси, които могат да си го
   позволят, а гласовото демо има таван от 12 разговора на ден. По-добре
   човек да си тръгне на страницата, отколкото да изяде слот от някой,
   който после ще плати. Числата са в PRICE — сменят се на едно място.
   ===================================================================== */
import {
  Check,
  Clock,
  Headphones,
  MessageSquareText,
  PackageSearch,
  PhoneCall,
  PhoneIncoming,
  RefreshCcw,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { SectionReveal } from "@/components/effects/SectionReveal";
import { VoiceCallForm } from "@/components/glas/VoiceCallForm";

const PRICE = { setup: "2 400 €", monthly: "290 €/мес." };

const CALLS = [
  {
    icon: PackageSearch,
    title: "„Къде ми е пратката?“",
    text: "Най-честото обаждане в онлайн магазин. Агентът намира поръчката, казва статуса и праща линк за проследяване по Viber — без да те откъсва от пакетирането.",
  },
  {
    icon: Truck,
    title: "Потвърждение на наложен платеж",
    text: "Звъни на всяка нова поръчка с наложен платеж и я потвърждава преди да тръгне. Фалшивите поръчки и върнатите пратки падат още първата седмица.",
  },
  {
    icon: ShoppingCart,
    title: "Поръчка по телефона",
    text: "Част от клиентите не искат да пишат — искат да кажат какво искат. Агентът приема поръчката, повтаря я за проверка и я вкарва в системата.",
  },
  {
    icon: RefreshCcw,
    title: "Смяна на размер и връщане",
    text: "Обяснява условията, записва заявката и праща инструкциите на имейл. Едно обаждане по-малко за теб, един спокоен клиент повече.",
  },
  {
    icon: MessageSquareText,
    title: "Наличности, размери, срокове",
    text: "„Имате ли го в четиридесет и две?“ и „Кога ще дойде?“ — отговаря по твоите данни, не по общи приказки.",
  },
  {
    icon: PhoneIncoming,
    title: "Изоставена кошница",
    text: "Обажда се на човека, който е спрял на плащането, с ясен повод и без натиск. Оттам излизат поръчки, които иначе не се случват.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Говориш с него сега",
    text: "Оставяш име, телефон, имейл и какъв бизнес имаш. Агентът те поздравява по име и ти записва среща с Ивайло — в истинския календар, докато си на линията.",
  },
  {
    n: "02",
    title: "Среща по твоя магазин",
    text: "Гледаме какво звъни при теб: колко обаждания, за какво, в кои часове. Излизаш със сценарий и с числа — колко поръчки и колко часа връща.",
  },
  {
    n: "03",
    title: "Пускане за 2–3 седмици",
    text: "Гласът и сценарият се правят по твоята фирма. Тестваме върху реални записи от твои разговори и чак тогава агентът застава пред твоя номер.",
  },
];

const STATS = [
  { icon: Clock, value: "24/7", label: "вдига и в неделя вечер" },
  { icon: Users, value: "40", label: "разговора едновременно" },
  { icon: Headphones, value: "0", label: "пропуснати обаждания" },
  { icon: PhoneCall, value: "1 сигнал", label: "толкова чака клиентът" },
];

export function GlasLanding() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-void)] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(90vw 60vh at 15% 5%, rgba(34,211,238,0.14), transparent 60%), radial-gradient(80vw 60vh at 90% 90%, rgba(124,58,237,0.12), transparent 60%)",
        }}
      />

      {/* Тънка шапка — марка и телефон, нищо, което да отвежда от формата. */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <Link href="/" className="font-mono text-sm font-bold tracking-[0.18em] text-white">
          PRO<span className="text-cyan-300">MARKETING</span>
        </Link>
        <a
          href="tel:+14754269084"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400/50"
        >
          <PhoneCall className="h-3.5 w-3.5 text-cyan-300" /> Или звънни на агента
        </a>
      </header>

      {/* HERO — формата е веднага видима */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pb-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/40 bg-[rgba(34,211,238,0.07)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> Живо демо · говориш с него сега
          </span>
          <h1 className="mt-5 text-[clamp(34px,5.4vw,60px)] font-bold leading-[1.06] tracking-tight">
            AI гласов агент, който <span className="text-cyan-300">вдига телефона</span> на магазина ти.
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-cyan-200 bg-clip-text text-transparent">
              Денонощно. На български.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-300 md:text-lg">
            Клиентът пита къде му е пратката, иска друг размер или поръчва по телефона. Агентът
            отговаря веднага, записва всичко в системата ти и потвърждава наложените платежи, преди
            да тръгнат. Ти четеш три реда обобщение, вместо да вдигаш.
          </p>
          <ul className="mt-6 space-y-2.5">
            {[
              "Чуваш го за трийсет секунди — с твоите данни, не с презентация",
              "Записва ти среща сам, докато говорите — в истинския календар",
              "Пуска се на твоя номер за две до три седмици",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] text-slate-200">
                <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-cyan-400/15">
                  <Check className="h-3 w-3 text-cyan-300" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div
          id="demo"
          className="rounded-3xl border border-cyan-400/30 bg-[rgba(7,12,16,0.92)] p-6 shadow-[0_0_80px_-18px_rgba(34,211,238,0.5)] md:p-8"
        >
          <VoiceCallForm location="hero" />
        </div>
      </section>

      {/* Числата */}
      <section className="relative mx-auto max-w-6xl px-6 pb-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATS.map((s, i) => (
            <SectionReveal key={s.label} delay={i * 70}>
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
                <s.icon className="h-4 w-4 text-cyan-300" />
                <p className="mt-2 text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Какви обаждания поема */}
      <section className="relative mx-auto max-w-6xl px-6 py-14">
        <SectionReveal>
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300">
            Какво поема вместо теб
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold md:text-4xl">
            Шестте обаждания, които ядат деня на един магазин
          </h2>
        </SectionReveal>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CALLS.map((c, i) => (
            <SectionReveal key={c.title} delay={i * 70}>
              <div className="h-full rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 transition hover:border-cyan-400/30">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10">
                  <c.icon className="h-5 w-5 text-cyan-300" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.text}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Как става */}
      <section className="relative mx-auto max-w-6xl px-6 py-10">
        <SectionReveal>
          <h2 className="text-center text-3xl font-bold md:text-4xl">Как става за три стъпки</h2>
        </SectionReveal>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <SectionReveal key={s.n} delay={i * 90}>
              <div className="relative h-full rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6">
                <span className="font-mono text-4xl font-bold text-cyan-300/30">{s.n}</span>
                <h3 className="mt-2 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.text}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Честно: за кого е и колко струва */}
      <section className="relative mx-auto max-w-6xl px-6 py-10">
        <SectionReveal>
          <div className="grid gap-6 rounded-3xl border border-violet-400/25 bg-[rgba(124,58,237,0.06)] p-7 md:grid-cols-[1.2fr_0.8fr] md:p-9">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-violet-300">
                Казано честно
              </p>
              <h2 className="mt-3 text-2xl font-bold md:text-3xl">Не е за всеки магазин. И го казваме отпред.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
                Агентът се отплаща там, където телефонът звъни повече, отколкото някой може да вдигне:
                от двайсет-трийсет обаждания на ден нагоре, при наложени платежи, при екип, който
                пакетира с ръцете си и вдига с рамото. Ако при теб звъни два пъти на ден, ще ти го
                кажем на срещата и ще ти предложим нещо по-малко.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
                И още едно: агентът се представя като AI в първите десет секунди. Клиентите ти не
                възразяват — възразяват, когато разберат по-късно.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgba(4,6,13,0.6)] p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">Цена</p>
              <p className="mt-3 text-3xl font-bold text-white">{PRICE.setup}</p>
              <p className="text-sm text-slate-400">внедряване — глас, сценарий, свързване с магазина и телефона</p>
              <p className="mt-4 text-3xl font-bold text-white">{PRICE.monthly}</p>
              <p className="text-sm text-slate-400">абонамент — линията, минутите, поддръжката и подобренията</p>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Сметката е проста: една пропусната поръчка на ден или пет фалшиви наложени платежа
                седмично струват повече.
              </p>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* Финална форма */}
      <section className="relative mx-auto max-w-xl px-6 pb-24 pt-10">
        <SectionReveal>
          <div className="rounded-3xl border border-cyan-400/30 bg-[rgba(7,12,16,0.92)] p-6 shadow-[0_0_80px_-18px_rgba(34,211,238,0.4)] md:p-8">
            <VoiceCallForm location="final" />
          </div>
        </SectionReveal>
        <p className="mt-8 text-center text-xs text-slate-600">
          ProMarketing · promarketing.pw ·{" "}
          <a href="/privacy" className="underline underline-offset-2">
            Поверителност
          </a>
        </p>
      </section>
    </main>
  );
}
