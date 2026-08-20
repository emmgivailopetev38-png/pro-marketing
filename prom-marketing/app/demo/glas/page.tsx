import Script from "next/script";

export const metadata = {
  title: "Гласов AI агент · демонстрация | Pro Marketing",
  description: "Чуйте как звучи AI агент, който вдига телефона на български.",
};

/**
 * Публична демо страница за клиентски срещи.
 *
 * Нарочно е ОТДЕЛЕН агент от този в /admin/glas — този няма нито един
 * инструмент и никакъв достъп до CRM-а. Клиент може да го пита каквото
 * поиска, без да стигне до данни на Ивайло.
 */
const DEMO_AGENT_ID = "agent_3601m0fwfrjwey6bgdfrkf1qa5d0";

export default function DemoGlasPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        textAlign: "center",
        background: "#0b0f19",
        color: "#e8ecf5",
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <p style={{ letterSpacing: 2, fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
          ДЕМОНСТРАЦИЯ
        </p>
        <h1 style={{ fontSize: 30, lineHeight: 1.25, fontWeight: 700, marginBottom: 16 }}>
          Така звучи агент, който вдига телефона вместо вас
        </h1>
        <p style={{ opacity: 0.75, lineHeight: 1.7, marginBottom: 28 }}>
          Отсреща е автосервиз. Питайте за цена, за час, за каквото се сетите —
          както бихте се обадили наистина. Говори български и може да бъде прекъсван.
        </p>

        <div
          style={{
            padding: 18,
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            textAlign: "left",
            lineHeight: 1.8,
            fontSize: 15,
          }}
        >
          <strong style={{ display: "block", marginBottom: 8 }}>Опитайте с:</strong>
          <span style={{ opacity: 0.8 }}>
            „Колко струва смяна на масло на Голф 6?“
            <br />
            „Спирачките ми свистят, кога имате свободен час?“
            <br />
            „Работите ли в събота?“
          </span>
        </div>

        <p style={{ marginTop: 28, fontSize: 13, opacity: 0.5, lineHeight: 1.6 }}>
          Автосервиз „Хоризонт“ е измислена фирма. Часовете не се записват никъде —
          това е само демонстрация на разговора.
        </p>
      </div>

      {/* Говорителят се появява като бутон долу вдясно. */}
      <elevenlabs-convai agent-id={DEMO_AGENT_ID}></elevenlabs-convai>
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />
    </main>
  );
}
