import { format } from "date-fns";
import { bg } from "date-fns/locale";

const today = format(new Date(), "d MMMM yyyy", { locale: bg });

const MODULES = [
  {
    n: "01",
    title: "Единен Dashboard",
    body: "Един екран — целият бизнес. Активни обекти, склад, разходи, входящи плащания, документи. Без 10 различни таблици в Excel.",
    bullets: [
      "Цялостен преглед на текущи строителни обекти",
      "Финансово състояние live (приходи, разходи, печалба по проект)",
      "Складова наличност на материали + ниска бройка alerts",
      "Изпълнение на КСС спрямо реално доставено",
    ],
  },
  {
    n: "02",
    title: "Склад + Логистика",
    body: "Управление на склада с QR кодове и AI разпознаване на доставени материали по снимка.",
    bullets: [
      "Снимай фактура → AI чете количества и цени → влиза в склада автоматично",
      "Маркиране на материали изнесени към обект (с кой шофьор, кога)",
      "Прогноза за следваща доставка спрямо темпото на работа",
      "История на цените от различни доставчици — оценка кой е изгоден",
    ],
  },
  {
    n: "03",
    title: "КСС + Документи",
    body: "Цифрова обработка на КСС таблици. Сравнение спрямо реално свършена работа.",
    bullets: [
      "Качване на КСС от Excel → автоматично извличане на позиции",
      "Маркиране 'завършено' по точки → отчет за клиента",
      "Папка за всеки обект: проекти, КСС, фактури, актове, снимки",
      "Auto-генериране на актове за извършена работа от шаблон",
    ],
  },
  {
    n: "04",
    title: "Счетоводство · автоматизация",
    body: "Връзка между обекти и счетоводството без двойно въвеждане. Всичко стига до счетоводителя структурирано.",
    bullets: [
      "Фактури → разпознаване → разпределяне по обект",
      "Авто-export към счетоводен софтуер (Microinvest, Бизнес навигатор, и др.)",
      "Месечни справки: приходи/разходи по обект, ДДС, печалба",
      "Telegram нотификации за просрочени фактури",
    ],
  },
  {
    n: "05",
    title: "AI Sales — клиенти и оферти",
    body: "От запитване до подписан договор — структурирано, без губене на клиенти в Viber/имейл.",
    bullets: [
      "Авто-разпознаване на запитвания от Facebook, имейл, телефон",
      "AI генерира предварителна оферта по описание на обекта",
      "Договор по утвърден шаблон, готов за подпис",
      "Tracking: запитване → оферта → договор → работа → разплащане",
    ],
  },
  {
    n: "06",
    title: "Чат бот контрол на български",
    body: "Управлявате цялата система с разговор. Не сте програмист — пишете на език, който владеете.",
    bullets: [
      "Колко струваме на обект Витоша 24 досега? → отговор + графика",
      "Прати Атанас на склада в 8 утре с тези материали…",
      "Кой клиент не е платил повече от 30 дни?",
      "Направи актове за всичко свършено този месец",
    ],
  },
];

const PROCESS = [
  { step: "1", title: "Разговор", body: "30 минути — обсъждаме процесите, болезнените места, какво искате да отпадне." },
  { step: "2", title: "Демо", body: "Подготвям конкретно демо на dashboard-а с примерни данни от вашия бранш." },
  { step: "3", title: "Изграждане", body: "От 30 до 60 дни до пълно стартиране — според големината на проекта. Работим с екипа ви, не само на хартия." },
  { step: "4", title: "Инсталация", body: "1-3 работни дни на място при вас. Настройка с реалните ви данни и тренинг." },
  { step: "5", title: "Поддръжка", body: "30 дни безплатна поддръжка, корекции, оптимизация. После — по договорка." },
];

const WHY = [
  { title: "Изграждаме по поръчка", body: "Не продаваме готов SaaS. Системата се прави около вашите конкретни процеси, не наопаки." },
  { title: "Реална автоматизация", body: "Не просто 'интелигентни' таблици. AI поема рутината — четене на фактури, генериране на документи, отговори." },
  { title: "Без външен софтуер", body: "Цялата система е ваша, на вашия Cloud. Не зависите от платформа, която утре може да фалира." },
  { title: "На място + локално", body: "От Пловдив сме. Идваме при вас за тренинг и фина настройка — без само Zoom." },
];

export default function TeodorOfertaPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 184, 0, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 184, 0, 1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 15% 25%, rgba(255, 184, 0, 0.14) 0%, transparent 50%), radial-gradient(ellipse at 85% 75%, rgba(255, 138, 60, 0.10) 0%, transparent 45%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-6 py-32 md:px-12">
          <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-amber)]">
            ПРЕЗЕНТАЦИЯ · {today}
          </p>

          <p className="mb-3 font-[family-name:var(--font-editorial)] text-2xl text-[var(--color-text-secondary)]">
            за
          </p>

          <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(48px,10vw,140px)] font-extrabold leading-[0.92] tracking-tight">
            <span style={{ color: "var(--color-text-primary)" }}>Теодор</span>
            <br />
            <span style={{ color: "var(--color-accent-amber)" }}>Лозев</span>
          </h1>

          <p className="mt-6 inline-block w-fit rounded-full border border-[var(--color-border-bright)] bg-[rgba(255,184,0,0.08)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-amber)]">
            Строителство
          </p>

          <div className="mt-12 max-w-2xl">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
              AI операционна система за строителен бранш — <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">един dashboard за склад, КСС, счетоводство и обекти</span>. Спестявате часове ръчна работа всеки ден.
            </p>
          </div>

          <div className="mt-14 flex items-center gap-6">
            <div aria-hidden className="h-px w-12" style={{ background: "var(--color-accent-amber)" }} />
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              „ПроМаркетинг" ЕООД · персонална презентация
            </p>
          </div>

          <a
            href="#what"
            className="mt-20 inline-flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-amber)]"
          >
            Какво изграждаме
            <span aria-hidden>↓</span>
          </a>
        </div>
      </section>

      {/* WHAT WE BUILD */}
      <section id="what" className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-amber)]">
            Какво изграждаме за вас
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Един <span className="text-[var(--color-accent-amber)]">dashboard</span>. Целият ви бизнес.
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {MODULES.map((m) => (
              <div
                key={m.n}
                className="relative overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-8 transition-colors hover:border-[var(--color-border-bright)]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold leading-tight">
                    {m.title}
                  </h3>
                  <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                    {m.n}
                  </span>
                </div>
                <p className="mb-5 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {m.body}
                </p>
                <ul className="space-y-2">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-sm leading-relaxed text-[var(--color-text-primary)]">
                      <span aria-hidden className="text-[var(--color-accent-amber)]">▸</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="relative border-t border-[var(--color-border-default)] py-32" style={{ background: "rgba(255, 184, 0, 0.02)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-amber)]">
            Защо ние
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            Не сме <span className="text-[var(--color-accent-amber)]">SaaS компания</span>.
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {WHY.map((w) => (
              <div key={w.title} className="border-l-2 border-[var(--color-accent-amber)] pl-6">
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
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-amber)]">
            Как работим
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[0.95]">
            От разговор до <span className="text-[var(--color-accent-amber)]">стартиране</span>.
          </h2>

          <div className="space-y-6">
            {PROCESS.map((p) => (
              <div
                key={p.step}
                className="flex flex-col gap-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-6 md:flex-row md:items-center md:gap-8 md:p-8"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-accent-amber)] font-[family-name:var(--font-editorial)] text-2xl font-bold text-[var(--color-accent-amber)]">
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
          <p className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-amber)]">
            Следваща стъпка
          </p>
          <h2 className="mb-8 font-[family-name:var(--font-editorial)] text-[clamp(40px,7vw,84px)] font-extrabold leading-[0.95]">
            Готов ли сте за <span className="text-[var(--color-accent-amber)]">30 мин разговор</span>?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Обсъждаме вашите процеси, болезнените места и какво конкретно искате да отпадне. След разговора подготвям конкретно демо.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://promarketing.pw/booking"
              className="inline-flex items-center gap-3 rounded-full bg-[var(--color-accent-amber)] px-10 py-5 text-base font-bold uppercase tracking-[0.2em] text-[#070a0f] transition-transform hover:scale-[1.02]"
            >
              Резервирай разговор
              <span aria-hidden>→</span>
            </a>
            <a
              href="tel:+359877399963"
              className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border-bright)] px-10 py-5 text-base font-medium uppercase tracking-[0.2em] text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent-amber)] hover:text-[var(--color-accent-amber)]"
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
