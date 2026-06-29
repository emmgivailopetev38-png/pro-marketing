"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { BRANDS, type BrandKey } from "@/components/brands";

/* ============================================================================
   ProMarketing — Продуктов модел (темплейт рамка по браншове)
   Визуален strategic/business framework. Самостоятелно, noindex.
   ========================================================================== */

type Zone = {
  n: string; fam: "b2c" | "b2b"; tag: string; color: string; icon: string;
  name: string; who: string; base: string[]; subs: string[]; demo: string;
  solves: string; result: string;
};

const ZONES: Zone[] = [
  {
    n: "01", fam: "b2c", tag: "B2C · ЛЕК", color: "var(--m-cyan)", icon: "◎",
    name: "Инфлуенсър / Личен бранд", who: "Създатели на съдържание и лични брандове",
    base: ["Instagram + Facebook свързване", "Meta реклами + Lead форми", "Личен AI асистент 24/7", "Авто-съдържание: постове + Reels", "DM + имейл автоматизация", "CRM за последователи + партньорства"],
    subs: ["Мода", "Фитнес", "Храна", "Пътувания", "Красота"],
    demo: "/demo/influencer",
    solves: "разпиляно съдържание и пропуснати DM/заявки",
    result: "повече последователи, отговорени запитвания и сделки с брандове",
  },
  {
    n: "02", fam: "b2c", tag: "B2C", color: "var(--m-pink)", icon: "▣",
    name: "Онлайн магазин / E-commerce", who: "Магазини — сам, малък екип или растящи",
    base: ["Meta реклами + ретаргет", "Соц. присъствие + публикации", "Магазин + поръчки → CRM", "Email/SMS flows", "AI асистент за клиенти", "Reporting: продукти, реклами, маржове"],
    subs: ["Козметика", "Добавки", "Дрехи", "Храни", "Локални продукти"],
    demo: "/demo/shop",
    solves: "ръчна работа, бавни отговори и неясни числа",
    result: "повече поръчки, по-висок ROAS и контрол на маржовете",
  },
  {
    n: "03", fam: "b2b", tag: "B2B · ТЕЖЪК", color: "var(--m-gold)", icon: "◆",
    name: "B2B / Услуги / Локални бизнеси", who: "Агенции, консултанти, сервизи, кабинети, имоти",
    base: ["CRM + lead management", "Pipeline за сделки + оферти", "Фактури + ERP/operational dashboard", "Follow-up + автоматични имейли", "Реклами (Meta/Google/LinkedIn)", "KPI табло + onboarding на клиенти"],
    subs: ["Агенции", "Консултанти", "Сервизи", "Мед. кабинети", "Строителство", "Счетоводство", "Имоти"],
    demo: "/demo/b2b",
    solves: "хаос от лийдове, бавни оферти и липса на контрол",
    result: "повече сделки, бързи оферти и пълна видимост",
  },
];

const NAMES = [
  { t: "ProMarketing Business OS", rec: true },
  { t: "AI Business Template Engine", rec: false },
  { t: "Industry Automation Framework", rec: false },
  { t: "ProMarketing Growth Systems", rec: false },
  { t: "Business Automation Blueprint", rec: false },
  { t: "AI Operating System for Business", rec: false },
  { t: "ProMarketing Vertical OS", rec: false },
  { t: "Plug & Grow Systems", rec: false },
];

const CONNECT: BrandKey[] = ["facebook", "instagram", "tiktok", "linkedin", "youtube", "messenger", "whatsapp", "viber", "telegram", "gmail", "google", "googleads", "meta"];

const ARCH = [
  { k: "01", t: "Core Engine · Ядро", d: "Стабилната, доказана основа — една за всички.", c: "var(--m-cyan)" },
  { k: "02", t: "Industry Templates · Браншови шаблони", d: "3-те зони: Influencer · E-commerce · B2B.", c: "var(--m-pink)" },
  { k: "03", t: "Add-ons · Модули", d: "Допълнителни, продаваеми отделно възможности.", c: "var(--m-violet)" },
  { k: "04", t: "Custom Implementation · Персонализация", d: "Нагласяме системата според конкретния клиент.", c: "var(--m-gold)" },
  { k: "05", t: "Reporting & Optimization", d: "Постоянни отчети и подобрение на резултатите.", c: "var(--m-emerald)" },
];

const CORE = [
  { i: "⇄", t: "CRM" }, { i: "◎", t: "Lead capture" }, { i: "▤", t: "Сайт / Landing" },
  { i: "✦", t: "Meta реклами" }, { i: "✉", t: "Email / SMS" }, { i: "❖", t: "AI асистент" },
  { i: "▦", t: "Reporting табло" }, { i: "↻", t: "Task автоматизация" }, { i: "✶", t: "Клиентска комуникация" },
  { i: "◈", t: "Оферти / Фактури" }, { i: "◷", t: "Аналитика" }, { i: "➤", t: "Follow-up система" },
];

const ADDONS = [
  "AI гласов агент", "AI чат агент", "Advanced CRM", "ERP", "Складова наличност", "Фактуриране",
  "Meta ads автоматизация", "Google Ads", "LinkedIn outreach", "Email маркетинг", "SMS маркетинг",
  "WhatsApp / Viber автоматизация", "Генериране на съдържание", "Социален календар", "Influencer outreach",
  "Събиране на ревюта", "Бот за поддръжка", "Sales pipeline автоматизация", "Финансови отчети",
  "Owner dashboard", "Екипен task мениджър",
];

const PHRASES = [
  "Не Ви даваме инструмент — даваме система, която работи за Вас.",
  "Заявките влизат сами. Процесите се случват сами. Вие командвате.",
  "Готова бизнес операционна система за дни, не за месеци.",
  "Спрете да губите клиенти между чатове, имейли и забравени обаждания.",
  "Една система вместо седем приложения.",
  "Построена веднъж, оптимизирана вечно.",
  "Контрол върху всеки лев и всеки клиент.",
];

const PACKAGES = [
  { name: "Starter", gist: "Бърз старт с една база", popular: false, color: "var(--m-sky)",
    inc: ["Core ядро + 1 браншови темплейт", "Свързване на основните канали", "Базови автоматизации", "Отчет на месец"], fee: "Setup + малка месечна поддръжка" },
  { name: "Growth", gist: "Растеж с реклами + add-ons", popular: true, color: "var(--m-cyan)",
    inc: ["Всичко от Starter", "Управление на реклами", "3–5 add-ons по избор", "Email/SMS flows", "Разширени отчети"], fee: "Setup + месечна + реклами" },
  { name: "Pro", gist: "Пълна система за мащаб", popular: false, color: "var(--m-violet)",
    inc: ["Всичко от Growth", "Повечето add-ons", "AI асистент(и)", "KPI табло за собственика", "Приоритетна поддръжка"], fee: "Setup + по-висока месечна + реклами" },
  { name: "Enterprise / Custom", gist: "Изцяло по мярка", popular: false, color: "var(--m-gold)",
    inc: ["Пълна персонализация", "ERP + интеграции", "Екипни процеси + onboarding", "SLA + посветен екип"], fee: "По договаряне" },
];

const FEES = ["Setup fee", "Месечна поддръжка", "Управление на реклами", "Автоматизации", "Add-ons", "Premium custom", "Performance бонус"];

const STEPS = [
  "Диагностика на бизнеса", "Избор на template", "Персонализация", "Свързване на CRM/реклами/автоматизации",
  "Тестване", "Launch", "Оптимизация", "Месечни отчети",
];

const DELIVERABLES = [
  "CRM структури", "Landing pages", "Ad copy", "Automation flows", "Dashboards",
  "Onboarding форми", "Reporting шаблони", "Sales scripts", "Оферти", "Браншови checklists",
];

const NEXT = [
  "Дефинираме 3-те генерални темплейта", "Разбиваме ги на конкретни браншове",
  "Checklist с автоматизации за всеки бранш", "Offer page за всеки темплейт",
  "Рекламни кампании за всеки темплейт", "Продаваме като готова система",
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
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <Reveal className="m-shead">
      <div className="m-eyebrow">{eyebrow}</div>
      <h2 className="m-h2">{title}</h2>
      {sub && <p className="m-shead-sub">{sub}</p>}
    </Reveal>
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
        <div className="m-brand"><span className="m-brand-dot" />ProMarketing<span style={{ color: "var(--m-cyan)" }}> · Business OS</span></div>
        <Reveal>
          <div className="m-eyebrow">ПРОДУКТОВ МОДЕЛ · ТЕМПЛЕЙТ РАМКА</div>
          <h1 className="m-h1">Построй веднъж.<br /><span className="m-grad">Продай много.</span></h1>
          <p className="m-lead">ProMarketing създава <b>template-based AI бизнес операционни системи</b> за различни браншове. Основата е една стабилна, доказана система; според бранша добавяме специфични модули, а после персонализираме. Готов продукт — лесен за обяснение, реклама и бързо внедряване.</p>
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
              <div className="m-slab-title">Стабилно ядро + браншов шаблон</div>
              <div className="m-slab-sub">Готово и доказано · бързо · изпипано · ниска цена</div>
            </div>
          </div>
          <div className="m-concept-note">
            <div className="m-note-line"><span style={{ color: "var(--m-cyan)" }}>●</span> Базата = сладоледът: правим я еднакво добре всеки път.</div>
            <div className="m-note-line"><span style={{ color: "var(--m-violet)" }}>●</span> Add-ons = екстрите отгоре: каквото клиентът поиска, срещу доплащане.</div>
          </div>
        </Reveal>
      </section>

      {/* СВЪРЗВАМЕ — брандови икони */}
      <section className="m-section">
        <SectionHead eyebrow="ВСИЧКИ КАНАЛИ · ЕДНА СИСТЕМА" title={<>Свързваме <span className="m-grad">всичко</span> в едно ядро.</>} sub="Реклами, съобщения, поща, форми и обаждания — всичко влиза автоматично в системата." />
        <div className="m-connect">
          {CONNECT.map((k, i) => { const b = BRANDS[k]; const Icon = b.Icon; return (
            <Reveal key={k} delay={Math.min(i * 0.03, 0.3)}>
              <div className="m-conn" style={{ "--bc": b.color } as React.CSSProperties}>
                <span className="m-conn-ic"><Icon /></span>
                <span className="m-conn-n">{b.name}</span>
              </div>
            </Reveal>
          ); })}
        </div>
      </section>

      {/* АРХИТЕКТУРА */}
      <section className="m-section">
        <SectionHead eyebrow="ОСНОВНА АРХИТЕКТУРА" title={<>Пет слоя, <span className="m-grad">един продукт</span>.</>} />
        <div className="m-arch">
          {ARCH.map((a, i) => (
            <Reveal key={a.k} delay={i * 0.06}>
              <div className="m-layer" style={{ "--lc": a.c } as React.CSSProperties}>
                <span className="m-layer-k">{a.k}</span>
                <div className="m-layer-main"><div className="m-layer-t">{a.t}</div><div className="m-layer-d">{a.d}</div></div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CORE МОДУЛИ */}
      <section className="m-section">
        <SectionHead eyebrow="CORE МОДУЛИ · ЯДРОТО" title={<>Това, което <span className="m-grad">почти всеки</span> бизнес получава.</>} sub="Споделената основа под всеки браншови темплейт." />
        <div className="m-core">
          {CORE.map((c, i) => (
            <Reveal key={c.t} delay={i * 0.03}>
              <div className="m-mod"><span className="m-mod-i">{c.i}</span><span>{c.t}</span></div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ZONES */}
      <section className="m-section">
        <Reveal>
          <div className="m-zones-head">
            <div>
              <div className="m-eyebrow">ИНДУСТРИАЛНИ ТЕМПЛЕЙТИ · 3 ЗОНИ</div>
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
                      <div className="m-base-row" key={j}><span className="m-base-num" style={{ color: z.color, borderColor: z.color }}>{j + 1}</span><span>{b}</span></div>
                    ))}
                  </div>

                  <div className="m-zone-meta">
                    <div><span className="m-meta-k">Решава</span> {z.solves}</div>
                    <div><span className="m-meta-k" style={{ color: z.color }}>Резултат</span> {z.result}</div>
                  </div>

                  <div className="m-subs">
                    <div className="m-subs-label">Под-браншове (примерно)</div>
                    <div className="m-subs-chips">{z.subs.map((s) => <span className="m-chip" key={s}>{s}</span>)}</div>
                  </div>
                  <a className="m-zone-demo" href={z.demo} style={{ borderColor: z.color, color: z.color }}>Виж демо на живо →</a>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
        <Reveal><p className="m-zones-foot">Всеки под-бранш = свой темплейт-комбо от базовите автоматизации. Детайлите по браншове се уточняват и добавят.</p></Reveal>
      </section>

      {/* ADD-ONS */}
      <section className="m-section">
        <SectionHead eyebrow="ADD-ONS · ПРОДАВАТ СЕ ОТДЕЛНО" title={<>Надграждане <span className="m-grad">върху всеки темплейт</span>.</>} sub="Всеки модул е отделен приход — upsell над базата." />
        <div className="m-addons">
          {ADDONS.map((a, i) => (
            <Reveal key={a} delay={Math.min(i * 0.02, 0.3)}><span className="m-addon"><span className="m-addon-dot" />{a}</span></Reveal>
          ))}
        </div>
      </section>

      {/* ПОЗИЦИОНИРАНЕ */}
      <section className="m-section">
        <SectionHead eyebrow="КАК СЕ ПРОДАВА · ПОЗИЦИОНИРАНЕ" title={<>Не продаваме части. <span className="m-grad">Продаваме система.</span></>} />
        <Reveal className="m-pos">
          <div className="m-pos-no">
            <span>Не продаваме „сайт"</span><span>Не продаваме „реклами"</span><span>Не продаваме „CRM"</span>
          </div>
          <div className="m-pos-yes">Продаваме <b>готова бизнес система</b>, която носи заявки, автоматизира процеси и дава контрол на собственика.</div>
        </Reveal>
        <div className="m-phrases">
          {PHRASES.map((p, i) => (
            <Reveal key={p} delay={i * 0.05}><div className="m-phrase">{p}</div></Reveal>
          ))}
        </div>
      </section>

      {/* ПАКЕТИ */}
      <section className="m-section">
        <SectionHead eyebrow="ЦЕНОВИ МОДЕЛ · ПАКЕТИ" title={<>Четири нива, <span className="m-grad">един продукт</span>.</>} sub="Setup + месечно + реклами + add-ons. Сумите са ориентир — финализираме заедно." />
        <div className="m-packs">
          {PACKAGES.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06}>
              <div className={`m-pack ${p.popular ? "is-pop" : ""}`} style={{ "--pc": p.color } as React.CSSProperties}>
                {p.popular && <span className="m-pack-badge">Най-избиран</span>}
                <div className="m-pack-name">{p.name}</div>
                <div className="m-pack-gist">{p.gist}</div>
                <div className="m-pack-inc">{p.inc.map((x) => <div key={x} className="m-pack-row"><span style={{ color: p.color }}>✓</span> {x}</div>)}</div>
                <div className="m-pack-fee">{p.fee}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="m-fees">
            <span className="m-fees-label">Компоненти на цената:</span>
            {FEES.map((f) => <span key={f} className="m-chip">{f}</span>)}
          </div>
        </Reveal>
      </section>

      {/* ВНЕДРЯВАНЕ */}
      <section className="m-section">
        <SectionHead eyebrow="ВНЕДРЯВАНЕ · ПРОЦЕС" title={<>От диагностика до <span className="m-grad">оптимизация</span>.</>} />
        <div className="m-steps">
          {STEPS.map((s, i) => (
            <Reveal key={s} delay={i * 0.05}>
              <div className="m-step"><span className="m-step-n">{i + 1}</span><span className="m-step-t">{s}</span></div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* DELIVERABLES */}
      <section className="m-section">
        <SectionHead eyebrow="КАКВО РАЗРАБОТВАМЕ · DELIVERABLES" title={<>Темплейтите, които <span className="m-grad">строим веднъж</span>.</>} sub="Готови активи, които преизползваме за всеки нов клиент." />
        <div className="m-deliv">
          {DELIVERABLES.map((d, i) => (
            <Reveal key={d} delay={Math.min(i * 0.03, 0.3)}><span className="m-deliv-item"><span className="m-deliv-i">▤</span>{d}</span></Reveal>
          ))}
        </div>
      </section>

      {/* ЗАЩО РАБОТИ */}
      <section className="m-section">
        <SectionHead eyebrow="ЗАЩО РАБОТИ" title={<>Логиката зад модела.</>} />
        <div className="m-sell">
          {SELL.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="m-sell-card"><span className="m-sell-ico">{s.icon}</span><div className="m-sell-t">{s.t}</div><div className="m-sell-d">{s.d}</div></div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* СЛЕДВАЩИ СТЪПКИ */}
      <section className="m-section">
        <SectionHead eyebrow="СЛЕДВАЩИ СТЪПКИ · ПЛАН" title={<>Пътят към <span className="m-grad">готовия продукт</span>.</>} />
        <div className="m-next">
          {NEXT.map((s, i) => (
            <Reveal key={s} delay={i * 0.05}>
              <div className="m-next-item"><span className="m-next-n">{i + 1}</span><span>{s}</span>{i < NEXT.length - 1 && <span className="m-next-arrow">→</span>}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ИМЕНА */}
      <section className="m-section">
        <SectionHead eyebrow="ИME НА МОДЕЛА · ПРЕДЛОЖЕНИЯ" title={<>Как да го <span className="m-grad">наречем</span>.</>} />
        <div className="m-names">
          {NAMES.map((n, i) => (
            <Reveal key={n.t} delay={i * 0.04}>
              <div className={`m-name ${n.rec ? "is-rec" : ""}`}>{n.rec && <span className="m-name-tag">препоръка</span>}{n.t}</div>
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
.m-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(125,160,220,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(125,160,220,.05) 1px,transparent 1px);background-size:58px 58px;mask-image:radial-gradient(ellipse 90% 50% at 50% 0%,#000 35%,transparent 80%);}
.m-glow{position:fixed;z-index:0;pointer-events:none;border-radius:50%;filter:blur(100px);opacity:.45;}
.m-glow-1{width:680px;height:680px;top:-240px;left:50%;transform:translateX(-50%);background:radial-gradient(circle,rgba(45,212,218,.18),transparent 62%);}
.m-glow-2{width:560px;height:560px;bottom:-220px;right:-120px;background:radial-gradient(circle,rgba(157,123,255,.16),transparent 62%);}

.m-section{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:0 24px;}
.m-section + .m-section{margin-top:58px;}
.m-eyebrow{font-family:var(--m-mono);font-size:11px;letter-spacing:3px;color:var(--m-cyan);margin-bottom:13px;}
.m-grad{background:linear-gradient(100deg,var(--m-cyan),var(--m-violet) 55%,var(--m-pink));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
.m-shead{margin-bottom:24px;}
.m-shead-sub{color:var(--m-dim);font-size:14.5px;line-height:1.6;max-width:600px;margin:12px 0 0;}

.m-hero{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:40px 24px 30px;}
.m-brand{display:inline-flex;align-items:center;gap:9px;font-family:var(--m-display);font-weight:800;font-size:16px;letter-spacing:.5px;}
.m-brand-dot{width:10px;height:10px;border-radius:50%;background:var(--m-cyan);box-shadow:0 0 14px var(--m-cyan);}
.m-h1{font-family:var(--m-display);font-weight:800;font-size:clamp(34px,6vw,64px);line-height:1.05;letter-spacing:-.02em;margin:26px 0 0;}
.m-h2{font-family:var(--m-display);font-weight:800;font-size:clamp(24px,3.4vw,38px);line-height:1.1;margin:0;letter-spacing:-.01em;}
.m-lead{color:var(--m-dim);font-size:clamp(15px,1.6vw,18px);line-height:1.65;max-width:680px;margin:20px 0 0;}
.m-lead b,.m-pos-yes b{color:var(--m-text);font-weight:700;}

/* concept */
.m-concept{border:1px solid var(--m-line);border-radius:20px;background:var(--m-panel);padding:26px;display:grid;grid-template-columns:1.1fr 1fr;gap:26px;align-items:center;}
.m-stack{display:flex;flex-direction:column;}
.m-slab{border-radius:14px;padding:18px 20px;}
.m-slab-addon{border:1.5px dashed var(--m-line-bright);background:rgba(157,123,255,.06);}
.m-slab-base{border:1px solid var(--m-line-bright);background:linear-gradient(180deg,rgba(45,212,218,.12),rgba(45,212,218,.03));box-shadow:0 18px 50px -28px var(--m-cyan);}
.m-plus{text-align:center;font-family:var(--m-display);font-weight:800;font-size:24px;color:var(--m-faint);margin:6px 0;}
.m-slab-tag{font-family:var(--m-mono);font-size:11px;letter-spacing:2px;font-weight:700;margin-bottom:7px;}
.m-slab-title{font-family:var(--m-display);font-weight:700;font-size:18px;}
.m-slab-sub{color:var(--m-dim);font-size:13px;line-height:1.5;margin-top:5px;}
.m-concept-note{display:flex;flex-direction:column;gap:12px;}
.m-note-line{font-size:14.5px;line-height:1.55;color:var(--m-dim);}

/* connect / brands */
.m-connect{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:12px;}
.m-conn{display:flex;flex-direction:column;align-items:center;gap:10px;border:1px solid var(--m-line);border-radius:14px;background:var(--m-panel);padding:18px 10px;transition:.18s;}
.m-conn:hover{border-color:color-mix(in srgb,var(--bc) 60%,transparent);box-shadow:0 0 28px color-mix(in srgb,var(--bc) 30%,transparent);transform:translateY(-3px);}
.m-conn-ic{display:flex;align-items:center;justify-content:center;width:50px;height:50px;border-radius:50%;font-size:25px;color:var(--bc);border:1px solid color-mix(in srgb,var(--bc) 38%,transparent);background:color-mix(in srgb,var(--bc) 11%,transparent);}
.m-conn-n{font-size:12px;color:var(--m-dim);font-weight:600;}

/* architecture */
.m-arch{display:flex;flex-direction:column;gap:10px;}
.m-layer{display:flex;align-items:center;gap:16px;border:1px solid var(--m-line);border-left:3px solid var(--lc);border-radius:12px;background:var(--m-panel);padding:16px 20px;}
.m-layer-k{font-family:var(--m-mono);font-size:15px;color:var(--lc);font-weight:700;flex:none;width:30px;}
.m-layer-t{font-family:var(--m-display);font-weight:700;font-size:15.5px;}
.m-layer-d{color:var(--m-dim);font-size:13px;margin-top:3px;}

/* core modules */
.m-core{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.m-mod{display:flex;align-items:center;gap:11px;border:1px solid var(--m-line);border-radius:12px;background:var(--m-panel);padding:14px 16px;font-size:14px;font-weight:600;}
.m-mod-i{flex:none;width:34px;height:34px;border-radius:9px;border:1px solid var(--m-line-bright);display:flex;align-items:center;justify-content:center;color:var(--m-cyan);font-size:16px;}

/* zones */
.m-zones-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap;}
.m-filter{display:flex;gap:7px;}
.m-fbtn{padding:9px 16px;border-radius:20px;border:1px solid var(--m-line);background:rgba(125,160,220,.05);color:var(--m-dim);font-size:13px;font-weight:600;transition:.16s;}
.m-fbtn:hover{color:var(--m-text);}
.m-fbtn.is-on{background:rgba(45,212,218,.12);color:var(--m-cyan);border-color:var(--m-line-bright);}
.m-zones{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:start;}
.m-zone-wrap{transition:opacity .3s;}
.m-zone-wrap.is-dim{opacity:.3;filter:saturate(.5);}
.m-zone{position:relative;border:1px solid var(--m-line);border-top:2px solid var(--zc);border-radius:16px;background:var(--m-panel);padding:20px;margin-top:34px;}
.m-zone-addon{position:absolute;top:-30px;left:14px;right:14px;height:30px;border:1.5px dashed var(--m-line);border-bottom:none;border-radius:12px 12px 0 0;background:rgba(157,123,255,.05);display:flex;align-items:center;justify-content:center;font-family:var(--m-mono);font-size:10.5px;letter-spacing:1.5px;color:var(--m-faint);}
.m-zone-top{display:flex;align-items:center;gap:10px;margin-bottom:13px;}
.m-zone-ico{width:38px;height:38px;border-radius:11px;border:1px solid;display:flex;align-items:center;justify-content:center;font-size:18px;}
.m-zone-n{font-family:var(--m-mono);font-size:13px;color:var(--m-faint);}
.m-zone-tag{margin-left:auto;font-family:var(--m-mono);font-size:10px;letter-spacing:1px;padding:4px 9px;border:1px solid;border-radius:20px;}
.m-zone-name{font-family:var(--m-display);font-weight:700;font-size:18px;line-height:1.2;}
.m-zone-who{color:var(--m-dim);font-size:13px;line-height:1.45;margin:5px 0 16px;min-height:38px;}
.m-base-label{display:flex;align-items:center;justify-content:space-between;font-family:var(--m-mono);font-size:10.5px;letter-spacing:1.5px;color:var(--m-cyan);font-weight:700;margin-bottom:11px;border-top:1px solid var(--m-line);padding-top:13px;}
.m-base-label span{color:var(--m-faint);font-weight:500;letter-spacing:.5px;}
.m-base-list{display:flex;flex-direction:column;gap:9px;}
.m-base-row{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.4;}
.m-base-num{flex:none;width:20px;height:20px;border-radius:6px;border:1px solid;display:flex;align-items:center;justify-content:center;font-family:var(--m-mono);font-size:10.5px;margin-top:1px;}
.m-zone-meta{margin-top:15px;border-top:1px solid var(--m-line);padding-top:12px;display:flex;flex-direction:column;gap:7px;font-size:12.5px;color:var(--m-dim);line-height:1.45;}
.m-meta-k{font-family:var(--m-mono);font-size:10px;letter-spacing:1px;color:var(--m-faint);text-transform:uppercase;margin-right:6px;}
.m-subs{margin-top:15px;border-top:1px solid var(--m-line);padding-top:13px;}
.m-subs-label{font-size:11px;color:var(--m-faint);margin-bottom:8px;}
.m-subs-chips{display:flex;flex-wrap:wrap;gap:6px;}
.m-chip{font-size:11.5px;padding:4px 10px;border-radius:20px;border:1px solid var(--m-line);color:var(--m-dim);background:rgba(125,160,220,.04);}
.m-zone-demo{display:block;text-align:center;margin-top:16px;padding:12px;border-radius:11px;border:1px solid;background:rgba(255,255,255,.02);font-weight:700;font-size:13.5px;text-decoration:none;transition:.18s;}
.m-zone-demo:hover{background:color-mix(in srgb,var(--zc) 12%,transparent);box-shadow:0 0 22px color-mix(in srgb,var(--zc) 28%,transparent);transform:translateY(-1px);}
.m-zones-foot{text-align:center;color:var(--m-faint);font-size:13px;margin-top:20px;max-width:640px;margin-left:auto;margin-right:auto;line-height:1.5;}

/* add-ons */
.m-addons{display:flex;flex-wrap:wrap;gap:9px;}
.m-addon{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--m-line);border-radius:11px;background:var(--m-panel);padding:10px 14px;font-size:13px;}
.m-addon-dot{width:6px;height:6px;border-radius:50%;background:var(--m-violet);box-shadow:0 0 8px var(--m-violet);}

/* positioning */
.m-pos{border:1px solid var(--m-line);border-radius:18px;background:var(--m-panel);padding:24px;}
.m-pos-no{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px;}
.m-pos-no span{font-size:14px;color:var(--m-faint);text-decoration:line-through;text-decoration-color:var(--m-pink);}
.m-pos-yes{font-family:var(--m-display);font-weight:600;font-size:clamp(17px,2.2vw,23px);line-height:1.35;}
.m-phrases{display:grid;grid-template-columns:repeat(2,1fr);gap:11px;margin-top:16px;}
.m-phrase{border:1px solid var(--m-line);border-left:3px solid var(--m-cyan);border-radius:0 12px 12px 0;background:rgba(45,212,218,.04);padding:14px 16px;font-size:14.5px;line-height:1.45;font-weight:500;}

/* packages */
.m-packs{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.m-pack{position:relative;height:100%;border:1px solid var(--m-line);border-top:2px solid var(--pc);border-radius:16px;background:var(--m-panel);padding:20px;}
.m-pack.is-pop{box-shadow:0 0 0 1px var(--pc) inset,0 16px 50px -28px var(--pc);}
.m-pack-badge{position:absolute;top:-11px;left:20px;font-family:var(--m-mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;background:var(--pc);color:#04121a;padding:3px 10px;border-radius:20px;font-weight:700;}
.m-pack-name{font-family:var(--m-display);font-weight:800;font-size:19px;color:var(--pc);}
.m-pack-gist{font-size:12.5px;color:var(--m-dim);margin:4px 0 14px;}
.m-pack-inc{display:flex;flex-direction:column;gap:8px;min-height:130px;}
.m-pack-row{display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.4;}
.m-pack-fee{margin-top:14px;border-top:1px solid var(--m-line);padding-top:12px;font-size:12px;color:var(--m-faint);}
.m-fees{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:18px;}
.m-fees-label{font-size:12.5px;color:var(--m-dim);font-weight:600;margin-right:4px;}

/* steps */
.m-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.m-step{display:flex;align-items:center;gap:11px;border:1px solid var(--m-line);border-radius:12px;background:var(--m-panel);padding:14px 15px;height:100%;}
.m-step-n{flex:none;width:28px;height:28px;border-radius:8px;background:rgba(45,212,218,.12);color:var(--m-cyan);display:flex;align-items:center;justify-content:center;font-family:var(--m-mono);font-weight:700;font-size:13px;}
.m-step-t{font-size:13px;font-weight:600;line-height:1.3;}

/* deliverables */
.m-deliv{display:flex;flex-wrap:wrap;gap:9px;}
.m-deliv-item{display:inline-flex;align-items:center;gap:9px;border:1px solid var(--m-line);border-radius:11px;background:var(--m-panel);padding:11px 15px;font-size:13.5px;font-weight:600;}
.m-deliv-i{color:var(--m-gold);font-size:14px;}

/* sell */
.m-sell{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.m-sell-card{height:100%;border:1px solid var(--m-line);border-radius:16px;background:var(--m-panel);padding:22px;}
.m-sell-ico{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;border:1px solid var(--m-line-bright);color:var(--m-cyan);font-size:20px;margin-bottom:14px;}
.m-sell-t{font-family:var(--m-display);font-weight:700;font-size:16px;margin-bottom:7px;}
.m-sell-d{color:var(--m-dim);font-size:13.5px;line-height:1.55;}

/* next steps */
.m-next{display:flex;flex-wrap:wrap;gap:10px;}
.m-next-item{display:inline-flex;align-items:center;gap:10px;border:1px solid var(--m-line);border-radius:12px;background:var(--m-panel);padding:12px 15px;font-size:13.5px;font-weight:600;}
.m-next-n{flex:none;width:24px;height:24px;border-radius:7px;background:rgba(157,123,255,.14);color:var(--m-violet);display:flex;align-items:center;justify-content:center;font-family:var(--m-mono);font-size:12px;font-weight:700;}
.m-next-arrow{color:var(--m-faint);margin-left:2px;}

/* names */
.m-names{display:flex;flex-wrap:wrap;gap:11px;}
.m-name{position:relative;border:1px solid var(--m-line);border-radius:12px;background:var(--m-panel);padding:14px 18px;font-family:var(--m-display);font-weight:700;font-size:15px;}
.m-name.is-rec{border-color:var(--m-cyan);box-shadow:0 0 0 1px var(--m-cyan) inset;color:var(--m-cyan);padding-top:22px;}
.m-name-tag{position:absolute;top:-10px;left:14px;font-family:var(--m-mono);font-size:9.5px;letter-spacing:1px;text-transform:uppercase;background:var(--m-cyan);color:#04121a;padding:2px 8px;border-radius:20px;font-weight:700;}

/* footer */
.m-footer{position:relative;z-index:1;max-width:1120px;margin:64px auto 0;padding:30px 24px;text-align:center;border-top:1px solid var(--m-line);}
.m-footer .m-brand{justify-content:center;}
.m-footer p{color:var(--m-dim);font-size:14px;line-height:1.6;max-width:560px;margin:14px auto 18px;}
.m-cta{display:inline-block;padding:13px 28px;border-radius:11px;background:var(--m-cyan);color:#04121a;font-weight:700;font-size:14px;text-decoration:none;transition:.2s;}
.m-cta:hover{box-shadow:0 0 26px rgba(45,212,218,.4);transform:translateY(-1px);}

@media(max-width:880px){
  .m-concept{grid-template-columns:1fr;gap:20px;}
  .m-core{grid-template-columns:repeat(2,1fr);}
  .m-zones{grid-template-columns:1fr;}
  .m-phrases{grid-template-columns:1fr;}
  .m-packs{grid-template-columns:1fr 1fr;}
  .m-steps{grid-template-columns:1fr 1fr;}
  .m-sell{grid-template-columns:1fr;}
}
@media(max-width:560px){
  .m-core,.m-packs,.m-steps{grid-template-columns:1fr;}
}
`;
