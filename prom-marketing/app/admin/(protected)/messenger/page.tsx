import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://promarketing.pw";
const WEBHOOK_URL = `${SITE_URL}/api/webhooks/messenger`;

export default async function MessengerPage() {
  const supabase = createServiceClient();

  const [pagesRes, convRes] = await Promise.all([
    supabase
      .from("meta_pages")
      .select("id, page_id, page_name, status, last_message_at, subscribed_fields, webhook_verify_token, error_message, token_expires_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("chatbot_conversations")
      .select("id, status, qualification_score")
      .eq("channel", "facebook_messenger"),
  ]);

  const pages = (pagesRes.data ?? []) as Array<{
    id: string;
    page_id: string;
    page_name: string;
    status: string;
    last_message_at: string | null;
    subscribed_fields: string[];
    webhook_verify_token: string;
    error_message: string | null;
    token_expires_at: string | null;
  }>;
  const conversations = (convRes.data ?? []) as Array<{
    id: string;
    status: string;
    qualification_score: number | null;
  }>;

  const connected = pages.filter((p) => p.status === "connected");
  const pending = pages.filter((p) => p.status === "pending" || p.status === "error");
  const totalConv = conversations.length;
  const qualified = conversations.filter((c) => c.status === "qualified" || c.status === "converted").length;

  return (
    <ModulePlaceholder
      icon="💬"
      title="Facebook Messenger"
      description="Свържи Facebook Page → чатботът поема разговори от Messenger автоматично. Хора от твоите реклами влизат в DM-а, AI ги квалифицира, при горещ лид → уговаря среща през promarketing.pw/booking."
      status={
        connected.length > 0
          ? { label: `${connected.length} страница свързана · webhook активен`, tone: "ready" }
          : { label: "очаква първа Page свързване", tone: "pending" }
      }
      stats={[
        { label: "Свързани страници", value: connected.length, color: "#1877F2" },
        { label: "Активни разговори", value: conversations.filter((c) => c.status === "open").length, color: "#d9a74a" },
        { label: "Квалифицирани", value: qualified, color: "#35c08c" },
        { label: "Общо разговори", value: totalConv, color: "#9b8ec9" },
      ]}
      primaryAction={{ label: "Виж разговорите", href: "/admin/chatbots?channel=facebook_messenger" }}
      secondaryAction={{ label: "Свържи нова страница", href: "/admin/messenger#connect" }}
      features={[
        {
          icon: "🔌",
          title: "Webhook receiver",
          description: "/api/webhooks/messenger приема signed payloads от Meta. Verify token per page.",
          ready: true,
        },
        {
          icon: "🤖",
          title: "AI отговор",
          description: "Scripted provider отговаря веднага · готово за Hermes (само env var).",
          ready: true,
        },
        {
          icon: "👤",
          title: "Auto-сваляне на профил",
          description: "При първо съобщение — Meta Graph API → име + аватар → CRM.",
          ready: true,
        },
        {
          icon: "🎯",
          title: "Qualification + auto-promote",
          description: "При спомената имейл/телефон → разговорът става контакт в CRM.",
          ready: true,
        },
        {
          icon: "🔐",
          title: "Token refresh (60-дневен)",
          description: "Long-lived Page Access Token. Cron job ще го опреснява преди изтичане.",
          ready: false,
        },
        {
          icon: "📸",
          title: "Image / video поддръжка",
          description: "Засега само текст. Многомедийни — следваща фаза.",
          ready: false,
        },
      ]}
    >
      {/* Connect instructions */}
      <section id="connect" className="rounded-2xl border border-[#1877F2]/30 bg-[#1877F2]/5 p-6">
        <h2 className="mb-4 font-display text-lg font-bold">🔌 Свържи Facebook Page — стъпка по стъпка</h2>
        <ol className="space-y-3 text-sm">
          <Step n={1} title="Meta for Developers app">
            Влез в{" "}
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-cyan-400 underline">
              developers.facebook.com/apps
            </a>{" "}
            → създай (или избери) Business app · добави product „Messenger".
          </Step>
          <Step n={2} title="App credentials в .env">
            Копирай <code className="rounded bg-black/40 px-1 font-mono text-[10px]">App ID</code>,{" "}
            <code className="rounded bg-black/40 px-1 font-mono text-[10px]">App Secret</code> и ги добави като{" "}
            <code className="rounded bg-black/40 px-1 font-mono text-[10px]">META_APP_ID</code>,{" "}
            <code className="rounded bg-black/40 px-1 font-mono text-[10px]">META_APP_SECRET</code> в Vercel.
          </Step>
          <Step n={3} title="Callback URL + Verify Token">
            В Messenger → Settings → Webhooks: <br />
            <span className="mt-1 inline-block rounded bg-black/40 px-2 py-1 font-mono text-[11px] text-cyan-300">
              {WEBHOOK_URL}
            </span>
            <br />
            Verify token = този, който получаваш при „Свържи нова страница" (генерира се per page).
          </Step>
          <Step n={4} title="Subscribe fields">
            Минимум: <code className="font-mono text-[10px]">messages, messaging_postbacks</code>. Опционално:{" "}
            <code className="font-mono text-[10px]">message_deliveries, message_reads</code>.
          </Step>
          <Step n={5} title="Page subscription">
            В Messenger → Settings → Page = избери своята Page → „Generate Access Token". Изпрати ми токена + Page ID през AI co-pilot („свържи Page с ID ... и token ...") и аз ще го запиша в meta_pages.
          </Step>
          <Step n={6} title="Тест">
            Изпрати съобщение към твоята Page от друг профил → чатботът отговаря автоматично. Разговорът се появява в /admin/chatbots?channel=facebook_messenger.
          </Step>
        </ol>
      </section>

      {/* Connected pages */}
      {pages.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
            Регистрирани страници
          </h2>
          <div className="space-y-3">
            {pages.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-4"
              >
                <span className="text-2xl">📘</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{p.page_name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${
                        p.status === "connected"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : p.status === "error"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                    Page ID: {p.page_id}
                  </p>
                  {p.subscribed_fields.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.subscribed_fields.map((f) => (
                        <span
                          key={f}
                          className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-mono text-cyan-300"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 space-y-1 text-[11px] text-[var(--color-text-tertiary)]">
                    <p>
                      Verify token:{" "}
                      <code className="select-all rounded bg-black/40 px-1.5 py-0.5 font-mono text-cyan-400">
                        {p.webhook_verify_token}
                      </code>
                    </p>
                    {p.token_expires_at && (
                      <p>Token изтича: {new Date(p.token_expires_at).toLocaleDateString("bg-BG")}</p>
                    )}
                    {p.last_message_at && (
                      <p>Последно съобщение: {new Date(p.last_message_at).toLocaleString("bg-BG")}</p>
                    )}
                    {p.error_message && <p className="text-red-300">⚠️ {p.error_message}</p>}
                  </div>
                </div>
                <Link
                  href={`/admin/chatbots?channel=facebook_messenger`}
                  className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20"
                >
                  Разговори →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm text-amber-300">
            ⚠️ {pending.length} {pending.length === 1 ? "страница чака" : "страници чакат"} конфигурация. Завърши стъпките по-горе или AI co-pilot ще ти помогне.
          </p>
        </section>
      )}
    </ModulePlaceholder>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-xs font-bold text-white">
        {n}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-[var(--color-text-primary)]">{title}</p>
        <div className="mt-0.5 text-[var(--color-text-secondary)]">{children}</div>
      </div>
    </li>
  );
}
