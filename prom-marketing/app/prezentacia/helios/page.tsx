"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/* Подготвено за конкретен клиент — смени само това име: */
const CLIENT = "вашата соларна компания";

const GOLD = "var(--h-gold)";
const CYAN = "var(--h-cyan)";
const LIME = "var(--h-lime)";
const DIM = "var(--h-dim)";

/* ---------- споделени помощници ---------- */

function Eyebrow({ children, color = GOLD }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{ fontFamily: "var(--font-mono)", color, letterSpacing: "0.32em" }}
      className="text-[11px] uppercase"
    >
      {children}
    </span>
  );
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ to, suffix = "", prefix = "", decimals = 0 }: { to: number; suffix?: string; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started) {
        started = true;
        const dur = 1400;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(to * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("bg-BG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

function Panel({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "var(--h-panel)",
        border: "1px solid var(--h-line)",
        backdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const sectionCls = "relative mx-auto w-full max-w-6xl px-6 py-24 md:py-32";
const h2Cls = "mt-4 font-semibold leading-[1.04] tracking-tight text-[clamp(2rem,5vw,3.6rem)]";

/* ---------- топ скрол лента ---------- */
function ScrollBar() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <motion.div
      style={{ scaleX: x, transformOrigin: "0%", background: `linear-gradient(90deg, ${GOLD}, ${LIME}, ${CYAN})` }}
      className="fixed left-0 top-0 z-50 h-[3px] w-full"
    />
  );
}

/* ---------- 1 · ХЕРОЙ ---------- */
function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* слънчево ядро */}
      <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[680px] w-[680px] md:right-[2%]">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,176,32,0.85), rgba(255,122,26,0.25) 45%, transparent 70%)", filter: "blur(8px)" }}
        />
        {!reduce && (
          <motion.div
            className="absolute inset-[14%] rounded-full"
            style={{ border: "1px solid rgba(255,176,32,0.35)" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {[0, 72, 144, 216, 288].map((deg) => (
              <span
                key={deg}
                className="absolute h-2.5 w-2.5 rounded-full"
                style={{
                  background: CYAN,
                  boxShadow: `0 0 14px ${CYAN}`,
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${deg}deg) translateX(230px)`,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* решетка от панели */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] opacity-[0.5]"
        style={{
          background:
            "repeating-linear-gradient(115deg, rgba(51,214,255,0.10) 0 2px, transparent 2px 26px)," +
            "repeating-linear-gradient(65deg, rgba(255,176,32,0.08) 0 2px, transparent 2px 26px)",
          maskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <Eyebrow>ProMarketing · поверителна презентация</Eyebrow>
          <h1
            className="mt-5 max-w-3xl font-bold leading-[0.98] tracking-tight text-[clamp(2.6rem,7vw,5.4rem)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Слънцето работи.
            <br />
            Сега и системата ви ще
            <span style={{ color: GOLD }}> работи сама.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[clamp(1rem,1.4vw,1.18rem)] leading-relaxed" style={{ color: DIM }}>
            Автономна операционна система с изкуствен интелект за {CLIENT}: оферти, мониторинг на
            обектите и управление на енергията — 24/7, без да вдигате телефон.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {["13 AI агента", "контрол на инвертори и батерии", "0 пропуснати оферти"].map((t, i) => (
              <span
                key={t}
                className="rounded-full px-4 py-2 text-sm"
                style={{
                  border: "1px solid var(--h-line)",
                  background: "var(--h-panel2)",
                  color: i === 1 ? LIME : "var(--h-text)",
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-2 text-xs" style={{ color: "var(--h-faint)", fontFamily: "var(--font-mono)" }}>
            <span className="inline-block h-8 w-[1px]" style={{ background: "var(--h-faint)" }} />
            СКРОЛНЕТЕ — започваме от реалността на пазара
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 2 · ПАЗАРЪТ ---------- */
function MarketShock() {
  const cards = [
    { k: "+1.4 GW", t: "нови соларни мощности за 2025 в България — мрежата прелива всеки обед.", c: GOLD },
    { k: "под 0 €", t: "борсовите цени паднаха в отрицателна територия — изнасяте ток и плащате за това.", c: "var(--h-red)" },
    { k: "балансиращи санкции", t: "методиката на КЕВР удря производителите при дисбаланс — хиляди €/MWh.", c: "var(--h-amber)" },
    { k: "топ-3 в ЕС", t: "по ръст на батерии (BESS) — защото това е единствената защита срещу горното.", c: LIME },
  ];
  return (
    <section className={sectionCls}>
      <Reveal>
        <Eyebrow color="var(--h-red)">Реалността · 2026</Eyebrow>
        <h2 className={h2Cls} style={{ fontFamily: "var(--font-display)" }}>
          Соларът в България вече<br />губи пари по обед.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed" style={{ color: DIM }}>
          Производството скочи, а мрежата е претоварена в пиковите часове. Резултатът: ниски и дори
          отрицателни цени точно когато вашите панели произвеждат най-много.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Reveal key={c.k} delay={i * 0.08}>
            <Panel className="h-full p-6">
              <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: c.c }}>{c.k}</div>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: DIM }}>{c.t}</p>
            </Panel>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <Panel className="mt-6 p-6 md:p-8" style={{ borderColor: "rgba(255,176,32,0.4)" }}>
          <p className="text-xl font-medium md:text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Всеки мегаватчас, изнесен в отрицателна цена, ви струва пари.{" "}
            <span style={{ color: GOLD }}>Системата ни решава това автоматично — на всеки 15 минути.</span>
          </p>
        </Panel>
      </Reveal>
    </section>
  );
}

/* ---------- 3 · 13 АГЕНТА ---------- */
const AGENTS = [
  ["Оферти", "Моментална оферта от адрес + сметка (PVGIS, ROI, изплащане)."],
  ["Енергиен диспечер", "Управлява инвертори и батерии в реално време."],
  ["Прогноза", "Производство и борсова цена 0–14 дни напред."],
  ["Мониторинг", "Целият портфейл от обекти, PR%, аларми."],
  ["Термография", "Дрон + AI открива дефектни панели и горещи точки."],
  ["Договори", "Авто-договори и електронен подпис."],
  ["Фактури", "Фактуриране и засичане на плащания."],
  ["Продажби", "Follow-up до всеки лийд — никой не зависва."],
  ["Рекламен", "Facebook и Google кампании, оптимизация."],
  ["Видео", "Генерира рекламни видеа автоматично."],
  ["Телеграм", "Управлявате всичко с едно съобщение."],
  ["Глас", "Гласов асистент по телефона."],
  ["Одитор", "Нощни проверки и здравен бюлетин."],
];
function AgentSwarm() {
  return (
    <section className={sectionCls}>
      <Reveal>
        <Eyebrow color={CYAN}>Вашият AI екип</Eyebrow>
        <h2 className={h2Cls} style={{ fontFamily: "var(--font-display)" }}>
          13 агента. Един екип.<br />Нула почивни дни.
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map(([name, desc], i) => (
          <Reveal key={name} delay={(i % 3) * 0.06}>
            <Panel className="group flex h-full items-start gap-4 p-5 transition-colors hover:border-[color:var(--h-cyan)]">
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                style={{ background: "rgba(51,214,255,0.12)", color: CYAN, fontFamily: "var(--font-mono)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="font-semibold" style={{ color: "var(--h-text)" }}>{name}</div>
                <p className="mt-1 text-sm leading-snug" style={{ color: DIM }}>{desc}</p>
              </div>
            </Panel>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4 · ЕНЕРГИЕН МОЗЪК (wow) ---------- */
function EnergyBrain() {
  const reduce = useReducedMotion();
  // стилизирана 24ч крива: производство (злато) + цена (циан, минава под 0)
  const prod = "M0,150 C60,150 90,60 150,40 C210,22 250,20 300,40 C350,60 380,150 440,150 L440,170 L0,170 Z";
  const price = "M0,70 C50,66 80,95 130,110 C175,124 210,140 250,120 C290,100 320,55 360,52 C400,49 420,60 440,58";
  return (
    <section className={sectionCls}>
      <Reveal>
        <Eyebrow color={LIME}>Сърцето · енергиен мозък</Eyebrow>
        <h2 className={h2Cls} style={{ fontFamily: "var(--font-display)" }}>
          На всеки 15 минути решава:<br />
          <span style={{ color: GOLD }}>консумирай, складирай, продай или спри.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed" style={{ color: DIM }}>
          AI следи производството спрямо потреблението и борсовата цена и управлява инверторите и
          батериите в реално време — за да не изнасяте в отрицателни цени и да не плащате
          балансиращи санкции.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <Panel className="mt-10 overflow-hidden p-6 md:p-8">
          <div className="mb-4 flex flex-wrap gap-5 text-xs" style={{ fontFamily: "var(--font-mono)", color: DIM }}>
            <span className="flex items-center gap-2"><i className="h-2.5 w-4 rounded-sm" style={{ background: GOLD }} /> производство</span>
            <span className="flex items-center gap-2"><i className="h-[2px] w-4" style={{ background: CYAN }} /> борсова цена</span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-4 rounded-sm" style={{ background: LIME }} /> зареждане батерия</span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-4 rounded-sm" style={{ background: "var(--h-red)" }} /> спиране на износ</span>
          </div>
          <svg viewBox="0 0 440 200" className="w-full" style={{ height: "auto" }}>
            <line x1="0" y1="92" x2="440" y2="92" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 4" />
            <text x="2" y="88" fill="var(--h-faint)" fontSize="9" fontFamily="var(--font-mono)">0 €</text>
            <path d={prod} fill="rgba(255,176,32,0.18)" stroke={GOLD as string} strokeWidth="2" />
            {/* зона на действие */}
            <rect x="70" y="174" width="120" height="14" rx="3" fill={LIME as string} opacity="0.85" />
            <rect x="300" y="174" width="90" height="14" rx="3" fill={GOLD as string} opacity="0.85" />
            <rect x="250" y="174" width="50" height="14" rx="3" fill="var(--h-red)" opacity="0.85" />
            <motion.path
              d={price}
              fill="none"
              stroke={CYAN as string}
              strokeWidth="2.5"
              initial={reduce ? undefined : { pathLength: 0 }}
              whileInView={reduce ? undefined : { pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
            <text x="120" y="184.5" fill="#06210a" fontSize="8" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">ЗАРЕЖДА</text>
            <text x="345" y="184.5" fill="#241400" fontSize="8" fontWeight="700" fontFamily="var(--font-mono)" textAnchor="middle">ПРОДАВА</text>
          </svg>
          <p className="mt-3 text-xs" style={{ color: "var(--h-faint)", fontFamily: "var(--font-mono)" }}>
            обед: цената пада под нулата → системата спира износа и зарежда батерията · вечер: пик → разрежда и продава
          </p>
        </Panel>
      </Reveal>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          ["Зареждане при ниски/отрицателни цени", LIME],
          ["Разреждане във вечерния пик", GOLD],
          ["Спиране на износа при минус", "var(--h-red)"],
          ["Пиково изглаждане (peak shaving)", CYAN],
          ["Максимално собствено потребление", LIME],
          ["Прогноза от метео + борса (ENTSO-E / IBEX)", GOLD],
        ].map(([t, c], i) => (
          <Reveal key={t as string} delay={(i % 3) * 0.06}>
            <Panel className="flex h-full items-center gap-3 p-4">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c as string, boxShadow: `0 0 10px ${c}` }} />
              <span className="text-sm" style={{ color: "var(--h-text)" }}>{t}</span>
            </Panel>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="mt-8 text-sm" style={{ color: DIM }}>
          Свързва се директно с инверторите и батериите ви:{" "}
          <span style={{ color: "var(--h-text)" }}>SolarEdge · Huawei FusionSolar · Fronius · SMA · Sungrow · Victron · Tesla Powerwall</span>{" "}
          — през Modbus / SunSpec / IEEE 2030.5.
        </p>
      </Reveal>
    </section>
  );
}

/* ---------- 5 · КОМАНДНА ЗАЛА ---------- */
function LiveOps() {
  const sites = [
    ['Парк Тракия · 1.2 MW', 98, 'норма', LIME],
    ['Покрив Логистика', 91, 'следи се', GOLD],
    ['Парк Дунав · 800 kW', 73, 'авария · авто-тикет', 'var(--h-red)'],
    ['Покрив Завод 4', 96, 'норма', LIME],
  ];
  const pipe = [
    ["Нови запитвания", 18],
    ["Изпратени оферти", 11],
    ["Подписани", 5],
  ];
  return (
    <section className={sectionCls}>
      <Reveal>
        <Eyebrow>Командна зала</Eyebrow>
        <h2 className={h2Cls} style={{ fontFamily: "var(--font-display)" }}>
          Целият ви портфейл —<br />на един екран.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Panel className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Мониторинг на обекти</span>
              <span className="text-xs" style={{ color: LIME, fontFamily: "var(--font-mono)" }}>● на живо</span>
            </div>
            <div className="space-y-3">
              {sites.map(([name, pr, status, c]) => (
                <div key={name as string} className="flex items-center gap-3">
                  <div className="w-40 truncate text-sm" style={{ color: "var(--h-text)" }}>{name}</div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pr}%`, background: c as string }} />
                  </div>
                  <div className="w-10 text-right text-xs" style={{ fontFamily: "var(--font-mono)", color: DIM }}>{pr as number}%</div>
                  <div className="w-32 text-right text-[11px]" style={{ color: c as string }}>{status}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs" style={{ color: "var(--h-faint)" }}>PR = коефициент на производителност · аларма → автоматичен тикет към техник</p>
          </Panel>
        </Reveal>

        <Reveal delay={0.1}>
          <Panel className="p-6">
            <div className="mb-4 text-sm font-semibold">Фуния на офертите · този месец</div>
            <div className="space-y-4">
              {pipe.map(([label, n], i) => (
                <div key={label as string}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span style={{ color: DIM }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--h-text)" }}>{n as number}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${[100, 62, 28][i]}%`, background: `linear-gradient(90deg, ${GOLD}, ${LIME})` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-end gap-2">
              <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: GOLD }}>
                <CountUp to={45} suffix="%" />
              </div>
              <div className="pb-1 text-xs" style={{ color: DIM }}>от оферта до подпис — без ръчна работа</div>
            </div>
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 6 · ВЪЗМОЖНОСТИ ---------- */
const CAPS = [
  ["Моментални оферти", "Адрес + сметка → размер, добив, цена, ROI за секунди."],
  ["Мониторинг 24/7", "Авто-откриване на проблеми и тикети към техниците."],
  ["Енергийна оптимизация", "Реално управление на инвертори и батерии."],
  ["Дрон термография", "AI инспекция на панели с дигитален близнак."],
  ["Управление през Телеграм", "Цялата система — с едно съобщение."],
  ["Гласов асистент", "Поема обаждания и говори с клиентите."],
  ["AI видеа", "Генерира рекламни клипове автоматично."],
  ["Facebook & Google реклами", "Пуска и оптимизира кампании за лийдове."],
  ["Пълна интеграция", "Имейли, акаунти, документи — всичко свързано, всичко в действие."],
];
function Capabilities() {
  return (
    <section className={sectionCls}>
      <Reveal>
        <Eyebrow color={GOLD}>Пълна автоматизация</Eyebrow>
        <h2 className={h2Cls} style={{ fontFamily: "var(--font-display)" }}>
          Построено веднъж.<br />Върши всичко.
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CAPS.map(([t, d], i) => (
          <Reveal key={t} delay={(i % 3) * 0.06}>
            <Panel className="group h-full p-6 transition-transform hover:-translate-y-1">
              <div className="mb-3 h-1 w-10 rounded-full" style={{ background: `linear-gradient(90deg, ${GOLD}, ${LIME})` }} />
              <div className="font-semibold" style={{ color: "var(--h-text)" }}>{t}</div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: DIM }}>{d}</p>
            </Panel>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 7 · ВНЕДРЯВАНЕ + ЧИСЛА ---------- */
function ProcessImpact() {
  const steps = [
    ["01", "Свързваме данните", "инвертори, мониторинг, имейл, CRM"],
    ["02", "Конфигурираме агентите", "за вашите обекти и процеси"],
    ["03", "Тест под надзор", "вие одобрявате, системата се учи"],
    ["04", "Пълна автономия", "работи сама, вие гледате резултата"],
  ];
  return (
    <section className={sectionCls}>
      <Reveal>
        <Eyebrow color={CYAN}>Внедряване</Eyebrow>
        <h2 className={h2Cls} style={{ fontFamily: "var(--font-display)" }}>От днес до автономия — за дни.</h2>
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([n, t, d], i) => (
          <Reveal key={n} delay={i * 0.08}>
            <Panel className="h-full p-6">
              <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,176,32,0.5)" }}>{n}</div>
              <div className="mt-3 font-semibold">{t}</div>
              <p className="mt-1 text-sm" style={{ color: DIM }}>{d}</p>
            </Panel>
          </Reveal>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { v: 13, s: "", l: "AI агента в екипа" },
          { v: 24, s: "/7", l: "контрол на енергията" },
          { v: 15, s: " мин", l: "интервал на решенията" },
        ].map((m, i) => (
          <Reveal key={m.l} delay={i * 0.08}>
            <Panel className="p-7 text-center">
              <div className="text-4xl font-bold md:text-5xl" style={{ fontFamily: "var(--font-display)", color: GOLD }}>
                <CountUp to={m.v} suffix={m.s} />
              </div>
              <div className="mt-2 text-sm" style={{ color: DIM }}>{m.l}</div>
            </Panel>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- 8 · CTA ---------- */
function ClosingCTA() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(700px 360px at 50% 120%, rgba(255,176,32,0.25), transparent 70%)" }}
      />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-28 text-center md:py-36">
        <Reveal>
          <Eyebrow>ProMarketing</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-3xl font-bold leading-[1.02] tracking-tight text-[clamp(2.2rem,6vw,4.2rem)]" style={{ fontFamily: "var(--font-display)" }}>
            Готови ли сте слънцето да работи<br />и докато спите?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg" style={{ color: DIM }}>
            Да насрочим кратко демо на живо — ще ви покажем системата с ваши реални числа.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://promarketing.pw"
              className="rounded-full px-8 py-4 text-base font-semibold transition-transform hover:scale-[1.03]"
              style={{ background: `linear-gradient(90deg, ${GOLD}, ${LIME})`, color: "#0a0a0a" }}
            >
              Запазете демо разговор →
            </a>
            <span className="text-sm" style={{ color: "var(--h-faint)", fontFamily: "var(--font-mono)" }}>promarketing.pw</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function HeliosPage() {
  return (
    <main className="relative">
      <ScrollBar />
      <Hero />
      <MarketShock />
      <AgentSwarm />
      <EnergyBrain />
      <LiveOps />
      <Capabilities />
      <ProcessImpact />
      <ClosingCTA />
    </main>
  );
}
