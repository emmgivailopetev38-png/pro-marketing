"use client";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { AICore } from "./AICore";

const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

function rise(reduced: boolean, delay = 0) {
  return {
    initial: reduced ? false : { opacity: 0, y: 26 },
    whileInView: reduced ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: reduced ? undefined : { duration: 0.8, ease: EASE, delay },
  };
}

function load(reduced: boolean, delay = 0) {
  return {
    initial: reduced ? false : { opacity: 0, y: 22 },
    animate: reduced ? undefined : { opacity: 1, y: 0 },
    transition: reduced ? undefined : { duration: 0.9, ease: EASE, delay },
  };
}

function accent(c: string): React.CSSProperties {
  return { ["--accent" as string]: c } as React.CSSProperties;
}

function CountUp({ to, reduced }: { to: number; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (reduced || !inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to]);

  return <span ref={ref}>{reduced ? to : val}</span>;
}

export default function PlanPage() {
  const reduced = useReducedMotion();

  return (
    <main className="pl-root">
      <div className="pl-aurora" aria-hidden />
      <div className="pl-grid" aria-hidden />
      <div className="pl-vignette" aria-hidden />

      {/* ===== TOPBAR ===== */}
      <header className="pl-topbar">
        <div className="pl-brand">
          PRO<i>MARKETING</i>
        </div>
        <div className="pl-syspill">
          <span className="pl-dot" /> Система · 2035
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="pl-hero">
        <div className="pl-copy">
          <motion.div className="pl-kicker" {...load(reduced)}>
            ◆ Премиум AI платформа
          </motion.div>
          <motion.h1 className="pl-h1" {...load(reduced, 0.07)}>
            Бизнес система <span>от бъдещето</span>
          </motion.h1>
          <motion.div className="pl-rule" aria-hidden {...load(reduced, 0.14)} />
          <motion.p className="pl-sub" {...load(reduced, 0.18)}>
            Изграждаме платформата ти на 3 фази — с изкуствен интелект във всяка.
            Премиум изпълнение, ясни цени, без изненади.
          </motion.p>
          <motion.div className="pl-chips" {...load(reduced, 0.24)}>
            <span>✦ AI във всяка фаза</span>
            <span>✦ Премиум поддръжка</span>
            <span>✦ Готово за растеж</span>
          </motion.div>
          <motion.div className="pl-ctarow" {...load(reduced, 0.3)}>
            <Link className="pl-cta" href="/booking">
              Заяви консултация →
            </Link>
            <a className="pl-ghost" href="#pl-build">
              Виж плана
            </a>
          </motion.div>
        </div>

        <motion.div className="pl-stage" {...load(reduced, 0.18)}>
          <AICore />
          <div className="pl-stagetag">
            <span className="pl-d" /> AI CORE · LIVE
          </div>
          <div className="pl-stagecap">
            <b>AI Екип</b> · 6 агента · денонощно
          </div>
        </motion.div>
      </section>

      <div className="pl-wrap">
        {/* ===== STATS ===== */}
        <section className="pl-stats">
          <motion.div className="pl-stat" {...rise(reduced, 0)}>
            <div className="pl-statn">
              до +<CountUp to={37} reduced={reduced} />%
            </div>
            <div className="pl-statl">повече продажби</div>
          </motion.div>
          <motion.div className="pl-stat" {...rise(reduced, 0.08)}>
            <div className="pl-statn">24/7</div>
            <div className="pl-statl">работа без почивка</div>
          </motion.div>
          <motion.div className="pl-stat" {...rise(reduced, 0.16)}>
            <div className="pl-statn">0</div>
            <div className="pl-statl">изпуснати клиенти</div>
          </motion.div>
          <motion.div className="pl-stat" {...rise(reduced, 0.24)}>
            <div className="pl-statn">∞</div>
            <div className="pl-statl">капацитет за растеж</div>
          </motion.div>
        </section>

        {/* ===== PHASES ===== */}
        <motion.h2 id="pl-build" className="pl-sec" {...rise(reduced)}>
          <b>Изработка</b> · 3 фази, всяка с 3 модула
        </motion.h2>
        <section className="pl-grid3">
          <motion.article
            className="pl-card"
            style={accent("#34e7e4")}
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.04)}
          >
            <div className="pl-ph">Фаза 01</div>
            <h3 className="pl-name">Основа</h3>
            <div className="pl-tag">Достъпи · Управление · Хора</div>
            <p className="pl-desc">Сигурният гръбнак, върху който стъпва всичко.</p>
            <ul className="pl-mods">
              <li>
                <div className="pl-mt">Достъпи &amp; роли</div>
                <div className="pl-ms">роли за управление, служители и клиенти</div>
              </li>
              <li>
                <div className="pl-mt">Управление &amp; табло</div>
                <div className="pl-ms">централно управление, настройки, преглед</div>
              </li>
              <li>
                <div className="pl-mt">
                  AI асистент „Управление" <i className="pl-ai">AI</i>
                </div>
                <div className="pl-ms">дневен бриф и приоритети за екипа</div>
              </li>
            </ul>
            <div className="pl-out">Получаваш: сигурна основа, готова за растеж.</div>
            <div className="pl-meta">
              <span className="pl-time">⏱ 3–4 седмици</span>
              <span className="pl-price">€2 200</span>
            </div>
          </motion.article>

          <motion.article
            className="pl-card"
            style={accent("#a78bfa")}
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.12)}
          >
            <div className="pl-ph">Фаза 02</div>
            <h3 className="pl-name">Клиенти &amp; операции</h3>
            <div className="pl-tag">Профили · Срещи · Процеси</div>
            <p className="pl-desc">Ежедневието ти — подредено и под контрол.</p>
            <ul className="pl-mods">
              <li>
                <div className="pl-mt">Клиентски профил 360°</div>
                <div className="pl-ms">цялата история на клиента на едно място</div>
              </li>
              <li>
                <div className="pl-mt">Сделки, срещи &amp; записки</div>
                <div className="pl-ms">pipeline, напомняния, записки от срещи</div>
              </li>
              <li>
                <div className="pl-mt">
                  AI бриф преди среща <i className="pl-ai">AI</i>
                </div>
                <div className="pl-ms">AI те подготвя за всеки клиент</div>
              </li>
            </ul>
            <div className="pl-out">Получаваш: повече сделки, нулево изпускане.</div>
            <div className="pl-meta">
              <span className="pl-time">⏱ 2–3 седмици</span>
              <span className="pl-price">€2 900</span>
            </div>
          </motion.article>

          <motion.article
            className="pl-card pl-gold"
            style={accent("#e7c984")}
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.2)}
          >
            <div className="pl-flag">премиум</div>
            <div className="pl-ph">Фаза 03</div>
            <h3 className="pl-name">Растеж &amp; AI</h3>
            <div className="pl-tag">Агенти · Автоматизации · Интеграции</div>
            <p className="pl-desc">Машината, която работи вместо теб.</p>
            <ul className="pl-mods">
              <li>
                <div className="pl-mt">Автоматизации</div>
                <div className="pl-ms">welcome, лийдове, follow-up последователности</div>
              </li>
              <li>
                <div className="pl-mt">
                  AI Екип (агенти) <i className="pl-ai">AI</i>
                </div>
                <div className="pl-ms">агенти със споделено учене</div>
              </li>
              <li>
                <div className="pl-mt">Авто-оферти &amp; интеграции</div>
                <div className="pl-ms">авто-оферти + Meta/омниканал</div>
              </li>
            </ul>
            <div className="pl-out">Получаваш: растеж без да наемаш екип.</div>
            <div className="pl-meta">
              <span className="pl-time">⏱ 1–2 седмици</span>
              <span className="pl-price">€3 600</span>
            </div>
          </motion.article>
        </section>

        {/* ===== PACKAGES ===== */}
        <motion.div className="pl-sublabel" {...rise(reduced)}>
          Пакети за изработка
        </motion.div>
        <section className="pl-grid3">
          <motion.article
            className="pl-card pl-pkg pl-pkg-value"
            style={accent("#34e7e4")}
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.04)}
          >
            <div className="pl-flag pl-flag-cy">★ най-изгодно</div>
            <div className="pl-top">
              <b>Пълна платформа</b>
              <span className="pl-pp">€7 400</span>
            </div>
            <p className="pl-pd">
              И трите фази — система от край до край. <em>Спестяваш €1 300.</em>
            </p>
            <div className="pl-team">
              🤖 <b>6</b> AI · 👤 <b>до 10</b> служителя
            </div>
            <ul className="pl-inc">
              <li>Всичките 9 модула (Фаза 1 + 2 + 3)</li>
              <li>Базови интеграции (имейл, Meta, Cal.com)</li>
              <li>Обучение на екипа</li>
              <li>1–3 мес. хостинг включен (вкл. AI)</li>
            </ul>
          </motion.article>

          <motion.article
            className="pl-card pl-pkg pl-gold"
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.12)}
          >
            <div className="pl-flag">✦ премиум</div>
            <div className="pl-top">
              <b>Премиум</b>
              <span className="pl-pp pl-g">от €12 000</span>
            </div>
            <p className="pl-pd">За по-сериозен бизнес — изцяло по поръчка.</p>
            <div className="pl-team">
              🤖 <b>6+</b> AI · 👤 <b>до 20</b> служителя
            </div>
            <ul className="pl-inc">
              <li>Всичко от Пълната платформа</li>
              <li>Custom интеграции (ERP, счетоводство, телефония)</li>
              <li>Брандиран дизайн „от бъдещето"</li>
              <li>Повече AI агенти, специфични за бизнеса</li>
            </ul>
          </motion.article>

          <motion.article
            className="pl-card pl-pkg"
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.2)}
          >
            <div className="pl-top">
              <b>Къстъм</b>
              <span className="pl-pp pl-pp-c">без таван</span>
            </div>
            <p className="pl-pd">За мащабни и сложни проекти.</p>
            <div className="pl-team">
              🤖 <b>∞</b> AI · 👤 <b>30+</b> служителя
            </div>
            <ul className="pl-inc">
              <li>Мулти-екип / мулти-локация</li>
              <li>Интеграции по поръчка + миграция</li>
              <li>Специални модули за твоята ниша</li>
              <li>Dedicated инфраструктура + SLA</li>
            </ul>
          </motion.article>
        </section>

        {/* ===== SUPPORT ===== */}
        <motion.h2 className="pl-sec" {...rise(reduced)}>
          <b>Поддръжка</b> · месечен абонамент
        </motion.h2>
        <section className="pl-grid3">
          <motion.article
            className="pl-card pl-plan"
            style={accent("#34e7e4")}
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.04)}
          >
            <h3 className="pl-pn">Базов</h3>
            <div className="pl-pr">
              €149<small>/мес</small>
            </div>
            <ul className="pl-feats">
              <li>
                <b>4</b> тикета за промяна / мес
              </li>
              <li>до 1 000 контакта · 5 автоматизации</li>
              <li>
                <i className="pl-ai pl-ai-l">AI</i> 1 агент
              </li>
              <li>имейл поддръжка · до 48ч</li>
            </ul>
          </motion.article>

          <motion.article
            className="pl-card pl-plan pl-plan-pop"
            style={accent("#a78bfa")}
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.12)}
          >
            <div className="pl-pop">Най-избиран</div>
            <h3 className="pl-pn">Про</h3>
            <div className="pl-pr">
              €199<small>/мес</small>
            </div>
            <ul className="pl-feats">
              <li>
                <b>6</b> тикета за промяна / мес
              </li>
              <li>до 5 000 контакта · 12 автоматизации</li>
              <li>
                <i className="pl-ai pl-ai-l">AI</i> до 3 агента
              </li>
              <li>приоритет · до 24ч</li>
            </ul>
          </motion.article>

          <motion.article
            className="pl-card pl-plan pl-gold"
            style={accent("#e7c984")}
            whileHover={reduced ? undefined : { y: -6 }}
            {...rise(reduced, 0.2)}
          >
            <h3 className="pl-pn">Премиум</h3>
            <div className="pl-pr">
              €299<small>/мес</small>
            </div>
            <ul className="pl-feats">
              <li>
                <b>10</b> тикета за промяна / мес
              </li>
              <li>високи лимити</li>
              <li>
                <i className="pl-ai pl-ai-l">AI</i> цял AI Екип
              </li>
              <li>приоритет · 12ч + тримесечна стратегия</li>
            </ul>
          </motion.article>
        </section>

        {/* ===== FOOTER ===== */}
        <motion.footer className="pl-foot" {...rise(reduced)}>
          <div className="pl-terms">
            🎟️ extra тикет <b>€20</b> · 📅 годишно <b>−2 месеца</b> · ☁️ платформи включени ·
            💳 изработка: депозит <b>50 / 50</b>
          </div>
          <Link className="pl-cta" href="/booking">
            Заяви консултация →
          </Link>
        </motion.footer>
      </div>

      <style>{`
        .pl-root{font-family:var(--pl-body),system-ui,sans-serif;position:relative;overflow-x:hidden;min-height:100vh;line-height:1.5;
          --cy:#34e7e4;--cy2:#7af5f0;--vi:#a78bfa;--vi2:#7c5cf0;--gold:#e7c984;--lime:#a3e635;
          --ink:#eef3fb;--mut:#8ea1bd;--dim:#6c7d97;--card:rgba(255,255,255,.026);--line:rgba(255,255,255,.08)}
        .pl-root *{box-sizing:border-box;margin:0;padding:0}

        /* ambient bg */
        .pl-aurora{position:fixed;inset:-20%;z-index:0;pointer-events:none;filter:blur(40px);
          background:radial-gradient(32% 40% at 14% 6%,rgba(52,231,228,.10),transparent 60%),
            radial-gradient(36% 44% at 88% 10%,rgba(167,139,250,.12),transparent 60%),
            radial-gradient(50% 50% at 50% 108%,rgba(231,201,132,.06),transparent 60%);
          animation:pl-drift 26s ease-in-out infinite alternate}
        @keyframes pl-drift{100%{transform:translate(-1.5%,1%) scale(1.05)}}
        .pl-grid{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.035;
          background-image:linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px);
          background-size:60px 60px;
          -webkit-mask-image:radial-gradient(circle at 50% 0%,#000,transparent 70%);
          mask-image:radial-gradient(circle at 50% 0%,#000,transparent 70%)}
        .pl-vignette{position:fixed;inset:0;z-index:0;pointer-events:none;
          background:radial-gradient(120% 90% at 50% 0%,transparent 55%,rgba(0,0,0,.55))}

        .pl-wrap{position:relative;z-index:2;max-width:1140px;margin:0 auto;padding:0 26px}

        /* topbar */
        .pl-topbar{position:relative;z-index:3;max-width:1140px;margin:0 auto;padding:24px 26px 0;display:flex;align-items:center;justify-content:space-between}
        .pl-brand{font-family:var(--pl-display),sans-serif;font-weight:800;font-size:15px;letter-spacing:.04em;color:var(--ink)}
        .pl-brand i{font-style:normal;background:linear-gradient(110deg,var(--cy),var(--vi));-webkit-background-clip:text;background-clip:text;color:transparent}
        .pl-syspill{font-family:var(--pl-mono),monospace;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--mut);border:1px solid var(--line);border-radius:999px;padding:7px 13px;display:flex;align-items:center;gap:8px}
        .pl-dot{width:6px;height:6px;border-radius:50%;background:var(--lime);box-shadow:0 0 10px var(--lime);animation:pl-blink 2s infinite}
        @keyframes pl-blink{50%{opacity:.35}}

        /* hero */
        .pl-hero{position:relative;z-index:2;max-width:1140px;margin:0 auto;padding:54px 26px 40px;display:grid;grid-template-columns:1.04fr .96fr;gap:30px;align-items:center;min-height:84vh}
        .pl-kicker{font-family:var(--pl-mono),monospace;font-size:11px;letter-spacing:.4em;text-transform:uppercase;color:var(--gold)}
        .pl-h1{font-family:var(--pl-display),sans-serif;font-weight:800;line-height:1.0;font-size:clamp(40px,5.6vw,74px);letter-spacing:-.02em;margin:20px 0 0;color:var(--ink)}
        .pl-h1 span{display:block;background:linear-gradient(108deg,var(--cy),var(--vi) 52%,var(--gold));background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 30px rgba(167,139,250,.28));animation:pl-shim 9s linear infinite}
        @keyframes pl-shim{to{background-position:200% center}}
        .pl-rule{width:64px;height:2px;margin:26px 0 0;border-radius:2px;background:linear-gradient(90deg,var(--cy),transparent)}
        .pl-sub{max-width:460px;margin:22px 0 0;color:var(--mut);font-size:clamp(15px,1.4vw,17px);line-height:1.7}
        .pl-chips{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}
        .pl-chips span{font-size:12px;color:#cdd9e8;background:rgba(255,255,255,.03);border:1px solid var(--line);padding:8px 14px;border-radius:999px}
        .pl-ctarow{display:flex;gap:14px;align-items:center;margin-top:32px;flex-wrap:wrap}
        .pl-cta{font-family:var(--pl-display),sans-serif;font-weight:700;font-size:14px;text-decoration:none;color:#0a0f08;background:linear-gradient(110deg,var(--cy),var(--cy2));padding:15px 28px;border-radius:13px;box-shadow:0 14px 40px rgba(52,231,228,.28);transition:transform .25s,box-shadow .25s;white-space:nowrap}
        .pl-cta:hover{transform:translateY(-2px);box-shadow:0 18px 54px rgba(52,231,228,.45)}
        .pl-ghost{font-size:13.5px;text-decoration:none;color:var(--ink);opacity:.8;border-bottom:1px solid var(--line);padding-bottom:3px}

        /* hero 3D stage */
        .pl-stage{position:relative;border-radius:26px;overflow:hidden;min-height:540px;height:62vh;
          border:1px solid rgba(122,245,240,.14);
          background:radial-gradient(60% 70% at 50% 45%,rgba(167,139,250,.08),transparent 70%),rgba(7,11,20,.45);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 40px 90px rgba(0,0,0,.55)}
        .pl-canvas{position:absolute!important;inset:0}
        .pl-stagetag{position:absolute;top:16px;left:18px;font-family:var(--pl-mono),monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--cy);display:flex;align-items:center;gap:8px;z-index:2}
        .pl-d{width:7px;height:7px;border-radius:50%;background:var(--cy);box-shadow:0 0 12px var(--cy);animation:pl-blink 1.6s infinite}
        .pl-stagecap{position:absolute;bottom:16px;left:0;right:0;text-align:center;font-family:var(--pl-mono),monospace;font-size:11px;letter-spacing:.14em;color:var(--dim);z-index:2}
        .pl-stagecap b{color:#bcccdf;font-weight:500}
        .pl-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
        .pl-orb{width:230px;height:230px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#c9fff9,var(--cy) 34%,var(--vi) 82%);box-shadow:0 0 70px rgba(52,231,228,.5),0 0 140px rgba(167,139,250,.4);animation:pl-breathe 4.5s ease-in-out infinite}
        @keyframes pl-breathe{50%{transform:scale(1.06)}}

        /* section heads */
        .pl-sec{font-family:var(--pl-mono),monospace;font-weight:500;font-size:12px;letter-spacing:.26em;text-transform:uppercase;color:var(--mut);margin:78px 0 22px;display:flex;align-items:center;gap:16px}
        .pl-sec b{color:var(--ink);font-weight:700;font-family:var(--pl-display),sans-serif;letter-spacing:.04em}
        .pl-sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(122,245,240,.4),transparent)}
        .pl-sublabel{font-family:var(--pl-mono),monospace;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--dim);margin:26px 0 14px}

        /* stats */
        .pl-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}
        .pl-stat{text-align:center;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 16px}
        .pl-statn{font-family:var(--pl-display),sans-serif;font-weight:800;font-size:34px;line-height:1;background:linear-gradient(120deg,#fff,var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
        .pl-statl{font-size:12px;color:var(--mut);margin-top:9px}

        /* shared cards */
        .pl-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
        .pl-card{position:relative;background:var(--card);backdrop-filter:blur(16px);border:1px solid var(--line);border-radius:22px;padding:26px;transition:border-color .45s,box-shadow .45s;box-shadow:0 24px 60px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.04);transform-style:preserve-3d}
        .pl-card:hover{border-color:rgba(122,245,240,.4);box-shadow:0 34px 80px rgba(0,0,0,.5),0 0 44px rgba(52,231,228,.12)}
        .pl-gold{border-color:rgba(231,201,132,.34)}
        .pl-gold:hover{border-color:rgba(231,201,132,.6);box-shadow:0 34px 80px rgba(0,0,0,.5),0 0 44px rgba(231,201,132,.16)}
        .pl-pkg-value{border-color:rgba(52,231,228,.3)}
        .pl-ph{font-family:var(--pl-mono),monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent,var(--cy))}
        .pl-name{font-family:var(--pl-display),sans-serif;font-weight:700;font-size:22px;margin:8px 0 4px;color:var(--ink)}
        .pl-tag{font-size:11.5px;color:var(--mut)}
        .pl-desc{font-size:13px;color:#c3cedd;margin:12px 0 16px;line-height:1.55}
        .pl-mods{list-style:none}
        .pl-mods li{padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06)}
        .pl-mods li:last-child{border:0}
        .pl-mt{display:flex;align-items:center;gap:9px;font-size:13.5px;font-weight:600;color:#eaf1f8}
        .pl-mt::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent,var(--cy));box-shadow:0 0 9px var(--accent,var(--cy));flex:none}
        .pl-ms{font-size:11.5px;color:var(--mut);margin-top:4px;padding-left:15px;line-height:1.5}
        .pl-ai{font-style:normal;font-size:9px;font-weight:700;letter-spacing:.06em;color:#06121a;background:linear-gradient(120deg,var(--cy),var(--lime));padding:2px 7px;border-radius:6px;margin-left:auto}
        .pl-ai-l{margin-left:0}
        .pl-meta{display:flex;align-items:center;justify-content:space-between;margin-top:18px}
        .pl-time{font-size:11.5px;color:var(--mut)}
        .pl-price{font-family:var(--pl-mono),monospace;font-weight:700;font-size:25px;background:linear-gradient(120deg,#fff,var(--accent,var(--cy)));-webkit-background-clip:text;background-clip:text;color:transparent}
        .pl-out{font-size:12px;color:var(--lime);background:rgba(163,230,53,.06);border:1px solid rgba(163,230,53,.18);border-radius:11px;padding:10px 13px;margin-top:16px}
        .pl-flag{position:absolute;top:16px;right:16px;font-family:var(--pl-mono),monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#1a1408;background:linear-gradient(120deg,var(--gold),#f6e3b0);padding:5px 11px;border-radius:8px;box-shadow:0 0 18px rgba(231,201,132,.4)}
        .pl-flag-cy{color:#04121a;background:var(--cy);box-shadow:0 0 18px rgba(52,231,228,.4)}

        /* packages */
        /* package flags hang from the top edge as a tab — never overlap the price */
        .pl-pkg .pl-flag{top:-1px;right:18px;border-radius:0 0 9px 9px}
        .pl-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:12px}
        .pl-top b{font-family:var(--pl-display),sans-serif;font-size:17px;color:var(--ink)}
        .pl-pp{font-family:var(--pl-mono),monospace;font-weight:700;font-size:20px;white-space:nowrap;color:#fff}
        .pl-pp.pl-g{background:linear-gradient(120deg,#fff,var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
        .pl-pp-c{font-size:15px;color:var(--gold)}
        .pl-pd{font-size:12px;color:var(--mut);margin:9px 0 12px;line-height:1.5}
        .pl-pd em{color:var(--lime);font-style:normal;font-weight:600}
        .pl-team{display:inline-flex;align-items:center;gap:7px;font-size:11px;color:var(--cy);background:rgba(52,231,228,.08);border:1px solid rgba(52,231,228,.24);border-radius:9px;padding:5px 11px;margin-bottom:12px}
        .pl-team b{font-family:var(--pl-mono),monospace;color:#fff;font-size:13px}
        .pl-inc{list-style:none}
        .pl-inc li{font-size:12px;color:#cdd9e8;padding:6px 0 6px 20px;position:relative;line-height:1.45}
        .pl-inc li::before{content:"›";position:absolute;left:2px;color:var(--gold);font-weight:700}

        /* support plans */
        .pl-pn{font-family:var(--pl-display),sans-serif;font-weight:700;font-size:19px;color:var(--ink)}
        .pl-pr{font-family:var(--pl-mono),monospace;font-weight:700;font-size:33px;margin:10px 0 18px;color:#fff}
        .pl-pr small{font-size:13px;color:var(--dim);font-weight:500}
        .pl-feats{list-style:none}
        .pl-feats li{font-size:12.5px;color:#cdd9e8;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:9px}
        .pl-feats li:last-child{border:0}
        .pl-feats li b{font-family:var(--pl-mono),monospace;color:var(--accent,var(--cy));font-size:14px}
        .pl-plan-pop{border-color:rgba(167,139,250,.42);box-shadow:0 24px 60px rgba(0,0,0,.42),0 0 40px rgba(167,139,250,.16)}
        .pl-pop{position:absolute;top:-1px;right:18px;font-family:var(--pl-mono),monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#fff;background:linear-gradient(120deg,var(--vi),var(--vi2));padding:5px 12px;border-radius:0 0 9px 9px;box-shadow:0 0 16px rgba(167,139,250,.5)}

        /* footer */
        .pl-foot{margin:40px 0 90px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px 28px;position:relative;overflow:hidden}
        .pl-foot::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--cy),var(--gold),var(--vi),transparent);background-size:220% 100%;animation:pl-sweep 6s linear infinite}
        @keyframes pl-sweep{to{background-position:-220% 0}}
        .pl-terms{font-size:12.5px;color:var(--mut);line-height:1.8}
        .pl-terms b{color:var(--ink)}

        @media (max-width:980px){
          .pl-hero{grid-template-columns:1fr;min-height:auto;padding-top:30px}
          .pl-stage{height:60vh;min-height:440px;order:2}
          .pl-copy{order:1}
          .pl-sub{max-width:none}
        }
        @media (max-width:760px){
          .pl-stats{grid-template-columns:1fr 1fr}
          .pl-grid3{grid-template-columns:1fr}
        }
        @media (prefers-reduced-motion:reduce){
          .pl-root *{animation:none!important}
        }
      `}</style>
    </main>
  );
}
