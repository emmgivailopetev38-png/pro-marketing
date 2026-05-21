interface LineItem {
  label: string;
  description: string;
  amount: number;
}

const LINE_ITEMS: LineItem[] = [
  {
    label: "Уникален дизайн на бранда",
    description:
      "Мудборд, типографски избор, цветова палитра, дизайн на 8+ ключови екрана във Figma. Финална визия одобрена от теб преди да започне разработката.",
    amount: 450,
  },
  {
    label: "Видео продуктови презентации",
    description:
      "Система за вграждане на 5-секундни продуктови видеа с auto-play, муум при scroll и музикална атмосфера. Поддръжка на до 100 продукта.",
    amount: 380,
  },
  {
    label: "Конструктор за персонализирана бродерия",
    description:
      "Уникален поток — клиентът избира тъкан, цвят, шрифт на бродерията, въвежда текст, вижда визуализация. Поръчката идва при теб готова за изпълнение.",
    amount: 420,
  },
  {
    label: "Каталог с креативни категории",
    description: `Не „по размер" — а по дизайн: Перли, Дантели, Бродерия, Минимализъм, Подаръчни сетове. Лесно сортиране, фини филтри.`,
    amount: 280,
  },
  {
    label: "Instagram &amp; социална интеграция",
    description:
      "Автоматичен sync от @boutique_bedding — последните 9 публикации в галерия. Wishlist, sharing, отзиви на клиенти.",
    amount: 220,
  },
  {
    label: "Mobile-first производителност",
    description:
      "Гарантирани под 1 секунда зареждане, 95+ Lighthouse score. Без лагване дори при бавна мрежа.",
    amount: 250,
  },
  {
    label: "SEO &amp; локални оптимизации",
    description:
      "Технически SEO, schema markup за продукти, мета описания на български, регистрация в Google Business + Google Merchant.",
    amount: 200,
  },
  {
    label: "Платежни &amp; доставка",
    description:
      "Stripe + PayPal + наложен платеж. Интеграция с Еконт и Спиди — клиентът избира офис, ти получаваш товарителница автоматично.",
    amount: 230,
  },
];

const SUBTOTAL = LINE_ITEMS.reduce((s, i) => s + i.amount, 0);
const PARTNER_PRICE = 2000;
const DISCOUNT = SUBTOTAL - PARTNER_PRICE;
const DISCOUNT_PCT = Math.round((DISCOUNT / SUBTOTAL) * 100);

const INCLUDED_FREE = [
  "Shopify theme customisation + всички apps настроени",
  "Обучение на живо · 2 сесии по 1 час, с презентация по сайта",
  "3 месеца support + corrections след стартиране",
  "Конфигуриране на собствен домейн + SSL",
  "Конфигуриране на email на собствен домейн",
  "Резервно копие всеки ден + достъп до архив",
];

const MONTHLY_COSTS = [
  {
    label: "Shopify Basic",
    amount: "~100 €/м",
    note: "плащана директно към Shopify, не през нас",
  },
  {
    label: "Домейн",
    amount: "~15 €/год",
    note: "ако вече нямаш — препоръчваме .bg или .com",
  },
  {
    label: "Транзакционни такси",
    amount: "~1.4% / транзакция",
    note: "стандартни такси за приемане на плащания, не са скрити",
  },
];

function formatEur(n: number): string {
  return new Intl.NumberFormat("bg-BG").format(n) + " €";
}

export function ScopeBreakdown() {
  return (
    <section
      id="scope"
      className="relative border-y border-[var(--color-border-default)] bg-[var(--color-bg-deep)] py-28 md:py-40"
    >
      <div className="mx-auto max-w-5xl px-6 md:px-12">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.4em] text-[var(--color-accent-magenta)]">
          03 · Какво получаваш
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,80px)] font-light leading-[1.05]">
          Стойността на<br />
          всеки <span className="italic">детайл</span>.
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          Разбираме на какво държиш — на детайлите. Затова всеки елемент от офертата е отделен, ясно показан, с цена, с очаквания. Без скрити такси след подписа.
        </p>

        <div className="mt-16 overflow-hidden rounded-sm border border-[var(--color-border-default)] bg-[var(--color-bg-void)]">
          <div className="grid grid-cols-[1fr_auto] items-baseline gap-6 border-b border-[var(--color-border-default)] px-6 py-4 md:px-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              Елемент
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              Стойност
            </p>
          </div>
          {LINE_ITEMS.map((item, i) => (
            <div
              key={item.label}
              className="grid grid-cols-[1fr_auto] items-baseline gap-6 border-b border-[var(--color-border-default)] px-6 py-7 last:border-b-0 md:px-10"
            >
              <div>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-[family-name:var(--font-editorial)] text-xl font-medium text-[var(--color-text-primary)] md:text-2xl">
                    <span dangerouslySetInnerHTML={{ __html: item.label }} />
                  </h3>
                </div>
                <p
                  className="mt-3 max-w-2xl pl-9 text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
              <p className="font-mono text-base font-medium text-[var(--color-text-primary)] md:text-lg">
                {formatEur(item.amount)}
              </p>
            </div>
          ))}
        </div>

        {/* Included free */}
        <div className="mt-12 rounded-sm border border-[var(--color-border-default)] bg-[var(--color-bg-void)] p-8 md:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-magenta)]">
            Включено · стойност на ProMarketing партньорство
          </p>
          <h3 className="mt-4 font-[family-name:var(--font-editorial)] text-2xl italic text-[var(--color-text-primary)] md:text-3xl">
            Безплатно, защото вярваме в дългосрочността.
          </h3>
          <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {INCLUDED_FREE.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)] md:text-base"
              >
                <span
                  aria-hidden
                  className="mt-2 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: "var(--color-accent-cyan)" }}
                />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>

        {/* Totals */}
        <div className="mt-12 rounded-sm border-2 border-[var(--color-accent-cyan)] bg-[var(--color-bg-void)] p-8 md:p-12">
          <div className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[var(--color-border-default)] pb-4">
              <p className="text-base text-[var(--color-text-secondary)] md:text-lg">
                Стойност на компонентите
              </p>
              <p className="font-mono text-lg text-[var(--color-text-secondary)] line-through md:text-xl">
                {formatEur(SUBTOTAL)}
              </p>
            </div>
            <div className="flex items-baseline justify-between border-b border-[var(--color-border-default)] pb-4">
              <p className="text-base text-[var(--color-text-secondary)] md:text-lg">
                Партньорска отстъпка · {DISCOUNT_PCT}%
              </p>
              <p
                className="font-mono text-lg font-medium md:text-xl"
                style={{ color: "var(--color-accent-magenta)" }}
              >
                −{formatEur(DISCOUNT)}
              </p>
            </div>
            <div className="flex items-baseline justify-between pt-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                  За теб · еднократна цена
                </p>
                <p className="mt-2 font-[family-name:var(--font-editorial)] text-2xl italic text-[var(--color-text-primary)]">
                  Всичко изброено по-горе
                </p>
              </div>
              <p
                className="font-[family-name:var(--font-editorial)] text-5xl font-medium leading-none md:text-7xl"
                style={{ color: "var(--color-accent-cyan)" }}
              >
                {formatEur(PARTNER_PRICE)}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-sm italic text-[var(--color-text-tertiary)] md:text-base">
          Плащане на 3 вноски — 40% при стартиране, 30% при готова визия, 30% при launch. Без скрити такси, без vendor lock-in. Сайтът остава твой и можеш да го местиш по всяко време.
        </p>

        {/* Transparency: ongoing platform costs */}
        <div className="mt-16 rounded-sm border border-[var(--color-border-default)] bg-[var(--color-bg-void)] p-8 md:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-magenta)]">
            Текущи разходи · извън нашата фактура
          </p>
          <h3 className="mt-4 font-[family-name:var(--font-editorial)] text-2xl italic text-[var(--color-text-primary)] md:text-3xl">
            Прозрачно за бъдещето.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
            Сайтът е изграден върху <span className="font-[family-name:var(--font-editorial)] italic">Shopify</span> — стандарта за луксозни брандове в света. Това са разходите, които ще плащаш месечно директно към платформата, не през нас:
          </p>
          <ul className="mt-6 space-y-4">
            {MONTHLY_COSTS.map((c) => (
              <li
                key={c.label}
                className="grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-[var(--color-border-default)] pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-[family-name:var(--font-editorial)] text-lg italic text-[var(--color-text-primary)]">
                    {c.label}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{c.note}</p>
                </div>
                <p className="font-mono text-sm text-[var(--color-text-secondary)] md:text-base">
                  {c.amount}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs italic text-[var(--color-text-tertiary)]">
            Защо Shopify? Защото е най-сигурната, най-бързата и най-разпознатата платформа за e-commerce. Не трябва да мислиш за сървъри, обновления или сигурност — всичко е поето. И когато решиш да се развиваш в чужбина, преходът е въпрос на минути.
          </p>
        </div>
      </div>
    </section>
  );
}
