import { createServiceClient } from "@/lib/supabase/service";
import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage() {
  const supabase = createServiceClient();
  const [accountsRes, convRes] = await Promise.all([
    supabase.from("whatsapp_accounts").select("id, phone_number, display_name, status"),
    supabase
      .from("whatsapp_conversations")
      .select("id, customer_phone, customer_name, status, unread_count, last_message_at")
      .order("last_message_at", { ascending: false })
      .limit(20),
  ]);

  const accounts = (accountsRes.data ?? []) as Array<{
    id: string;
    phone_number: string;
    display_name: string;
    status: string;
  }>;
  const conversations = (convRes.data ?? []) as Array<{
    id: string;
    customer_phone: string;
    customer_name: string | null;
    status: string;
    unread_count: number;
    last_message_at: string;
  }>;

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  return (
    <ModulePlaceholder
      icon="💚"
      title="WhatsApp Business"
      description="Централизиран inbox за WhatsApp Business Cloud API. Приемай съобщения, отговаряй с шаблони, синхронизирай с CRM. Изисква WhatsApp Business Account верификация (1-2 седмици)."
      status={
        accounts.some((a) => a.status === "connected")
          ? { label: `номер свързан · ${accounts[0]?.phone_number}`, tone: "ready" }
          : { label: "очаква верификация на бизнес номер", tone: "pending" }
      }
      stats={[
        { label: "Свързани номера", value: accounts.filter((a) => a.status === "connected").length, color: "#35c08c" },
        { label: "Активни разговори", value: conversations.filter((c) => c.status === "open").length, color: "#d9a74a" },
        { label: "Непрочетени", value: totalUnread, color: totalUnread > 0 ? "#e2574e" : "#9b8ec9" },
        { label: "Архивирани", value: conversations.filter((c) => c.status === "closed").length, color: "#e5c069" },
      ]}
      primaryAction={{ label: "Свържи WhatsApp номер", href: "/admin/whatsapp#connect" }}
      features={[
        {
          icon: "📱",
          title: "WhatsApp Cloud API · Meta",
          description: "Бизнес номер регистриран през Meta Business Manager. Webhook за входящи + Send Messages API за изходящи.",
          ready: false,
        },
        {
          icon: "📥",
          title: "Inbox изглед",
          description: "Левa колонка — всички разговори, средна — chat, дясна — клиент данни от CRM. Snooze, label, asignee.",
          ready: false,
        },
        {
          icon: "📋",
          title: "Message templates",
          description: "Pre-approved Meta templates за outbound съобщения извън 24ч прозорец. Variables за персонализация.",
          ready: false,
        },
        {
          icon: "🤖",
          title: "Auto-reply rules",
          description: "Прости keyword тригери ('цена' → праща оферта) и AI fallback с Hermes за по-сложни въпроси.",
          ready: false,
        },
        {
          icon: "👤",
          title: "Auto-link към CRM",
          description: "При нов разговор от непознат номер — създава Contact автоматично. Прикача всеки разговор като activity.",
          ready: false,
        },
        {
          icon: "📞",
          title: "Voice → текст транскрипция",
          description: "WhatsApp audio messages → транскрипция чрез Whisper. Не пропускаш съдържание дори при гласови.",
          ready: false,
        },
      ]}
    >
      {conversations.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Последни разговори
          </h2>
          <div className="space-y-2">
            {conversations.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-3"
              >
                <span className="text-lg">💬</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{c.customer_name ?? c.customer_phone}</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">{c.customer_phone}</p>
                </div>
                {c.unread_count > 0 && (
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-mono font-bold text-black">
                    {c.unread_count}
                  </span>
                )}
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  {new Date(c.last_message_at).toLocaleString("bg-BG")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </ModulePlaceholder>
  );
}
