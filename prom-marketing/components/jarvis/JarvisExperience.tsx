"use client";
/* =====================================================================
   JarvisExperience — публичната страница на Jarvis: асистентът от
   бъдещето. Живо неврално ядро, интерактивна командна конзола със
   скриптирани демо отговори + симулирано „изпълнение" на задачи,
   решетка от способности, „един ден с Jarvis" и CTA. Дизайн езикът е
   v2 „Luminescent Depth" (app/v2/v2-design.css).
   ===================================================================== */
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  MessageCircle,
  Calendar,
  Megaphone,
  Receipt,
  Clapperboard,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";
import { openBookingPopup } from "@/lib/cal/embed";
import { track } from "@/lib/analytics/track";

/* ---------- скриптирани демо интенти ---------- */
type Intent = {
  match: RegExp;
  reply: string;
  steps: string[];
};

const INTENTS: Intent[] = [
  {
    match: /отчет|доклад|днес|обобщ/i,
    reply: "Ето дневния отчет, шефе: 23 нови лида, 4 насрочени срещи, 2 приети оферти. Най-силният канал днес е Meta · видео фунията.",
    steps: ["Събирам данни от CRM…", "Анализирам канали…", "Сглобявам отчета…"],
  },
  {
    match: /видео|клип|tiktok|контент|пост/i,
    reply: "Готово. Генерирах 3 видеа с AI глас и субтитри, качени по график за 18:00, 19:30 и 21:00 — в най-силните часове за твоята аудитория.",
    steps: ["Пиша сценарии…", "Генерирам визуали…", "Качвам по график…"],
  },
  {
    match: /реклам|кампания|бюджет|ads/i,
    reply: "Прегледах кампаниите: преместих 20% от бюджета към най-печелившата аудитория и спрях 2 губещи криейтива. Очакван ефект: −14% цена на лид.",
    steps: ["Чета резултатите…", "Сравнявам аудитории…", "Премествам бюджет…"],
  },
  {
    match: /срещ|запази|календар|разговор/i,
    reply: "Насрочих среща и изпратих покана с линк за видеовръзка. Ще напомня на клиента 1 час по-рано — автоматично.",
    steps: ["Проверявам календара…", "Изпращам покана…", "Настройвам напомняне…"],
  },
  {
    match: /фактур|плащан|пари|счетовод/i,
    reply: "Издадох фактурата, изпратих я на клиента и ще засека плащането веднага щом влезе. Ако закъснее — напомням учтиво вместо теб.",
    steps: ["Генерирам фактура…", "Изпращам на клиента…", "Активирам следене…"],
  },
  {
    match: /лид|клиент|запитван|фуния|продажб/i,
    reply: "В момента следя 47 активни лида. На 12 отговорих през последния час, 3 са готови за оферта — сложих ги най-отгоре в списъка ти.",
    steps: ["Сканирам фунията…", "Приоритизирам…", "Обновявам списъка…"],
  },
];

const FALLBACK: Intent = {
  reply:
    "Мога да покажа много повече на живо. Запази 15-минутен разговор и ще ти демонстрирам как поемам точно твоя бизнес.",
  match: /./,
  steps: ["Обработвам заявката…"],
};

const SUGGESTIONS = [
  "Дай ми отчет за днес",
  "Генерирай видео за TikTok",
  "Оптимизирай рекламите",
  "Насрочи среща с клиент",
  "Издай фактура",
  "Как са лидовете?",
];

type Msg = { from: "user" | "jarvis"; text: string };

const CAPABILITIES = [
  { icon: MessageCircle, title: "Отговаря на клиенти", sub: "Messenger, Instagram, имейл, сайт — за секунди, 24/7.", color: "#22d3ee" },
  { icon: Calendar, title: "Насрочва срещи", sub: "Календар, покани, напомняния — без нито едно разминаване.", color: "#34d399" },
  { icon: Megaphone, title: "Управлява реклами", sub: "Мести бюджети към печелившото, спира губещото.", color: "#a78bfa" },
  { icon: Clapperboard, title: "Създава съдържание", sub: "Видеа, постове, имейли — по график, в твоя тон.", color: "#fbbf24" },
  { icon: Receipt, title: "Издава фактури", sub: "И засича плащанията. Напомня при закъснение.", color: "#67e8f9" },
  { icon: Users, title: "Движи фунията", sub: "Квалифицира лидове и ги придвижва към сделка.", color: "#d946ef" },
  { icon: BarChart3, title: "Докладва всичко", sub: "Дневен отчет: лидове, продажби, разходи, печалба.", color: "#34d399" },
  { icon: Zap, title: "Учи се от данните", sub: "Всяка седмица става по-точен за твоя бизнес.", color: "#22d3ee" },
];

const DAY_TIMELINE = [
  { time: "06:00", text: "Преглежда нощните запитвания и отговаря на всички." },
  { time: "08:30", text: "Изпраща ти дневния бриф: срещи, приоритети, числа." },
  { time: "10:00", text: "Публикува съдържанието за деня във всички канали." },
  { time: "13:00", text: "Оптимизира рекламните кампании по обедните данни." },
  { time: "16:00", text: "Придвижва сделки: оферти, follow-up, напомняния." },
  { time: "19:00", text: "Качва вечерните видеа в най-гледаните часове." },
  { time: "23:00", text: "Затваря деня с отчет и планира утрешния." },
];

export function JarvisExperience() {
  const [messages, setMessages] = useState<Msg[]>([
    { from: "jarvis", text: "Здравей. Аз съм Jarvis — AI асистентът на ProMarketing. Дай ми команда или избери една отдолу. Това е демо — на живо правя всичко наистина." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, step]);

  const run = (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { from: "user", text: clean }]);
    track("jarvis_demo_command", { command: clean.slice(0, 60) });

    const intent = INTENTS.find((i) => i.match.test(clean)) ?? FALLBACK;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepDelay = reduced ? 60 : 620;

    intent.steps.forEach((s, i) => {
      setTimeout(() => setStep(s), stepDelay * i + 260);
    });
    setTimeout(() => {
      setStep(null);
      setMessages((m) => [...m, { from: "jarvis", text: intent.reply }]);
      setBusy(false);
    }, stepDelay * intent.steps.length + 460);
  };

  return (
    <>
      <div className="v2-aurora" aria-hidden />

      {/* ============ HERO ============ */}
      <section className="v2-section !pb-10 !pt-8" aria-label="Jarvis — герой">
        <div className="v2-wrap text-center">
          <div className="relative mx-auto h-64 w-64 md:h-80 md:w-80">
            <NeuralCore radius={1.4} nodeCount={260} spin={0.9} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Bot className="h-10 w-10" style={{ color: "var(--v2-cyan)", filter: "drop-shadow(0 0 14px var(--v2-glow-cyan))" }} />
            </div>
          </div>
          <p className="v2-eyebrow mt-4 justify-center">// ProMarketing · AI Core</p>
          <h1 className="v2-title mx-auto">JARVIS</h1>
          <p className="v2-sub mx-auto">
            Асистентът от бъдещето. Говори, изпълнява, докладва. Управлява
            клиенти, реклами, съдържание и пари — докато ти управляваш визията.
          </p>
          <div className="mt-4 flex justify-center">
            <span className="v2-status">Онлайн · работи в момента</span>
          </div>
        </div>
      </section>

      {/* ============ КОНЗОЛА ============ */}
      <section className="v2-section !py-10" aria-label="Говори с Jarvis">
        <div className="v2-wrap">
          <div
            className="v2-glass v2-glow is-always mx-auto max-w-3xl overflow-hidden"
            style={{ ["--v2-c" as string]: "var(--v2-cyan)" }}
          >
            {/* header */}
            <div
              className="flex items-center justify-between border-b px-5 py-3"
              style={{ borderColor: "var(--v2-line)" }}
            >
              <span className="v2-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--v2-faint)" }}>
                Jarvis · командна конзола
              </span>
              <span className="v2-mono text-[11px]" style={{ color: "var(--v2-mint)" }}>
                ● demo
              </span>
            </div>

            {/* log */}
            <div ref={logRef} className="jx-log flex flex-col gap-3 overflow-y-auto p-5" style={{ height: 320 }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed"
                  style={
                    m.from === "jarvis"
                      ? {
                          alignSelf: "flex-start",
                          background: "rgba(34, 211, 238, 0.08)",
                          border: "1px solid var(--v2-line-bright)",
                          color: "var(--v2-ink)",
                        }
                      : {
                          alignSelf: "flex-end",
                          background: "rgba(124, 58, 237, 0.14)",
                          border: "1px solid rgba(167, 139, 250, 0.35)",
                          color: "var(--v2-ink)",
                        }
                  }
                >
                  {m.from === "jarvis" && (
                    <span className="v2-mono mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--v2-cyan)" }}>
                      <Bot className="h-3 w-3" /> Jarvis
                    </span>
                  )}
                  {m.text}
                </div>
              ))}
              {step && (
                <div
                  className="v2-mono flex items-center gap-2 self-start rounded-xl px-4 py-2 text-[12px]"
                  style={{ color: "var(--v2-mint)", border: "1px dashed rgba(52,211,153,0.35)" }}
                  aria-live="polite"
                >
                  <span className="jx-spin" aria-hidden>◐</span> {step}
                </div>
              )}
            </div>

            {/* suggestions */}
            <div className="flex flex-wrap gap-2 px-5 pb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => run(s)}
                  className="jx-chip v2-mono rounded-full border px-3 py-1.5 text-[12px] transition-colors disabled:opacity-40"
                  style={{ borderColor: "var(--v2-line)", color: "var(--v2-muted)" }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* input */}
            <form
              className="flex items-center gap-2 border-t px-4 py-3"
              style={{ borderColor: "var(--v2-line)" }}
              onSubmit={(e) => {
                e.preventDefault();
                run(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напиши команда към Jarvis…"
                aria-label="Команда към Jarvis"
                className="w-full bg-transparent px-2 py-2 text-[14px] outline-none"
                style={{ color: "var(--v2-ink)", fontFamily: "var(--v2-font-display)" }}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Изпрати"
                className="v2-btn v2-btn-primary !p-3 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
          <p className="v2-mono mx-auto mt-3 max-w-3xl text-center text-[11px]" style={{ color: "var(--v2-faint)" }}>
            Демонстрационна конзола със скриптирани отговори. Реалният Jarvis се
            свързва с твоя CRM, календар, реклами и счетоводство.
          </p>
        </div>
      </section>

      {/* ============ СПОСОБНОСТИ ============ */}
      <section className="v2-section" aria-label="Какво може Jarvis">
        <div className="v2-wrap">
          <div className="v2-head is-center">
            <p className="v2-eyebrow">// Способности</p>
            <h2 className="v2-title">Един асистент. Цял отдел работа.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="v2-card">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{ borderColor: `${c.color}44`, background: `${c.color}12` }}
                >
                  <c.icon className="h-5 w-5" style={{ color: c.color }} />
                </span>
                <h3 className="mt-4 text-[16px] font-bold" style={{ color: "var(--v2-ink)" }}>
                  {c.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                  {c.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ЕДИН ДЕН С JARVIS ============ */}
      <section className="v2-section !pt-4" aria-label="Един ден с Jarvis">
        <div className="v2-wrap">
          <div className="v2-head is-center">
            <p className="v2-eyebrow">// 24/7</p>
            <h2 className="v2-title-plain">
              Един ден с <span className="v2-grad">Jarvis</span>
            </h2>
          </div>
          <div className="mx-auto max-w-2xl">
            {DAY_TIMELINE.map((t, i) => (
              <div key={t.time} className="relative flex gap-5 pb-7">
                {i < DAY_TIMELINE.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[38px] top-8 h-full w-px"
                    style={{ background: "linear-gradient(180deg, var(--v2-line-bright), transparent)" }}
                  />
                )}
                <span
                  className="v2-mono z-[1] w-[76px] shrink-0 rounded-lg border px-2 py-1.5 text-center text-[12px]"
                  style={{ borderColor: "var(--v2-line-bright)", color: "var(--v2-cyan)", background: "rgba(4,6,13,0.7)" }}
                >
                  {t.time}
                </span>
                <p className="pt-1 text-[15px]" style={{ color: "var(--v2-muted)" }}>
                  <CheckCircle2 className="mr-2 inline h-4 w-4 align-[-2px]" style={{ color: "var(--v2-mint)" }} />
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="v2-section !pt-2" aria-label="Вземи своя Jarvis">
        <div className="v2-wrap">
          <div
            className="v2-glass v2-glow is-always mx-auto max-w-3xl p-8 text-center md:p-12"
            style={{ ["--v2-c" as string]: "var(--v2-violet)" }}
          >
            <Sparkles className="mx-auto h-8 w-8" style={{ color: "var(--v2-violet-2)" }} />
            <h2 className="v2-title-plain mt-4 !text-[clamp(1.6rem,3.6vw,2.6rem)]">
              Искаш Jarvis да работи <span className="v2-grad">за твоя бизнес?</span>
            </h2>
            <p className="v2-sub mx-auto mt-2">
              15 минути разговор. Показваме ти какво поема веднага и колко
              часа седмично ти връща.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  track("cta_clicked", { location: "jarvis_page", target: "booking" });
                  void openBookingPopup();
                }}
                className="v2-btn v2-btn-primary is-lg"
              >
                Запази среща
                <span aria-hidden className="v2-arrow">→</span>
              </button>
              <a
                href="/demo"
                onClick={() => track("cta_clicked", { location: "jarvis_page", target: "/demo" })}
                className="v2-btn is-lg"
                style={{ borderColor: "var(--v2-line-bright)", color: "var(--v2-cyan)", background: "rgba(34,211,238,0.06)" }}
              >
                Живо демо на системата
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .jx-chip:hover { border-color: var(--v2-line-bright); color: var(--v2-cyan); }
        .jx-spin { display: inline-block; animation: jx-rot 0.9s linear infinite; }
        @keyframes jx-rot { to { transform: rotate(360deg); } }
        .jx-log::-webkit-scrollbar { width: 6px; }
        .jx-log::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.25); border-radius: 3px; }
        @media (prefers-reduced-motion: reduce) { .jx-spin { animation: none; } }
      `}</style>
    </>
  );
}
