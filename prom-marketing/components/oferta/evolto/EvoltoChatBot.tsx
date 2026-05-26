interface ChatMessage {
  role: "user" | "bot";
  text: string;
  meta?: string;
}

const CONVERSATION: ChatMessage[] = [
  {
    role: "user",
    text: "Колко са активните leads този месец?",
    meta: "09:32",
  },
  {
    role: "bot",
    text: `127 leads този месец — 34% повече от април. От тях 23 са на етап „Оферта", 12 чакат подпис. Топ canal: Facebook Lead Ads (52%).`,
    meta: "09:32 · 0.8 сек",
  },
  {
    role: "user",
    text: "Напиши пост за нов проект 42 kW в Пловдив",
    meta: "09:33",
  },
  {
    role: "bot",
    text: "Готово. Draft в Content tab → одобрение чака. Подготвих и 3 варианта banner (FB/IG/LinkedIn). Искаш ли да включа и Reels от монтажа?",
    meta: "09:33 · 2.1 сек",
  },
  {
    role: "user",
    text: "Да, и планирай за публикуване утре 10:00",
    meta: "09:34",
  },
  {
    role: "bot",
    text: "Запазено: 4 поста + 1 Reels, 28.05.2026 10:00 Sofia. Ще пинна напомняне за одобрение тази вечер 21:00.",
    meta: "09:34 · 0.5 сек",
  },
];

export function EvoltoChatBot() {
  return (
    <section
      className="relative border-y py-28 md:py-36"
      style={{
        background: "var(--color-bg-deep)",
        borderColor: "var(--color-border-default)",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <p
          className="mb-8 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.5em]"
          style={{ color: "var(--color-electric-blue)" }}
        >
          06 · Чат бот контрол
        </p>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(36px,6vw,68px)] font-extrabold leading-[1.02]">
              Управляваш всичко с{" "}
              <span style={{ color: "var(--color-electric-blue)" }}>един чат</span>.
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
              Без бутони и менюта. Пишеш на български. AI агентът разбира, изпълнява, връща резултат.
            </p>

            <ul className="mt-10 space-y-4 text-sm text-[var(--color-text-secondary)] md:text-base">
              <ChatCapability
                icon="📊"
                title="Pull данни"
                example='"Колко kW сме инсталирали тази седмица?"'
              />
              <ChatCapability
                icon="📨"
                title="Изпрати действие"
                example='"Прати follow-up на всички leads които не са отговорили 5+ дни"'
              />
              <ChatCapability
                icon="🎬"
                title="Генерирай съдържание"
                example='"Направи пост за финансиране по ПВЕЕ-2026"'
              />
              <ChatCapability
                icon="📅"
                title="Планирай"
                example='"Запази 30 мин с Михаил Петров в петък 14:00"'
              />
            </ul>
          </div>

          {/* Chat mockup */}
          <div
            className="relative overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              borderColor: "var(--color-border-bright)",
              background: "rgba(7,11,24,0.85)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
            }}
          >
            {/* Bot header */}
            <div
              className="flex items-center gap-3 border-b px-5 py-4"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #FFB800 0%, #3B82F6 100%)",
                }}
              >
                <span className="text-base" aria-hidden>🤖</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Evolto AI Assistant
                </p>
                <p className="text-[10px]" style={{ color: "#22C55E" }}>
                  ● Online · отговор &lt; 2 сек
                </p>
              </div>
            </div>

            <div className="space-y-3 p-5">
              {CONVERSATION.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-3"
                    style={
                      msg.role === "user"
                        ? {
                            background:
                              "linear-gradient(135deg, #FFB800 0%, #F59E0B 100%)",
                            color: "#070b18",
                          }
                        : {
                            background: "rgba(59,130,246,0.12)",
                            border: "1px solid rgba(59,130,246,0.25)",
                            color: "var(--color-text-primary)",
                          }
                    }
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    {msg.meta && (
                      <p
                        className="mt-2 text-[10px]"
                        style={{
                          opacity: msg.role === "user" ? 0.6 : 0.5,
                        }}
                      >
                        {msg.meta}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input mock */}
            <div
              className="border-t p-4"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div
                className="flex items-center gap-3 rounded-full border px-4 py-3"
                style={{
                  borderColor: "var(--color-border-bright)",
                  background: "rgba(7,11,24,0.7)",
                }}
              >
                <span className="text-[var(--color-text-tertiary)] text-sm">
                  Напиши съобщение…
                </span>
                <span className="ml-auto text-base" aria-hidden>↗</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatCapability({ icon, title, example }: { icon: string; title: string; example: string }) {
  return (
    <li
      className="rounded-lg border px-5 py-4"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(10,20,41,0.4)",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0" aria-hidden>{icon}</span>
        <div>
          <p className="font-bold text-[var(--color-text-primary)]">{title}</p>
          <p className="mt-1 text-xs italic text-[var(--color-text-tertiary)] md:text-sm">
            {example}
          </p>
        </div>
      </div>
    </li>
  );
}
