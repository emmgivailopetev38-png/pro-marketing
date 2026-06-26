"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/* ============================================================================
   ProMarketing OS — живо интерактивно демо (2050)
   Хермес + 16 AI агента + всички канали + имейли + follow-up + реклами +
   съдържание + видео + CRM поток + аналитика. Всичко работи на state.
   Самостоятелно. Нула връзки към реалната CRM логика.
   ========================================================================== */

type KpiKey = "leads" | "replies" | "posts" | "videos" | "deals" | "revenue" | "hours";

type Agent = {
  key: string;
  name: string;
  role: string;
  color: string;
  icon: string;
  feed: string[];
  bumps: Partial<Record<KpiKey, number>>;
};

const AGENTS: Agent[] = [
  { key: "lead", name: "Лийд Ловец", role: "Хваща запитвания от Meta, сайт, форми и обаждания", color: "#22d3ee", icon: "◎",
    feed: ["Нов лийд от Facebook реклама → записан в CRM", "Instagram запитване уловено и качено", "Обаждане транскрибирано → нов контакт"], bumps: { leads: 1, hours: 0.2 } },
  { key: "qualify", name: "Квалификатор", role: "Оценява и приоритизира всеки лийд (0–100)", color: "#38bdf8", icon: "⌖",
    feed: ["Лийд оценен: 87/100 — горещ", "Приоритизиран лийд за днес", "Дубликат открит и обединен"], bumps: { hours: 0.3 } },
  { key: "router", name: "Диспечер", role: "Насочва всеки лийд към правилния човек или екип", color: "#3b82f6", icon: "⇲",
    feed: ["Лийд насочен към екип Продажби", "Гореща оферта пратена на старши консултант", "Баланс на натоварването изравнен"], bumps: { hours: 0.3 } },
  { key: "chat", name: "Чатбот", role: "Жив чат на сайта и в Messenger 24/7", color: "#2dd4bf", icon: "✺",
    feed: ["Чат на сайта поет и насочен", "Въпрос за цена → отговорено + лийд", "Messenger разговор подет"], bumps: { replies: 1, leads: 0.3, hours: 0.4 } },
  { key: "reply", name: "Отговарящ", role: "Мигновени отговори по имейл, чат и съобщения", color: "#8b5cf6", icon: "✶",
    feed: ["Отговор изпратен за 3 секунди", "Имейл запитване обработено автоматично", "Viber съобщение поето"], bumps: { replies: 1, hours: 0.4 } },
  { key: "followup", name: "Follow-up", role: "Връща клиенти, за да не изпускаш сделки", color: "#fbbf24", icon: "↻",
    feed: ["Напомняне пратено: оферта чака от 2 дни", "Follow-up #2 насрочен за утре", "Замълчал клиент върнат в разговор"], bumps: { deals: 0.2, hours: 0.4 } },
  { key: "content", name: "Постов Криейтор", role: "Пише публикации в стила на марката", color: "#ec4899", icon: "✎",
    feed: ["Пост за Instagram генериран", "Карусел за Facebook готов", "Идея за Reels предложена"], bumps: { posts: 1, hours: 0.5 } },
  { key: "social", name: "Социален Дистрибутор", role: "Публикува във FB, IG, TikTok, LinkedIn, YouTube", color: "#fb7185", icon: "⇪",
    feed: ["Пост публикуван в 5 мрежи едновременно", "Reels качено в TikTok + IG", "Календарът за седмицата запълнен"], bumps: { posts: 0.6, hours: 0.6 } },
  { key: "video", name: "Видео Студио", role: "Генерира рекламни видеа от текст", color: "#34d399", icon: "▷",
    feed: ["Рекламно видео 0:30 рендирано", "Reels от оферта генерирано", "Видео озвучено с AI глас"], bumps: { videos: 1, hours: 0.8 } },
  { key: "ads", name: "Рекламен Пилот", role: "Управлява и оптимизира Meta рекламите", color: "#6366f1", icon: "✦",
    feed: ["Бюджет преместен към печелившата кампания", "Цена на лийд свалена с 18%", "Нова аудитория пусната на тест"], bumps: { hours: 0.4 } },
  { key: "offer", name: "Оферент", role: "Сглобява оферти и ги праща автоматично", color: "#14b8a6", icon: "◈",
    feed: ["Оферта сглобена и изпратена (PDF)", "Цена калкулирана автоматично", "Оферта отворена от клиента"], bumps: { deals: 0.3, hours: 0.5 } },
  { key: "invoice", name: "Фактурист", role: "Издава фактури и следи плащанията", color: "#f5c542", icon: "₿",
    feed: ["Фактура издадена №2026-0142", "Плащане маркирано като получено", "Напомняне за неплатена фактура"], bumps: { revenue: 1, hours: 0.3 } },
  { key: "calendar", name: "Календар", role: "Насрочва срещи, огледи и резервации", color: "#a78bfa", icon: "◷",
    feed: ["Среща насрочена за четвъртък 14:00", "Резервация от Cal.com → CRM", "Напомняне за среща пратено"], bumps: { hours: 0.3 } },
  { key: "voice", name: "Гласов Асистент", role: "Управляваш всичко с глас от телефона", color: "#818cf8", icon: "❖",
    feed: ["Гласова команда изпълнена за секунди", "Гласова бележка → задача в CRM", "Отчет прочетен на глас"], bumps: { hours: 0.5 } },
  { key: "reviews", name: "Репутация", role: "Следи и отговаря на ревюта и коментари", color: "#fb923c", icon: "★",
    feed: ["Ново 5★ ревю — благодарност изпратена", "Коментар във Facebook обработен", "Запитване от ревю → нов лийд"], bumps: { hours: 0.3 } },
  { key: "audit", name: "Одитор", role: "Нощни равнения, аналитика и здравен отчет", color: "#f472b6", icon: "◆",
    feed: ["Нощна равносметка — 0 разминавания", "Здравен отчет генериран", "Препоръка за оптимизация подадена"], bumps: { hours: 0.6 } },
];

const KPIS: { key: KpiKey; label: string; color: string; prefix?: string; suffix?: string; start: number }[] = [
  { key: "leads", label: "Уловени лийдове", color: "#22d3ee", start: 1284 },
  { key: "replies", label: "Авто-отговори", color: "#8b5cf6", start: 3940 },
  { key: "posts", label: "Публикации", color: "#ec4899", start: 412 },
  { key: "videos", label: "AI видеа", color: "#34d399", start: 96 },
  { key: "deals", label: "Сделки", color: "#fbbf24", start: 173 },
  { key: "revenue", label: "Оборот", color: "#f5c542", prefix: "€", suffix: "K", start: 642 },
  { key: "hours", label: "Спестени часове", color: "#2dd4bf", start: 2180 },
];

const CHANNELS = [
  { name: "Facebook", color: "#3b82f6", desc: "Реклами · страница · Messenger" },
  { name: "Instagram", color: "#ec4899", desc: "Реклами · DM · публикации" },
  { name: "TikTok", color: "#22d3ee", desc: "Видеа · Lead форми" },
  { name: "LinkedIn", color: "#38bdf8", desc: "B2B · публикации" },
  { name: "YouTube", color: "#fb7185", desc: "Видеа · Shorts" },
  { name: "Messenger", color: "#6366f1", desc: "Авто-отговори 24/7" },
  { name: "WhatsApp", color: "#34d399", desc: "Съобщения · известия" },
  { name: "Viber", color: "#8b5cf6", desc: "Кампании · съобщения" },
  { name: "Gmail / Имейл", color: "#fbbf24", desc: "Четене + отговори · Пощальон" },
  { name: "Telegram", color: "#38bdf8", desc: "Контрол + гласови команди" },
  { name: "Meta Ads", color: "#3b82f6", desc: "Кампании · Lead Ads → CRM" },
  { name: "Google", color: "#22d3ee", desc: "Календар · Ads · форми" },
  { name: "Уебсайт форми", color: "#2dd4bf", desc: "Запитвания → CRM" },
  { name: "Cal.com", color: "#a78bfa", desc: "Резервации → CRM" },
];

const VIDEO_STAGES = ["Анализ на темата", "Сценарий", "Кадри (AI)", "Глас зад кадър", "Музика", "Монтаж", "Рендиране"];
const VIDEO_IDEAS = ["Промо на нов продукт", "Отзив на доволен клиент", "Преди / след", "Оферта на седмицата", "Зад кулисите", "Бърз съвет (Reels)"];

const POST_PLATFORMS = [
  { key: "fb", name: "Facebook", color: "#3b82f6" },
  { key: "ig", name: "Instagram", color: "#ec4899" },
  { key: "tt", name: "TikTok", color: "#22d3ee" },
  { key: "in", name: "LinkedIn", color: "#38bdf8" },
  { key: "yt", name: "YouTube", color: "#fb7185" },
] as const;

const POST_TEMPLATES: string[] = [
  "🚀 {topic} вече е тук. По-бързо, по-умно, без излишни усилия. Пишете ни на лично — отговаряме за минути, не за дни.",
  "Спрете да губите клиенти между съобщенията. {topic} — всичко на едно място, под контрол. ✨ Запитайте сега.",
  "Истината за {topic}: печели този, който отговаря пръв. Ние отговаряме мигновено, 24/7. 💬 Вижте как.",
  "{topic} без главоболия. Свързваме каналите ви, а екипът ви се фокусира върху продажбите. 📈",
];
const POST_TOPICS = ["AI автоматизация", "новата ни услуга", "по-бързи отговори", "оферта на месеца", "защо клиентите ни остават"];
const POST_HASHTAGS = ["#AI", "#автоматизация", "#бизнес", "#растеж", "#ProMarketing", "#CRM", "#реклама"];

const LEAD_NAMES = ["Г. Иванов", "С. Петрова", "М. Костов", "Е. Димитрова", "Н. Стоянов", "Р. Колева", "Д. Маринов", "В. Тодоров", "А. Николова", "К. Георгиев"];
const LEAD_SOURCES = [
  { s: "Facebook", c: "#3b82f6" }, { s: "Instagram", c: "#ec4899" }, { s: "Уебсайт", c: "#22d3ee" }, { s: "Препоръка", c: "#34d399" }, { s: "TikTok", c: "#a78bfa" },
];
const STAGES = [
  { key: "new", name: "Нов лийд", color: "#38bdf8" },
  { key: "contact", name: "Контакт", color: "#8b5cf6" },
  { key: "offer", name: "Оферта", color: "#fbbf24" },
  { key: "nego", name: "Преговори", color: "#fb923c" },
  { key: "won", name: "Спечелен", color: "#34d399" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

const EMAIL_SEED: { from: string; subj: string; tag: string; color: string; preview: string }[] = [
  { from: "info@megastore.bg", subj: "Запитване за оферта — 200 бр.", tag: "Запитване", color: "#22d3ee", preview: "Здравейте, интересува ни количка от 200 броя. Може ли оферта и срок за доставка?" },
  { from: "ivan.k@gmail.com", subj: "Re: Вашата оферта", tag: "Гореща", color: "#fb7185", preview: "Благодаря, цената е ок. Кога можем да подпишем договор?" },
  { from: "office@buildco.bg", subj: "Фактура и плащане", tag: "Фактура", color: "#f5c542", preview: "Преведохме сумата по фактура 0142. Моля потвърдете получаване." },
  { from: "no-reply@facebook.com", subj: "Нов лийд от Lead Ads", tag: "Лийд", color: "#3b82f6", preview: "Получихте нов лийд от кампания „Лято 2026“. Данните са качени в CRM." },
  { from: "maria@hotelvista.bg", subj: "Партньорство", tag: "B2B", color: "#a78bfa", preview: "Бихме искали да обсъдим дългосрочно партньорство за есента." },
  { from: "support@client.bg", subj: "Проблем с поръчка", tag: "Поддръжка", color: "#fb923c", preview: "Поръчка 8841 още не е пристигнала. Може ли да проверите статуса?" },
];

const FOLLOWUP_SEED: { name: string; channel: string; color: string; note: string; due: string }[] = [
  { name: "Г. Иванов", channel: "Имейл", color: "#fbbf24", note: "Оферта изпратена, чака отговор", due: "днес" },
  { name: "С. Петрова", channel: "Viber", color: "#8b5cf6", note: "Заинтересована, поиска повече детайли", due: "днес" },
  { name: "BuildCo", channel: "Имейл", color: "#fbbf24", note: "2-ри follow-up след среща", due: "утре" },
  { name: "М. Костов", channel: "Messenger", color: "#6366f1", note: "Замълча след цена", due: "утре" },
  { name: "HotelVista", channel: "Телефон", color: "#34d399", note: "Партньорство — да се обади", due: "сряда" },
];

const ADS_SEED: { name: string; net: string; color: string; spend: number; leads: number; cpl: number; roas: number; active: boolean }[] = [
  { name: "Лийдове · Лято 2026", net: "Facebook", color: "#3b82f6", spend: 420, leads: 84, cpl: 5.0, roas: 4.2, active: true },
  { name: "Ретаргет · Оферти", net: "Instagram", color: "#ec4899", spend: 260, leads: 41, cpl: 6.3, roas: 5.8, active: true },
  { name: "Видео · Узнаваемост", net: "TikTok", color: "#22d3ee", spend: 180, leads: 22, cpl: 8.2, roas: 2.4, active: false },
  { name: "B2B · LinkedIn", net: "LinkedIn", color: "#38bdf8", spend: 310, leads: 17, cpl: 18.2, roas: 6.1, active: true },
];

const ROI = [
  { ch: "Facebook", v: 92, color: "#3b82f6" },
  { ch: "Instagram", v: 78, color: "#ec4899" },
  { ch: "Препоръки", v: 64, color: "#34d399" },
  { ch: "Уебсайт", v: 51, color: "#22d3ee" },
  { ch: "TikTok", v: 38, color: "#a78bfa" },
  { ch: "LinkedIn", v: 30, color: "#38bdf8" },
];

const INSIGHTS = [
  { t: "Преместете 15% бюджет от TikTok към Facebook", d: "Facebook носи 2.4× повече сделки на лев в момента.", c: "#3b82f6" },
  { t: "Пуснете follow-up на 7 замълчали оферти", d: "Средно 1 от 4 се връща при втори контакт.", c: "#fbbf24" },
  { t: "Най-добро време за публикуване: 19:00–21:00", d: "Ангажираността е с 34% по-висока вечер.", c: "#ec4899" },
  { t: "3 фактури са просрочени над 14 дни", d: "Одиторът подготви автоматични напомняния.", c: "#fb7185" },
];

const HERMES_CMDS = [
  "Дай ми отчет за днес",
  "Пусни follow-up на чакащите оферти",
  "Генерирай 3 поста за Instagram",
  "Направи видео за оферта",
  "Кои реклами да оптимизирам?",
];

const NAV = [
  { key: "overview", label: "Обзор", icon: "▦" },
  { key: "hermes", label: "Хермес AI", icon: "❖" },
  { key: "agents", label: "AI Агенти", icon: "✷" },
  { key: "channels", label: "Канали", icon: "⌗" },
  { key: "inbox", label: "Имейли", icon: "✉" },
  { key: "followup", label: "Follow-up", icon: "↻" },
  { key: "content", label: "Съдържание", icon: "✎" },
  { key: "video", label: "Видео Студио", icon: "▷" },
  { key: "ads", label: "Реклами", icon: "✦" },
  { key: "pipeline", label: "CRM Поток", icon: "⇄" },
  { key: "analytics", label: "Аналитика", icon: "◷" },
] as const;
type ViewKey = (typeof NAV)[number]["key"];

type Lead = { id: number; name: string; source: string; sourceColor: string; value: number; stage: StageKey };
type FeedItem = { id: number; t: string; agent: string; color: string; text: string };
type Video = { id: number; title: string; len: string; published: boolean };
type Post = { id: number; platform: string; color: string; text: string; tags: string[]; likes: number; comments: number; published: boolean };
type Email = { id: number; from: string; subj: string; tag: string; color: string; preview: string; replied: boolean };
type Followup = { id: number; name: string; channel: string; color: string; note: string; due: string; done: boolean };
type Campaign = { id: number; name: string; net: string; color: string; spend: number; leads: number; cpl: number; roas: number; active: boolean };
type HermesMsg = { id: number; role: "user" | "step" | "hermes"; text: string };

/* ---------- помощници ---------- */

const rid = (() => { let n = 1; return () => n++; })();
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const clock = () => new Date().toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmt = (n: number) => Math.round(n).toLocaleString("bg-BG");

function useInterval(cb: () => void, delay: number | null) {
  const saved = useRef(cb);
  useEffect(() => { saved.current = cb; }, [cb]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/* ============================================================================
   Главен компонент
   ========================================================================== */

export default function DemoPage() {
  const reduce = useReducedMotion();
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState<ViewKey>("overview");

  const [running, setRunning] = useState<Set<string>>(new Set(["lead", "reply", "content", "ads"]));
  const [loads, setLoads] = useState<Record<string, number>>(() => Object.fromEntries(AGENTS.map((a) => [a.key, 0])));
  const [kpi, setKpi] = useState<Record<KpiKey, number>>(() => Object.fromEntries(KPIS.map((k) => [k.key, k.start])) as Record<KpiKey, number>);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leads, setLeads] = useState<Lead[]>(() => seedLeads());
  const [emails, setEmails] = useState<Email[]>(() => EMAIL_SEED.map((e) => ({ ...e, id: rid(), replied: false })));
  const [followups, setFollowups] = useState<Followup[]>(() => FOLLOWUP_SEED.map((f) => ({ ...f, id: rid(), done: false })));
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => ADS_SEED.map((c) => ({ ...c, id: rid() })));
  const [toast, setToast] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const pushFeed = useCallback((agent: string, color: string, text: string) => {
    setFeed((f) => [{ id: rid(), t: clock(), agent, color, text }, ...f].slice(0, 40));
  }, []);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    if (reduce) { setBooted(true); return; }
    const id = window.setTimeout(() => setBooted(true), 1850);
    return () => window.clearTimeout(id);
  }, [reduce]);

  const addLead = useCallback(() => {
    setLeads((ls) => {
      if (ls.length > 28) return ls;
      const src = pick([...LEAD_SOURCES]);
      return [{ id: rid(), name: pick(LEAD_NAMES), source: src.s, sourceColor: src.c, value: 1 + Math.floor(Math.random() * 18), stage: "new" }, ...ls];
    });
  }, []);

  const autoPost = useCallback(() => {
    const p = pick([...POST_PLATFORMS]);
    const text = pick(POST_TEMPLATES).replace("{topic}", pick(POST_TOPICS));
    setPosts((ps) => [{ id: rid(), platform: p.name, color: p.color, text, tags: POST_HASHTAGS.slice(0, 4), likes: 0, comments: 0, published: false }, ...ps].slice(0, 14));
  }, []);

  /* живият пулс */
  useInterval(() => {
    if (!booted) return;
    setLoads((prev) => {
      const next = { ...prev };
      for (const a of AGENTS) {
        const on = running.has(a.key);
        const target = on ? 42 + Math.random() * 52 : Math.max(0, prev[a.key] - 18);
        next[a.key] = Math.round(prev[a.key] + (target - prev[a.key]) * 0.5);
      }
      return next;
    });
    const active = AGENTS.filter((a) => running.has(a.key));
    if (active.length === 0) return;
    const events = Math.random() > 0.5 ? 2 : 1;
    for (let i = 0; i < events; i++) {
      const a = pick(active);
      pushFeed(a.name, a.color, pick(a.feed));
      setKpi((k) => {
        const n = { ...k };
        for (const [key, v] of Object.entries(a.bumps)) n[key as KpiKey] += v as number;
        return n;
      });
      if ((a.key === "lead" || a.key === "chat") && Math.random() > 0.5) addLead();
      if ((a.key === "content" || a.key === "social") && Math.random() > 0.72) autoPost();
    }
  }, 1500);

  const toggleAgent = useCallback((key: string) => {
    setRunning((prev) => {
      const next = new Set(prev);
      const a = AGENTS.find((x) => x.key === key)!;
      if (next.has(key)) { next.delete(key); pushFeed(a.name, a.color, "⏸ Агентът е спрян"); }
      else { next.add(key); pushFeed(a.name, a.color, "▶ Агентът е активиран"); }
      return next;
    });
  }, [pushFeed]);

  const allOn = useCallback(() => { setRunning(new Set(AGENTS.map((a) => a.key))); flashToast("Всичките 16 агента са активни"); pushFeed("Хермес", "#22d3ee", "▶ Целият екип е пуснат"); }, [flashToast, pushFeed]);
  const allOff = useCallback(() => { setRunning(new Set()); flashToast("Всички агенти са спрени"); pushFeed("Хермес", "#fb7185", "⏸ Целият екип е спрян"); }, [flashToast, pushFeed]);

  const onVideoDone = useCallback((title: string) => {
    setVideos((v) => [{ id: rid(), title, len: `0:${(15 + Math.floor(Math.random() * 45)).toString().padStart(2, "0")}`, published: false }, ...v].slice(0, 12));
    setKpi((k) => ({ ...k, videos: k.videos + 1, hours: k.hours + 0.8 }));
    pushFeed("Видео Студио", "#34d399", `Видео ${title} е готово`);
    flashToast("Видеото е генерирано ✓");
  }, [pushFeed, flashToast]);

  const advanceLead = useCallback((id: number) => {
    setLeads((ls) => ls.map((l) => {
      if (l.id !== id) return l;
      const idx = STAGES.findIndex((s) => s.key === l.stage);
      const nidx = Math.min(STAGES.length - 1, idx + 1);
      if (STAGES[nidx].key === "won" && l.stage !== "won") {
        setKpi((k) => ({ ...k, deals: k.deals + 1, revenue: k.revenue + l.value }));
        pushFeed("Оферент", "#14b8a6", `Сделка спечелена — ${l.name} (€${l.value}K)`);
      }
      return { ...l, stage: STAGES[nidx].key };
    }));
  }, [pushFeed]);

  const replyEmail = useCallback((id: number) => {
    setEmails((es) => es.map((e) => e.id === id ? { ...e, replied: true } : e));
    setKpi((k) => ({ ...k, replies: k.replies + 1, hours: k.hours + 0.4 }));
    pushFeed("Отговарящ", "#8b5cf6", "AI отговор изпратен на имейл");
    flashToast("AI отговори на имейла ✓");
  }, [pushFeed, flashToast]);

  const doFollowup = useCallback((id: number) => {
    setFollowups((fs) => fs.map((f) => f.id === id ? { ...f, done: true } : f));
    setKpi((k) => ({ ...k, replies: k.replies + 1, deals: k.deals + 0.2, hours: k.hours + 0.3 }));
    pushFeed("Follow-up", "#fbbf24", "Follow-up изпратен на клиент");
    flashToast("Follow-up е изпратен ✓");
  }, [pushFeed, flashToast]);

  const optimizeAd = useCallback((id: number) => {
    setCampaigns((cs) => cs.map((c) => c.id === id ? { ...c, cpl: Math.max(2, +(c.cpl * 0.82).toFixed(1)), roas: +(c.roas * 1.12).toFixed(1), leads: c.leads + 6 } : c));
    setKpi((k) => ({ ...k, hours: k.hours + 0.4 }));
    pushFeed("Рекламен Пилот", "#6366f1", "Кампания оптимизирана — по-евтини лийдове");
    flashToast("Кампанията е оптимизирана ✓");
  }, [pushFeed, flashToast]);

  const toggleAd = useCallback((id: number) => {
    setCampaigns((cs) => cs.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  }, []);

  return (
    <div className="d-root">
      <style>{CSS}</style>
      <div className="d-bg-grid" aria-hidden />
      <div className="d-bg-glow d-bg-glow-1" aria-hidden />
      <div className="d-bg-glow d-bg-glow-2" aria-hidden />
      <div className="d-scan" aria-hidden />

      <AnimatePresence>{!booted && <Boot key="boot" />}</AnimatePresence>

      <header className="d-hud">
        <div className="d-hud-brand">
          <span className="d-logo-dot" />
          <span className="d-logo">ProMarketing<span style={{ color: "var(--d-cyan)" }}> OS</span></span>
          <span className="d-tag">v2050.1 · жива среда</span>
        </div>
        <div className="d-hud-right">
          <span className="d-status"><span className="d-pulse-dot" /> {running.size} активни агента</span>
          <span className="d-clock"><LiveClock /></span>
          <button className="d-voice-btn" onClick={() => setVoiceOpen(true)} aria-label="Гласова команда"><span className="d-mic">❖</span> Глас</button>
        </div>
      </header>

      <div className="d-shell">
        <nav className="d-rail" aria-label="Навигация">
          {NAV.map((n) => (
            <button key={n.key} className={`d-rail-item ${view === n.key ? "is-active" : ""}`} onClick={() => setView(n.key)}>
              <span className="d-rail-icon">{n.icon}</span>
              <span className="d-rail-label">{n.label}</span>
            </button>
          ))}
          <a className="d-rail-cta" href="https://promarketing.pw/booking" target="_blank" rel="noreferrer">Запази внедряване →</a>
        </nav>

        <main className="d-main">
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}>
              {view === "overview" && <Overview kpi={kpi} feed={feed} running={running} loads={loads} onAllOn={allOn} onAllOff={allOff} go={setView} />}
              {view === "hermes" && <HermesConsole kpi={kpi} pushFeed={pushFeed} flashToast={flashToast} />}
              {view === "agents" && <AgentsView running={running} loads={loads} toggle={toggleAgent} onAllOn={allOn} onAllOff={allOff} />}
              {view === "channels" && <ChannelsView />}
              {view === "inbox" && <InboxView emails={emails} reply={replyEmail} />}
              {view === "followup" && <FollowupView followups={followups} doFollowup={doFollowup} />}
              {view === "content" && <ContentStudio posts={posts} setPosts={setPosts} pushFeed={pushFeed} setKpi={setKpi} flashToast={flashToast} />}
              {view === "video" && <VideoStudio onDone={onVideoDone} videos={videos} setVideos={setVideos} flashToast={flashToast} />}
              {view === "ads" && <AdsView campaigns={campaigns} optimize={optimizeAd} toggle={toggleAd} />}
              {view === "pipeline" && <Pipeline leads={leads} advance={advanceLead} addLead={() => { addLead(); flashToast("Нов лийд добавен"); }} />}
              {view === "analytics" && <Analytics kpi={kpi} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <aside className="d-feed">
          <div className="d-feed-head"><span className="d-feed-title">Жив поток</span><span className="d-feed-live"><span className="d-pulse-dot" /> live</span></div>
          <div className="d-feed-body">
            <AnimatePresence initial={false}>
              {feed.length === 0 && <div className="d-feed-empty">Пуснете агент, за да тръгне потокът…</div>}
              {feed.map((f) => (
                <motion.div key={f.id} layout={!reduce} initial={reduce ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="d-feed-row">
                  <span className="d-feed-time">{f.t}</span>
                  <span className="d-feed-agent" style={{ color: f.color }}>{f.agent}</span>
                  <span className="d-feed-text">{f.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {voiceOpen && <VoiceModal onClose={() => setVoiceOpen(false)} run={(t) => { pushFeed("Гласов Асистент", "#818cf8", t); flashToast("Командата е изпълнена ✓"); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && <motion.div className="d-toast" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}>{toast}</motion.div>}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Обзор
   ========================================================================== */

function Overview({ kpi, feed, running, loads, onAllOn, onAllOff, go }: {
  kpi: Record<KpiKey, number>; feed: FeedItem[]; running: Set<string>; loads: Record<string, number>;
  onAllOn: () => void; onAllOff: () => void; go: (v: ViewKey) => void;
}) {
  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">КОМАНДЕН ЦЕНТЪР</div>
          <h1 className="d-h1">Целият Ви бизнес — <span className="d-grad">на един екран</span>.</h1>
          <p className="d-sub">Шестнадесет AI агента под управлението на Хермес работят денонощно: хващат клиенти, отговарят навсякъде, пишат съдържание, правят видеа, въртят реклами и затварят сделки. Вие само наблюдавате и одобрявате.</p>
        </div>
        <div className="d-head-actions">
          <button className="d-btn d-btn-primary" onClick={onAllOn}>▶ Пусни всички</button>
          <button className="d-btn" onClick={onAllOff}>⏸ Спри всички</button>
        </div>
      </div>

      <div className="d-kpi-grid">
        {KPIS.map((k) => (
          <div className="d-kpi" key={k.key}>
            <div className="d-kpi-bar" style={{ background: k.color }} />
            <div className="d-kpi-val" style={{ color: k.color }}>{k.prefix}{fmt(kpi[k.key])}{k.suffix}</div>
            <div className="d-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="d-channels-strip">
        <span className="d-strip-label">Свързани канали</span>
        <div className="d-strip-pills">
          {CHANNELS.map((c) => (
            <span key={c.name} className="d-strip-pill" style={{ borderColor: `${c.color}55` }}>
              <span className="d-strip-dot" style={{ background: c.color }} />{c.name}
            </span>
          ))}
        </div>
        <button className="d-link" onClick={() => go("channels")}>Виж всички →</button>
      </div>

      <div className="d-two-col">
        <div className="d-card">
          <div className="d-card-head"><span className="d-card-title">Екипът в момента</span><button className="d-link" onClick={() => go("agents")}>Управлявай →</button></div>
          <div className="d-mini-agents">
            {AGENTS.map((a) => {
              const on = running.has(a.key);
              return (
                <div key={a.key} className={`d-mini-agent ${on ? "is-on" : ""}`}>
                  <span className="d-mini-ico" style={{ color: a.color, borderColor: on ? a.color : "var(--d-line)" }}>{a.icon}</span>
                  <span className="d-mini-name">{a.name}</span>
                  <span className="d-mini-load"><span className="d-mini-load-fill" style={{ width: `${on ? loads[a.key] : 0}%`, background: a.color }} /></span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="d-card">
          <div className="d-card-head"><span className="d-card-title">Последни действия</span><span className="d-feed-live"><span className="d-pulse-dot" /> live</span></div>
          <div className="d-mini-feed">
            {feed.slice(0, 11).map((f) => (
              <div key={f.id} className="d-mini-feed-row"><span className="d-feed-time">{f.t}</span><span style={{ color: f.color }}>{f.agent}</span><span className="d-feed-text">{f.text}</span></div>
            ))}
            {feed.length === 0 && <div className="d-feed-empty">Пуснете агентите, за да видите живите действия.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Хермес (централен мозък)
   ========================================================================== */

function HermesConsole({ kpi, pushFeed, flashToast }: { kpi: Record<KpiKey, number>; pushFeed: (a: string, c: string, t: string) => void; flashToast: (m: string) => void; }) {
  const [msgs, setMsgs] = useState<HermesMsg[]>([
    { id: rid(), role: "hermes", text: "Здравейте! Аз съм Хермес — централният мозък на системата. Управлявам 16-те агента, всички канали и CRM-а. Кажете ми какво да направя." },
  ]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs]);

  const scenario = (cmd: string): { steps: string[]; result: string } => {
    const c = cmd.toLowerCase();
    if (c.includes("отчет")) return { steps: ["Чета CRM и пощата…", "Допитвам се до 16-те агента…", "Обобщавам деня…"], result: `Днес: ${fmt(kpi.leads)} лийда, ${fmt(kpi.replies)} отговора, ${fmt(kpi.deals)} сделки, оборот €${fmt(kpi.revenue)}K. Всичко върви по план.` };
    if (c.includes("follow") || c.includes("оферт")) return { steps: ["Преглеждам отворените оферти…", "Подготвям персонални съобщения…", "Изпращам през имейл и Viber…"], result: "Пуснах follow-up на 7 чакащи оферти. 2 клиента вече отвориха съобщението." };
    if (c.includes("пост") || c.includes("instagram") || c.includes("съдържан")) return { steps: ["Анализирам аудиторията…", "Пиша 3 публикации в стила на марката…", "Насрочвам за FB, IG и TikTok…"], result: "3 публикации са готови и насрочени за най-силните часове (19:00–21:00)." };
    if (c.includes("видео")) return { steps: ["Пиша сценарий…", "Генерирам кадри и глас…", "Монтирам и рендирам…"], result: "Видео 0:30 е готово и чака Вашето одобрение във Видео Студио." };
    if (c.includes("реклам") || c.includes("оптимиз")) return { steps: ["Сравнявам кампаниите…", "Местя бюджета към печелившите…", "Спирам слабите аудитории…"], result: "Оптимизирах рекламите: очаквана цена на лийд −19%, без да пипам бюджета." };
    return { steps: ["Разбирам задачата…", "Насочвам към правилните агенти…", "Изпълнявам…"], result: "Готово. Задачата е изпълнена и записана в CRM." };
  };

  const run = (cmd: string) => {
    if (busy || !cmd.trim()) return;
    setBusy(true);
    setInput("");
    const sc = scenario(cmd);
    setMsgs((m) => [...m, { id: rid(), role: "user", text: cmd }]);
    let i = 0;
    const step = () => {
      if (i < sc.steps.length) {
        const s = sc.steps[i];
        setMsgs((m) => [...m, { id: rid(), role: "step", text: s }]);
        i++;
        window.setTimeout(step, 620);
      } else {
        setMsgs((m) => [...m, { id: rid(), role: "hermes", text: sc.result }]);
        pushFeed("Хермес", "#22d3ee", `Команда изпълнена: ${cmd}`);
        flashToast("Хермес изпълни командата ✓");
        setBusy(false);
      }
    };
    window.setTimeout(step, 480);
  };

  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">ХЕРМЕС · ЦЕНТРАЛЕН МОЗЪК</div>
          <h1 className="d-h1">Един мозък, който <span className="d-grad">движи всичко</span>.</h1>
          <p className="d-sub">Хермес разбира естествен език (текст или глас), решава кои агенти да включи и изпълнява. Пишете команда или изберете готова — и гледайте как мисли и действа на живо.</p>
        </div>
      </div>

      <div className="d-hermes">
        <div className="d-card d-hermes-chat">
          <div className="d-hermes-body" ref={bodyRef}>
            {msgs.map((m) => (
              <div key={m.id} className={`d-hmsg d-hmsg-${m.role}`}>
                {m.role === "step" && <span className="d-hstep-dot" />}
                {m.role === "hermes" && <span className="d-hbadge">❖ Хермес</span>}
                <span className="d-hmsg-text">{m.text}</span>
              </div>
            ))}
            {busy && <div className="d-hmsg d-hmsg-step"><span className="d-stage-spin" /> <span className="d-hmsg-text">Хермес работи…</span></div>}
          </div>
          <div className="d-hermes-input">
            <input className="d-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Напишете команда на Хермес…" onKeyDown={(e) => { if (e.key === "Enter") run(input); }} />
            <button className="d-btn d-btn-primary" onClick={() => run(input)} disabled={busy}>Изпрати</button>
          </div>
        </div>
        <div className="d-card d-hermes-side">
          <div className="d-card-title" style={{ marginBottom: 12 }}>Бързи команди</div>
          <div className="d-hcmds">
            {HERMES_CMDS.map((c) => <button key={c} className="d-hcmd" disabled={busy} onClick={() => run(c)}>{c}</button>)}
          </div>
          <div className="d-hermes-stat">
            <div className="d-hstat"><span>Свързани агенти</span><b>16 / 16</b></div>
            <div className="d-hstat"><span>Канали</span><b>{CHANNELS.length}</b></div>
            <div className="d-hstat"><span>Статус</span><b style={{ color: "var(--d-emerald)" }}>● онлайн</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Агенти
   ========================================================================== */

function AgentsView({ running, loads, toggle, onAllOn, onAllOff }: {
  running: Set<string>; loads: Record<string, number>; toggle: (k: string) => void; onAllOn: () => void; onAllOff: () => void;
}) {
  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">AI ЕКИП · 16 АГЕНТА</div>
          <h1 className="d-h1">Пускате и спирате всеки <span className="d-grad">с един клик</span>.</h1>
          <p className="d-sub">Всеки агент е специалист. Пуснете го — започва да работи веднага. Спрете го — спира. Контролът е изцяло Ваш.</p>
        </div>
        <div className="d-head-actions">
          <button className="d-btn d-btn-primary" onClick={onAllOn}>▶ Пусни всички</button>
          <button className="d-btn" onClick={onAllOff}>⏸ Спри всички</button>
        </div>
      </div>
      <div className="d-agent-grid">
        {AGENTS.map((a) => {
          const on = running.has(a.key);
          return (
            <motion.div key={a.key} className={`d-agent ${on ? "is-on" : ""}`} style={on ? ({ "--ac": a.color } as React.CSSProperties) : undefined} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
              <div className="d-agent-top">
                <span className="d-agent-ico" style={{ color: a.color, borderColor: on ? a.color : "var(--d-line)", boxShadow: on ? `0 0 22px ${a.color}40` : "none" }}>{a.icon}</span>
                <span className={`d-agent-state ${on ? "is-on" : ""}`} style={on ? { color: a.color } : undefined}><span className="d-state-dot" style={on ? { background: a.color } : undefined} /> {on ? "работи" : "спрян"}</span>
              </div>
              <div className="d-agent-name">{a.name}</div>
              <div className="d-agent-role">{a.role}</div>
              <div className="d-agent-load"><div className="d-agent-load-fill" style={{ width: `${on ? loads[a.key] : 0}%`, background: a.color }} /></div>
              <button className={`d-agent-toggle ${on ? "is-on" : ""}`} style={on ? { borderColor: a.color, color: a.color } : undefined} onClick={() => toggle(a.key)}>{on ? "■ Спри" : "▶ Пусни"}</button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Канали
   ========================================================================== */

function ChannelsView() {
  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">КАНАЛИ · ИНТЕГРАЦИИ</div>
          <h1 className="d-h1">Всичките Ви канали — <span className="d-grad">на едно място</span>.</h1>
          <p className="d-sub">Реклами, съобщения, имейли, форми и обаждания влизат в една система. Системата отговаря, публикува и записва — навсякъде, без да скачате между приложения.</p>
        </div>
      </div>
      <div className="d-channel-grid">
        {CHANNELS.map((c) => (
          <motion.div key={c.name} className="d-channel" whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
            <div className="d-channel-top">
              <span className="d-channel-ico" style={{ color: c.color, borderColor: `${c.color}55` }}>{c.name.charAt(0)}</span>
              <span className="d-channel-on" style={{ color: c.color }}><span className="d-state-dot" style={{ background: c.color }} /> свързан</span>
            </div>
            <div className="d-channel-name">{c.name}</div>
            <div className="d-channel-desc">{c.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Имейли (Пощальон)
   ========================================================================== */

function InboxView({ emails, reply }: { emails: Email[]; reply: (id: number) => void }) {
  const newCount = emails.filter((e) => !e.replied).length;
  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">ИМЕЙЛИ · ПОЩАЛЬОНЪТ</div>
          <h1 className="d-h1">AI чете пощата и <span className="d-grad">отговаря вместо Вас</span>.</h1>
          <p className="d-sub">Всеки имейл се разпознава, класифицира и качва в CRM. Запитванията стават лийдове, фактурите се засичат, а отговорите се подготвят автоматично. Вие само одобрявате.</p>
        </div>
        <div className="d-head-actions"><span className="d-pill-count">{newCount} чакат отговор</span></div>
      </div>
      <div className="d-inbox">
        {emails.map((e) => (
          <motion.div key={e.id} layout className={`d-email ${e.replied ? "is-done" : ""}`}>
            <div className="d-email-l">
              <span className="d-email-tag" style={{ background: `${e.color}22`, color: e.color }}>{e.tag}</span>
              <div className="d-email-main">
                <div className="d-email-from">{e.from}</div>
                <div className="d-email-subj">{e.subj}</div>
                <div className="d-email-prev">{e.preview}</div>
              </div>
            </div>
            <div className="d-email-r">
              {e.replied
                ? <span className="d-email-replied">✓ AI отговори</span>
                : <button className="d-mini-btn" onClick={() => reply(e.id)}>✦ AI отговор</button>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Follow-up
   ========================================================================== */

function FollowupView({ followups, doFollowup }: { followups: Followup[]; doFollowup: (id: number) => void }) {
  const pending = followups.filter((f) => !f.done).length;
  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">FOLLOW-UP МАШИНА</div>
          <h1 className="d-h1">Никой клиент <span className="d-grad">не пропада в забвение</span>.</h1>
          <p className="d-sub">Системата помни всяка оферта и всеки разговор. Връща клиентите в точния момент — по имейл, Viber, Messenger или телефон — докато не вземете решение.</p>
        </div>
        <div className="d-head-actions"><span className="d-pill-count">{pending} активни</span></div>
      </div>
      <div className="d-followups">
        {followups.map((f) => (
          <motion.div key={f.id} layout className={`d-fu ${f.done ? "is-done" : ""}`}>
            <span className="d-fu-ch" style={{ background: `${f.color}22`, color: f.color }}>{f.channel}</span>
            <div className="d-fu-main">
              <div className="d-fu-name">{f.name}</div>
              <div className="d-fu-note">{f.note}</div>
            </div>
            <span className="d-fu-due">{f.due}</span>
            {f.done ? <span className="d-email-replied">✓ изпратено</span> : <button className="d-mini-btn" onClick={() => doFollowup(f.id)}>↻ Изпрати сега</button>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Съдържание
   ========================================================================== */

function ContentStudio({ posts, setPosts, pushFeed, setKpi, flashToast }: {
  posts: Post[]; setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  pushFeed: (a: string, c: string, t: string) => void; setKpi: React.Dispatch<React.SetStateAction<Record<KpiKey, number>>>; flashToast: (m: string) => void;
}) {
  const [platform, setPlatform] = useState<(typeof POST_PLATFORMS)[number]>(POST_PLATFORMS[0]);
  const [topic, setTopic] = useState(POST_TOPICS[0]);
  const [busy, setBusy] = useState(false);

  const generate = () => {
    if (busy) return;
    setBusy(true);
    window.setTimeout(() => {
      const text = pick(POST_TEMPLATES).replace("{topic}", topic);
      setPosts((ps) => [{ id: rid(), platform: platform.name, color: platform.color, text, tags: POST_HASHTAGS.slice(0, 4), likes: 0, comments: 0, published: false }, ...ps].slice(0, 14));
      setKpi((k) => ({ ...k, posts: k.posts + 1, hours: k.hours + 0.5 }));
      pushFeed("Постов Криейтор", "#ec4899", `Пост за ${platform.name} генериран`);
      setBusy(false);
      flashToast("Постът е готов ✓");
    }, 850);
  };

  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">СЪДЪРЖАНИЕ</div>
          <h1 className="d-h1">Публикации, които <span className="d-grad">сами се пишат</span>.</h1>
          <p className="d-sub">Изберете мрежа и тема. AI пише в стила на марката Ви и подготвя за всички канали наведнъж — Facebook, Instagram, TikTok, LinkedIn, YouTube.</p>
        </div>
      </div>
      <div className="d-studio">
        <div className="d-card d-studio-panel">
          <label className="d-field-label">Мрежа</label>
          <div className="d-seg">
            {POST_PLATFORMS.map((p) => (
              <button key={p.key} className={`d-seg-btn ${platform.key === p.key ? "is-on" : ""}`} style={platform.key === p.key ? { borderColor: p.color, color: p.color } : undefined} onClick={() => setPlatform(p)}>{p.name}</button>
            ))}
          </div>
          <label className="d-field-label">Тема</label>
          <div className="d-chips">
            {POST_TOPICS.map((t) => <button key={t} className={`d-chip ${topic === t ? "is-on" : ""}`} onClick={() => setTopic(t)}>{t}</button>)}
          </div>
          <button className="d-btn d-btn-primary d-btn-block" onClick={generate} disabled={busy}>{busy ? "Пиша…" : "✎ Генерирай публикация"}</button>
        </div>
        <div className="d-card d-studio-gallery">
          <div className="d-card-head"><span className="d-card-title">Публикации ({posts.length})</span></div>
          {posts.length === 0 && <div className="d-feed-empty">Още няма публикации — генерирайте първата.</div>}
          <div className="d-post-list">
            <AnimatePresence initial={false}>
              {posts.map((p) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="d-post">
                  <div className="d-post-head"><span className="d-post-net" style={{ background: `${p.color}22`, color: p.color }}>{p.platform}</span>{p.published && <span className="d-post-pub">● публикувано</span>}</div>
                  <div className="d-post-text">{p.text}</div>
                  <div className="d-post-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
                  <div className="d-post-foot">
                    <span className="d-post-stat">♥ {p.likes}</span>
                    <span className="d-post-stat">💬 {p.comments}</span>
                    <button className={`d-mini-btn ${p.published ? "is-pub" : ""}`} onClick={() => { setPosts((ps) => ps.map((x) => x.id === p.id ? { ...x, published: !x.published, likes: x.published ? 0 : 40 + Math.floor(Math.random() * 260), comments: x.published ? 0 : 3 + Math.floor(Math.random() * 30) } : x)); flashToast(p.published ? "Свалено" : "Публикувано ✓"); }}>{p.published ? "✓ Публикувано" : "↑ Публикувай"}</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Видео Студио
   ========================================================================== */

function VideoStudio({ onDone, videos, setVideos, flashToast }: {
  onDone: (title: string) => void; videos: Video[]; setVideos: React.Dispatch<React.SetStateAction<Video[]>>; flashToast: (m: string) => void;
}) {
  const [topic, setTopic] = useState("Промо на нов продукт");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);

  const generate = () => {
    if (busy) return;
    setBusy(true); setStage(0);
    let s = 0;
    const tick = () => {
      s++; setStage(s);
      if (s >= VIDEO_STAGES.length) { window.setTimeout(() => { onDone(topic); setBusy(false); setStage(0); }, 350); return; }
      window.setTimeout(tick, 520);
    };
    window.setTimeout(tick, 520);
  };

  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">ВИДЕО СТУДИО</div>
          <h1 className="d-h1">Рекламно видео от <span className="d-grad">едно изречение</span>.</h1>
          <p className="d-sub">Опишете идеята. AI пише сценарий, прави кадрите, озвучава и монтира. Готово за публикуване във всички мрежи за секунди.</p>
        </div>
      </div>
      <div className="d-studio">
        <div className="d-card d-studio-panel">
          <label className="d-field-label">Каква е идеята за видеото?</label>
          <input className="d-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="напр. Промо на нов продукт" />
          <div className="d-chips">{VIDEO_IDEAS.map((i) => <button key={i} className="d-chip" onClick={() => setTopic(i)}>{i}</button>)}</div>
          <button className="d-btn d-btn-primary d-btn-block" onClick={generate} disabled={busy}>{busy ? "Генерирам…" : "✦ Генерирай видео"}</button>
          <div className="d-stages">
            {VIDEO_STAGES.map((st, i) => {
              const done = busy && stage > i; const active = busy && stage === i + 1;
              return (<div key={st} className={`d-stage ${done ? "is-done" : ""} ${active ? "is-active" : ""}`}><span className="d-stage-dot">{done ? "✓" : i + 1}</span><span>{st}</span>{active && <span className="d-stage-spin" />}</div>);
            })}
          </div>
        </div>
        <div className="d-card d-studio-gallery">
          <div className="d-card-head"><span className="d-card-title">Генерирани видеа ({videos.length})</span></div>
          {videos.length === 0 && <div className="d-feed-empty">Още няма видеа — генерирайте първото.</div>}
          <div className="d-video-grid">
            <AnimatePresence initial={false}>
              {videos.map((v) => (
                <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="d-video">
                  <div className="d-video-thumb"><span className="d-video-play">▷</span><span className="d-video-len">{v.len}</span></div>
                  <div className="d-video-title">{v.title}</div>
                  <button className={`d-mini-btn ${v.published ? "is-pub" : ""}`} onClick={() => { setVideos((vs) => vs.map((x) => x.id === v.id ? { ...x, published: !x.published } : x)); flashToast(v.published ? "Свалено" : "Публикувано ✓"); }}>{v.published ? "✓ Публикувано" : "↑ Публикувай"}</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Реклами
   ========================================================================== */

function AdsView({ campaigns, optimize, toggle }: { campaigns: Campaign[]; optimize: (id: number) => void; toggle: (id: number) => void }) {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">РЕКЛАМИ · META + ОЩЕ</div>
          <h1 className="d-h1">Реклами, които <span className="d-grad">сами се оптимизират</span>.</h1>
          <p className="d-sub">Кампаниите се управляват директно от системата. Лийдовете от рекламите влизат автоматично в CRM, а Рекламният Пилот мести бюджета към това, което носи пари.</p>
        </div>
      </div>
      <div className="d-ads-stat">
        <div className="d-kpi"><div className="d-kpi-bar" style={{ background: "#6366f1" }} /><div className="d-kpi-val" style={{ color: "#6366f1" }}>€{fmt(totalSpend)}</div><div className="d-kpi-label">Похарчено този месец</div></div>
        <div className="d-kpi"><div className="d-kpi-bar" style={{ background: "#22d3ee" }} /><div className="d-kpi-val" style={{ color: "#22d3ee" }}>{fmt(totalLeads)}</div><div className="d-kpi-label">Лийда от реклами</div></div>
        <div className="d-kpi"><div className="d-kpi-bar" style={{ background: "#34d399" }} /><div className="d-kpi-val" style={{ color: "#34d399" }}>{campaigns.filter((c) => c.active).length}</div><div className="d-kpi-label">Активни кампании</div></div>
      </div>
      <div className="d-ads">
        {campaigns.map((c) => (
          <motion.div key={c.id} layout className={`d-ad ${c.active ? "" : "is-off"}`}>
            <div className="d-ad-l">
              <span className="d-ad-net" style={{ background: `${c.color}22`, color: c.color }}>{c.net}</span>
              <div>
                <div className="d-ad-name">{c.name}</div>
                <div className="d-ad-metrics">
                  <span>Бюджет <b>€{c.spend}</b></span>
                  <span>Лийдове <b>{c.leads}</b></span>
                  <span>Цена/лийд <b style={{ color: c.cpl < 7 ? "var(--d-emerald)" : "var(--d-amber)" }}>€{c.cpl}</b></span>
                  <span>ROAS <b style={{ color: "var(--d-emerald)" }}>{c.roas}×</b></span>
                </div>
              </div>
            </div>
            <div className="d-ad-r">
              <button className="d-mini-btn" onClick={() => optimize(c.id)}>✦ Оптимизирай</button>
              <button className={`d-toggle-pill ${c.active ? "is-on" : ""}`} onClick={() => toggle(c.id)}>{c.active ? "● активна" : "○ спряна"}</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: CRM Поток
   ========================================================================== */

function Pipeline({ leads, advance, addLead }: { leads: Lead[]; advance: (id: number) => void; addLead: () => void }) {
  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">CRM ПОТОК</div>
          <h1 className="d-h1">Всеки клиент — <span className="d-grad">проследен до сделка</span>.</h1>
          <p className="d-sub">Лийдовете влизат автоматично и се движат през ясни етапи. Натиснете „придвижи“, за да преместите клиент напред — или оставете агентите да го правят.</p>
        </div>
        <div className="d-head-actions"><button className="d-btn d-btn-primary" onClick={addLead}>+ Нов лийд</button></div>
      </div>
      <div className="d-board">
        {STAGES.map((s) => {
          const col = leads.filter((l) => l.stage === s.key);
          return (
            <div className="d-col" key={s.key}>
              <div className="d-col-head"><span className="d-col-name" style={{ color: s.color }}>{s.name}</span><span className="d-col-count" style={{ background: `${s.color}1f`, color: s.color }}>{col.length}</span></div>
              <div className="d-col-body">
                <AnimatePresence initial={false}>
                  {col.map((l) => (
                    <motion.div key={l.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="d-lead">
                      <div className="d-lead-top"><span className="d-lead-name">{l.name}</span><span className="d-lead-val">€{l.value}K</span></div>
                      <span className="d-lead-src" style={{ color: l.sourceColor }}>● {l.source}</span>
                      {l.stage !== "won" ? <button className="d-lead-adv" onClick={() => advance(l.id)}>придвижи →</button> : <span className="d-lead-won">✓ спечелен</span>}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {col.length === 0 && <div className="d-col-empty">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   ИЗГЛЕД: Аналитика
   ========================================================================== */

function Analytics({ kpi }: { kpi: Record<KpiKey, number> }) {
  return (
    <div className="d-view">
      <div className="d-view-head">
        <div>
          <div className="d-eyebrow">АНАЛИТИКА · ОПТИМИЗАЦИЯ</div>
          <h1 className="d-h1">Системата си казва <span className="d-grad">какво да подобри</span>.</h1>
          <p className="d-sub">Всяка нощ Одиторът прави равнение и анализ. Сутрин получавате ясни препоръки — къде да наблегнете, какво да спрете и кое носи най-много пари.</p>
        </div>
      </div>
      <div className="d-two-col">
        <div className="d-card">
          <div className="d-card-head"><span className="d-card-title">Възвръщаемост по канал</span><span className="d-feed-time">последни 30 дни</span></div>
          <div className="d-roi">
            {ROI.map((r) => (
              <div key={r.ch} className="d-roi-row">
                <span className="d-roi-ch">{r.ch}</span>
                <span className="d-roi-track"><span className="d-roi-fill" style={{ width: `${r.v}%`, background: r.color }} /></span>
                <span className="d-roi-v">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="d-roi-note">Оборот този месец: <b style={{ color: "var(--d-gold)" }}>€{fmt(kpi.revenue)}K</b> · {fmt(kpi.deals)} сделки</div>
        </div>
        <div className="d-card">
          <div className="d-card-head"><span className="d-card-title">Препоръки от Одитора</span><span className="d-feed-live"><span className="d-pulse-dot" /> ново</span></div>
          <div className="d-insights">
            {INSIGHTS.map((it) => (
              <div key={it.t} className="d-insight" style={{ borderLeftColor: it.c }}>
                <div className="d-insight-t">{it.t}</div>
                <div className="d-insight-d">{it.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   Помощни UI
   ========================================================================== */

function LiveClock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => { setT(clock()); const id = setInterval(() => setT(clock()), 1000); return () => clearInterval(id); }, []);
  return <>{t}</>;
}

function Boot() {
  return (
    <motion.div className="d-boot" exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <div className="d-boot-inner">
        <div className="d-boot-logo">ProMarketing<span style={{ color: "var(--d-cyan)" }}> OS</span></div>
        <div className="d-boot-bar"><motion.div className="d-boot-fill" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, ease: "easeInOut" }} /></div>
        <div className="d-boot-text">Зареждам Хермес и 16-те агента…</div>
      </div>
    </motion.div>
  );
}

function VoiceModal({ onClose, run }: { onClose: () => void; run: (t: string) => void }) {
  const CMDS = ["Дай ми отчет за днес", "Пусни рекламните агенти", "Генерирай видео за оферта", "Кои оферти чакат отговор?"];
  const [phase, setPhase] = useState<"idle" | "listening" | "done">("idle");
  const [cmd, setCmd] = useState("");
  const speak = (c: string) => {
    setCmd(c); setPhase("listening");
    window.setTimeout(() => { setPhase("done"); run(`Гласова команда изпълнена: ${c}`); window.setTimeout(onClose, 1100); }, 1400);
  };
  return (
    <motion.div className="d-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="d-modal" initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className={`d-voice-orb ${phase === "listening" ? "is-listening" : ""}`}>❖</div>
        <div className="d-voice-status">{phase === "idle" && "Кажете команда (или изберете):"}{phase === "listening" && cmd}{phase === "done" && "✓ Изпълнено"}</div>
        {phase === "idle" && <div className="d-voice-cmds">{CMDS.map((c) => <button key={c} className="d-chip" onClick={() => speak(c)}>{c}</button>)}</div>}
        <button className="d-modal-close" onClick={onClose}>затвори</button>
      </motion.div>
    </motion.div>
  );
}

/* ---------- seed ---------- */

function seedLeads(): Lead[] {
  const data: { name: string; src: number; value: number; stage: StageKey }[] = [
    { name: "Г. Иванов", src: 0, value: 8, stage: "new" },
    { name: "С. Петрова", src: 2, value: 5, stage: "new" },
    { name: "М. Костов", src: 1, value: 12, stage: "new" },
    { name: "Е. Димитрова", src: 0, value: 4, stage: "contact" },
    { name: "Н. Стоянов", src: 3, value: 9, stage: "contact" },
    { name: "Р. Колева", src: 1, value: 15, stage: "offer" },
    { name: "Д. Маринов", src: 4, value: 7, stage: "offer" },
    { name: "В. Тодоров", src: 2, value: 11, stage: "nego" },
    { name: "А. Николова", src: 3, value: 6, stage: "won" },
    { name: "К. Георгиев", src: 1, value: 14, stage: "won" },
  ];
  return data.map((d) => { const src = LEAD_SOURCES[d.src]; return { id: rid(), name: d.name, source: src.s, sourceColor: src.c, value: d.value, stage: d.stage }; });
}

/* ============================================================================
   CSS
   ========================================================================== */

const CSS = `
.d-root{position:relative;min-height:100vh;font-family:var(--d-body),system-ui,sans-serif;color:var(--d-text);}
.d-root *{box-sizing:border-box;}
.d-root button{font-family:inherit;cursor:pointer;}

.d-bg-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(120,165,220,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(120,165,220,.05) 1px,transparent 1px);background-size:54px 54px;mask-image:radial-gradient(ellipse 80% 70% at 50% 0%,#000 30%,transparent 80%);}
.d-bg-glow{position:fixed;z-index:0;pointer-events:none;border-radius:50%;filter:blur(90px);opacity:.5;}
.d-bg-glow-1{width:620px;height:620px;top:-180px;right:-120px;background:radial-gradient(circle,rgba(34,211,238,.22),transparent 65%);}
.d-bg-glow-2{width:540px;height:540px;bottom:-200px;left:-140px;background:radial-gradient(circle,rgba(139,92,246,.20),transparent 65%);}
.d-scan{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.4;background:repeating-linear-gradient(to bottom,transparent 0,transparent 2px,rgba(0,0,0,.18) 3px,transparent 4px);}

.d-hud{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:13px 22px;border-bottom:1px solid var(--d-line);background:linear-gradient(180deg,rgba(7,12,24,.92),rgba(7,12,24,.66));backdrop-filter:blur(14px);}
.d-hud-brand{display:flex;align-items:center;gap:11px;min-width:0;}
.d-logo-dot{width:11px;height:11px;border-radius:50%;background:var(--d-cyan);box-shadow:0 0 14px var(--d-cyan);flex:none;animation:dpulse 2.4s infinite;}
.d-logo{font-family:var(--d-display);font-weight:800;font-size:18px;letter-spacing:.5px;white-space:nowrap;}
.d-tag{font-family:var(--d-mono);font-size:10.5px;color:var(--d-faint);letter-spacing:1px;border-left:1px solid var(--d-line);padding-left:11px;white-space:nowrap;}
.d-hud-right{display:flex;align-items:center;gap:14px;}
.d-status{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--d-dim);white-space:nowrap;}
.d-pulse-dot{width:7px;height:7px;border-radius:50%;background:var(--d-emerald);box-shadow:0 0 10px var(--d-emerald);animation:dpulse 1.8s infinite;flex:none;}
.d-clock{font-family:var(--d-mono);font-size:12.5px;color:var(--d-cyan);letter-spacing:.5px;}
.d-voice-btn{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:10px;border:1px solid var(--d-line-bright);background:rgba(34,211,238,.08);color:var(--d-cyan);font-size:13px;font-weight:600;transition:.2s;}
.d-voice-btn:hover{background:rgba(34,211,238,.16);box-shadow:0 0 20px rgba(34,211,238,.2);}
.d-mic{font-size:14px;}

.d-shell{position:relative;z-index:10;display:grid;grid-template-columns:212px 1fr 290px;align-items:start;}
.d-rail{position:sticky;top:55px;height:calc(100vh - 55px);overflow-y:auto;display:flex;flex-direction:column;gap:4px;padding:16px 12px;border-right:1px solid var(--d-line);}
.d-rail-item{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:11px;border:1px solid transparent;background:transparent;color:var(--d-dim);font-size:13.5px;font-weight:600;text-align:left;transition:.18s;flex:none;}
.d-rail-item:hover{background:rgba(120,165,220,.06);color:var(--d-text);}
.d-rail-item.is-active{background:linear-gradient(90deg,rgba(34,211,238,.14),rgba(34,211,238,.02));border-color:var(--d-line-bright);color:var(--d-text);box-shadow:inset 2px 0 0 var(--d-cyan);}
.d-rail-icon{font-size:16px;width:20px;text-align:center;flex:none;}
.d-rail-cta{display:block;text-align:center;margin-top:10px;padding:12px;border-radius:11px;background:var(--d-cyan);color:#04121a;font-weight:700;font-size:13px;text-decoration:none;transition:.2s;flex:none;}
.d-rail-cta:hover{box-shadow:0 0 26px rgba(34,211,238,.4);transform:translateY(-1px);}

.d-main{min-width:0;padding:26px 26px 60px;}

.d-feed{position:sticky;top:55px;height:calc(100vh - 55px);display:flex;flex-direction:column;border-left:1px solid var(--d-line);background:rgba(7,12,24,.4);}
.d-feed-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--d-line);}
.d-feed-title{font-family:var(--d-display);font-weight:700;font-size:14px;letter-spacing:.5px;}
.d-feed-live{display:flex;align-items:center;gap:6px;font-family:var(--d-mono);font-size:10.5px;color:var(--d-emerald);text-transform:uppercase;letter-spacing:1px;}
.d-feed-body{flex:1;overflow-y:auto;padding:10px 14px;}
.d-feed-empty{color:var(--d-faint);font-size:12.5px;padding:18px 6px;line-height:1.6;}
.d-feed-row{display:flex;flex-direction:column;gap:2px;padding:9px 10px;border-radius:9px;margin-bottom:5px;background:rgba(120,165,220,.04);border:1px solid var(--d-line);}
.d-feed-time{font-family:var(--d-mono);font-size:10px;color:var(--d-faint);}
.d-feed-agent{font-size:11.5px;font-weight:700;}
.d-feed-text{font-size:12.5px;color:var(--d-dim);line-height:1.45;}

.d-view-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap;}
.d-eyebrow{font-family:var(--d-mono);font-size:11px;letter-spacing:3px;color:var(--d-cyan);margin-bottom:10px;}
.d-h1{font-family:var(--d-display);font-weight:800;font-size:clamp(23px,2.6vw,32px);line-height:1.12;margin:0;letter-spacing:-.01em;}
.d-grad{background:linear-gradient(100deg,var(--d-cyan),var(--d-violet) 60%,var(--d-pink));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
.d-sub{color:var(--d-dim);font-size:14.5px;line-height:1.6;max-width:600px;margin:12px 0 0;}
.d-head-actions{display:flex;gap:10px;flex:none;align-items:center;}

.d-btn{padding:11px 18px;border-radius:11px;border:1px solid var(--d-line-bright);background:rgba(120,165,220,.06);color:var(--d-text);font-size:13.5px;font-weight:600;transition:.18s;}
.d-btn:hover{background:rgba(120,165,220,.12);}
.d-btn-primary{background:var(--d-cyan);color:#04121a;border-color:var(--d-cyan);}
.d-btn-primary:hover{box-shadow:0 0 24px rgba(34,211,238,.4);}
.d-btn-block{width:100%;margin-top:14px;}
.d-btn:disabled{opacity:.6;cursor:not-allowed;}
.d-link{background:none;border:none;color:var(--d-cyan);font-size:12.5px;font-weight:600;}
.d-pill-count{padding:8px 14px;border-radius:20px;border:1px solid var(--d-line-bright);background:rgba(34,211,238,.08);color:var(--d-cyan);font-size:12.5px;font-weight:600;}

.d-kpi-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:11px;margin-bottom:18px;}
.d-kpi{position:relative;overflow:hidden;padding:15px 14px;border-radius:14px;border:1px solid var(--d-line);background:var(--d-panel);}
.d-kpi-bar{position:absolute;top:0;left:0;width:100%;height:2px;opacity:.85;}
.d-kpi-val{font-family:var(--d-display);font-weight:800;font-size:21px;line-height:1;letter-spacing:-.02em;}
.d-kpi-label{font-size:11.5px;color:var(--d-dim);margin-top:7px;line-height:1.3;}

.d-channels-strip{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 16px;border:1px solid var(--d-line);border-radius:14px;background:var(--d-panel);margin-bottom:18px;}
.d-strip-label{font-family:var(--d-mono);font-size:10.5px;letter-spacing:1.5px;color:var(--d-faint);text-transform:uppercase;flex:none;}
.d-strip-pills{display:flex;flex-wrap:wrap;gap:7px;flex:1;}
.d-strip-pill{display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:20px;border:1px solid var(--d-line);font-size:12px;color:var(--d-dim);}
.d-strip-dot{width:6px;height:6px;border-radius:50%;}

.d-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.d-card{border:1px solid var(--d-line);border-radius:16px;background:var(--d-panel);padding:18px;}
.d-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;}
.d-card-title{font-family:var(--d-display);font-weight:700;font-size:15px;}

.d-mini-agents{display:grid;grid-template-columns:1fr 1fr;gap:9px 16px;max-height:360px;overflow-y:auto;}
.d-mini-agent{display:grid;grid-template-columns:28px 1fr 54px;align-items:center;gap:9px;opacity:.5;transition:.2s;}
.d-mini-agent.is-on{opacity:1;}
.d-mini-ico{width:28px;height:28px;border-radius:8px;border:1px solid var(--d-line);display:flex;align-items:center;justify-content:center;font-size:13px;}
.d-mini-name{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.d-mini-load{height:5px;border-radius:3px;background:rgba(120,165,220,.12);overflow:hidden;}
.d-mini-load-fill{display:block;height:100%;border-radius:3px;transition:width .6s ease;}
.d-mini-feed{display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;}
.d-mini-feed-row{display:grid;grid-template-columns:54px 110px 1fr;gap:8px;align-items:baseline;font-size:12px;}
.d-mini-feed-row>span:nth-child(2){font-weight:700;font-size:11.5px;}

.d-agent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:14px;}
.d-agent{position:relative;border:1px solid var(--d-line);border-radius:16px;background:var(--d-panel);padding:17px;transition:.2s;}
.d-agent.is-on{border-color:var(--ac);box-shadow:0 0 0 1px var(--ac) inset,0 12px 40px -22px var(--ac);}
.d-agent-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;}
.d-agent-ico{width:42px;height:42px;border-radius:12px;border:1px solid var(--d-line);display:flex;align-items:center;justify-content:center;font-size:19px;transition:.25s;}
.d-agent-state{display:flex;align-items:center;gap:6px;font-family:var(--d-mono);font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--d-faint);}
.d-state-dot{width:6px;height:6px;border-radius:50%;background:var(--d-faint);}
.d-agent-state.is-on .d-state-dot{animation:dpulse 1.6s infinite;}
.d-agent-name{font-family:var(--d-display);font-weight:700;font-size:15px;}
.d-agent-role{font-size:12px;color:var(--d-dim);line-height:1.45;margin:5px 0 13px;min-height:34px;}
.d-agent-load{height:5px;border-radius:3px;background:rgba(120,165,220,.12);overflow:hidden;margin-bottom:13px;}
.d-agent-load-fill{height:100%;border-radius:3px;transition:width .6s ease;}
.d-agent-toggle{width:100%;padding:9px;border-radius:10px;border:1px solid var(--d-line);background:rgba(120,165,220,.05);color:var(--d-dim);font-size:13px;font-weight:700;transition:.18s;}
.d-agent-toggle:hover{background:rgba(120,165,220,.1);}
.d-agent-toggle.is-on{background:transparent;}

.d-channel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:13px;}
.d-channel{border:1px solid var(--d-line);border-radius:14px;background:var(--d-panel);padding:16px;}
.d-channel-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.d-channel-ico{width:38px;height:38px;border-radius:11px;border:1px solid var(--d-line);display:flex;align-items:center;justify-content:center;font-family:var(--d-display);font-weight:800;font-size:17px;}
.d-channel-on{display:flex;align-items:center;gap:6px;font-size:11px;}
.d-channel-name{font-weight:700;font-size:14.5px;}
.d-channel-desc{font-size:12px;color:var(--d-dim);margin-top:4px;line-height:1.4;}

.d-inbox{display:flex;flex-direction:column;gap:10px;}
.d-email{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid var(--d-line);border-radius:13px;background:var(--d-panel);padding:14px 16px;transition:.2s;}
.d-email.is-done{opacity:.55;}
.d-email-l{display:flex;gap:13px;min-width:0;}
.d-email-tag{flex:none;align-self:flex-start;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;}
.d-email-from{font-size:12px;color:var(--d-dim);}
.d-email-subj{font-size:14px;font-weight:600;margin:2px 0;}
.d-email-prev{font-size:12.5px;color:var(--d-dim);line-height:1.45;}
.d-email-r{flex:none;}
.d-email-replied{font-size:12.5px;color:var(--d-emerald);font-weight:600;}

.d-mini-btn{padding:8px 13px;border-radius:9px;border:1px solid var(--d-line-bright);background:rgba(34,211,238,.08);color:var(--d-cyan);font-size:12px;font-weight:600;transition:.16s;white-space:nowrap;}
.d-mini-btn:hover{background:rgba(34,211,238,.16);}
.d-mini-btn.is-pub{border-color:var(--d-emerald);background:rgba(52,211,153,.12);color:var(--d-emerald);}

.d-followups{display:flex;flex-direction:column;gap:10px;}
.d-fu{display:flex;align-items:center;gap:14px;border:1px solid var(--d-line);border-radius:13px;background:var(--d-panel);padding:13px 16px;transition:.2s;}
.d-fu.is-done{opacity:.55;}
.d-fu-ch{flex:none;font-size:11px;font-weight:700;padding:5px 11px;border-radius:7px;}
.d-fu-main{flex:1;min-width:0;}
.d-fu-name{font-size:14px;font-weight:600;}
.d-fu-note{font-size:12.5px;color:var(--d-dim);margin-top:2px;}
.d-fu-due{font-family:var(--d-mono);font-size:11.5px;color:var(--d-faint);flex:none;}

.d-studio{display:grid;grid-template-columns:340px 1fr;gap:16px;align-items:start;}
.d-studio-panel{position:sticky;top:74px;}
.d-field-label{display:block;font-size:12px;color:var(--d-dim);margin:0 0 8px;font-weight:600;}
.d-input{width:100%;padding:12px 14px;border-radius:11px;border:1px solid var(--d-line);background:rgba(4,6,13,.6);color:var(--d-text);font-size:14px;font-family:inherit;outline:none;transition:.18s;}
.d-input:focus{border-color:var(--d-line-bright);box-shadow:0 0 0 3px rgba(34,211,238,.1);}
.d-chips{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 4px;}
.d-chip{padding:7px 12px;border-radius:20px;border:1px solid var(--d-line);background:rgba(120,165,220,.05);color:var(--d-dim);font-size:12px;transition:.16s;}
.d-chip:hover{color:var(--d-text);border-color:var(--d-line-bright);}
.d-chip.is-on{background:rgba(34,211,238,.12);color:var(--d-cyan);border-color:var(--d-line-bright);}
.d-seg{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;}
.d-seg-btn{flex:1;min-width:78px;padding:9px;border-radius:10px;border:1px solid var(--d-line);background:rgba(120,165,220,.05);color:var(--d-dim);font-size:12.5px;font-weight:600;transition:.16s;}
.d-seg-btn.is-on{background:rgba(120,165,220,.08);}

.d-stages{margin-top:18px;display:flex;flex-direction:column;gap:8px;}
.d-stage{display:flex;align-items:center;gap:11px;font-size:13px;color:var(--d-faint);transition:.2s;}
.d-stage-dot{width:24px;height:24px;border-radius:50%;border:1px solid var(--d-line);display:flex;align-items:center;justify-content:center;font-size:11px;font-family:var(--d-mono);flex:none;}
.d-stage.is-active{color:var(--d-text);}
.d-stage.is-active .d-stage-dot{border-color:var(--d-cyan);color:var(--d-cyan);box-shadow:0 0 14px rgba(34,211,238,.3);}
.d-stage.is-done{color:var(--d-emerald);}
.d-stage.is-done .d-stage-dot{border-color:var(--d-emerald);color:var(--d-emerald);background:rgba(52,211,153,.1);}
.d-stage-spin{width:13px;height:13px;border-radius:50%;border:2px solid rgba(34,211,238,.25);border-top-color:var(--d-cyan);animation:dspin .7s linear infinite;flex:none;}

.d-video-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
.d-video{border:1px solid var(--d-line);border-radius:12px;overflow:hidden;background:rgba(4,6,13,.5);}
.d-video-thumb{position:relative;height:92px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(52,211,153,.22),rgba(34,211,238,.1),rgba(139,92,246,.16));}
.d-video-play{font-size:26px;color:#fff;opacity:.9;}
.d-video-len{position:absolute;bottom:7px;right:8px;font-family:var(--d-mono);font-size:10px;background:rgba(0,0,0,.55);padding:2px 6px;border-radius:5px;}
.d-video-title{font-size:13px;font-weight:600;padding:10px 11px 8px;}
.d-video .d-mini-btn{margin:0 11px 11px;display:block;text-align:center;}

.d-post-list{display:flex;flex-direction:column;gap:12px;}
.d-post{border:1px solid var(--d-line);border-radius:12px;padding:14px;background:rgba(4,6,13,.5);}
.d-post-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.d-post-net{font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;}
.d-post-pub{font-size:11px;color:var(--d-emerald);}
.d-post-text{font-size:13.5px;line-height:1.55;}
.d-post-tags{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;}
.d-post-tags span{font-size:11.5px;color:var(--d-sky);}
.d-post-foot{display:flex;align-items:center;gap:14px;border-top:1px solid var(--d-line);padding-top:10px;}
.d-post-stat{font-size:12px;color:var(--d-dim);}
.d-post-foot .d-mini-btn{margin-left:auto;}

.d-ads-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-bottom:16px;}
.d-ads{display:flex;flex-direction:column;gap:11px;}
.d-ad{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid var(--d-line);border-radius:13px;background:var(--d-panel);padding:14px 16px;transition:.2s;}
.d-ad.is-off{opacity:.5;}
.d-ad-l{display:flex;align-items:center;gap:13px;min-width:0;}
.d-ad-net{flex:none;font-size:11px;font-weight:700;padding:5px 11px;border-radius:7px;}
.d-ad-name{font-size:14px;font-weight:600;}
.d-ad-metrics{display:flex;flex-wrap:wrap;gap:14px;margin-top:5px;font-size:12px;color:var(--d-dim);}
.d-ad-metrics b{color:var(--d-text);}
.d-ad-r{display:flex;align-items:center;gap:9px;flex:none;}
.d-toggle-pill{padding:7px 12px;border-radius:20px;border:1px solid var(--d-line);background:transparent;color:var(--d-faint);font-size:11.5px;font-weight:600;}
.d-toggle-pill.is-on{border-color:var(--d-emerald);color:var(--d-emerald);}

.d-board{display:grid;grid-template-columns:repeat(5,1fr);gap:11px;}
.d-col{border:1px solid var(--d-line);border-radius:14px;background:rgba(7,12,24,.4);padding:11px;min-height:300px;}
.d-col-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;}
.d-col-name{font-size:12.5px;font-weight:700;}
.d-col-count{font-family:var(--d-mono);font-size:11px;padding:2px 8px;border-radius:20px;}
.d-col-body{display:flex;flex-direction:column;gap:9px;}
.d-col-empty{color:var(--d-faint);text-align:center;padding:10px;font-size:13px;}
.d-lead{border:1px solid var(--d-line);border-radius:10px;background:var(--d-panel-solid);padding:11px;}
.d-lead-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.d-lead-name{font-size:13px;font-weight:600;}
.d-lead-val{font-family:var(--d-mono);font-size:12px;color:var(--d-gold);}
.d-lead-src{font-size:11px;}
.d-lead-adv{display:block;width:100%;margin-top:9px;padding:6px;border-radius:7px;border:1px solid var(--d-line);background:rgba(120,165,220,.05);color:var(--d-dim);font-size:11.5px;transition:.16s;}
.d-lead-adv:hover{color:var(--d-cyan);border-color:var(--d-line-bright);background:rgba(34,211,238,.08);}
.d-lead-won{display:block;margin-top:9px;font-size:11.5px;color:var(--d-emerald);text-align:center;}

.d-hermes{display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start;}
.d-hermes-chat{display:flex;flex-direction:column;height:540px;padding:0;overflow:hidden;}
.d-hermes-body{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:11px;}
.d-hmsg{max-width:80%;font-size:13.5px;line-height:1.5;padding:11px 14px;border-radius:12px;}
.d-hmsg-text{display:inline;}
.d-hmsg-user{align-self:flex-end;background:rgba(34,211,238,.14);border:1px solid var(--d-line-bright);color:var(--d-text);border-bottom-right-radius:4px;}
.d-hmsg-hermes{align-self:flex-start;background:var(--d-panel-solid);border:1px solid var(--d-line);border-bottom-left-radius:4px;}
.d-hmsg-step{align-self:flex-start;display:flex;align-items:center;gap:9px;background:transparent;color:var(--d-faint);font-family:var(--d-mono);font-size:12px;padding:3px 4px;}
.d-hstep-dot{width:6px;height:6px;border-radius:50%;background:var(--d-cyan);animation:dpulse 1.2s infinite;flex:none;}
.d-hbadge{display:block;font-family:var(--d-mono);font-size:10px;letter-spacing:1px;color:var(--d-cyan);margin-bottom:5px;text-transform:uppercase;}
.d-hermes-input{display:flex;gap:9px;padding:14px;border-top:1px solid var(--d-line);}
.d-hermes-input .d-input{flex:1;}
.d-hermes-side{align-self:start;}
.d-hcmds{display:flex;flex-direction:column;gap:8px;margin-bottom:18px;}
.d-hcmd{text-align:left;padding:11px 13px;border-radius:10px;border:1px solid var(--d-line);background:rgba(120,165,220,.05);color:var(--d-dim);font-size:12.5px;transition:.16s;}
.d-hcmd:hover:not(:disabled){color:var(--d-cyan);border-color:var(--d-line-bright);background:rgba(34,211,238,.08);}
.d-hcmd:disabled{opacity:.5;cursor:not-allowed;}
.d-hermes-stat{border-top:1px solid var(--d-line);padding-top:14px;display:flex;flex-direction:column;gap:9px;}
.d-hstat{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--d-dim);}
.d-hstat b{color:var(--d-text);font-family:var(--d-mono);}

.d-roi{display:flex;flex-direction:column;gap:11px;}
.d-roi-row{display:grid;grid-template-columns:84px 1fr 30px;align-items:center;gap:10px;}
.d-roi-ch{font-size:12.5px;color:var(--d-dim);}
.d-roi-track{height:8px;border-radius:4px;background:rgba(120,165,220,.1);overflow:hidden;}
.d-roi-fill{display:block;height:100%;border-radius:4px;transition:width .8s ease;}
.d-roi-v{font-family:var(--d-mono);font-size:12px;color:var(--d-text);text-align:right;}
.d-roi-note{margin-top:14px;padding-top:13px;border-top:1px solid var(--d-line);font-size:13px;color:var(--d-dim);}
.d-insights{display:flex;flex-direction:column;gap:10px;}
.d-insight{border:1px solid var(--d-line);border-left:3px solid var(--d-cyan);border-radius:0 10px 10px 0;background:rgba(120,165,220,.04);padding:12px 14px;}
.d-insight-t{font-size:13.5px;font-weight:600;}
.d-insight-d{font-size:12.5px;color:var(--d-dim);margin-top:4px;line-height:1.45;}

.d-boot{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;background:#04060d;}
.d-boot-inner{text-align:center;}
.d-boot-logo{font-family:var(--d-display);font-weight:800;font-size:30px;letter-spacing:1px;margin-bottom:24px;}
.d-boot-bar{width:240px;height:3px;border-radius:3px;background:rgba(120,165,220,.14);overflow:hidden;margin:0 auto;}
.d-boot-fill{height:100%;background:linear-gradient(90deg,var(--d-cyan),var(--d-violet));}
.d-boot-text{font-family:var(--d-mono);font-size:11.5px;color:var(--d-faint);margin-top:16px;letter-spacing:1px;}

.d-modal-bg{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(4,6,13,.7);backdrop-filter:blur(6px);padding:20px;}
.d-modal{width:100%;max-width:420px;border:1px solid var(--d-line-bright);border-radius:20px;background:var(--d-panel-solid);padding:32px 26px;text-align:center;box-shadow:0 30px 80px -30px rgba(34,211,238,.4);}
.d-voice-orb{width:90px;height:90px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:38px;color:var(--d-cyan);border:1px solid var(--d-line-bright);background:radial-gradient(circle,rgba(99,102,241,.2),transparent 70%);}
.d-voice-orb.is-listening{animation:dorb 1.2s infinite;}
.d-voice-status{font-size:16px;font-weight:600;margin-bottom:18px;min-height:24px;}
.d-voice-cmds{display:flex;flex-direction:column;gap:9px;margin-bottom:18px;}
.d-voice-cmds .d-chip{text-align:center;}
.d-modal-close{background:none;border:none;color:var(--d-faint);font-size:12.5px;text-decoration:underline;}

.d-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:85;padding:13px 22px;border-radius:12px;border:1px solid var(--d-line-bright);background:rgba(7,12,24,.95);color:var(--d-text);font-size:13.5px;font-weight:600;box-shadow:0 16px 40px -16px rgba(0,0,0,.7);}

@keyframes dpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
@keyframes dspin{to{transform:rotate(360deg)}}
@keyframes dorb{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.4)}50%{box-shadow:0 0 0 16px rgba(99,102,241,0)}}

@media(max-width:1240px){
  .d-shell{grid-template-columns:64px 1fr;}
  .d-rail-label{display:none;}
  .d-rail-cta{font-size:0;padding:12px 0;}
  .d-rail-cta::after{content:"→";font-size:15px;}
  .d-rail-item{justify-content:center;padding:12px 0;}
  .d-feed{display:none;}
  .d-kpi-grid{grid-template-columns:repeat(4,1fr);}
  .d-hermes{grid-template-columns:1fr;}
  .d-hermes-side{order:-1;}
}
@media(max-width:760px){
  .d-shell{grid-template-columns:1fr;}
  .d-rail{position:static;height:auto;flex-direction:row;overflow-x:auto;border-right:none;border-bottom:1px solid var(--d-line);padding:9px;}
  .d-rail-item{flex-direction:column;gap:4px;font-size:10px;min-width:60px;}
  .d-rail-label{display:block;}
  .d-rail-cta{display:none;}
  .d-main{padding:18px 14px 50px;}
  .d-kpi-grid{grid-template-columns:repeat(2,1fr);}
  .d-two-col,.d-studio{grid-template-columns:1fr;}
  .d-studio-panel{position:static;}
  .d-mini-agents{grid-template-columns:1fr;}
  .d-board,.d-ads-stat{grid-template-columns:1fr;}
  .d-hud{padding:11px 14px;}
  .d-tag{display:none;}
  .d-email,.d-fu,.d-ad{flex-wrap:wrap;}
}
`;
