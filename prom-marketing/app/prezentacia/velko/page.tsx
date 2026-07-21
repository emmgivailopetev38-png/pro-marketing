import Link from "next/link";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

const today = format(new Date(), "d MMMM yyyy", { locale: bg });

const MEETINGS = [
  {
    n: "Разговор 1",
    href: "https://fathom.video/share/MJTed5_xeTzGybe8iuqJoZzQ51Lxqp7B",
    body: "Първият ни запис — контекст, идеи и посока за партньорството.",
  },
  {
    n: "Разговор 2",
    href: "https://fathom.video/share/xXK-n3HwwhMXojpaVS2v1Fm3usXT-t6R",
    body: "Вторият запис — детайли по структурата и следващи стъпки.",
  },
];

const PRODUCTS = [
  {
    icon: "🤖",
    title: "AI агенти & чатботове",
    body: "24/7 на Messenger, Instagram, WhatsApp, Viber и сайта. Отговарят, квалифицират и не изпускат нито едно запитване.",
  },
  {
    icon: "🗂️",
    title: "Персонализиран CRM",
    body: "Всеки контакт, оферта и сделка на едно място. Скроен за процесите на клиента — не готов шаблон под наем.",
  },
  {
    icon: "⚙️",
    title: "Автоматизации",
    body: "Оферти, договори, фактури и follow-up имейли се генерират сами. По-малко ръчна работа, по-бързи сделки.",
  },
  {
    icon: "🎯",
    title: "Lead generation",
    body: "Meta форми и реклами, lead magnets и AI оценка — топъл лийд директно в CRM-а, без ръчно въвеждане.",
  },
  {
    icon: "📊",
    title: "Анализи & отчети",
    body: "Ясна картина кой канал и коя оферта носят пари. Решения по числа, не по усещане.",
  },
  {
    icon: "✨",
    title: "Персонални демота & презентации",
    body: "За всеки сериозен клиент правим таен линк като този — скроен за неговия бизнес. Затваря много по-бързо.",
  },
];

const STAGES = [
  { n: "01", title: "Лийд · първи контакт", body: "Запитване от реклама, препоръка или форма влиза автоматично при нас." },
  { n: "02", title: "Discovery разговор", body: "30 минути — процеси, болезнени места, какво искат да отпадне от ръчната работа." },
  { n: "03", title: "Персонална презентация", body: "Таен линк, скроен за техния бизнес (като този). Виждат точно какво получават." },
  { n: "04", title: "Демо", body: "Показваме системата с техни примерни данни — усещат я преди да платят." },
  { n: "05", title: "Договор", body: "Фиксиран обхват и цена. Без скрити такси, без изненади." },
  { n: "06", title: "Изграждане", body: "30–60 дни според големината — строим по поръчка, тестваме, интегрираме." },
  { n: "07", title: "Старт + тренинг", body: "Пускаме на живо с реалните им данни и обучаваме екипа онлайн." },
  { n: "08", title: "Поддръжка · recurring", body: "Месечен абонамент — оптимизация, нови функции, хостинг. Тук е дългосрочната стойност." },
];

const PATHS = [
  {
    tag: "Път А",
    title: "Done-for-you",
    body: "Ние строим и движим системата + месечна поддръжка. За клиента, който иска резултат и време — не проект за управление.",
    points: [
      "Най-висока стойност — за клиента и за нас",
      "Месечен recurring приход (поддръжка)",
      "Клиентът се фокусира върху бизнеса си",
    ],
    accent: "gold" as const,
  },
  {
    tag: "Път Б",
    title: "Менторска · „сам, но с нас“",
    body: "За контролните типове, които искат сами да го направят. Учим тях и екипа им да строят и движат системите (4-месечна програма).",
    points: [
      "Хваща клиента, който иначе би си тръгнал",
      "Често става врата към done-for-you по-късно",
      "Печелим и от двата сценария",
    ],
    accent: "emerald" as const,
  },
];

const OFFERS = [
  { href: "https://promarketing.pw/pitch", label: "Обща презентация", tag: "за нови клиенти" },
  { href: "https://promarketing.pw/oferta/golden-key", label: "Golden Key", tag: "агенция за имоти" },
  { href: "https://promarketing.pw/oferta/irina", label: "Ирина", tag: "складове с храни" },
  { href: "https://promarketing.pw/oferta/taste-of-bulgaria", label: "Taste of Bulgaria", tag: "храни / бранд" },
  { href: "https://promarketing.pw/oferta/evolto", label: "Evolto", tag: "персонална презентация" },
  { href: "https://promarketing.pw/oferta/teodor", label: "Теодор", tag: "персонална презентация" },
  { href: "https://promarketing.pw/oferta/eduard", label: "Едуард", tag: "персонална презентация" },
  { href: "https://promarketing.pw/oferta/krasimira", label: "Красимира", tag: "персонална презентация" },
  { href: "https://promarketing.pw/oferta/antoan09", label: "Antoan 09", tag: "персонална презентация" },
  { href: "https://promarketing.pw/mentor", label: "Менторска програма", tag: "обучение 1-на-1" },
  { href: "https://promarketing.pw/partneri", label: "Партньорска програма", tag: "за агенции · white-label" },
];

export default function VelkoPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(224, 168, 46, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(224, 168, 46, 1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 25%, rgba(224, 168, 46, 0.16) 0%, transparent 50%), radial-gradient(ellipse at 80% 75%, rgba(16, 185, 129, 0.12) 0%, transparent 45%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-6 py-32 md:px-12">
          <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            ПАРТНЬОРСТВО · {today}
          </p>

          <p className="mb-3 font-[family-name:var(--font-editorial)] text-2xl text-[var(--color-text-secondary)]">
            за
          </p>

          <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[1.05] tracking-tight">
            <span style={{ color: "var(--color-text-primary)" }}>Велко </span>
            <span
              style={{
                color: "transparent",
                backgroundImage: "linear-gradient(135deg, #ffd166, #e0a82e 50%, #b8860b)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              Кузманов
            </span>
          </h1>

          <p className="mt-6 inline-block w-fit rounded-full border border-[var(--color-border-bright)] bg-[rgba(224,168,46,0.08)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">
            Структура & продажби · ProMarketing
          </p>

          <div className="mt-12 max-w-2xl">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
              Ето я цялата машина — <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">какво продаваме, как клиентът минава през нивата ни, и къде влизаш ти</span>. Целта е проста: затваряме клиенти по-бързо и те остават на поддръжка. Ти структурираш процеса и си до нас, докато стигнем до първата продажба — продажбите водим ние, а ти ги правиш системни и предвидими.
            </p>
          </div>

          <div className="mt-14 flex items-center gap-6">
            <div aria-hidden className="h-px w-12" style={{ background: "var(--color-gold)" }} />
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              От Ивайло Петев · „ПроМаркетинг“ ЕООД
            </p>
          </div>

          <div className="mt-20 flex flex-wrap gap-4">
            <a
              href="#sreshti"
              className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: "var(--color-gold-bright)",
                color: "var(--color-gold-bright)",
                background: "rgba(224, 168, 46, 0.08)",
              }}
            >
              🎥 Гледай срещите
              <span aria-hidden>↓</span>
            </a>
            <a
              href="#model"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-gold-bright)] hover:text-[var(--color-gold-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              💰 Моделът на партньорство
            </a>
            <a
              href="#oferti"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-gold-bright)]"
            >
              Нашите презентации
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* СРЕЩИ · FATHOM */}
      <section
        id="sreshti"
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{ background: "rgba(224, 168, 46, 0.02)" }}
      >
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Нашите разговори
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Двете <span className="text-[var(--color-gold-bright)]">срещи</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Записите на разговорите ни — за да можем да тръгнем от една и съща точка.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {MEETINGS.map((m) => (
              <a
                key={m.n}
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border p-8 transition-colors hover:border-[var(--color-border-bright)]"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(14, 20, 14, 0.55)",
                }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(224,168,46,0.12)] text-xl">
                    ▶
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">
                    Fathom · видео
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold leading-tight text-[var(--color-text-primary)]">
                  {m.n}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{m.body}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-gold-bright)]">
                  Отвори записа
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ДОВЕРИЕ */}
      <section className="relative border-t border-[var(--color-border-default)] py-24">
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <div
            className="rounded-3xl border-2 p-10 text-center md:p-14"
            style={{
              borderColor: "var(--color-border-bright)",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(224, 168, 46, 0.05))",
            }}
          >
            <p className="mb-5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
              🤝 С пълно доверие
            </p>
            <p className="font-[family-name:var(--font-editorial)] text-2xl font-bold leading-snug text-[var(--color-text-primary)] md:text-3xl">
              Споделяме това с пълно доверие към теб и екипа ти.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
              Вътре има реални клиенти, числа и ноу-хау, които не показваме на всеки. Изпращаме ти го, защото вярваме във вас и в това, което можем да построим заедно.
            </p>
          </div>
        </div>
      </section>

      {/* КАКВО Е PROMARKETING */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            За 60 секунди
          </p>
          <h2 className="mb-6 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Какво е <span className="text-[var(--color-gold-bright)]">ProMarketing</span>.
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Строим <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">серийни AI системи за бизнеса</span> — агенти, CRM и автоматизации, които ловят лийдове, квалифицират ги и ги водят до сделка 24/7. Не продаваме „реклама“, а система, която работи сама и се изплаща. Всичко е по поръчка, на собствен облак на клиента — без зависимост от чужди платформи.
          </p>
        </div>
      </section>

      {/* КАКВО ПРОДАВАМЕ */}
      <section
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{ background: "rgba(224, 168, 46, 0.02)" }}
      >
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Каталог
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Какво точно <span className="text-[var(--color-gold-bright)]">продаваме</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Всяко върви самостоятелно или в пакет. Обхватът и цената се определят според това какво иска клиентът.
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {PRODUCTS.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border p-7 transition-colors hover:border-[var(--color-border-bright)]"
                style={{ background: "rgba(14, 20, 14, 0.55)", borderColor: "var(--color-border-default)" }}
              >
                <span className="text-3xl" aria-hidden>{s.icon}</span>
                <h3 className="mt-4 font-[family-name:var(--font-editorial)] text-xl font-bold text-[var(--color-text-primary)]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* НИВАТА · КЛИЕНТСКИ ПЪТ */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Нашият процес
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Нивата, през които минава <span className="text-[var(--color-gold-bright)]">клиентът</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            От първо запитване до постоянна поддръжка. Това е „машината“, в която включваш всеки клиент, когото донесеш.
          </p>

          <div className="space-y-4">
            {STAGES.map((s) => (
              <div
                key={s.n}
                className="flex flex-col gap-3 rounded-2xl border p-6 md:flex-row md:items-center md:gap-8"
                style={{ borderColor: "var(--color-border-default)", background: "rgba(14, 20, 14, 0.45)" }}
              >
                <span className="font-[family-name:var(--font-editorial)] text-4xl font-extrabold text-[var(--color-gold-bright)] md:w-20">
                  {s.n}
                </span>
                <div className="flex-1">
                  <h3 className="font-[family-name:var(--font-editorial)] text-lg font-bold text-[var(--color-text-primary)]">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ДВАТА ПЪТЯ */}
      <section
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{ background: "rgba(16, 185, 129, 0.03)" }}
      >
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-emerald-bright)]">
            Сегментация на клиента
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Два пътя — <span className="text-[var(--color-emerald-bright)]">и двата печелят</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Някои клиенти — често големи бизнесмени — искат сами да си направят всичко. Не се бори с това. Осребри го.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {PATHS.map((p) => {
              const accentVar = p.accent === "gold" ? "var(--color-gold-bright)" : "var(--color-emerald-bright)";
              const accentBg = p.accent === "gold" ? "rgba(224, 168, 46, 0.06)" : "rgba(16, 185, 129, 0.06)";
              return (
                <div
                  key={p.tag}
                  className="rounded-2xl border p-8"
                  style={{ borderColor: "var(--color-border-default)", background: accentBg }}
                >
                  <span
                    className="inline-block rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em]"
                    style={{ borderColor: accentVar, color: accentVar }}
                  >
                    {p.tag}
                  </span>
                  <h3 className="mt-5 font-[family-name:var(--font-editorial)] text-2xl font-bold text-[var(--color-text-primary)]">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{p.body}</p>
                  <ul className="mt-6 space-y-2">
                    {p.points.map((pt, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-primary)]">
                        <span className="mt-0.5" style={{ color: accentVar }}>▸</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div
            className="mt-8 rounded-2xl border p-8"
            style={{ borderColor: "var(--color-border-bright)", background: "rgba(14, 20, 14, 0.55)" }}
          >
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-emerald-bright)]">
              Как ги затваряме
            </p>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-text-secondary)]">
              Менторската е <span className="font-bold text-[var(--color-text-primary)]">и продукт, и фуния</span>. Много, които тръгнат „сам“, виждат, че е тежко, и минават към done-for-you + поддръжка. Репликата за скептика:{" "}
              <span className="font-[family-name:var(--font-editorial)] italic text-[var(--color-text-primary)]">
                „Можеш да си го направиш сам — даже ще те научим. Въпросът е дали времето ти е по-ценно да въртиш бизнеса, или да настройваш автоматизации.“
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ЦЕЛТА · RECURRING */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Целта
          </p>
          <h2 className="mb-6 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Клиенти, които <span className="text-[var(--color-gold-bright)]">остават</span>.
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Истинската печалба не е една сделка — а <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">месечната поддръжка</span>. Тя дава предвидим приход, по-висока стойност на бизнеса и компаундиращ ефект. Затова целта ни е да затваряме по-бързо и да задържаме по-дълго — и затова комисионата ти може да включва и дял от поддръжката (договаряме го).
          </p>
        </div>
      </section>

      {/* МОДЕЛЪТ */}
      <section
        id="model"
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{ background: "rgba(224, 168, 46, 0.04)" }}
      >
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <p className="mb-4 text-center font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Модел на партньорство
          </p>
          <h2 className="mb-16 text-center font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Започваме <span className="text-[var(--color-gold-bright)]">просто</span>.
          </h2>

          <div
            className="rounded-3xl border-2 p-10 md:p-14"
            style={{
              borderColor: "var(--color-gold-bright)",
              background: "linear-gradient(135deg, rgba(224, 168, 46, 0.12), rgba(16, 185, 129, 0.05))",
            }}
          >
            <div className="text-center">
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-bright)]">
                В началото
              </p>
              <p className="mt-3 font-[family-name:var(--font-editorial)] text-6xl font-extrabold text-[var(--color-text-primary)] md:text-8xl">
                25%
              </p>
              <p className="mt-3 text-lg text-[var(--color-text-secondary)]">
                на всяка затворена сделка
              </p>
            </div>

            <div
              className="mt-10 rounded-xl border p-6 text-center"
              style={{ borderColor: "var(--color-border-bright)", background: "rgba(14, 20, 14, 0.45)" }}
            >
              <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
                Останалите условия — стандартен процент след старта, дял от месечната поддръжка, ексклузивност и зони — <span className="font-bold text-[var(--color-text-primary)]">договаряме заедно</span> на първия разговор. Започваме веднага, с ясни 25%, и градим оттам.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* НАШИТЕ ОФЕРТИ */}
      <section
        id="oferti"
        className="relative border-t border-[var(--color-border-default)] py-32"
      >
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Реална работа
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Нашите <span className="text-[var(--color-gold-bright)]">презентации</span> до момента.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Всяка е таен личен линк, скроен за конкретен клиент. Това е стандартът, който носим на всеки сериозен бизнес — и темплейтът, който можеш да показваш.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {OFFERS.map((o) => (
              <a
                key={o.href}
                href={o.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border p-6 transition-colors hover:border-[var(--color-border-bright)]"
                style={{ borderColor: "var(--color-border-default)", background: "rgba(14, 20, 14, 0.5)" }}
              >
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                  {o.tag}
                </span>
                <span className="mt-2 font-[family-name:var(--font-editorial)] text-xl font-bold text-[var(--color-text-primary)]">
                  {o.label}
                </span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-gold-bright)]">
                  Отвори
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{
          background: "linear-gradient(135deg, rgba(224, 168, 46, 0.10), rgba(8, 10, 8, 0.20))",
        }}
      >
        <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-gold-bright)]">
            Следваща стъпка
          </p>
          <h2 className="mb-8 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Хайде да <span className="text-[var(--color-gold-bright)]">тръгваме</span>.
          </h2>
          <p className="mb-12 mx-auto max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Кратък разговор — фиксираме модела и избираме първите 3–5 клиента, по които да ударим заедно. Колкото по-рано тръгнем, толкова по-рано влизат първите комисиони.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-full border-2 px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
              style={{ borderColor: "var(--color-gold-bright)", color: "#080a08", background: "var(--color-gold-bright)" }}
            >
              📅 Запази разговор
              <span aria-hidden>→</span>
            </Link>
            <a
              href="tel:+359877399963"
              className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-gold-bright)] hover:text-[var(--color-gold-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              📞 +359 877 399 963
            </a>
            <a
              href="mailto:emmgivailopetev38@gmail.com?subject=Партньорство%20ProMarketing"
              className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-gold-bright)] hover:text-[var(--color-gold-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              ✉️ Пиши директно
            </a>
          </div>

          <p className="mt-16 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
            Ивайло Петев · ProMarketing ЕООД · promarketing.pw
          </p>
        </div>
      </section>
    </main>
  );
}
