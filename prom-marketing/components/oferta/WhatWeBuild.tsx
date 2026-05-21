import { Camera, Music, Heart, Sparkles, Layers, Share2 } from "lucide-react";

const FEATURES = [
  {
    icon: Camera,
    title: "Продуктови видеа на всеки артикул",
    body: "Не статични снимки — кратко 5-секундно видео на материята, как се разгъва, как блести при светлина. Auto-play при влизане в продукта.",
  },
  {
    icon: Music,
    title: "Лек, обгръщащ саундтрак",
    body: "Тиха инструментална музика, която потребителят може да заглуши с един клик. Атмосфера, не натрапване.",
  },
  {
    icon: Layers,
    title: "Колекции по дизайн",
    body: `Категории не са „Двойно / Единично" — а „С перли", „С дантела", „С бродерия", „Минимални". Виртуална бутикова витрина.`,
  },
  {
    icon: Sparkles,
    title: "Конструктор за персонализация",
    body: "Клиентът избира бродерия — име, инициали, дата. Вижда визуализация преди да купи. Самостоятелен поток на поръчка.",
  },
  {
    icon: Share2,
    title: "Instagram интеграция",
    body: `Последните 9 публикации от @boutique_bedding автоматично се появяват в галерия с CTA „Виж в Instagram".`,
  },
  {
    icon: Heart,
    title: "Wishlist + споделяне",
    body: "Клиентите запазват любими, споделят с близки за подарък. Намалява време до решение.",
  },
];

export function WhatWeBuild() {
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.4em] text-[var(--color-accent-magenta)]">
          02 · Това ще построим
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,80px)] font-light leading-[1.05]">
          Уебсайт, който{" "}
          <span className="italic">усеща</span>
          <br />
          материята.
        </h2>

        <p className="mt-10 max-w-3xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
          {`Базата е Shopify — платформата, която ползват Allbirds, Heinz, Gymshark, Tesla. Но не "един от много" template — изграждаме над нея конкретно за начина, по който твоите клиентки купуват: бавно, с удоволствие, със сетива.`}
        </p>

        <div className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[var(--color-border-default)] bg-[var(--color-border-default)] md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex flex-col gap-4 bg-[var(--color-bg-void)] p-8 md:p-10"
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className="h-7 w-7"
                    strokeWidth={1.2}
                    style={{ color: "var(--color-accent-cyan)" }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl font-medium leading-tight text-[var(--color-text-primary)] md:text-3xl">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-magenta)]">
              + Невидими, но критични
            </p>
            <ul className="mt-6 space-y-3 text-base text-[var(--color-text-secondary)]">
              {[
                `SEO оптимизация за „спално бельо с перли" и подобни ключови думи`,
                "Speed: под 1 секунда зареждане на всяко устройство",
                "Mobile-first дизайн (90% от Instagram трафика е телефон)",
                "GDPR съвместимост и SSL по подразбиране",
                "Аналитика — кой какво гледа, колко време остава",
                "Лесна административна страница за добавяне на продукти",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full"
                    style={{ background: "var(--color-accent-cyan)" }}
                  />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-magenta)]">
              + Готово за растеж
            </p>
            <ul className="mt-6 space-y-3 text-base text-[var(--color-text-secondary)]">
              {[
                "Email маркетинг секвенции след първа поръчка",
                "Програма за лоялност и подаръчни ваучери",
                "Интеграция с Еконт / Спиди за доставка",
                "Множество начини на плащане: карта, PayPal, наложен платеж",
                "Готова система за купони / промо кодове",
                "Подготовка за разширение към чужбина (мулти-език)",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full"
                    style={{ background: "var(--color-accent-violet)" }}
                  />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
