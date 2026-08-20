import { VoiceButton } from "@/components/admin/VoiceButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Гласово демо · ProMarketing" };

/**
 * Гласовото демо живее ВЪТРЕ в CRM-а нарочно.
 *
 * Първо беше публична страница на /demo/glas, но публичен агент значи, че
 * всеки с линка може да говори и да изяде включените 275 минути месечно.
 * Сега достъпът минава през админ бисквитката, а агентът е частен — в кода
 * на страницата няма agent-id, само подписан адрес, който живее минути.
 *
 * Ползване: отваряш това на телефона си (вече си влязъл) и подаваш телефона.
 */
export default function GlasovoDemoPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Гласово демо за клиенти</h1>
      <p style={{ opacity: 0.75, marginBottom: 24, lineHeight: 1.6 }}>
        Натисни и подай телефона на клиента. Отсреща е измислен автосервиз — агентът
        отговаря за цени, свободни часове и работно време.{" "}
        <strong>Няма достъп до твоите данни.</strong>
      </p>

      <VoiceButton agent="demo" label="Пусни демото" />

      <div
        style={{
          marginTop: 32,
          padding: 18,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          lineHeight: 1.8,
        }}
      >
        <strong style={{ display: "block", marginBottom: 10 }}>Кажи на клиента да пробва с</strong>
        <div style={{ opacity: 0.8 }}>
          „Колко струва смяна на масло на Голф 6?“
          <br />
          „Спирачките ми свистят, кога имате свободен час?“
          <br />
          „Работите ли в събота?“
        </div>

        <strong style={{ display: "block", marginTop: 18, marginBottom: 10 }}>Козът</strong>
        <div style={{ opacity: 0.8 }}>
          Прекъсни го насред изречение. Спира и слуша — точно както човек.
          Това впечатлява повече от всичко останало.
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, opacity: 0.55, lineHeight: 1.6 }}>
        Всяка минута се брои от плана ти в ElevenLabs — включени са 275 месечно.
        Затова страницата е тук, зад входа, а не публична.
      </p>
    </div>
  );
}
