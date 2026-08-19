import { VoiceButton } from "@/components/admin/VoiceButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Глас · ProMarketing" };

export default function GlasPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Говори с агента</h1>
      <p style={{ opacity: 0.75, marginBottom: 24, lineHeight: 1.6 }}>
        Натисни и питай на глас. Разбира български. Знае днешните ти срещи, кой чака отговор,
        кой не е платил и какво е влязло като лийд.
      </p>

      <VoiceButton />

      <div
        style={{
          marginTop: 32,
          padding: 18,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          lineHeight: 1.7,
        }}
      >
        <strong style={{ display: "block", marginBottom: 10 }}>Какво можеш да го питаш</strong>
        <div style={{ opacity: 0.8 }}>
          „Какво става днес?“ · „Намери ми Панчев“ · „Кой не е платил?“
          <br />
          „Запиши, че говорих с Иван и да го потърся другата седмица“
        </div>

        <strong style={{ display: "block", marginTop: 18, marginBottom: 10 }}>Какво няма да направи</strong>
        <div style={{ opacity: 0.8 }}>
          Няма да прати имейл, да пусне реклама или да изтрие нещо. Такива неща само ги записва
          и ги слага в <a href="/admin/manual-review">Ръчна проверка</a> за твое одобрение —
          и ти пише в Telegram.
        </div>
      </div>
    </div>
  );
}
