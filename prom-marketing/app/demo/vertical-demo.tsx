"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BRANDS, type BrandKey } from "@/components/brands";

/* ============================================================================
   VerticalDemo — конфигуруем демо-двигател за един бранш (темплейт на живо).
   Ползва се от /demo/influencer, /demo/shop, /demo/b2b.
   Самостоятелно, нула връзки към CRM. Тема (--d-*) идва от app/demo/layout.
   ========================================================================== */

type Vertical = "influencer" | "shop" | "b2b";

type Auto = { key: string; name: string; desc: string; icon: string; feed: string[] };
type Kpi = { label: string; value: number; prefix?: string; suffix?: string };
type Config = {
  accent: string; accent2: string;
  eyebrow: string; headline: string; headlineAccent: string; sub: string;
  kpis: Kpi[];
  autos: Auto[];
  studio: "content" | "shop" | "crm";
  studioTitle: string;
  brands: BrandKey[];
};

const CONFIGS: Record<Vertical, Config> = {
  influencer: {
    accent: "#2dd4d8", accent2: "#9d7bff",
    eyebrow: "ТЕМПЛЕЙТ · ИНФЛУЕНСЪР / ЛИЧЕН БРАНД",
    headline: "Личният Ви бранд —", headlineAccent: "на автопилот.",
    sub: "Свързваме каналите Ви, пишем и пускаме съдържание, отговаряме на всеки и хващаме лийдове — докато Вие творите.",
    kpis: [
      { label: "Обхват / седмица", value: 184, suffix: "K" },
      { label: "Отговорени DM", value: 1240 },
      { label: "Публикации", value: 86 },
      { label: "Нови последователи", value: 3920 },
      { label: "Лийдове", value: 214 },
    ],
    autos: [
      { key: "connect", name: "Instagram + Facebook", icon: "◎", desc: "Всичко свързано на едно място", feed: ["Instagram акаунт синхронизиран", "Facebook страница свързана", "Нов коментар → обработен"] },
      { key: "ads", name: "Meta реклами + Lead форми", icon: "✦", desc: "Реклами, които носят последователи и лийдове", feed: ["Lead форма → нов контакт", "Аудитория оптимизирана", "Цена на лийд −14%"] },
      { key: "assistant", name: "Личен AI асистент", icon: "❖", desc: "Отговаря и организира 24/7", feed: ["Запитване за колаборация обработено", "Календарът подреден за седмицата", "Гласова бележка → задача"] },
      { key: "content", name: "Авто-постове + Reels", icon: "▷", desc: "Съдържание в Вашия стил", feed: ["Reel генериран и насрочен", "Карусел готов за преглед", "3 поста добавени в календара"] },
      { key: "dm", name: "DM + имейл автоматизация", icon: "✶", desc: "Мигновени лични отговори", feed: ["Авто-отговор в Instagram DM", "Имейл до бранд изпратен", "Нов абонат добре дошъл"] },
      { key: "leads", name: "Лийдове на едно място", icon: "◈", desc: "Нито една възможност изпусната", feed: ["Запитване за реклама записано", "Гореща оферта маркирана", "Партньорство в проследяване"] },
    ],
    studio: "content", studioTitle: "Студио за съдържание",
    brands: ["instagram", "facebook", "tiktok", "youtube", "messenger", "gmail", "meta"],
  },
  shop: {
    accent: "#ef5da8", accent2: "#f0c560",
    eyebrow: "ТЕМПЛЕЙТ · ОНЛАЙН МАГАЗИН / SOLO",
    headline: "Магазинът Ви продава,", headlineAccent: "докато спите.",
    sub: "Реклами, поръчки, отговори и справки — автоматизирани. Вие гледате как влизат продажбите, без да висите на телефона.",
    kpis: [
      { label: "Поръчки / месец", value: 312 },
      { label: "Оборот", value: 48, prefix: "€", suffix: "K" },
      { label: "ROAS реклами", value: 4, suffix: "×" },
      { label: "Отговорени запитвания", value: 980 },
      { label: "Публикации", value: 124 },
    ],
    autos: [
      { key: "ads", name: "Meta реклами + ретаргет", icon: "✦", desc: "Продажби от реклами на автопилот", feed: ["Ретаргет кампания пусната", "Бюджет към печелившия продукт", "Нова продажба от реклама"] },
      { key: "social", name: "Соц. присъствие + постове", icon: "✎", desc: "Редовно съдържание без усилие", feed: ["Пост за нов продукт публикуван", "Story с промоция качено", "Reels за бестселър готов"] },
      { key: "orders", name: "Поръчки → CRM", icon: "◈", desc: "Всяка поръчка подредена", feed: ["Нова поръчка #8841 записана", "Адрес валидиран за доставка", "Куриер известен автоматично"] },
      { key: "reports", name: "Справки + статистика", icon: "▦", desc: "Виждате какво работи", feed: ["Дневен отчет генериран", "Топ продукт за деня отчетен", "Изоставена количка засечена"] },
      { key: "assistant", name: "AI асистент за клиенти", icon: "❖", desc: "Отговаря на въпроси за секунди", feed: ["Въпрос за наличност обработен", "Статус на поръчка изпратен", "Запитване → продажба"] },
      { key: "content", name: "Авто-съдържание за продукти", icon: "▷", desc: "Описания и визии автоматично", feed: ["Описание на продукт генерирано", "Продуктово видео готово", "Банер за промоция създаден"] },
    ],
    studio: "shop", studioTitle: "Поръчки на живо + съдържание",
    brands: ["facebook", "instagram", "tiktok", "google", "whatsapp", "gmail", "meta"],
  },
  b2b: {
    accent: "#f0c560", accent2: "#2dd4d8",
    eyebrow: "ТЕМПЛЕЙТ · B2B / ФИРМИ",
    headline: "Цялата фирма", headlineAccent: "в една система.",
    sub: "CRM, оферти, фактури, проекти и отчети — свързани и автоматизирани. Пълен контрол върху всеки клиент и всеки лев.",
    kpis: [
      { label: "Активни лийдове", value: 142 },
      { label: "Сделки / месец", value: 28 },
      { label: "Оборот", value: 167, prefix: "€", suffix: "K" },
      { label: "Оферти", value: 64 },
      { label: "Фактури", value: 91 },
    ],
    autos: [
      { key: "crm", name: "CRM: лийд → оферта → сделка", icon: "⇄", desc: "Всеки клиент проследен докрай", feed: ["Лийд преместен в „Оферта“", "Сделка спечелена — €12K", "Дубликат обединен"] },
      { key: "report", name: "Reporting + дашборди", icon: "▦", desc: "Живи числа за управителя", feed: ["Седмичен отчет изпратен", "KPI обновени в реално време", "Прогноза за месеца преизчислена"] },
      { key: "erp", name: "ERP: фактури, проекти", icon: "₿", desc: "Документи и пари под контрол", feed: ["Фактура №2026-0142 издадена", "Плащане маркирано", "Проект придвижен към доставка"] },
      { key: "site", name: "Сайт + лийд форми", icon: "◎", desc: "Запитванията влизат автоматично", feed: ["Форма от сайта → нов лийд", "Чат запитване поето", "Обаждане транскрибирано"] },
      { key: "followup", name: "Follow-up машина", icon: "↻", desc: "Никой клиент не пропада", feed: ["Напомняне за оферта изпратено", "Follow-up #2 насрочен", "Замълчал клиент върнат"] },
      { key: "docs", name: "Документи + е-подпис", icon: "◆", desc: "Договори за минути", feed: ["Договор изпратен за подпис", "Документ подписан електронно", "Архив обновен"] },
      { key: "it", name: "IT / интеграции", icon: "✦", desc: "Свързваме каквото ползвате", feed: ["Интеграция с счетоводство", "Данни синхронизирани", "Бекъп завършен"] },
    ],
    studio: "crm", studioTitle: "CRM поток на живо",
    brands: ["linkedin", "google", "googleads", "gmail", "facebook", "telegram", "meta"],
  },
};

/* ---------- helpers ---------- */
const rid = (() => { let n = 1; return () => n++; })();
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clock = () => new Date().toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmt = (n: number) => Math.round(n).toLocaleString("bg-BG");

function useInterval(cb: () => void, delay: number | null) {
  const saved = useRef(cb);
  useEffect(() => { saved.current = cb; }, [cb]);
  useEffect(() => { if (delay === null) return; const id = setInterval(() => saved.current(), delay); return () => clearInterval(id); }, [delay]);
}

type FeedItem = { id: number; t: string; name: string; text: string };
type Order = { id: number; name: string; item: string; sum: number };
type Lead = { id: number; name: string; stage: number };
type Card = { id: number; title: string; published: boolean; kind: string };

const SHOP_ITEMS = ["Суитшърт", "Маратонки", "Чанта", "Парфюм", "Часовник", "Слушалки", "Яке", "Шапка"];
const NAMES = ["Г. Иванов", "С. Петрова", "М. Костов", "Е. Димитрова", "Н. Стоянов", "Р. Колева", "Д. Маринов", "А. Николова"];
const CRM_STAGES = ["Нов", "Контакт", "Оферта", "Сделка"];

export function VerticalDemo({ vertical }: { vertical: Vertical }) {
  const cfg = CONFIGS[vertical];
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [running, setRunning] = useState<Set<string>>(() => new Set(cfg.autos.slice(0, 3).map((a) => a.key)));
  const [kpi, setKpi] = useState<number[]>(() => cfg.kpis.map((k) => k.value));
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>(() => NAMES.slice(0, 6).map((n, i) => ({ id: rid(), name: n, stage: i % 4 })));
  const [cards, setCards] = useState<Card[]>([]);
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState(vertical === "shop" ? "Промоция -20%" : "Нов проект");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const flash = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2200); }, []);
  const pushFeed = useCallback((name: string, text: string) => {
    setFeed((f) => [{ id: rid(), t: clock(), name, text }, ...f].slice(0, 22));
  }, []);

  useInterval(() => {
    if (!mounted) return;
    const active = cfg.autos.filter((a) => running.has(a.key));
    if (!active.length) return;
    const a = pick(active);
    pushFeed(a.name, pick(a.feed));
    setKpi((prev) => prev.map((v, i) => v + (Math.random() > 0.4 ? (i === 1 && cfg.kpis[1].prefix ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3)) : 0)));
    if (cfg.studio === "shop" && a.key === "orders" && Math.random() > 0.4) {
      setOrders((o) => [{ id: rid(), name: pick(NAMES), item: pick(SHOP_ITEMS), sum: 30 + Math.floor(Math.random() * 220) }, ...o].slice(0, 8));
    }
  }, 1600);

  const toggle = useCallback((k: string) => {
    setRunning((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  }, []);

  const genCard = (kind: string) => {
    if (busy) return;
    setBusy(true);
    window.setTimeout(() => {
      setCards((c) => [{ id: rid(), title: topic, published: false, kind }, ...c].slice(0, 8));
      setBusy(false);
      flash("Готово ✓");
      pushFeed(cfg.studio === "shop" ? "Авто-съдържание" : "Студио", `${kind}: ${topic}`);
    }, 900);
  };

  const advance = (id: number) => {
    setLeads((ls) => ls.map((l) => {
      if (l.id !== id) return l;
      const ns = Math.min(3, l.stage + 1);
      if (ns === 3 && l.stage !== 3) { setKpi((k) => k.map((v, i) => i === 1 ? v + 1 : v)); pushFeed("CRM", `Сделка спечелена — ${l.name}`); }
      return { ...l, stage: ns };
    }));
  };

  if (!mounted) {
    return (
      <div className="vd-root">
        <style>{CSS}</style>
        <div className="vd-boot"><div className="vd-boot-logo">ProMarketing<span style={{ color: "var(--d-cyan)" }}> OS</span></div><div className="vd-boot-text">Зареждам демото…</div></div>
      </div>
    );
  }

  return (
    <div className="vd-root" style={{ "--ac": cfg.accent, "--ac2": cfg.accent2 } as React.CSSProperties}>
      <style>{CSS}</style>
      <div className="vd-grid" aria-hidden />
      <div className="vd-glow" aria-hidden />

      <header className="vd-hud">
        <a className="vd-back" href="https://promarketing.pw/model">← Модел</a>
        <div className="vd-brand"><span className="vd-dot" />ProMarketing OS</div>
        <div className="vd-clock"><LiveClock /></div>
      </header>

      <main className="vd-main">
        <div className="vd-eyebrow">{cfg.eyebrow}</div>
        <h1 className="vd-h1">{cfg.headline} <span className="vd-grad">{cfg.headlineAccent}</span></h1>
        <p className="vd-sub">{cfg.sub}</p>
        <div className="vd-brands">
          {cfg.brands.map((k) => { const b = BRANDS[k]; const Icon = b.Icon; return (
            <span className="vd-brand" key={k} title={b.name} style={{ "--bc": b.color } as React.CSSProperties}><Icon /></span>
          ); })}
        </div>

        <div className="vd-kpis">
          {cfg.kpis.map((k, i) => (
            <div className="vd-kpi" key={k.label}>
              <div className="vd-kpi-v">{k.prefix || ""}{fmt(kpi[i])}{k.suffix || ""}</div>
              <div className="vd-kpi-l">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="vd-cols">
          <section className="vd-card">
            <div className="vd-card-h"><span className="vd-card-t">Автоматизации в темплейта</span><span className="vd-live"><span className="vd-pulse" /> {running.size} активни</span></div>
            <div className="vd-autos">
              {cfg.autos.map((a) => {
                const on = running.has(a.key);
                return (
                  <button key={a.key} className={`vd-auto ${on ? "is-on" : ""}`} onClick={() => toggle(a.key)}>
                    <span className="vd-auto-ico">{a.icon}</span>
                    <span className="vd-auto-main"><span className="vd-auto-name">{a.name}</span><span className="vd-auto-desc">{a.desc}</span></span>
                    <span className={`vd-auto-sw ${on ? "is-on" : ""}`}><span className="vd-knob" /></span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="vd-card">
            <div className="vd-card-h"><span className="vd-card-t">Жив поток</span><span className="vd-live"><span className="vd-pulse" /> live</span></div>
            <div className="vd-feed">
              <AnimatePresence initial={false}>
                {feed.length === 0 && <div className="vd-empty">Пуснете автоматизация, за да тръгне потокът…</div>}
                {feed.map((f) => (
                  <motion.div key={f.id} layout={!reduce} initial={reduce ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="vd-feed-row">
                    <span className="vd-feed-t">{f.t}</span><span className="vd-feed-n">{f.name}</span><span className="vd-feed-x">{f.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Студио */}
        <section className="vd-card vd-studio">
          <div className="vd-card-h"><span className="vd-card-t">{cfg.studioTitle}</span></div>

          {cfg.studio === "crm" ? (
            <div className="vd-board">
              {CRM_STAGES.map((s, si) => (
                <div className="vd-col" key={s}>
                  <div className="vd-col-h">{s}<span>{leads.filter((l) => l.stage === si).length}</span></div>
                  <div className="vd-col-b">
                    <AnimatePresence initial={false}>
                      {leads.filter((l) => l.stage === si).map((l) => (
                        <motion.div key={l.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="vd-lead">
                          <span>{l.name}</span>
                          {l.stage < 3 ? <button onClick={() => advance(l.id)} className="vd-lead-b">напред →</button> : <span className="vd-won">✓</span>}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="vd-studio-grid">
              <div className="vd-studio-panel">
                <label className="vd-label">{cfg.studio === "shop" ? "Тема за продуктов пост" : "Тема за съдържание"}</label>
                <input className="vd-input" value={topic} onChange={(e) => setTopic(e.target.value)} />
                <div className="vd-gen-row">
                  <button className="vd-btn" disabled={busy} onClick={() => genCard("Пост")}>{busy ? "…" : "✎ Пост"}</button>
                  <button className="vd-btn" disabled={busy} onClick={() => genCard(cfg.studio === "shop" ? "Видео" : "Reel")}>{busy ? "…" : (cfg.studio === "shop" ? "▷ Видео" : "▷ Reel")}</button>
                </div>
                {cfg.studio === "shop" && (
                  <div className="vd-orders">
                    <div className="vd-orders-h">Поръчки на живо</div>
                    <AnimatePresence initial={false}>
                      {orders.length === 0 && <div className="vd-empty" style={{ padding: "10px 2px" }}>Пуснете „Поръчки → CRM"…</div>}
                      {orders.map((o) => (
                        <motion.div key={o.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="vd-order">
                          <span>{o.name}</span><span className="vd-order-i">{o.item}</span><span className="vd-order-s">€{o.sum}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <div className="vd-cards">
                {cards.length === 0 && <div className="vd-empty">Генерирайте първото съдържание.</div>}
                <AnimatePresence initial={false}>
                  {cards.map((c) => (
                    <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="vd-content-card">
                      <div className="vd-cc-thumb">{c.kind === "Пост" ? "✎" : "▷"}</div>
                      <div className="vd-cc-body"><div className="vd-cc-kind">{c.kind}</div><div className="vd-cc-title">{c.title}</div></div>
                      <button className={`vd-cc-btn ${c.published ? "is-pub" : ""}`} onClick={() => { setCards((cs) => cs.map((x) => x.id === c.id ? { ...x, published: !x.published } : x)); flash(c.published ? "Свалено" : "Публикувано ✓"); }}>{c.published ? "✓" : "↑ Публикувай"}</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </section>

        <div className="vd-cta-row">
          <a className="vd-cta" href="https://promarketing.pw/booking" target="_blank" rel="noreferrer">Запазете внедряване →</a>
          <a className="vd-cta vd-cta-ghost" href="https://promarketing.pw/model">← Обратно към модела</a>
        </div>
      </main>

      <AnimatePresence>
        {toast && <motion.div className="vd-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>{toast}</motion.div>}
      </AnimatePresence>
    </div>
  );
}

function LiveClock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => { setT(clock()); const id = setInterval(() => setT(clock()), 1000); return () => clearInterval(id); }, []);
  return <>{t}</>;
}

const CSS = `
.vd-root{position:relative;min-height:100vh;color:var(--d-text);font-family:var(--d-body),system-ui,sans-serif;overflow:hidden;}
.vd-root *{box-sizing:border-box;}
.vd-root button{font-family:inherit;cursor:pointer;}
.vd-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(120,165,220,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(120,165,220,.05) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse 90% 60% at 50% 0%,#000 35%,transparent 80%);}
.vd-glow{position:fixed;top:-220px;left:50%;transform:translateX(-50%);width:760px;height:600px;z-index:0;pointer-events:none;border-radius:50%;filter:blur(110px);opacity:.5;background:radial-gradient(circle,color-mix(in srgb,var(--ac) 26%,transparent),transparent 60%);}

.vd-hud{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 22px;border-bottom:1px solid var(--d-line);background:linear-gradient(180deg,rgba(7,12,24,.92),rgba(7,12,24,.6));backdrop-filter:blur(14px);}
.vd-back{color:var(--d-dim);text-decoration:none;font-size:13px;font-weight:600;}
.vd-back:hover{color:var(--ac);}
.vd-brand{display:flex;align-items:center;gap:9px;font-family:var(--d-display);font-weight:800;font-size:16px;}
.vd-dot{width:10px;height:10px;border-radius:50%;background:var(--ac);box-shadow:0 0 14px var(--ac);}
.vd-clock{font-family:var(--d-mono);font-size:12.5px;color:var(--ac);}

.vd-main{position:relative;z-index:1;max-width:1080px;margin:0 auto;padding:34px 22px 70px;}
.vd-eyebrow{font-family:var(--d-mono);font-size:11px;letter-spacing:3px;color:var(--ac);margin-bottom:14px;}
.vd-h1{font-family:var(--d-display);font-weight:800;font-size:clamp(28px,5vw,50px);line-height:1.08;letter-spacing:-.02em;margin:0;}
.vd-grad{background:linear-gradient(100deg,var(--ac),var(--ac2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
.vd-sub{color:var(--d-dim);font-size:clamp(14px,1.6vw,17px);line-height:1.6;max-width:600px;margin:18px 0 0;}
.vd-brands{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;}
.vd-brand{display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:11px;font-size:20px;color:var(--bc);border:1px solid color-mix(in srgb,var(--bc) 38%,transparent);background:color-mix(in srgb,var(--bc) 12%,transparent);transition:.16s;}
.vd-brand:hover{transform:translateY(-3px);box-shadow:0 0 20px color-mix(in srgb,var(--bc) 35%,transparent);}

.vd-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:11px;margin:28px 0 22px;}
.vd-kpi{border:1px solid var(--d-line);border-radius:13px;background:var(--d-panel);padding:14px;border-top:2px solid var(--ac);}
.vd-kpi-v{font-family:var(--d-display);font-weight:800;font-size:21px;color:var(--ac);line-height:1;}
.vd-kpi-l{font-size:11.5px;color:var(--d-dim);margin-top:7px;line-height:1.3;}

.vd-cols{display:grid;grid-template-columns:1.15fr 1fr;gap:16px;}
.vd-card{border:1px solid var(--d-line);border-radius:16px;background:var(--d-panel);padding:18px;}
.vd-card-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.vd-card-t{font-family:var(--d-display);font-weight:700;font-size:15px;}
.vd-live{display:flex;align-items:center;gap:6px;font-family:var(--d-mono);font-size:10.5px;color:var(--d-emerald);text-transform:uppercase;letter-spacing:1px;}
.vd-pulse{width:7px;height:7px;border-radius:50%;background:var(--d-emerald);box-shadow:0 0 10px var(--d-emerald);animation:vdp 1.8s infinite;}

.vd-autos{display:flex;flex-direction:column;gap:8px;}
.vd-auto{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 13px;border-radius:12px;border:1px solid var(--d-line);background:rgba(120,165,220,.04);transition:.16s;opacity:.6;}
.vd-auto.is-on{opacity:1;border-color:color-mix(in srgb,var(--ac) 45%,transparent);background:color-mix(in srgb,var(--ac) 7%,transparent);}
.vd-auto-ico{flex:none;width:38px;height:38px;border-radius:10px;border:1px solid var(--d-line);display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--ac);}
.vd-auto-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.vd-auto-name{font-size:13.5px;font-weight:600;}
.vd-auto-desc{font-size:11.5px;color:var(--d-dim);margin-top:2px;}
.vd-auto-sw{flex:none;width:38px;height:21px;border-radius:20px;background:rgba(120,165,220,.18);position:relative;transition:.2s;}
.vd-auto-sw.is-on{background:var(--ac);}
.vd-knob{position:absolute;top:2px;left:2px;width:17px;height:17px;border-radius:50%;background:#fff;transition:.2s;}
.vd-auto-sw.is-on .vd-knob{left:19px;}

.vd-feed{display:flex;flex-direction:column;gap:7px;max-height:330px;overflow-y:auto;}
.vd-empty{color:var(--d-faint);font-size:12.5px;padding:16px 4px;line-height:1.5;}
.vd-feed-row{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:9px;background:rgba(120,165,220,.04);border:1px solid var(--d-line);}
.vd-feed-t{font-family:var(--d-mono);font-size:10px;color:var(--d-faint);}
.vd-feed-n{font-size:11.5px;font-weight:700;color:var(--ac);}
.vd-feed-x{font-size:12.5px;color:var(--d-dim);line-height:1.4;}

.vd-studio{margin-top:16px;}
.vd-studio-grid{display:grid;grid-template-columns:320px 1fr;gap:16px;align-items:start;}
.vd-label{display:block;font-size:12px;color:var(--d-dim);margin-bottom:8px;font-weight:600;}
.vd-input{width:100%;padding:11px 13px;border-radius:11px;border:1px solid var(--d-line);background:rgba(4,6,13,.55);color:var(--d-text);font-size:14px;font-family:inherit;outline:none;}
.vd-input:focus{border-color:var(--ac);}
.vd-gen-row{display:flex;gap:9px;margin-top:11px;}
.vd-btn{flex:1;padding:11px;border-radius:10px;border:1px solid color-mix(in srgb,var(--ac) 45%,transparent);background:color-mix(in srgb,var(--ac) 10%,transparent);color:var(--ac);font-size:13px;font-weight:700;transition:.16s;}
.vd-btn:hover:not(:disabled){background:color-mix(in srgb,var(--ac) 18%,transparent);}
.vd-btn:disabled{opacity:.6;cursor:not-allowed;}

.vd-orders{margin-top:16px;border-top:1px solid var(--d-line);padding-top:13px;}
.vd-orders-h{font-family:var(--d-mono);font-size:10.5px;letter-spacing:1.5px;color:var(--d-faint);text-transform:uppercase;margin-bottom:9px;}
.vd-order{display:grid;grid-template-columns:1fr auto auto;gap:9px;align-items:center;padding:8px 10px;border-radius:9px;background:rgba(120,165,220,.04);border:1px solid var(--d-line);margin-bottom:6px;font-size:12.5px;}
.vd-order-i{color:var(--d-dim);}
.vd-order-s{font-family:var(--d-mono);color:var(--d-gold);font-weight:700;}

.vd-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:11px;}
.vd-content-card{border:1px solid var(--d-line);border-radius:12px;background:rgba(4,6,13,.5);overflow:hidden;}
.vd-cc-thumb{height:74px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;background:linear-gradient(135deg,color-mix(in srgb,var(--ac) 30%,transparent),color-mix(in srgb,var(--ac2) 18%,transparent));}
.vd-cc-body{padding:10px 12px 6px;}
.vd-cc-kind{font-family:var(--d-mono);font-size:10px;color:var(--ac);text-transform:uppercase;letter-spacing:1px;}
.vd-cc-title{font-size:13px;font-weight:600;margin-top:3px;}
.vd-cc-btn{margin:0 12px 12px;padding:7px;width:calc(100% - 24px);border-radius:8px;border:1px solid color-mix(in srgb,var(--ac) 45%,transparent);background:color-mix(in srgb,var(--ac) 8%,transparent);color:var(--ac);font-size:11.5px;font-weight:600;}
.vd-cc-btn.is-pub{border-color:var(--d-emerald);color:var(--d-emerald);background:rgba(52,211,153,.1);}

.vd-board{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;}
.vd-col{border:1px solid var(--d-line);border-radius:13px;background:rgba(7,12,24,.4);padding:11px;min-height:200px;}
.vd-col-h{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;font-weight:700;color:var(--ac);margin-bottom:10px;}
.vd-col-h span{font-family:var(--d-mono);font-size:11px;color:var(--d-faint);}
.vd-col-b{display:flex;flex-direction:column;gap:8px;}
.vd-lead{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:9px 11px;border-radius:9px;border:1px solid var(--d-line);background:var(--d-panel-solid);font-size:12.5px;}
.vd-lead-b{font-size:11px;color:var(--d-dim);background:none;border:1px solid var(--d-line);border-radius:7px;padding:4px 7px;transition:.16s;}
.vd-lead-b:hover{color:var(--ac);border-color:var(--ac);}
.vd-won{color:var(--d-emerald);}

.vd-cta-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:34px;}
.vd-cta{display:inline-block;padding:14px 30px;border-radius:11px;background:var(--ac);color:#04121a;font-weight:700;font-size:14px;text-decoration:none;transition:.2s;}
.vd-cta:hover{box-shadow:0 0 26px color-mix(in srgb,var(--ac) 50%,transparent);transform:translateY(-1px);}
.vd-cta-ghost{background:transparent;border:1px solid var(--d-line);color:var(--d-dim);}

.vd-boot{position:fixed;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#04060d;}
.vd-boot-logo{font-family:var(--d-display);font-weight:800;font-size:28px;}
.vd-boot-text{font-family:var(--d-mono);font-size:11.5px;color:var(--d-faint);letter-spacing:1px;}
.vd-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:40;padding:12px 22px;border-radius:12px;border:1px solid var(--ac);background:rgba(7,12,24,.95);color:var(--d-text);font-size:13.5px;font-weight:600;}

@keyframes vdp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}

@media(max-width:880px){
  .vd-kpis{grid-template-columns:repeat(2,1fr);}
  .vd-cols{grid-template-columns:1fr;}
  .vd-studio-grid{grid-template-columns:1fr;}
  .vd-cards{grid-template-columns:1fr 1fr;}
  .vd-board{grid-template-columns:1fr 1fr;}
}
`;
