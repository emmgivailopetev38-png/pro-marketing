interface Feature {
  text: string;
}

interface Package {
  num: string;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  features: Feature[];
  highlight: boolean;
  note?: string;
}

const PACKAGES: Package[] = [
  {
    num: "01",
    tag: "Стартово",
    tagColor: "var(--color-accent-cyan)",
    title: "Ателие за Съдържание",
    subtitle: "2 AI агента пишат и публикуват вместо теб",
    price: 2000,
    highlight: true,
    features: [
      { text: "2 специализирани AI агента за писане на постове" },
      { text: "Автоматично публикуване в Facebook, Instagram, Threads" },
      { text: "Дашборд с ✅ чекбокс — одобряваш или отхвърляш всеки пост" },
      { text: "Контент календар с планиране напред" },
      { text: "Брандирани визуални шаблони за всяка платформа" },
      { text: "30+ поста/месец, готови без участие от твоя страна" },
    ],
    note: "Плащане на 2 вноски — 50% при стартиране, 50% след приемане.",
  },
  {
    num: "02",
    tag: "–15% | Следваща стъпка",
    tagColor: "var(--color-accent-violet)",
    title: "Автоматизация с Чат Ботове",
    subtitle: "AI отговаря на клиенти 24/7, квалифицира лийдове",
    price: 1700,
    originalPrice: 2000,
    discount: 15,
    highlight: false,
    features: [
      { text: "AI чат бот на уебсайта ти — активен 24 часа в денонощието" },
      { text: "Автоматична квалификация: бот решава кой е готов клиент" },
      { text: "CRM интеграция — всеки разговор директно в базата" },
      { text: "FAQ база с интелигентни отговори на честите въпроси" },
      { text: "Разширен дашборд с история на всички разговори" },
      { text: "Известяване при hot lead — ти влизаш само когато трябва" },
    ],
    note: "Добавя се към Пакет 1 или поотделно.",
  },
  {
    num: "03",
    tag: "–15% | Напред",
    tagColor: "var(--color-accent-magenta)",
    title: "Финансова Автоматизация",
    subtitle: "Плащания, счетоводство и отчети — без ръчна работа",
    price: 1445,
    originalPrice: 1700,
    discount: 15,
    highlight: false,
    features: [
      { text: "Автоматизирано фактуриране и изпращане на фактури" },
      { text: "Интеграция с счетоводен софтуер (по избор)" },
      { text: "Автоматични напомняния при просрочени плащания" },
      { text: "Седмични финансови отчети генерирани от AI" },
      { text: "Проследяване на постъпленията и разходите в реално време" },
      { text: "Допълнителни AI операции по твой избор" },
    ],
    note: "Активира се след Пакет 1 или Пакет 2.",
  },
];

function formatEur(n: number): string {
  return new Intl.NumberFormat("bg-BG").format(n) + " €";
}

const TOTAL_ALL = PACKAGES.reduce((s, p) => s + p.price, 0);

export function EduardPackages() {
  return (
    <section
      id="packages"
      className="relative border-y border-[var(--color-border-default)] py-28 md:py-40"
      style={{ background: "var(--color-bg-deep)" }}
    >
      {/* subtle glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.06) 0%, transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 md:px-12">
        <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-violet)]">
          01 · Три нива на автоматизация
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,80px)] font-extrabold leading-[1.0]">
          Избери темпото<br />
          на <span style={{ color: "var(--color-accent-cyan)" }}>растежа</span>.
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Всяко ниво носи самостоятелна стойност. Заедно изграждат система, която работи вместо теб — 24 часа в денонощието, без да ти отнема внимание.
        </p>

        {/* Package cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.num}
              className="relative flex flex-col overflow-hidden rounded-sm border"
              style={{
                borderColor: pkg.highlight ? "var(--color-accent-cyan)" : "var(--color-border-default)",
                background: pkg.highlight
                  ? "linear-gradient(160deg, rgba(0,212,255,0.07) 0%, rgba(13,18,33,0.8) 60%)"
                  : "rgba(13,18,33,0.6)",
                boxShadow: pkg.highlight
                  ? "0 0 40px rgba(0,212,255,0.08)"
                  : "none",
              }}
            >
              {pkg.highlight && (
                <div
                  className="absolute inset-x-0 top-0 h-[2px]"
                  style={{ background: "var(--color-accent-cyan)" }}
                />
              )}

              <div className="p-8">
                <div className="flex items-center justify-between">
                  <span
                    className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.35em]"
                    style={{ color: pkg.tagColor }}
                  >
                    {pkg.tag}
                  </span>
                  <span
                    className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-text-tertiary)]"
                  >
                    {pkg.num}
                  </span>
                </div>

                <h3 className="mt-5 font-[family-name:var(--font-editorial)] text-2xl font-bold text-[var(--color-text-primary)] md:text-3xl">
                  {pkg.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {pkg.subtitle}
                </p>

                <div className="mt-8">
                  {pkg.originalPrice && (
                    <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-text-tertiary)] line-through">
                      {formatEur(pkg.originalPrice)}
                    </p>
                  )}
                  <p
                    className="font-[family-name:var(--font-editorial)] text-5xl font-extrabold leading-none"
                    style={{ color: pkg.highlight ? "var(--color-accent-cyan)" : "var(--color-text-primary)" }}
                  >
                    {formatEur(pkg.price)}
                  </p>
                  {pkg.discount && (
                    <p
                      className="mt-1 font-[family-name:var(--font-mono)] text-xs"
                      style={{ color: pkg.tagColor }}
                    >
                      Спестяваш {formatEur((pkg.originalPrice ?? 0) - pkg.price)} ({pkg.discount}%)
                    </p>
                  )}
                </div>

                <ul className="mt-8 space-y-3">
                  {pkg.features.map((f) => (
                    <li
                      key={f.text}
                      className="flex items-start gap-3 text-sm leading-relaxed text-[var(--color-text-secondary)]"
                    >
                      <span
                        aria-hidden
                        className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: pkg.tagColor }}
                      />
                      {f.text}
                    </li>
                  ))}
                </ul>

                {pkg.note && (
                  <p className="mt-8 border-t border-[var(--color-border-default)] pt-5 text-xs italic text-[var(--color-text-tertiary)]">
                    {pkg.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* All 3 total */}
        <div
          className="mt-12 rounded-sm border-2 p-8 md:p-12"
          style={{
            borderColor: "var(--color-accent-cyan)",
            background: "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(13,18,33,0.9) 100%)",
          }}
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p
                className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.35em]"
                style={{ color: "var(--color-accent-violet)" }}
              >
                Всичките три · пълна система
              </p>
              <h3 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
                Пълна AI автоматизация
              </h3>
              <p className="mt-2 max-w-lg text-base leading-relaxed text-[var(--color-text-secondary)]">
                Съдържание, чат ботове, финансови операции — цялата верига работи без теб. Ти фокусираш само върху стратегията.
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-text-tertiary)]">
                Общо при 3 пакета
              </p>
              <p
                className="font-[family-name:var(--font-editorial)] text-6xl font-extrabold leading-none md:text-7xl"
                style={{ color: "var(--color-accent-cyan)" }}
              >
                {formatEur(TOTAL_ALL)}
              </p>
              <p
                className="mt-2 font-[family-name:var(--font-mono)] text-xs"
                style={{ color: "var(--color-accent-violet)" }}
              >
                Спестяваш общо {formatEur(2000 * 3 - TOTAL_ALL)} спрямо редовна цена
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
