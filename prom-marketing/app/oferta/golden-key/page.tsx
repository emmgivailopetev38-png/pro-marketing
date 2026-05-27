import { format } from "date-fns";
import { bg } from "date-fns/locale";

const today = format(new Date(), "d MMMM yyyy", { locale: bg });

const MODULES = [
  {
    n: "01",
    title: "Лийдове · автоматичен прием",
    body: "Всеки запитващ — независимо откъде идва — влиза автоматично в CRM-а без ръчно въвеждане.",
    bullets: [
      "Facebook, Instagram, TikTok форми → CRM в реално време",
      "Уебсайт форми и chat запитвания → CRM в реално време",
      "Имейли към office@ → AI разпознава лида и го качва",
      "Обаждания → запис, транскрипция, основни данни в карти",
      "Telegram/Viber съобщения → авто-прием",
    ],
  },
  {
    n: "02",
    title: "Разпределение · по брокер",
    body: "Лидът директно отива при правилния брокер според район, специализация и натовареност.",
    bullets: [
      "Правила по район: 'Център' → Иван, 'Тракия' → Мария",
      "По специализация: 'наем' → екип А, 'продажба' → екип Б",
      "Авто-баланс на натовареност между брокери",
      "Round-robin или приоритет — настройваш сам",
      "Push нотификация към брокера в момента на разпределение",
    ],
  },
  {
    n: "03",
    title: "Custom нива в CRM",
    body: "Сами си създавате stage-овете в CRM-а — без програмист. Влачите и пускате с мишката.",
    bullets: [
      "Нови → Контакт → Огледан имот → Оферта → Резервация → Сделка",
      "Добавяте нови нива в движение, променяте имена и цветове",
      "Правила за авто-движение между нивата (с условия)",
      "Stage-специфични задачи и шаблони (имейли, документи)",
      "Pipeline view + Kanban визуализация",
    ],
  },
  {
    n: "04",
    title: "AI CRM · оценка и прогноза",
    body: "AI оценява всеки лид — топъл/студен — и предсказва вероятност за сделка.",
    bullets: [
      "Score 0-100 спрямо качество на запитването",
      "Прогноза 'време до сделка' и 'вероятен бюджет'",
      "Автоматични follow-up таски на брокера в правилния момент",
      "Анализ кои източници носят най-добри сделки (ROI)",
      "AI генерира предварителни оферти по описание на имота",
    ],
  },
  {
    n: "05",
    title: "Документи · договори и оферти",
    body: "Авто-генериране на оферти, договори, актове — директно от данните в CRM-а, готови за подпис.",
    bullets: [
      "Шаблони на договори: предварителен договор, договор за наем, посредничество",
      "Автоматично попълване от данните на клиента и имота",
      "Електронен подпис · клиентът подписва от телефон/имейл",
      "Авто-генериране на оферти (PDF) при натискане на бутон",
      "Архив на всички документи по клиент/имот в CRM-а",
      "GDPR · клиентите могат да заявят експорт/изтриване на своите данни",
    ],
  },
  {
    n: "06",
    title: "HR · форми за набиране на персонал",
    body: "Кандидати за брокери и админ персонал — автоматизирана селекция, без хаос в имейли.",
    bullets: [
      "Форма за кандидати на уебсайта и в социалните мрежи",
      "AI скрининг по опит, локация, мотивация",
      "Автоматичен интервю scheduling със свободни часове",
      "База данни на минали кандидати с notes за бъдеще",
      "Workflow от заявка → интервю → onboarding",
    ],
  },
  {
    n: "07",
    title: "Промотиране на обяви и опит",
    body: "Имотите и експертизата ви достигат до повече хора с по-малко усилие.",
    bullets: [
      "Auto-публикуване във Facebook + Instagram (директни API-та · 100% автоматично)",
      "OLX и imot.bg · ако открият публично API → пълно auto. Иначе semi-auto (1-clik генериране на текст и публикация)",
      "AI генерира описания на имотите от снимки и параметри",
      "Reels от обиколка на имот (time-lapse + voiceover)",
      "Storytelling постове за брокерите — личен бранд",
      "Targeted реклами за всеки имот по типов клиент",
    ],
  },
  {
    n: "08",
    title: "Всички социални мрежи · едно място",
    body: "Управление на FB, Instagram, TikTok, LinkedIn, YouTube от един dashboard.",
    bullets: [
      "Един редактор → публикуване във всички мрежи едновременно",
      "Календар на съдържание за следващите 30 дни",
      "DM и коментари от всички мрежи → единна inbox",
      "Анализ на ангажираност + препоръки за оптимизация",
      "Брандови шаблони — всеки пост в стила на агенцията",
    ],
  },
  {
    n: "09",
    title: "Поддръжка · живо",
    body: "Не ви оставяме сами след стартирането на системата.",
    bullets: [
      "30 дни безплатна поддръжка след стартиране",
      "Прав хотлайн за спешни въпроси",
      "Месечна оптимизация и нови функции",
      "Корекции на дефекти в гаранционен срок",
      "Тренинг видеа за нови служители",
    ],
  },
];

const PROCESS = [
  { step: "1", title: "Разговор", body: "30 минути — обсъждаме процеси, болезнени места и какво искате да отпадне." },
  { step: "2", title: "План + демо", body: "Подготвям конкретен план + демо с примерни данни от агенция за имоти." },
  { step: "3", title: "Изграждане", body: "От 30 до 60 дни до пълно стартиране — според големината на проекта." },
  { step: "4", title: "Старт + тренинг", body: "Стартиране на системата с реалните ви данни и тренинг на екипа онлайн." },
  { step: "5", title: "Поддръжка", body: "30 дни безплатна поддръжка + продължаваща оптимизация." },
];

const WHY = [
  { title: "Изграждаме по поръчка", body: "Не продаваме готов SaaS. Системата се прави около вашите конкретни процеси — за брокерство, не за всичко изобщо." },
  { title: "Сами си създавате нива", body: "След стартирането — добавяте нови stage-ове в CRM-а, променяте правила, без да чакате програмист. Контролът е ваш." },
  { title: "Без зависимост от платформи", body: "Всичко е ваше, на ваш Cloud. Ако утре Facebook или OLX променят правилата — вие сте защитени." },
  { title: "Локален екип", body: "От Русе сме. Лична комуникация, лично присъствие при разговор и тренинг — не само автоматизирани чатове." },
];

const TIERS = [
  {
    badge: "Phase 1",
    title: "Базов",
    price: "3 800 €",
    priceSub: "без ДДС",
    timeline: "30-45 дни",
    color: "var(--color-text-secondary)",
    features: [
      "Custom CRM ядро · клиенти, имоти, брокери",
      "Tiered access · брокер / team lead / мениджър · custom permissions",
      "Lead capture форми · уебсайт → CRM в реално време",
      "Графичен Dashboard · real-time KPIs (звъняния, имоти, сделки)",
      "AI текст асистент · в системата (отчети по заявка)",
      "Form-based data entry · за брокерите (без Excel)",
      "Backup стратегия · daily snapshots + GDPR audit log",
      "30 дни безплатна поддръжка",
    ],
    cta: "Стартиране Phase 1",
  },
  {
    badge: "Phase 1 + 2",
    title: "Разширен",
    price: "4 900 €",
    priceSub: "без ДДС",
    timeline: "45-60 дни",
    color: "var(--color-gold)",
    highlight: true,
    features: [
      "Всичко от Базов",
      "AI Content генератор · описания на имоти автоматично",
      "Auto-публикуване · Facebook + Instagram · cross-posting",
      "Telegram бот · гласови команди „Дай ми днешния отчет на всички брокери\"",
      "Email + Telegram daily reports",
      "Многоезична подкрепа · BG + EN",
      "Weekly off-site backup · допълнителен слой защита",
    ],
    cta: "Препоръчан вариант",
  },
  {
    badge: "Всички фази",
    title: "Пълен",
    price: "6 000 €",
    priceSub: "без ДДС",
    timeline: "60 дни",
    color: "var(--color-gold-bright)",
    features: [
      "Всичко от Разширен",
      "AI Video Editor · автоматични видеа на имоти",
      "Virtual Staging · празна стая → мебелирана",
      "Facebook + Google Ads management · кампании от CRM-а",
      "LinkedIn + YouTube · auto-публикуване",
      "Lead Ads → CRM · реклами от FB/Google → автоматично в системата",
      "Reels автоматизация",
      "Monthly archive backup · 5 години retention",
    ],
    cta: "Пълно решение",
  },
];

const RECURRING = [
  {
    badge: "Поддръжка",
    title: "Месечна поддръжка и развитие",
    price: "300 – 400 €",
    priceSub: "на месец · без ДДС · включва хостинг и сигурност",
    color: "var(--color-gold)",
    features: [
      "Технически промени и нови функции по заявка",
      "Корекции на грешки и оптимизация",
      "Постоянно следене на работоспособност 24/7",
      "Тренинг на нови служители при наемане",
      "Реагиране в рамките на 24 часа за критични проблеми",
      "Месечен отчет за свършена работа",
      "Хостинг и backup включени в цената",
    ],
  },
];

const SECURITY = [
  {
    title: "Сигурен хостинг от стартиране",
    body: "В началото системата е на Supabase — индустриален стандарт за сигурен EU хостинг с GDPR-съвместимост. Сървър във Frankfurt, encrypted at rest (AES-256), TLS in transit. Включено в месечната поддръжка.",
  },
  {
    title: "Многослоен backup",
    body: "Daily point-in-time recovery (7 дни), weekly off-site encrypted backup (EU дата центрове), monthly архивен снапшот за дългосрочно съхранение. Никога не сте без копие на данните си.",
  },
  {
    title: "Audit log · при нужда",
    body: "При нужда добавяме пълен audit log — кой потребител, кога, какво е променил, login attempts, IP адреси, експорт на данни. Пълна следа за GDPR одит при изискване.",
  },
  {
    title: "Row Level Security",
    body: "Всеки брокер вижда само своите клиенти. Мениджърите виждат всички. Достъпите се настройват в админ панела — без програмист.",
  },
];

export default function GoldenKeyPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212, 175, 55, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 25%, rgba(212, 175, 55, 0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 75%, rgba(255, 215, 0, 0.10) 0%, transparent 45%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-6 py-32 md:px-12">
          <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            ПРЕЗЕНТАЦИЯ · {today}
          </p>

          <p className="mb-3 font-[family-name:var(--font-editorial)] text-2xl text-[var(--color-text-secondary)]">
            за
          </p>

          <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[1.05] tracking-tight">
            <span style={{ color: "var(--color-text-primary)" }}>Golden </span>
            <span
              style={{
                color: "transparent",
                backgroundImage: "linear-gradient(135deg, #ffd700, #d4af37 50%, #b8941f)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              Key
            </span>
          </h1>

          <p className="mt-6 inline-block w-fit rounded-full border border-[var(--color-border-bright)] bg-[rgba(212,175,55,0.08)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">
            Агенция за недвижими имоти
          </p>

          <div className="mt-12 max-w-2xl">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
              Тотална AI автоматизация — <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">лийдове, разпределение, нива, чат за брокери, HR, промотиране, всички социални мрежи</span> в един единен dashboard. Брокерите се фокусират върху сделките, не върху ръчната работа.
            </p>
          </div>

          <div className="mt-14 flex items-center gap-6">
            <div aria-hidden className="h-px w-12" style={{ background: "var(--color-gold)" }} />
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              За Росен Костадинов · „ПроМаркетинг" ЕООД
            </p>
          </div>

          <div className="mt-20 flex flex-wrap gap-4">
            <a
              href="#design"
              className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: "var(--color-gold-bright)",
                color: "var(--color-gold-bright)",
                background: "rgba(212, 175, 55, 0.08)",
              }}
            >
              🎨 Виж дизайна
              <span aria-hidden>↓</span>
            </a>
            <a
              href="#tiers"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-gold-bright)] hover:text-[var(--color-gold-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              💎 Цени и нива
            </a>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-gold-bright)]"
            >
              9-те модула
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* VISUAL DESIGN MOCKUPS */}
      <section id="design" className="relative border-t border-[var(--color-border-default)] py-32" style={{ background: "rgba(212, 175, 55, 0.02)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Как ще изглежда системата ви
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Дизайн на <span className="text-[var(--color-gold-bright)]">CRM-а</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Не показваме слайдове с обещания. Това са визуални mock-ups на реалните екрани, които ще получите. Всеки модул, всеки изглед, в подробности.
          </p>

          {/* MOCKUP 1: Главен Dashboard */}
          <div className="mb-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 01</span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Главен Dashboard</h3>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Влизаш сутрин и виждаш всичко важно за 30 секунди. KPI карти, графика на тенденции, топ брокери, последни активности — всичко на едно място, mobile-friendly.
            </p>

            {/* Browser Window Mock */}
            <div className="overflow-hidden rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center gap-2 border-b border-[var(--color-border-default)] bg-black/40 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-red-500/60" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <span className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-3 flex-1 rounded bg-white/5 px-3 py-1 text-xs font-mono text-[var(--color-text-secondary)]">
                  crm.goldenkey.bg/dashboard
                </span>
                <span className="rounded-full bg-[var(--color-gold)]/20 px-3 py-1 text-[10px] font-mono text-[var(--color-gold-bright)]">
                  👤 Управител
                </span>
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold)]">GOLDEN KEY · 27 МАЙ 2026</p>
                    <h4 className="mt-1 font-display text-2xl font-bold text-white">Добро утро, управител</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">Live · обновено току що</p>
                    <p className="text-xs text-[#22c55e]">🟢 Всичко работи</p>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    { label: "АКТИВНИ КЛИЕНТИ", value: "127", hint: "+12 тази седмица", color: "#06b6d4" },
                    { label: "СДЕЛКИ · МАЙ", value: "23", hint: "€127K общ оборот", color: "#22c55e" },
                    { label: "НОВИ ЛИДОВЕ", value: "45", hint: "32 FB · 13 уебсайт", color: "#ec4899" },
                    { label: "ОГЛЕДИ ДНЕС", value: "8", hint: "по 6 брокери", color: "#facc15" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-md border border-white/10 bg-white/5 p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wider text-white/50">{s.label}</p>
                      <p className="mt-1 text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="mt-0.5 text-[10px] text-white/60">{s.hint}</p>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder + Top brokers */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/60">📈 СДЕЛКИ · ПОСЛЕДНИ 12 СЕДМИЦИ</p>
                    <div className="flex h-32 items-end justify-around gap-1">
                      {[3, 5, 4, 7, 6, 8, 5, 9, 11, 8, 10, 12].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-[var(--color-gold)] to-[var(--color-gold-bright)]"
                          style={{ height: `${(h / 12) * 100}%`, opacity: 0.7 + (i / 24) }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] text-white/40">
                      <span>март</span>
                      <span>април</span>
                      <span>май</span>
                    </div>
                  </div>

                  <div className="rounded-md border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/60">🏆 ТОП БРОКЕРИ · МАЙ</p>
                    <div className="space-y-2.5">
                      {[
                        { rank: 1, name: "Мария Петрова", deals: 12, revenue: "€4 200" },
                        { rank: 2, name: "Иван Стоянов", deals: 8, revenue: "€2 800" },
                        { rank: 3, name: "Петя Димитрова", deals: 6, revenue: "€2 100" },
                      ].map((b) => (
                        <div key={b.rank} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-gold)]/20 text-[10px] text-[var(--color-gold-bright)]">{b.rank}</span>
                            <span className="text-white">{b.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[10px] text-[var(--color-gold-bright)]">{b.deals} сделки</span>
                            <span className="ml-2 font-mono text-[10px] text-white/50">{b.revenue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MOCKUP 2: Pipeline Kanban */}
          <div className="mb-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 02</span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Pipeline на клиентите · Custom нива</h3>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Сами създавате стъпките през които минават клиентите — от нов лид до сделка. Влачите с мишката, променяте имена и цветове, без програмист.
            </p>

            <div className="overflow-x-auto rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] p-5 shadow-2xl">
              <div className="grid min-w-[900px] grid-cols-6 gap-3">
                {[
                  { title: "Нов лид", count: 12, color: "#7da8cc", cards: [
                    { name: "Г. Иванов", note: "FB реклама · апартамент Тракия" },
                    { name: "С. Петрова", note: "Уебсайт форма · къща Лозен" },
                  ]},
                  { title: "Контакт", count: 8, color: "#a78bfa", cards: [
                    { name: "М. Костов", note: "Звъня вчера · интерес до €120K" },
                  ]},
                  { title: "Оглед", count: 5, color: "#06b6d4", cards: [
                    { name: "Сем. Атанасови", note: "2 огледа · харесват двата" },
                  ]},
                  { title: "Оферта", count: 3, color: "#facc15", cards: [
                    { name: "К. Тодоров", note: "€95K оферта · чакаме отговор" },
                  ]},
                  { title: "Резервация", count: 2, color: "#fb923c", cards: [
                    { name: "Д. Маринов", note: "Депозит €5K · юрист преглежда" },
                  ]},
                  { title: "Сделка", count: 1, color: "#22c55e", cards: [
                    { name: "В. Стоянов", note: "Подписан · €138K · комисиона €4.1K" },
                  ]},
                ].map((col) => (
                  <div key={col.title} className="rounded-md bg-white/5 p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: col.color }}>
                        {col.title}
                      </h4>
                      <span className="rounded-full px-2 py-0.5 font-mono text-[10px]" style={{ background: `${col.color}22`, color: col.color }}>
                        {col.count}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {col.cards.map((c, i) => (
                        <div key={i} className="rounded border border-white/10 bg-black/30 p-2">
                          <p className="text-[11px] font-medium text-white">{c.name}</p>
                          <p className="mt-0.5 text-[9px] leading-snug text-white/50">{c.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
              ✨ Drag &amp; drop между колоните · авто-преместване по правила (напр. „След 7 дни без активност → ⚠️")
            </p>
          </div>

          {/* MOCKUP 3 + 4: Side by side */}
          <div className="mb-20 grid gap-6 lg:grid-cols-2">
            {/* Broker profile */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 03</span>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Карта на брокер</h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Профил с ефективност, активни клиенти, последни действия — за всеки от екипа.
              </p>
              <div className="rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] p-5 shadow-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gold)]/20 text-2xl">👤</div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-white">Мария Петрова</p>
                    <p className="text-[10px] text-white/50">Team Lead · Тракия · от Юли 2024</p>
                  </div>
                  <span className="rounded-full bg-[#22c55e]/20 px-2 py-1 text-[10px] text-[#22c55e]">🟢 Активен</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Активни клиенти", value: "23" },
                    { label: "Сделки · Май", value: "12" },
                    { label: "Среден срок", value: "14 дни" },
                  ].map((s) => (
                    <div key={s.label} className="rounded border border-white/10 bg-white/5 p-2 text-center">
                      <p className="text-[8px] uppercase tracking-wider text-white/50">{s.label}</p>
                      <p className="mt-0.5 text-lg font-bold text-[var(--color-gold-bright)]">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-white/50">ПОСЛЕДНИ АКТИВНОСТИ</p>
                  <div className="space-y-1.5 text-[10px] text-white/70">
                    <div className="flex justify-between"><span>🤝 Оглед с Иван Костов</span><span className="text-white/40">преди 2ч</span></div>
                    <div className="flex justify-between"><span>📧 Изпрати оферта · €95K</span><span className="text-white/40">вчера</span></div>
                    <div className="flex justify-between"><span>📞 3 звъняния към лидове</span><span className="text-white/40">вчера</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Chat */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 04</span>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">AI Асистент · разговор</h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Питаш на български или говориш в Telegram → AI ти дава отчет, графика, експорт. Без копаене в менюта.
              </p>
              <div className="rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] p-4 shadow-2xl">
                <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                  <span className="text-lg">💬</span>
                  <span className="text-sm font-bold text-white">AI Асистент</span>
                  <span className="ml-auto text-[10px] text-[#22c55e]">● онлайн</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg rounded-br-sm bg-[var(--color-gold)]/20 px-3 py-2 text-[11px] text-white">
                      Дай ми отчет за днес
                    </div>
                  </div>
                  <div className="flex">
                    <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/90">
                      <p className="mb-1.5 font-bold text-[var(--color-gold-bright)]">Днес 27.05.2026:</p>
                      <ul className="space-y-0.5">
                        <li>• <strong>12 нови лида</strong> (5 от FB, 7 от уебсайт)</li>
                        <li>• <strong>8 огледа</strong> разпределени по брокери</li>
                        <li>• <strong>2 оферти</strong> изпратени (€95K + €120K)</li>
                        <li>• <strong>1 сделка</strong> подписана (€138K, Мария)</li>
                      </ul>
                      <p className="mt-2 text-[10px] text-white/60">📊 Виж в Dashboard / 📧 Прати ми на имейл / 💾 Експортирай PDF</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg rounded-br-sm bg-[var(--color-gold)]/20 px-3 py-2 text-[11px] text-white">
                      Прати ми на имейл
                    </div>
                  </div>
                  <div className="flex">
                    <div className="max-w-[85%] rounded-lg rounded-bl-sm bg-white/5 px-3 py-2 text-[11px] text-white/90">
                      ✅ Готово. Отчетът е в имейла ти.
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2">
                  <span className="flex-1 rounded bg-white/5 px-3 py-1.5 text-[10px] text-white/40">Напиши съобщение…</span>
                  <span className="text-base">🎤</span>
                </div>
              </div>
            </div>
          </div>

          {/* MOCKUP 5: Mobile */}
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 05</span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">На телефон · брокерите в полето</h3>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Брокерите работят от телефона си — въвеждат данни в момента на огледа, виждат новите лидове за 5 секунди, отговарят на клиенти.
            </p>

            <div className="flex flex-wrap items-start justify-center gap-6">
              {/* Phone 1 - Inbox */}
              <div className="w-[200px] overflow-hidden rounded-2xl border-4 border-[var(--color-border-bright)] bg-[#0f1a2e] shadow-2xl">
                <div className="bg-black px-2 py-1 text-center">
                  <span className="inline-block h-1 w-12 rounded-full bg-white/20" />
                </div>
                <div className="p-3">
                  <p className="mb-2 text-[9px] font-mono uppercase tracking-wider text-white/50">📥 МОИТЕ ЛИДОВЕ · 5</p>
                  <div className="space-y-1.5">
                    {[
                      { name: "Г. Иванов", time: "10 мин", red: true },
                      { name: "С. Петрова", time: "1ч", red: false },
                      { name: "М. Костов", time: "3ч", red: false },
                    ].map((l) => (
                      <div key={l.name} className="rounded border border-white/10 bg-white/5 p-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white">{l.name}</span>
                          {l.red && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                        </div>
                        <p className="text-[8px] text-white/50">преди {l.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phone 2 - Property */}
              <div className="w-[200px] overflow-hidden rounded-2xl border-4 border-[var(--color-border-bright)] bg-[#0f1a2e] shadow-2xl">
                <div className="bg-black px-2 py-1 text-center">
                  <span className="inline-block h-1 w-12 rounded-full bg-white/20" />
                </div>
                <div className="p-3">
                  <p className="mb-1 text-[9px] font-mono uppercase tracking-wider text-white/50">🏠 ИМОТ</p>
                  <p className="text-[11px] font-bold text-white">3-стаен · Тракия</p>
                  <p className="text-[9px] text-white/60">85м² · 2 ет. · €128 000</p>
                  <div className="mt-2 h-20 rounded bg-gradient-to-br from-[var(--color-gold)]/30 to-[var(--color-gold)]/5" />
                  <div className="mt-2 space-y-1">
                    <button className="w-full rounded bg-[var(--color-gold)] py-1 text-[9px] font-bold text-black">📞 Запази оглед</button>
                    <button className="w-full rounded border border-white/20 py-1 text-[9px] text-white/80">📤 Сподели</button>
                  </div>
                </div>
              </div>

              {/* Phone 3 - Voice */}
              <div className="w-[200px] overflow-hidden rounded-2xl border-4 border-[var(--color-border-bright)] bg-[#0f1a2e] shadow-2xl">
                <div className="bg-black px-2 py-1 text-center">
                  <span className="inline-block h-1 w-12 rounded-full bg-white/20" />
                </div>
                <div className="p-3">
                  <p className="mb-2 text-[9px] font-mono uppercase tracking-wider text-white/50">🎤 ГЛАСОВО ВЪВЕЖДАНЕ</p>
                  <div className="rounded bg-white/5 p-2">
                    <p className="text-[10px] leading-snug text-white/80">„Огледах апартамента в Тракия с клиента Иван. Хареса му. Иска оферта до €130К."</p>
                  </div>
                  <p className="mt-2 text-center text-[8px] text-white/40">AI разпознава → запис в CRM</p>
                  <div className="mt-2 flex h-16 items-center justify-center">
                    <div className="flex gap-1">
                      {[3, 6, 4, 8, 5, 7, 3, 6, 5].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 rounded-full bg-[var(--color-gold-bright)]"
                          style={{ height: `${h * 4}px`, opacity: 0.4 + i * 0.05 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MOCKUP 6: Карта на имот */}
          <div className="mb-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 06</span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Карта на имот · детайл</h3>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Всеки имот има пълна карта — снимки, описание, КСС, история на огледи, заинтересовани клиенти. Един екран — цялата история.
            </p>

            <div className="overflow-hidden rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] shadow-2xl">
              <div className="grid gap-0 md:grid-cols-3">
                {/* Gallery */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-3 gap-1 p-2">
                    <div className="col-span-2 row-span-2 h-44 rounded bg-gradient-to-br from-[var(--color-gold)]/30 via-[var(--color-gold)]/15 to-[var(--color-gold)]/5" />
                    <div className="h-[88px] rounded bg-gradient-to-br from-cyan-500/30 to-cyan-500/10" />
                    <div className="h-[88px] rounded bg-gradient-to-br from-pink-500/30 to-pink-500/10" />
                    <div className="col-span-3 grid grid-cols-4 gap-1">
                      <div className="h-12 rounded bg-white/10" />
                      <div className="h-12 rounded bg-white/10" />
                      <div className="h-12 rounded bg-white/10" />
                      <div className="flex h-12 items-center justify-center rounded bg-black/40 text-[10px] text-white/60">+8 снимки</div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="border-l border-white/10 p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-white/50">ID-247 · Тракия</p>
                      <p className="mt-1 text-lg font-bold text-white">3-стаен апартамент</p>
                    </div>
                    <span className="rounded-full bg-[#22c55e]/20 px-2 py-1 text-[10px] text-[#22c55e]">🟢 Активен</span>
                  </div>
                  <p className="mb-3 text-2xl font-bold text-[var(--color-gold-bright)]">€128 000</p>
                  <div className="mb-3 space-y-1 text-[10px] text-white/70">
                    <div className="flex justify-between"><span className="text-white/40">Площ:</span><span>85 м²</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Етаж:</span><span>2 от 5</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Строеж:</span><span>Тухла · 2018</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Брокер:</span><span>Мария Петрова</span></div>
                  </div>
                  <div className="mb-2 border-t border-white/10 pt-2">
                    <p className="text-[9px] font-mono uppercase tracking-wider text-white/50">ИНТЕРЕС</p>
                    <p className="text-[11px] text-white/80">👁 23 преглеждания · 4 огледа · 2 оферти</p>
                  </div>
                  <button className="mt-2 w-full rounded bg-[var(--color-gold)] py-1.5 text-[10px] font-bold text-black">📤 Промотирай</button>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t border-white/10 p-4">
                <p className="mb-2 text-[9px] font-mono uppercase tracking-wider text-white/50">📅 ИСТОРИЯ</p>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-white/80">💎 Оферта изпратена · К. Тодоров · €95K</span><span className="text-white/40">днес 11:20</span></div>
                  <div className="flex justify-between"><span className="text-white/80">🤝 Оглед · сем. Атанасови</span><span className="text-white/40">вчера 18:00</span></div>
                  <div className="flex justify-between"><span className="text-white/80">📤 Публикуван в OLX + imot.bg + FB</span><span className="text-white/40">3 дни</span></div>
                  <div className="flex justify-between"><span className="text-white/80">📸 Качени 12 снимки + Reel</span><span className="text-white/40">3 дни</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* MOCKUP 7: Календар на огледи */}
          <div className="mb-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 07</span>
              <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Календар на огледи · всички брокери</h3>
            </div>
            <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Кой брокер кого среща и кога — една седмица напред, в реално време. Без двойни записи, без забравени огледи.
            </p>

            <div className="overflow-x-auto rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] p-4 shadow-2xl">
              <div className="min-w-[800px]">
                {/* Days header */}
                <div className="mb-2 grid grid-cols-8 gap-2 border-b border-white/10 pb-2 text-center">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Брокер</div>
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
                    <div key={d} className="text-[10px] font-mono uppercase tracking-wider text-white/60">{d}</div>
                  ))}
                </div>

                {/* Broker rows */}
                {[
                  { name: "Мария Петрова", events: [{ day: 0, t: "10:00", title: "Оглед · Тракия" }, { day: 2, t: "14:00", title: "Среща · оферта" }, { day: 4, t: "11:00", title: "Огледи x2" }] },
                  { name: "Иван Стоянов", events: [{ day: 1, t: "09:00", title: "Оглед · Лозен" }, { day: 3, t: "16:00", title: "Подпис договор" }] },
                  { name: "Петя Димитрова", events: [{ day: 0, t: "15:00", title: "Оглед · Център" }, { day: 5, t: "12:00", title: "Open House" }] },
                  { name: "Г. Николов", events: [{ day: 2, t: "10:30", title: "Огледи x3" }, { day: 4, t: "17:00", title: "Resale visit" }] },
                ].map((row) => (
                  <div key={row.name} className="mb-2 grid grid-cols-8 gap-2 items-center">
                    <div className="text-[10px] font-medium text-white truncate">{row.name}</div>
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                      const ev = row.events.find((e) => e.day === d);
                      return (
                        <div key={d} className="h-12">
                          {ev ? (
                            <div className="h-full rounded bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/40 px-1.5 py-1">
                              <p className="text-[8px] text-[var(--color-gold-bright)] font-mono">{ev.t}</p>
                              <p className="text-[8px] text-white/80 leading-tight truncate">{ev.title}</p>
                            </div>
                          ) : <div className="h-full rounded border border-dashed border-white/5" />}
                        </div>
                      );
                    })}
                  </div>
                ))}

                <p className="mt-3 text-[10px] text-white/40">🟡 12 огледа · 3 подписа · 1 Open House</p>
              </div>
            </div>
          </div>

          {/* MOCKUP 8: Финансов отчет + Социални */}
          <div className="mb-20 grid gap-6 lg:grid-cols-2">
            {/* Финанси */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 08</span>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Финансов отчет</h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Кой колко изкарва, кой колко струва, чиста печалба по проект.
              </p>
              <div className="rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] p-5 shadow-2xl">
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Приходи · Май", value: "€127K", color: "#22c55e" },
                    { label: "Комисиони", value: "€38K", color: "#facc15" },
                    { label: "Чиста печалба", value: "€18K", color: "#06b6d4" },
                  ].map((s) => (
                    <div key={s.label} className="rounded border border-white/10 bg-white/5 p-2">
                      <p className="text-[8px] uppercase tracking-wider text-white/50">{s.label}</p>
                      <p className="mt-1 text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-white/50">КОМИСИОНИ ПО БРОКЕР</p>
                <div className="space-y-1.5">
                  {[
                    { name: "Мария Петрова", amount: "€12 400", pct: 100 },
                    { name: "Иван Стоянов", amount: "€8 200", pct: 66 },
                    { name: "Петя Димитрова", amount: "€6 100", pct: 49 },
                    { name: "Г. Николов", amount: "€4 800", pct: 39 },
                  ].map((b) => (
                    <div key={b.name}>
                      <div className="mb-0.5 flex justify-between text-[10px]">
                        <span className="text-white/80">{b.name}</span>
                        <span className="font-mono text-[var(--color-gold-bright)]">{b.amount}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-bright)]" style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded border border-white/20 py-1.5 text-[10px] text-white/80">📊 Експорт Excel</button>
                  <button className="flex-1 rounded border border-white/20 py-1.5 text-[10px] text-white/80">📧 Прати на счет.</button>
                </div>
              </div>
            </div>

            {/* Социални */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 09</span>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Социални мрежи · един редактор</h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                AI пише описанието. Натискаш веднъж → отива във FB, IG, LinkedIn, YouTube.
              </p>
              <div className="rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] p-5 shadow-2xl">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] font-mono text-white/60">📝 НОВ ПОСТ · 3-стаен Тракия</span>
                  <span className="text-[10px] text-[var(--color-gold-bright)]">✨ AI generated</span>
                </div>
                <div className="mb-3 rounded bg-white/5 p-2 text-[10px] leading-relaxed text-white/80">
                  „🏠 Слънчев апартамент в сърцето на Тракия! 85м², 3 стаи, изцяло обзаведен. Перфектен за семейство — близо до училище, парк, метро. €128К — изключителна цена!"
                </div>
                <div className="mb-3">
                  <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-white/50">КАНАЛИ</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { name: "Facebook", on: true },
                      { name: "Instagram", on: true },
                      { name: "LinkedIn", on: true },
                      { name: "YouTube", on: false },
                    ].map((c) => (
                      <div key={c.name} className="rounded border px-2 py-1 text-center text-[9px]" style={{ borderColor: c.on ? "var(--color-gold)" : "rgba(255,255,255,0.1)", color: c.on ? "var(--color-gold-bright)" : "rgba(255,255,255,0.3)", background: c.on ? "rgba(212,175,55,0.1)" : "transparent" }}>
                        {c.on ? "✓" : "○"} {c.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-1.5 text-[9px]">
                  <div className="rounded border border-white/10 bg-white/5 p-1.5 text-center text-white/70">📅 Сега</div>
                  <div className="rounded border border-white/10 bg-white/5 p-1.5 text-center text-white/40">⏰ Утре 09:00</div>
                </div>
                <button className="w-full rounded bg-[var(--color-gold)] py-2 text-[11px] font-bold text-black">📤 Публикувай във всички</button>
              </div>
            </div>
          </div>

          {/* MOCKUP 10: HR + Документи */}
          <div className="mb-20 grid gap-6 lg:grid-cols-2">
            {/* HR */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 10</span>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">HR · кандидати за брокери</h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Форма на сайта → AI скрининг → авто-интервюта в календара ви.
              </p>
              <div className="rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] p-4 shadow-2xl">
                <p className="mb-3 font-mono text-[9px] uppercase tracking-wider text-white/50">📥 НОВИ КАНДИДАТИ · 7</p>
                <div className="space-y-2">
                  {[
                    { name: "Стефан Радев", exp: "3 г опит · СПИ", score: 87, color: "#22c55e" },
                    { name: "Деница Колева", exp: "1 г опит · Hospitality", score: 72, color: "#facc15" },
                    { name: "Александър М.", exp: "5 г опит · Друга агенция", score: 91, color: "#22c55e" },
                    { name: "Ива Петкова", exp: "Без опит · мотивиран", score: 54, color: "#fb923c" },
                  ].map((c) => (
                    <div key={c.name} className="rounded border border-white/10 bg-white/5 p-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-white">{c.name}</p>
                          <p className="text-[9px] text-white/50">{c.exp}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-white/50">AI Score</p>
                          <p className="text-sm font-bold" style={{ color: c.color }}>{c.score}/100</p>
                        </div>
                      </div>
                      <div className="mt-1 flex gap-1">
                        <button className="flex-1 rounded bg-[var(--color-gold)]/20 py-0.5 text-[9px] text-[var(--color-gold-bright)]">📅 Интервю</button>
                        <button className="flex-1 rounded border border-white/10 py-0.5 text-[9px] text-white/60">📧 CV</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Документи · договори и оферти */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">Изглед 11</span>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold">Документи · договори и оферти</h3>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Авто-генериране на договори и оферти от данните в CRM-а. Електронен подпис.
              </p>
              <div className="rounded-lg border-2 border-[var(--color-border-bright)] bg-[#0f1a2e] p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] font-mono text-white/60">📄 Документи · Иван Костов</span>
                  <button className="rounded bg-[var(--color-gold)] px-2 py-0.5 text-[9px] font-bold text-black">+ Нов</button>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: "📜", name: "Договор за посредничество", status: "✍️ Подписан", color: "#22c55e", date: "вчера" },
                    { icon: "💎", name: "Оферта · ап. Тракия €128К", status: "👀 Видяна 3х", color: "#facc15", date: "преди 2 дни" },
                    { icon: "📋", name: "Предварителен договор", status: "📤 Изпратен", color: "#06b6d4", date: "преди 3 дни" },
                    { icon: "📄", name: "Декларация ЗЗЛД (GDPR)", status: "✍️ Подписан", color: "#22c55e", date: "1 седм." },
                  ].map((d) => (
                    <div key={d.name} className="flex items-center justify-between rounded border border-white/10 bg-white/5 p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{d.icon}</span>
                        <div>
                          <p className="text-[10px] font-medium text-white">{d.name}</p>
                          <p className="text-[8px] text-white/50">{d.date}</p>
                        </div>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[8px] font-bold"
                        style={{ background: `${d.color}22`, color: d.color }}
                      >
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 border-t border-white/10 pt-2">
                  <button className="rounded border border-white/20 py-1 text-[9px] text-white/80">📥 PDF</button>
                  <button className="rounded border border-white/20 py-1 text-[9px] text-white/80">✍️ e-sign</button>
                  <button className="rounded border border-white/20 py-1 text-[9px] text-white/80">📤 Email</button>
                </div>
              </div>
            </div>
          </div>

          {/* Design philosophy footer */}
          <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">Дизайн философия</p>
            <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl font-bold leading-tight">
              <span className="text-[var(--color-gold-bright)]">3 секунди</span> до отговор.
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Всеки екран отговаря на въпрос за по-малко от 3 секунди. Без меню в меню в меню. Без обучение от 2 седмици. Брокерите ще го ползват от ден 1.
            </p>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            9 модула в един dashboard
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Целият <span className="text-[var(--color-gold-bright)]">процес</span> на агенцията.
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div
                key={m.n}
                className="relative overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-7 transition-colors hover:border-[var(--color-border-bright)]"
              >
                <div className="mb-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-gold)]">
                  {m.n}
                </div>
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-xl font-bold leading-tight">
                  {m.title}
                </h3>
                <p className="mb-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {m.body}
                </p>
                <ul className="space-y-2">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-xs leading-relaxed text-[var(--color-text-primary)]">
                      <span aria-hidden className="text-[var(--color-gold-bright)]">▸</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIERS — 3 PRICING LEVELS */}
      <section id="tiers" className="relative border-t border-[var(--color-border-default)] py-32" style={{ background: "rgba(212, 175, 55, 0.03)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Цени · 3 нива
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Phased rollout — <span className="text-[var(--color-gold-bright)]">плащате според обхвата</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Започвате с основата и добавяте слоеве, или вземате цялото решение за 60 дни. Без скрити такси.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.title}
                className="relative flex flex-col rounded-lg border bg-[var(--color-bg-deep)] p-7 transition-transform hover:scale-[1.02]"
                style={{
                  borderColor: t.highlight ? t.color : "var(--color-border-default)",
                  borderWidth: t.highlight ? "2px" : "1px",
                  boxShadow: t.highlight ? "0 0 40px rgba(212, 175, 55, 0.15)" : undefined,
                }}
              >
                {t.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: t.color, color: "#0a0805" }}
                  >
                    Препоръчан
                  </div>
                )}
                <p
                  className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: t.color }}
                >
                  {t.badge}
                </p>
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-3xl font-bold">
                  {t.title}
                </h3>
                <div className="mb-2 flex items-baseline gap-2">
                  <span
                    className="font-[family-name:var(--font-editorial)] text-4xl font-extrabold"
                    style={{ color: t.color }}
                  >
                    {t.price}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {t.priceSub}
                  </span>
                </div>
                <p className="mb-6 text-xs font-mono text-[var(--color-text-secondary)]">
                  ⏱ {t.timeline}
                </p>
                <ul className="mb-6 flex-1 space-y-2">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed">
                      <span aria-hidden style={{ color: t.color }}>
                        ✓
                      </span>
                      <span className="text-[var(--color-text-primary)]">{f}</span>
                    </li>
                  ))}
                </ul>
                <div
                  className="mt-auto rounded-md border px-4 py-3 text-center text-sm font-bold uppercase tracking-wider"
                  style={{
                    borderColor: t.color,
                    color: t.color,
                  }}
                >
                  {t.cta}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-[var(--color-text-tertiary)]">
            Плащане: 50% при подписване · 50% при стартиране · ДДС се добавя при фактуриране, ако е приложим
          </p>
        </div>
      </section>

      {/* RECURRING · ЕЖЕМЕСЕЧНИ РАЗХОДИ */}
      <section id="recurring" className="relative border-t border-[var(--color-border-default)] py-32" style={{ background: "rgba(212, 175, 55, 0.025)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            След стартиране
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Ежемесечни <span className="text-[var(--color-gold-bright)]">разходи</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            След първоначалното изграждане системата трябва да живее, да расте и да съхранява данните на клиентите ви сигурно. Това са постоянните оперативни разходи.
          </p>

          <div className="mx-auto grid max-w-2xl gap-6">
            {RECURRING.map((r) => (
              <div
                key={r.title}
                className="flex flex-col rounded-lg border bg-[var(--color-bg-deep)] p-7"
                style={{ borderColor: "var(--color-border-default)", borderTopWidth: "3px", borderTopColor: r.color }}
              >
                <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]" style={{ color: r.color }}>
                  {r.badge}
                </p>
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-2xl font-bold">
                  {r.title}
                </h3>
                <div className="mb-1 flex items-baseline gap-2">
                  <span
                    className="font-[family-name:var(--font-editorial)] text-4xl font-extrabold"
                    style={{ color: r.color }}
                  >
                    {r.price}
                  </span>
                </div>
                <p className="mb-6 text-xs text-[var(--color-text-tertiary)]">
                  {r.priceSub}
                </p>
                <ul className="flex-1 space-y-2">
                  {r.features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed">
                      <span aria-hidden style={{ color: r.color }}>
                        ✓
                      </span>
                      <span className="text-[var(--color-text-primary)]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-[var(--color-text-tertiary)]">
            Възможна е почасова поддръжка вместо абонамент (50 €/час), но абонаментът е по-изгоден за активен бизнес.
          </p>
        </div>
      </section>

      {/* SECURITY · GDPR · BACKUP */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Сигурност на данните
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Данните на клиентите ви — <span className="text-[var(--color-gold-bright)]">защитени</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            GDPR-съвместима архитектура, многослоен backup и пълен audit log за всяка промяна. Никога не сте без копие на данните си.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {SECURITY.map((s) => (
              <div
                key={s.title}
                className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/50 p-7"
              >
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-xl font-bold">
                  🔐 {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="relative border-t border-[var(--color-border-default)] py-32" style={{ background: "rgba(212, 175, 55, 0.02)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Защо ние
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Не сме <span className="text-[var(--color-gold-bright)]">SaaS</span> компания.
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {WHY.map((w) => (
              <div key={w.title} className="border-l-2 border-[var(--color-gold)] pl-6">
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-2xl font-bold">
                  {w.title}
                </h3>
                <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Как работим
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            От разговор до <span className="text-[var(--color-gold-bright)]">стартиране</span>.
          </h2>

          <div className="space-y-6">
            {PROCESS.map((p) => (
              <div
                key={p.step}
                className="flex flex-col gap-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-6 md:flex-row md:items-center md:gap-8 md:p-8"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-gold)] font-[family-name:var(--font-editorial)] text-2xl font-bold text-[var(--color-gold-bright)]">
                  {p.step}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-[family-name:var(--font-editorial)] text-2xl font-bold">
                    {p.title}
                  </h3>
                  <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
          <p className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Следваща стъпка
          </p>
          <h2 className="mb-8 font-[family-name:var(--font-editorial)] text-[clamp(40px,7vw,84px)] font-extrabold leading-[0.95]">
            Готови сме за <span className="text-[var(--color-gold-bright)]">разговор</span>.
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Тази презентация е основата. На срещата обсъждаме конкретно кои модули искате първи и как да ги вплетем във вече съществуващите ви процеси.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://promarketing.pw/booking"
              className="inline-flex items-center gap-3 rounded-full bg-[var(--color-gold)] px-10 py-5 text-base font-bold uppercase tracking-[0.2em] text-[#0a0805] transition-transform hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #ffd700, #d4af37)" }}
            >
              Резервирай разговор
              <span aria-hidden>→</span>
            </a>
            <a
              href="tel:+359877399963"
              className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border-bright)] px-10 py-5 text-base font-medium uppercase tracking-[0.2em] text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-gold-bright)] hover:text-[var(--color-gold-bright)]"
            >
              +359 877 399 963
            </a>
          </div>

          <div className="mt-20 border-t border-[var(--color-border-default)] pt-10 text-center">
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              „ПроМаркетинг" ЕООД · Ивайло Петев — управител
            </p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
              ivailopetev38@gmail.com · promarketing.pw
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
