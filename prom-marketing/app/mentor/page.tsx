import Link from "next/link";

const MODULES = [
  {
    n: "Месец 1",
    title: "AI Основи",
    body: "От нулата до увереност с AI — без блокажи.",
    bullets: [
      "Как мислят моделите (ChatGPT, Claude, Gemini) — на разговорен език",
      "Prompt engineering · техники, които работят в реална работа",
      "Какво е AI агент и кога има смисъл да го използваш",
      "Първи practical workflow в края на месеца",
    ],
  },
  {
    n: "Месец 2",
    title: "Автоматизация · n8n, Make, OpenAI",
    body: "Спираш да правиш ръчно това, което може да тече само.",
    bullets: [
      "n8n · self-hosted безкрайни workflow-и (любимият ми инструмент)",
      "Make.com · кога е по-добрият избор и защо",
      "API интеграции · OpenAI, webhooks, Google Sheets, Telegram",
      "Реален пример: авто-обработка на лидове от форма до CRM",
    ],
  },
  {
    n: "Месец 3",
    title: "CRM + Маркетинг с AI",
    body: "От лид до клиент — автоматично и измеримо.",
    bullets: [
      "Как се изгражда CRM (Supabase или готов) с твоите процеси",
      "Lead generation · Meta форми, lead magnets, AI scoring",
      "Имейл sequences с AI · drafts, follow-ups, персонализация",
      "Meta Ads + AI · оптимизация на креативи и публики",
    ],
  },
  {
    n: "Месец 4",
    title: "Твой AI бизнес или внедряване",
    body: "Прилагаш всичко — или вътре във фирмата си, или като собствен AI бизнес.",
    bullets: [
      "Позициониране · какво продаваш и на кого",
      "Оферта и цена · как ги пишеш да привличат правилните клиенти",
      "Outreach стратегия за първите 3 реални проекта",
      "Capstone проект · реална система, която работи в края на месеца",
    ],
  },
];

const INCLUDED = [
  "16 × 60 мин 1-на-1 сесии онлайн (Google Meet)",
  "Личен ментор · аз, не асистент",
  "Достъп до моите prompt библиотеки и n8n workflow templates",
  "Telegram канал за въпроси между сесиите",
  "Записи на сесиите · за повторен преглед",
  "Преглед на твоите реални проекти и код",
  "Сертификат за завършена програма",
];

const FOR_WHO = [
  {
    title: "За собственици на малък/среден бизнес",
    body: "Искаш да внедриш AI в твоята фирма — CRM, маркетинг, обслужване — без да наемаш отдел.",
  },
  {
    title: "За маркетолози и фрийлансъри",
    body: "Искаш да добавиш AI услуги в портфолиото си — реални workflow-и, които можеш да продаваш.",
  },
  {
    title: "За хора в кариерен преход",
    body: "Виждаш накъде отива работата и искаш да си в правилната половина — тази, която строи AI системите.",
  },
];

const FAQ = [
  {
    q: "Колко предварителни знания трябват?",
    a: "Никакви технически. Ако можеш да използваш ChatGPT и Excel — стартираме оттам. Build-up е постепенен.",
  },
  {
    q: "Какво ако пропусна сесия?",
    a: "Сесиите се записват и са твои. Можем да преместим в рамките на седмицата. Гъвкав съм с графика.",
  },
  {
    q: "Какво след 4-те месеца?",
    a: "Завършваш с реален проект и умение да изграждаш още. Поддържам връзка — повечето менторирани остават приятели.",
  },
];

export default function MentorPage() {
  return (
    <main className="font-[family-name:var(--font-body)] text-[var(--color-text-primary)]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139, 92, 246, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 1) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 25%, rgba(139, 92, 246, 0.20) 0%, transparent 50%), radial-gradient(ellipse at 80% 75%, rgba(250, 204, 21, 0.08) 0%, transparent 45%)",
          }}
        />

        <div className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-6 py-32 md:px-12">
          <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-violet-bright)]">
            Менторска програма · 1-на-1
          </p>

          <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,72px)] font-extrabold leading-[1.05] tracking-tight">
            <span style={{ color: "var(--color-text-primary)" }}>4 месеца до </span>
            <span
              style={{
                color: "transparent",
                backgroundImage: "linear-gradient(135deg, #a78bfa, #8b5cf6 50%, #7c3aed)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              AI системи
            </span>
            <span style={{ color: "var(--color-text-primary)" }}> в реалния ти живот.</span>
          </h1>

          <p className="mt-6 inline-block w-fit rounded-full border border-[var(--color-border-bright)] bg-[rgba(139,92,246,0.10)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-violet-bright)]">
            🧠 AI · автоматизация · CRM маркетинг
          </p>

          <div className="mt-12 max-w-2xl">
            <p className="text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
              16 седмични 1-на-1 сесии. Аз и ти. Изграждаш{" "}
              <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">
                реални AI системи
              </span>{" "}
              — за твоя бизнес или като нов твой бизнес. Без теория без приложение.
            </p>
          </div>

          <div className="mt-14 flex items-center gap-6">
            <div aria-hidden className="h-px w-12" style={{ background: "var(--color-violet-bright)" }} />
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              С Ивайло Петев · „ПроМаркетинг" ЕООД
            </p>
          </div>

          <div className="mt-20 flex flex-wrap gap-4">
            <a
              href="#price"
              className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: "var(--color-violet-bright)",
                color: "var(--color-violet-bright)",
                background: "rgba(139, 92, 246, 0.10)",
              }}
            >
              💎 Виж цената
              <span aria-hidden>↓</span>
            </a>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-violet-bright)] hover:text-[var(--color-violet-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              📚 4 месеца · 16 сесии
            </a>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-violet-bright)]"
            >
              Запази безплатен разговор
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOR WHO */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-violet-bright)]">
            За кого е програмата
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Подходяща ли е <span className="text-[var(--color-violet-bright)]">за теб</span>?
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {FOR_WHO.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border p-6"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(139, 92, 246, 0.04)",
                }}
              >
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-violet-bright)]">
                  0{i + 1}
                </p>
                <h3 className="mb-3 font-[family-name:var(--font-editorial)] text-xl font-bold leading-tight">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section
        id="modules"
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{ background: "rgba(139, 92, 246, 0.02)" }}
      >
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-violet-bright)]">
            Структура · 4 месеца
          </p>
          <h2 className="mb-4 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            16 сесии. От <span className="text-[var(--color-violet-bright)]">нулата</span> до{" "}
            <span className="text-[var(--color-gold)]">работещ AI продукт</span>.
          </h2>
          <p className="mb-16 max-w-3xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Седмично по 60 минути в Google Meet. Между сесиите — Telegram канал за бързи въпроси и
            преглед на това, което изграждаш.
          </p>

          <div className="space-y-6">
            {MODULES.map((m, i) => (
              <div
                key={i}
                className="rounded-2xl border p-8"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(15, 10, 30, 0.50)",
                }}
              >
                <div className="mb-4 flex flex-wrap items-baseline gap-4">
                  <span className="rounded-full border border-[var(--color-violet-bright)] bg-[rgba(139,92,246,0.10)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-violet-bright)]">
                    {m.n}
                  </span>
                  <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-bold leading-tight md:text-3xl">
                    {m.title}
                  </h3>
                </div>
                <p className="mb-5 text-base leading-relaxed text-[var(--color-text-secondary)]">{m.body}</p>
                <ul className="space-y-2">
                  {m.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-primary)]">
                      <span className="mt-1 text-[var(--color-violet-bright)]">▸</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INCLUDED */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-violet-bright)]">
            Какво получаваш
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Не само сесии. <span className="text-[var(--color-violet-bright)]">Цяла екосистема</span>.
          </h2>

          <ul className="grid gap-4 md:grid-cols-2">
            {INCLUDED.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-xl border p-5"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(139, 92, 246, 0.04)",
                }}
              >
                <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-violet-bright)] text-[10px] font-bold text-[#080612]">
                  ✓
                </span>
                <span className="text-sm leading-relaxed text-[var(--color-text-primary)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRICE */}
      <section
        id="price"
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{ background: "rgba(139, 92, 246, 0.04)" }}
      >
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <p className="mb-4 text-center font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-violet-bright)]">
            Инвестиция
          </p>
          <h2 className="mb-16 text-center font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            <span className="text-[var(--color-violet-bright)]">2 000 €</span> за 4 месеца.
          </h2>

          <div
            className="rounded-3xl border-2 p-10 md:p-14"
            style={{
              borderColor: "var(--color-violet-bright)",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.06))",
            }}
          >
            <div className="mb-8 text-center">
              <p className="font-[family-name:var(--font-editorial)] text-6xl font-extrabold text-[var(--color-text-primary)] md:text-7xl">
                2 000 €
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                без ДДС · за цялата 4-месечна програма
              </p>
            </div>

            <div
              className="mb-8 rounded-xl border p-6 text-center"
              style={{
                borderColor: "var(--color-border-bright)",
                background: "rgba(139, 92, 246, 0.06)",
              }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-violet-bright)]">
                Условие на плащане
              </p>
              <p className="mt-2 font-[family-name:var(--font-editorial)] text-2xl font-bold text-[var(--color-text-primary)]">
                Еднократно · 2 000 €
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Цялата сума се заплаща при стартиране на програмата.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative border-t border-[var(--color-border-default)] py-32">
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-violet-bright)]">
            Често задавани въпроси
          </p>
          <h2 className="mb-16 max-w-3xl font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Каквото <span className="text-[var(--color-violet-bright)]">хората питат</span>.
          </h2>

          <div className="space-y-4">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border p-6 transition-colors hover:border-[var(--color-violet-bright)]"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(139, 92, 246, 0.04)",
                }}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-[family-name:var(--font-editorial)] text-lg font-bold">
                  {f.q}
                  <span
                    aria-hidden
                    className="text-2xl text-[var(--color-violet-bright)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section
        className="relative border-t border-[var(--color-border-default)] py-32"
        style={{
          background:
            "linear-gradient(135deg, rgba(139, 92, 246, 0.10), rgba(15, 10, 30, 0.20))",
        }}
      >
        <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-violet-bright)]">
            Следваща стъпка
          </p>
          <h2 className="mb-8 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05]">
            Безплатен 30-мин разговор. <br />
            <span className="text-[var(--color-violet-bright)]">Виж дали си пасваме.</span>
          </h2>
          <p className="mb-12 mx-auto max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">
            Запазваш разговор. Питаш каквото искаш. Ако усетим връзка — стартираме. Ако не — поне си
            тръгваш с ясни идеи накъде да гледаш.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-full border-2 px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] transition-colors"
              style={{
                borderColor: "var(--color-violet-bright)",
                color: "#080612",
                background: "var(--color-violet-bright)",
              }}
            >
              📅 Запази разговор
              <span aria-hidden>→</span>
            </Link>
            <a
              href="mailto:ivailopetev38@gmail.com"
              className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm uppercase tracking-[0.15em] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-violet-bright)] hover:text-[var(--color-violet-bright)]"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              ✉️ Пиши директно
            </a>
          </div>

          <p className="mt-16 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
            Ивайло Петев · ProMarketing ЕООД · Пловдив, България
          </p>
        </div>
      </section>
    </main>
  );
}
