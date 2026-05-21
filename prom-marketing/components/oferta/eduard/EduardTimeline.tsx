const PHASES = [
  {
    week: "Седмица 1",
    title: "Discovery & Онбординг",
    body: "Дълбок одит на бизнеса: продукти, ICP, тон на бранда, текущи канали. Свързваме AI агентите с Facebook, Instagram, Threads. Настройваме достъпа до дашборда.",
    deliverable: "Brand brief + достъпи",
  },
  {
    week: "Седмица 2",
    title: "Content Engine стартира",
    body: "AI агентите генерират първите 20 поста — текст, визия, hashtags. Ти преглеждаш в дашборда и одобряваш. Системата запомня кой стил харесваш и кой не.",
    deliverable: "Първите одобрени постове",
  },
  {
    week: "Седмица 3",
    title: "Планирано публикуване",
    body: "Включваме автоматичното публикуване по оптимални часове за всяка платформа. Първите реални публикации тръгват live. Започваме да събираме ангажираност данни.",
    deliverable: "Социалните на автопилот",
  },
  {
    week: "Седмица 4",
    title: "Чат бот — setup",
    body: "Изграждаме чат бота за Instagram DM, Messenger и Viber. Подаваме му база знания за продуктите и FAQ. Конфигурираме сценарии за често задавани въпроси.",
    deliverable: "Чат бот в тестов режим",
  },
  {
    week: "Седмица 5",
    title: "Чат бот — go live",
    body: "Чат ботът минава на боен режим и отговаря на реални клиенти 24/7. Свързваме го с CRM-а — всеки качествен lead влиза автоматично. Ти получаваш само горещите запитвания.",
    deliverable: "Live чат бот + CRM поток",
  },
  {
    week: "Седмица 6",
    title: "Финансова автоматизация",
    body: "Свързваме счетоводна система и банкови сметки. Автоматично разпознаване на фактури, категоризация на разходи, ежедневни справки за cash flow в дашборда.",
    deliverable: "Финансов модул работи",
  },
  {
    week: "Седмица 7",
    title: "Интеграция & оптимизация",
    body: "Свързваме всички системи в един поток: социални → чат бот → CRM → счетоводство. Анализираме първите резултати и преструктурираме там, където има тесни места.",
    deliverable: "Единна свързана система",
  },
  {
    week: "Седмица 8",
    title: "Launch & handover",
    body: "Финална проверка на всеки агент. Получаваш писмен playbook, видео обучение за дашборда и план за следващите 90 дни. От тук нататък — ти караш, ние сме на разположение.",
    deliverable: "Самоподдържаща се система",
  },
];

export function EduardTimeline() {
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-violet)]">
          02 · Стартираме след 7 дни
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,80px)] font-extrabold leading-[1.0]">
          От подписа до{" "}
          <span style={{ color: "var(--color-accent-cyan)" }}>автопилот</span>
          <br />за 8 седмици.
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          {`Без чакане. Без „ще ви се обадим след седмица". Стриктен график с ясни milestones — знаеш точно на какъв етап е системата.`}
        </p>

        <ol className="mt-20">
          {PHASES.map((p, i) => (
            <li
              key={p.week}
              className="relative grid grid-cols-1 gap-8 border-t border-[var(--color-border-default)] py-12 md:grid-cols-[180px_1fr_200px] md:items-start md:gap-12 md:py-16"
            >
              {/* Glowing dot on the timeline */}
              <div
                aria-hidden
                className="absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full"
                style={{
                  background: i === 0 ? "var(--color-accent-cyan)" : "var(--color-text-tertiary)",
                  boxShadow: i === 0 ? "0 0 12px var(--color-accent-cyan)" : "none",
                }}
              />

              <div>
                <p
                  className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em]"
                  style={{ color: "var(--color-accent-violet)" }}
                >
                  {p.week}
                </p>
                <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-tertiary)]">
                  Фаза {String(i + 1).padStart(2, "0")}
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-editorial)] text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
                  {p.title}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">
                  {p.body}
                </p>
              </div>

              <div className="md:text-right">
                <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                  Резултат
                </p>
                <p
                  className="mt-2 font-[family-name:var(--font-editorial)] text-lg font-bold"
                  style={{ color: "var(--color-accent-cyan)" }}
                >
                  {p.deliverable}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
