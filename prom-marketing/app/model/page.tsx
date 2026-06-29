"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/* ============================================================================
   ProMarketing — Продуктов модел (темплейт рамка по браншове)
   Схема: БАЗА (5–7 безупречни автоматизации) + CUSTOM ADD-ONS, по 3 зони.
   Самостоятелно, noindex. Нула връзки към CRM.
   ========================================================================== */

type Zone = {
  n: string; fam: "b2c" | "b2b"; tag: string; color: string; icon: string;
  name: string; who: string; base: string[]; subs: string[];
};

const ZONES: Zone[] = [
  {
    n: "01", fam: "b2c", tag: "B2C · ЛЕК", color: "var(--m-cyan)", icon: "◎",
    name: "Инфлуенсър / Личен бранд", who: "Създатели на съдържание и лични брандове",
    base: ["Instagram + Facebook свързване", "Meta реклами + Lead форми", "Личен AI асистент 24/7", "Авто-съдържание: постове + Reels", "DM + имейл автоматизация", "Лийдове на едно място"],
    subs: ["Мода", "Фитнес", "Храна", "Пътувания", "Красота"],
  },
  {
    n: "02", fam: "b2c", tag: "B2C", color: "var(--m-pink)", icon: "▣",
    name: "Онлайн магазин / Solo", who: "Сам или с 1 служител, продава онлайн",
    base: ["Meta реклами + ретаргет", "Соц. присъствие + публикации", "Интеграция на магазина (поръчки)", "Справки, статистика, обратна връзка", "AI асистент за клиенти", "Авто-съдържание за продукти"],
    subs: ["Дрехи", "Козметика", "Добавки", "Хендмейд", "Аксесоари"],
  },
  {
    n: "03", fam: "b2b", tag: "B2B · ТЕЖЪК", color: "var(--m-gold)", icon: "◆",
    name: "B2B / Фирми", who: "Компании с екипи и по-сложни процеси",
    base: ["CRM: лийд → оферта → сделка", "Reporting + живи дашборди", "ERP: фактури, проекти, доставка", "Сайт + лийд форми", "Follow-up машина", "Документи + е-подпис", "IT / интеграции по мярка"],
    subs: ["Дистрибутори", "Услуги", "Производство", "Агенции", "Логистика"],
  },
];

const SELL = [
  { icon: "∞", t: "Построй веднъж, продай много", d: "Темплейтът се преизползва за всеки клиент в бранша — без преоткриване всеки път." },
  { icon: "⚡", t: "Старт за дни, не месеци", d: "Базата е готова и изпипана → бърза доставка и ниска входна цена." },
  { icon: "↗", t: "Add-ons = маржът", d: "Custom надграждането над базата е upsell + повтаряема месечна поддръжка." },
];

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export default function ModelPage() {
  const [fam, setFam] = useState<"all" | "b2c" | "b2b">("all");

  return (
    <div className="m-root">
      <style>{CSS}</style>
      <div className="m-grid" aria-hidden />
      <div className="m-glow m-glow-1" aria-hidden />
      <div className="m-glow m-glow-2" aria-hidden />

      {/* HERO */}
      <header className="m-hero">
        <div className="m-brand"><span className="m-brand-dot" />ProMarketing<span style={{ color: "var(--m-cyan)" }}> · модел</span></div>
        <Reveal>
          <div className="m-eyebrow">ПРОДУКТОВ МОДЕЛ · ТЕМПЛЕЙТ РАМКА</div>
          <h1 className="m-h1">Построй веднъж.<br /><span className="m-grad">Продай много.</span></h1>
          <p className="m-lead">Всеки бранш получава една и съща <b>база</b> от 5–7 безупречни автоматизации. Над нея сглобяваме <b>custom add-ons</b>. Една рамка — безкрайно надграждане.</p>
        </Reveal>
      </header>

      {/* CONCEPT — база + add-ons */}
      <section className="m-section">
        <Reveal className="m-concept">
          <div className="m-stack">
            <div className="m-slab m-slab-addon">
              <div className="m-slab-tag" style={{ color: "var(--m-violet)" }}>+ ADD-ONS</div>
              <div className="m-slab-title">Custom решения</div>
              <div className="m-slab-sub">Персонализирано надграждане · доплащане · тук са маржовете</div>
            </div>
            <div className="m-plus">+</div>
            <div className="m-slab m-slab-base">
              <div className="m-slab-tag" style={{ color: "var(--m-cyan)" }}>БАЗА · ТЕМПЛЕЙТ</div>
              <div className="m-slab-title">5–7 безупречни автоматизации</div>
              <div className="m-slab-sub">Еднакви за всеки клиент в бранша · бързо · изпипано · ниска цена</div>
            </div>
          </div>
          <div className="m-concept-note">
            <div className="m-note-line"><span style={{ color: "var(--m-cyan)" }}>●</span> Базата = сладоледът: правим я еднакво добре всеки път.</div>
            <div className="m-note-line"><span style={{ color: "var(--m-violet)" }}>●</span> Add-ons = екстрите отгоре: каквото клиентът поиска, срещу доплащане.</div>
          </div>
        </Reveal>
      </section>

      {/* ZONES */}
      <section className="m-section">
        <Reveal>
          <div className="m-zones-head">
            <div>
              <div className="m-eyebrow">ПРИЛАГА СЕ ПО БРАНШОВЕ · 3 ЗОНИ</div>
              <h2 className="m-h2">Една база, <span className="m-grad">три посоки</span>.</h2>
            </div>
            <div className="m-filter">
              <button className={`m-fbtn ${fam === "all" ? "is-on" : ""}`} onClick={() => setFam("all")}>Всички</button>
              <button className={`m-fbtn ${fam === "b2c" ? "is-on" : ""}`} onClick={() => setFam("b2c")}>B2C</button>
              <button className={`m-fbtn ${fam === "b2b" ? "is-on" : ""}`} onClick={() => setFam("b2b")}>B2B</button>
            </div>
          </div>
        </Reveal>

        <div className="m-zones">
          {ZONES.map((z, i) => {
            const dim = fam !== "all" && fam !== z.fam;
            return (
              <Reveal key={z.n} delay={i * 0.08} className={`m-zone-wrap ${dim ? "is-dim" : ""}`}>
                <motion.div className="m-zone" style={{ "--zc": z.color } as React.CSSProperties} whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
                  {/* add-ons ghost layer */}
                  <div className="m-zone-addon">+ ADD-ONS · custom</div>

                  <div className="m-zone-top">
                    <span className="m-zone-ico" style={{ color: z.color, borderColor: z.color }}>{z.icon}</span>
                    <span className="m-zone-n">{z.n}</span>
                    <span className="m-zone-tag" style={{ color: z.color, borderColor: z.color }}>{z.tag}</span>
                  </div>
                  <div className="m-zone-name">{z.name}</div>
                  <div className="m-zone-who">{z.who}</div>

                  <div className="m-base-label">БАЗА · ТЕМПЛЕЙТ <span>{z.base.length} автоматизации</span></div>
                  <div className="m-base-list">
                    {z.base.map((b, j) => (
                      <div className="m-base-row" key={j}>
                        <span className="m-base-num" style={{ color: z.color, borderColor: z.color }}>{j + 1}</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="m-subs">
                    <div className="m-subs-label">Под-браншове (примерно)</div>
                    <div className="m-subs-chips">
                      {z.subs.map((s) => <span className="m-chip" key={s}>{s}</span>)}
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
        <Reveal>
          <p className="m-zones-foot">Всеки под-бранш = свой темплейт-комбо от базовите автоматизации. Детайлите по браншове се уточняват и добавят.</p>
        </Reveal>
      </section>

      {/* SELL */}
      <section className="m-section">
        <Reveal>
          <div className="m-eyebrow" style={{ textAlign: "center" }}>КАК СЕ ПРОДАВА</div>
          <h2 className="m-h2 m-center">Логиката зад модела.</h2>
        </Reveal>
        <div className="m-sell">
          {SELL.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="m-sell-card">
                <span className="m-sell-ico">{s.icon}</span>
                <div className="m-sell-t">{s.t}</div>
                <div className="m-sell-d">{s.d}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="m-footer">
        <div className="m-brand"><span className="m-brand-dot" />ProMarketing</div>
        <p>Жива рамка — базата е фиксирана и изпипана, всичко над нея е custom. Построй веднъж, продай много.</p>
        <a className="m-cta" href="https://promarketing.pw/demo" target="_blank" rel="noreferrer">Виж живото демо →</a>
      </footer>
    </div>
  );
}

const CSS = `
.m-root{position:relative;min-height:100vh;font-family:var(--m-body),system-ui,sans-serif;color:var(--m-text);overflow:hidden;padding-bottom:40px;}
.m-root *{box-sizing:border-box;}
.m-root button{font-family:inherit;cursor:pointer;}

.m-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(125,160,220,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(125,160,220,.05) 1px,transparent 1px);background-size:58px 58px;mask-image:radial-gradient(ellipse 90% 60% at 50% 0%,#000 35%,transparent 80%);}
.m-glow{position:fixed;z-index:0;pointer-events:none;border-radius:50%;filter:blur(100px);opacity:.5;}
.m-glow-1{width:680px;height:680px;top:-220px;left:50%;transform:translateX(-50%);background:radial-gradient(circle,rgba(45,212,218,.18),transparent 62%);}
.m-glow-2{width:560px;height:560px;bottom:-220px;right:-120px;background:radial-gradient(circle,rgba(157,123,255,.16),transparent 62%);}

.m-section{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:0 24px;}
.m-eyebrow{font-family:var(--m-mono);font-size:11px;letter-spacing:3px;color:var(--m-cyan);margin-bottom:14px;}
.m-grad{background:linear-gradient(100deg,var(--m-cyan),var(--m-violet) 55%,var(--m-pink));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}

.m-hero{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:40px 24px 30px;}
.m-brand{display:inline-flex;align-items:center;gap:9px;font-family:var(--m-display);font-weight:800;font-size:16px;letter-spacing:.5px;}
.m-brand-dot{width:10px;height:10px;border-radius:50%;background:var(--m-cyan);box-shadow:0 0 14px var(--m-cyan);}
.m-h1{font-family:var(--m-display);font-weight:800;font-size:clamp(34px,6vw,64px);line-height:1.05;letter-spacing:-.02em;margin:26px 0 0;}
.m-lead{color:var(--m-dim);font-size:clamp(15px,1.6vw,18px);line-height:1.6;max-width:640px;margin:20px 0 0;}
.m-lead b{color:var(--m-text);font-weight:700;}

/* concept */
.m-concept{margin-top:18px;border:1px solid var(--m-line);border-radius:20px;background:var(--m-panel);padding:26px;display:grid;grid-template-columns:1.1fr 1fr;gap:26px;align-items:center;}
.m-stack{display:flex;flex-direction:column;gap:0;}
.m-slab{border-radius:14px;padding:18px 20px;}
.m-slab-addon{border:1.5px dashed var(--m-line-bright);background:rgba(157,123,255,.06);}
.m-slab-base{border:1px solid var(--m-line-bright);background:linear-gradient(180deg,rgba(45,212,218,.12),rgba(45,212,218,.03));box-shadow:0 18px 50px -28px var(--m-cyan);}
.m-plus{text-align:center;font-family:var(--m-display);font-weight:800;font-size:24px;color:var(--m-faint);margin:6px 0;}
.m-slab-tag{font-family:var(--m-mono);font-size:11px;letter-spacing:2px;font-weight:700;margin-bottom:7px;}
.m-slab-title{font-family:var(--m-display);font-weight:700;font-size:18px;}
.m-slab-sub{color:var(--m-dim);font-size:13px;line-height:1.5;margin-top:5px;}
.m-concept-note{display:flex;flex-direction:column;gap:12px;}
.m-note-line{font-size:14.5px;line-height:1.55;color:var(--m-dim);}

/* zones */
.m-section + .m-section{margin-top:54px;}
.m-zones-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap;}
.m-h2{font-family:var(--m-display);font-weight:800;font-size:clamp(24px,3.4vw,38px);line-height:1.1;margin:0;letter-spacing:-.01em;}
.m-center{text-align:center;}
.m-filter{display:flex;gap:7px;}
.m-fbtn{padding:9px 16px;border-radius:20px;border:1px solid var(--m-line);background:rgba(125,160,220,.05);color:var(--m-dim);font-size:13px;font-weight:600;transition:.16s;}
.m-fbtn:hover{color:var(--m-text);}
.m-fbtn.is-on{background:rgba(45,212,218,.12);color:var(--m-cyan);border-color:var(--m-line-bright);}

.m-zones{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:start;}
.m-zone-wrap{transition:opacity .3s;}
.m-zone-wrap.is-dim{opacity:.32;filter:saturate(.5);}
.m-zone{position:relative;border:1px solid var(--m-line);border-top:2px solid var(--zc);border-radius:16px;background:var(--m-panel);padding:20px;margin-top:34px;}
.m-zone-addon{position:absolute;top:-30px;left:14px;right:14px;height:30px;border:1.5px dashed var(--m-line);border-bottom:none;border-radius:12px 12px 0 0;background:rgba(157,123,255,.05);display:flex;align-items:center;justify-content:center;font-family:var(--m-mono);font-size:10.5px;letter-spacing:1.5px;color:var(--m-faint);}
.m-zone-top{display:flex;align-items:center;gap:10px;margin-bottom:13px;}
.m-zone-ico{width:38px;height:38px;border-radius:11px;border:1px solid;display:flex;align-items:center;justify-content:center;font-size:18px;opacity:.95;}
.m-zone-n{font-family:var(--m-mono);font-size:13px;color:var(--m-faint);}
.m-zone-tag{margin-left:auto;font-family:var(--m-mono);font-size:10px;letter-spacing:1px;padding:4px 9px;border:1px solid;border-radius:20px;opacity:.9;}
.m-zone-name{font-family:var(--m-display);font-weight:700;font-size:18px;line-height:1.2;}
.m-zone-who{color:var(--m-dim);font-size:13px;line-height:1.45;margin:5px 0 16px;min-height:38px;}
.m-base-label{display:flex;align-items:center;justify-content:space-between;font-family:var(--m-mono);font-size:10.5px;letter-spacing:1.5px;color:var(--m-cyan);font-weight:700;margin-bottom:11px;border-top:1px solid var(--m-line);padding-top:13px;}
.m-base-label span{color:var(--m-faint);font-weight:500;letter-spacing:.5px;}
.m-base-list{display:flex;flex-direction:column;gap:9px;}
.m-base-row{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.4;color:var(--m-text);}
.m-base-num{flex:none;width:20px;height:20px;border-radius:6px;border:1px solid;display:flex;align-items:center;justify-content:center;font-family:var(--m-mono);font-size:10.5px;margin-top:1px;}
.m-subs{margin-top:16px;border-top:1px solid var(--m-line);padding-top:13px;}
.m-subs-label{font-size:11px;color:var(--m-faint);margin-bottom:8px;}
.m-subs-chips{display:flex;flex-wrap:wrap;gap:6px;}
.m-chip{font-size:11.5px;padding:4px 10px;border-radius:20px;border:1px solid var(--m-line);color:var(--m-dim);background:rgba(125,160,220,.04);}
.m-zones-foot{text-align:center;color:var(--m-faint);font-size:13px;margin-top:20px;max-width:640px;margin-left:auto;margin-right:auto;line-height:1.5;}

/* sell */
.m-sell{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px;}
.m-sell-card{height:100%;border:1px solid var(--m-line);border-radius:16px;background:var(--m-panel);padding:22px;}
.m-sell-ico{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;border:1px solid var(--m-line-bright);color:var(--m-cyan);font-size:20px;margin-bottom:14px;}
.m-sell-t{font-family:var(--m-display);font-weight:700;font-size:16px;margin-bottom:7px;}
.m-sell-d{color:var(--m-dim);font-size:13.5px;line-height:1.55;}

/* footer */
.m-footer{position:relative;z-index:1;max-width:1120px;margin:64px auto 0;padding:30px 24px;text-align:center;border-top:1px solid var(--m-line);}
.m-footer .m-brand{justify-content:center;}
.m-footer p{color:var(--m-dim);font-size:14px;line-height:1.6;max-width:560px;margin:14px auto 18px;}
.m-cta{display:inline-block;padding:13px 28px;border-radius:11px;background:var(--m-cyan);color:#04121a;font-weight:700;font-size:14px;text-decoration:none;transition:.2s;}
.m-cta:hover{box-shadow:0 0 26px rgba(45,212,218,.4);transform:translateY(-1px);}

@media(max-width:880px){
  .m-concept{grid-template-columns:1fr;gap:20px;}
  .m-zones{grid-template-columns:1fr;}
  .m-sell{grid-template-columns:1fr;}
  .m-zone{margin-top:34px;}
}
`;
