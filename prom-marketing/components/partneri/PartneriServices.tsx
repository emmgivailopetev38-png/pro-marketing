const SERVICES = [
  {
    icon: "💬",
    title: "AI чат ботове",
    body: "24/7 отговори на Instagram DM, Messenger, Viber, WhatsApp и сайт. Booking inquiries за хотели · qualified leads за имотни.",
  },
  {
    icon: "✍️",
    title: "AI генератор на съдържание",
    body: "Социални постове в брандовия глас на клиента. 30+ публикации/месец с одобрение преди публикуване.",
  },
  {
    icon: "🔗",
    title: "Lead capture + CRM",
    body: "Свързваме форми, чат ботове и реклами с CRM-а на клиента — Salesforce, HubSpot, Pipedrive или custom.",
  },
  {
    icon: "🌍",
    title: "Мулти-езикова комуникация",
    body: "BG, EN, DE, RU — един и същ агент работи на всички езици според кой пише.",
  },
  {
    icon: "⭐",
    title: "Автоматизирани отговори на ревюта",
    body: "TripAdvisor, Booking.com, Google Maps. AI чете тона и предлага персонализиран отговор за одобрение.",
  },
  {
    icon: "💼",
    title: "Финансова автоматизация",
    body: "Фактуриране, разпознаване на разходи, седмични отчети за cash flow. Свързано със счетоводната система.",
  },
];

export function PartneriServices() {
  return (
    <section
      className="relative border-y border-[var(--color-border-default)] py-28 md:py-36"
      style={{ background: "var(--color-bg-deep)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 30%, rgba(129,140,248,0.06) 0%, transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 md:px-12">
        <p className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--color-accent-violet)]">
          02 · Какво изпълняваме за теб
        </p>

        <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,7vw,72px)] font-extrabold leading-[1.0]">
          Шест направления —<br />
          <span style={{ color: "var(--color-accent-cyan)" }}>един партньор</span>.
        </h2>

        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
          Всяка услуга може да върви самостоятелно или като пакет. Обхватът и цената
          обсъждаме в discovery call-а — според това какво иска твоят клиент.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-sm border border-[var(--color-border-default)] p-7 transition-colors hover:border-[var(--color-border-bright)]"
              style={{ background: "rgba(13,18,33,0.6)" }}
            >
              <span className="text-3xl" aria-hidden>{s.icon}</span>
              <h3 className="mt-4 font-[family-name:var(--font-editorial)] text-xl font-bold text-[var(--color-text-primary)]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
