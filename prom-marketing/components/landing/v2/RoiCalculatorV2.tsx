"use client";
/* =====================================================================
   RoiCalculatorV2 — интерактивен ROI калкулатор за /v2.
   ---------------------------------------------------------------------
   Две живи полета (плъзгачи + числов вход):
     • часове рутинна работа на седмица
     • средна цена на час (€)
   → пресмята на живо спестени часове/месец и €/месец, с count-up,
   който се „включва" при влизане във viewport (IntersectionObserver),
   точно като останалите v2 секции.

   Под разчета — нисък-фрикшън блок „Остави телефон за пълния разчет
   + демо": само телефон е задължителен → POST /api/leads/submit
   (същият capture патерн като components/landing/v2/AiAudit.tsx).

   Реските/повърхностите идват 1:1 от app/v2/v2-design.css (v2-* класове).
   Компонентът се рендира вътре в .v2-scope, така че --v2-* токените
   резолват. Числата са илюстративни, не реални клиенти.
   ===================================================================== */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator,
  Clock,
  Euro,
  Phone,
  ArrowRight,
  Loader2,
  Check,
  TrendingUp,
  Sparkles,
  Bot,
} from "lucide-react";
import { track } from "@/lib/analytics/track";

/* Колко от рутината реалистично поема AI слоят (60%). Консервативно —
   нарочно под „100% магия", за да е достоверно числото в офертата. */
const AUTOMATION_RATE = 0.6;
/* седмици → месец */
const WEEKS_PER_MONTH = 4.33;

type Status = "idle" | "submitting" | "done" | "error";

const fmtInt = new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 0 });

/* ---- малък count-up хук: анимира число към `target`, но само след като
   `active` стане true (т.е. секцията е във viewport). Уважава
   prefers-reduced-motion — тогава скача директно. ------------------- */
function useCountUp(target: number, active: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    const from = fromRef.current;
    const delta = target - from;
    const start = performance.now();
    // easeOutCubic — спира меко, „премиум" усещане
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(from + delta * ease(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, active, duration]);

  return value;
}

export function RoiCalculatorV2() {
  // — входни стойности (с разумни начални числа за малък бизнес) ——————
  const [hours, setHours] = useState(14); // рутинни часове / седмица
  const [rate, setRate] = useState(20); // € / час

  // — capture state ————————————————————————————————————————————————
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // — viewport gate за count-up ————————————————————————————————————
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // — изчисления (live) ————————————————————————————————————————————
  const savedHoursMonth = useMemo(
    () => hours * AUTOMATION_RATE * WEEKS_PER_MONTH,
    [hours]
  );
  const savedMoneyMonth = useMemo(
    () => savedHoursMonth * rate,
    [savedHoursMonth, rate]
  );
  const savedMoneyYear = savedMoneyMonth * 12;
  const workdays = savedHoursMonth / 8; // 8-часови работни дни / месец

  // count-up върху изчислените таргети
  const moneyAnimated = useCountUp(savedMoneyMonth, active);
  const hoursAnimated = useCountUp(savedHoursMonth, active);
  const yearAnimated = useCountUp(savedMoneyYear, active);
  const daysAnimated = useCountUp(workdays, active);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 6) return;
    setStatus("submitting");
    track("roi_calc_submit", { hours, rate });
    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          company_activity: "ROI калкулатор (v2)",
          message:
            `ROI калкулатор · ${hours}ч рутина/седм. · ${rate}€/час → ` +
            `спестени ~${fmtInt.format(Math.round(savedHoursMonth))}ч/мес · ` +
            `~${fmtInt.format(Math.round(savedMoneyMonth))}€/мес ` +
            `(~${fmtInt.format(Math.round(savedMoneyYear))}€/год). Иска пълен разчет + демо.`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("done");
        track("roi_calc_lead", { hours, rate });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section ref={sectionRef} className="v2-section" id="roi" aria-labelledby="roi-title">
      {/* фина инженерна решетка като атмосферен слой */}
      <div className="v2-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="v2-wrap">
        {/* — header ————————————————————————————————————————————— */}
        <div className="v2-head is-center">
          <span className="v2-eyebrow v2-reveal is-in">{"// roi калкулатор"}</span>
          <h2
            id="roi-title"
            className="v2-title v2-reveal is-in"
            style={{ ["--d" as string]: "0.06s" }}
            lang="bg"
          >
            Колко ти струва рутината?
          </h2>
          <p className="v2-sub v2-reveal is-in" style={{ ["--d" as string]: "0.12s" }}>
            Премести плъзгачите и виж на живо колко часа и евро на месец
            връща един AI слой в джоба ти. Числата се обновяват, докато
            местиш.
          </p>
        </div>

        {/* — основен панел: входове (ляво) + резултат (дясно) ————— */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8">
          {/* ВХОДОВЕ */}
          <div
            className="v2-card v2-reveal is-in flex flex-col gap-8"
            style={{ ["--d" as string]: "0.06s" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-[12px]"
                style={{ border: "1px solid var(--v2-line)", background: "var(--v2-glass-2)" }}
              >
                <Calculator className="h-5 w-5" strokeWidth={1.5} style={{ color: "var(--v2-cyan)" }} />
              </span>
              <div>
                <p
                  className="font-semibold leading-tight"
                  style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-ink)", fontSize: "1.05rem" }}
                >
                  Твоите числа
                </p>
                <p className="v2-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--v2-faint)" }}>
                  нагласи за твоя бизнес
                </p>
              </div>
            </div>

            <SliderField
              icon={<Clock className="h-4 w-4" />}
              label="Рутинни часове на седмица"
              hint="обаждания, чат, оферти, записвания, въвеждане на данни"
              value={hours}
              min={2}
              max={60}
              step={1}
              suffix="ч/седм."
              onChange={setHours}
            />

            <SliderField
              icon={<Euro className="h-4 w-4" />}
              label="Средна цена на час"
              hint="заплата на човек или твоето време"
              value={rate}
              min={8}
              max={120}
              step={1}
              suffix="€/час"
              onChange={setRate}
            />

            <div
              className="flex items-start gap-3 rounded-[var(--v2-r-sm)] px-4 py-3"
              style={{ border: "1px solid var(--v2-line)", background: "rgba(4, 6, 13, 0.45)" }}
            >
              <Bot className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--v2-violet-2)" }} />
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--v2-muted)" }}>
                Сметката приема, че AI слоят поема{" "}
                <span style={{ color: "var(--v2-ink)", fontWeight: 600 }}>~60%</span>{" "}
                от рутината — консервативно, за да е реалистично. На практика
                често е повече.
              </p>
            </div>
          </div>

          {/* РЕЗУЛТАТ */}
          <div
            className="v2-card v2-glow is-always v2-reveal is-in relative flex flex-col"
            style={{ ["--d" as string]: "0.12s", ["--v2-c" as never]: "var(--v2-cyan)" }}
          >
            <div className="flex items-center justify-between">
              <span className="v2-eyebrow" style={{ marginBottom: 0 }}>
                разчет / месец
              </span>
              <span className="v2-status">live</span>
            </div>

            {/* голямото € число */}
            <div className="mt-7">
              <p className="v2-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--v2-faint)" }}>
                Спестени пари
              </p>
              <div className="mt-1 flex items-end gap-2">
                <span
                  className="leading-none"
                  style={{
                    fontFamily: "var(--v2-font-display)",
                    fontWeight: 800,
                    fontSize: "clamp(2.6rem, 7vw, 4.2rem)",
                    letterSpacing: "-0.03em",
                    backgroundImage: "var(--v2-grad-accent)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                  }}
                >
                  {fmtInt.format(Math.round(moneyAnimated))}€
                </span>
                <span className="v2-mono mb-2 text-sm" style={{ color: "var(--v2-muted)" }}>
                  / месец
                </span>
              </div>
              <p
                className="v2-mono mt-2 inline-flex items-center gap-1.5 text-[12px]"
                style={{ color: "var(--v2-mint)" }}
              >
                <TrendingUp className="h-3.5 w-3.5" />~{fmtInt.format(Math.round(yearAnimated))}€ на година
              </p>
            </div>

            <hr className="v2-divider my-6" />

            {/* вторични метрики */}
            <div className="grid grid-cols-2 gap-4">
              <Metric
                value={`${fmtInt.format(Math.round(hoursAnimated))}ч`}
                label="върнато време / месец"
                icon={<Clock className="h-4 w-4" />}
              />
              <Metric
                value={`${fmtInt.format(Math.round(daysAnimated))}`}
                label="цели работни дни / месец"
                icon={<Sparkles className="h-4 w-4" />}
              />
            </div>

            <p className="v2-mono mt-6 text-[11px] leading-relaxed" style={{ color: "var(--v2-faint)" }}>
              * Илюстративна оценка при ~60% автоматизация на рутината.
              Точният разчет правим спрямо твоите реални процеси.
            </p>
          </div>
        </div>

        {/* — CAPTURE: остави телефон за пълния разчет + демо ———————— */}
        <div
          className="v2-glass v2-glow is-always v2-reveal is-in relative mt-6 overflow-hidden p-6 md:mt-8 md:p-8"
          style={{ ["--d" as string]: "0.06s", ["--v2-c" as never]: "var(--v2-violet)" }}
        >
          {status === "done" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "rgba(34, 211, 238, 0.1)" }}
              >
                <Check className="h-7 w-7" style={{ color: "var(--v2-cyan)" }} />
              </div>
              <h3 className="v2-title-plain" style={{ fontSize: "1.5rem", margin: 0 }}>
                Прието! Готвим ти разчета.
              </h3>
              <p className="v2-sub mt-2" style={{ fontSize: "0.95rem" }}>
                Обаждаме се в рамките на работния ден с точния разчет за{" "}
                <b style={{ color: "var(--v2-ink)" }}>
                  ~{fmtInt.format(Math.round(savedMoneyMonth))}€/месец
                </b>{" "}
                спестявания и кратко живо демо.
              </p>
            </div>
          ) : (
            <div className="grid items-center gap-6 md:grid-cols-[1.15fr_1fr] md:gap-10">
              {/* pitch */}
              <div>
                <span className="v2-eyebrow">пълен разчет + демо</span>
                <h3
                  className="v2-title-plain mt-3"
                  style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", margin: 0 }}
                  lang="bg"
                >
                  Искаш <span className="v2-grad">точните</span> числа за твоя бизнес?
                </h3>
                <p className="v2-sub mt-3" style={{ fontSize: "0.95rem" }}>
                  Остави телефон — звъним ти с персонален разчет и показваме
                  на живо как AI поема рутината. Без ангажимент.
                </p>
                <ul className="mt-4 space-y-1.5">
                  {[
                    "Разчет спрямо реалните ти процеси",
                    "Кратко живо демо на AI слоя",
                    "Безплатно · отговор в работния ден",
                  ].map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2 text-[13px]"
                      style={{ color: "var(--v2-muted)" }}
                    >
                      <Check className="h-4 w-4 shrink-0" style={{ color: "var(--v2-cyan)" }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* form (само телефон е задължителен) */}
              <form onSubmit={submit} className="flex flex-col gap-3">
                <div
                  className="flex items-center gap-3 rounded-[var(--v2-r-sm)] px-4 transition-colors focus-within:border-[color:var(--v2-line-bright)]"
                  style={{ border: "1px solid var(--v2-line)", background: "rgba(4, 6, 13, 0.5)" }}
                >
                  <Phone className="h-4 w-4 shrink-0" style={{ color: "var(--v2-cyan)" }} />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="Телефон за обаждане"
                    aria-label="Телефон за обаждане"
                    className="w-full bg-transparent py-3.5 text-base outline-none"
                    style={{ color: "var(--v2-ink)" }}
                  />
                </div>

                {status === "error" && (
                  <p
                    className="rounded-[var(--v2-r-sm)] px-3 py-2 text-xs"
                    style={{
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#fca5a5",
                    }}
                  >
                    Грешка — опитай пак или звънни на +359 877 399 963.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="v2-btn v2-btn-primary is-lg w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Изпращам…
                    </>
                  ) : (
                    <>
                      Изпрати ми пълния разчет
                      <ArrowRight className="v2-arrow h-4 w-4" />
                    </>
                  )}
                </button>
                <p
                  className="v2-mono text-center text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "var(--v2-faint)" }}
                >
                  Само телефон · без ангажимент
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---- плъзгач + числов вход, споделящи една стойност ------------------ */
function SliderField({
  icon,
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <label
            className="v2-mono flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--v2-faint)" }}
          >
            <span style={{ color: "var(--v2-cyan)" }}>{icon}</span>
            {label}
          </label>
          <p className="mt-1 text-[12px] leading-snug" style={{ color: "var(--v2-muted)" }}>
            {hint}
          </p>
        </div>
        {/* числов вход — синхронизиран с плъзгача */}
        <div
          className="flex shrink-0 items-baseline gap-1 rounded-[10px] px-3 py-1.5"
          style={{ border: "1px solid var(--v2-line-bright)", background: "var(--v2-glass-2)" }}
        >
          <input
            type="number"
            inputMode="numeric"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
            aria-label={label}
            className="w-[3.5ch] bg-transparent text-right text-lg font-bold outline-none"
            style={{ fontFamily: "var(--v2-font-display)", color: "var(--v2-ink)" }}
          />
          <span className="v2-mono text-[11px]" style={{ color: "var(--v2-faint)" }}>
            {suffix}
          </span>
        </div>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="roi-range"
        style={{
          // запълването пред палеца оцветено в акцент, остатъкът — hairline
          background: `linear-gradient(90deg, var(--v2-cyan) 0%, var(--v2-violet) ${pct}%, rgba(120,150,210,0.14) ${pct}%, rgba(120,150,210,0.14) 100%)`,
        }}
      />

      {/* локални стилове за палеца — scoped през уникален клас */}
      <style jsx>{`
        .roi-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 100px;
          outline: none;
          cursor: pointer;
          margin-top: 4px;
        }
        .roi-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--v2-ink);
          border: 3px solid var(--v2-cyan);
          box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.18), 0 4px 12px rgba(0, 0, 0, 0.6);
          transition: transform 0.15s var(--v2-ease), box-shadow 0.2s var(--v2-ease);
        }
        .roi-range::-webkit-slider-thumb:hover {
          transform: scale(1.12);
          box-shadow: 0 0 0 6px rgba(34, 211, 238, 0.22), 0 4px 16px rgba(0, 0, 0, 0.7);
        }
        .roi-range:active::-webkit-slider-thumb {
          transform: scale(1.04);
        }
        .roi-range::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--v2-ink);
          border: 3px solid var(--v2-cyan);
          box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.18), 0 4px 12px rgba(0, 0, 0, 0.6);
          cursor: pointer;
        }
        .roi-range::-moz-range-track {
          height: 6px;
          border-radius: 100px;
          background: transparent;
        }
        .roi-range:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 6px rgba(34, 211, 238, 0.3);
        }
        @media (prefers-reduced-motion: reduce) {
          .roi-range::-webkit-slider-thumb {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

/* ---- малка вторична метрика в резултатния панел --------------------- */
function Metric({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[var(--v2-r-sm)] px-4 py-3"
      style={{ border: "1px solid var(--v2-line)", background: "rgba(4, 6, 13, 0.4)" }}
    >
      <span style={{ color: "var(--v2-cyan)" }}>{icon}</span>
      <p
        className="mt-2 leading-none"
        style={{ fontFamily: "var(--v2-font-display)", fontWeight: 700, fontSize: "1.6rem", color: "var(--v2-ink)" }}
      >
        {value}
      </p>
      <p className="v2-mono mt-1.5 text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--v2-faint)" }}>
        {label}
      </p>
    </div>
  );
}
