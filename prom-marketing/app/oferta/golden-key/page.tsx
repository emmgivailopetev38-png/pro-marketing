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
    title: "Чат за брокери",
    body: "Вътрешен бизнес чат с AI помощник — не Viber, не Messenger, ваше пространство.",
    bullets: [
      "Канали по екипи, по район, по сделка",
      "Споделяне на имоти, документи, снимки между брокери",
      "AI помощник: 'Намери ми всички 3-стайни в Тракия до 150к'",
      "История на всичко казано по даден клиент или имот",
      "Voice → text + auto-summary на дълги дискусии",
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
      "Auto-публикуване на нови имоти във Facebook, Instagram, OLX, imot.bg",
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

const SECURITY = [
  {
    title: "GDPR-съвместима архитектура",
    body: "Supabase PostgreSQL · EU (Frankfurt) · encrypted at rest (AES-256) · TLS encryption in transit · Row Level Security (всеки брокер вижда само своите клиенти).",
  },
  {
    title: "Многослоен backup",
    body: "1. Daily point-in-time recovery (7 дни) 2. Weekly off-site encrypted backup → Wasabi EU 3. Monthly архивен снапшот (5 години retention).",
  },
  {
    title: "Audit log · кой какво кога",
    body: "Всяка промяна се записва: кой потребител, кога, какво е променил. Login attempts, IP адреси, експорт на данни — пълна следа за GDPR одит.",
  },
  {
    title: "Опционален локален сървър",
    body: "За максимална контрола — Self-hosted Supabase на офис компютър/NAS със Cloud replica за disaster recovery. One-time €1 500 setup + €100/мес поддръжка.",
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

          <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(48px,10vw,140px)] font-extrabold leading-[0.92] tracking-tight">
            <span style={{ color: "var(--color-text-primary)" }}>Golden</span>
            <br />
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

          <a
            href="#modules"
            className="mt-20 inline-flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-gold-bright)]"
          >
            Какво изграждаме
            <span aria-hidden>↓</span>
          </a>
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
