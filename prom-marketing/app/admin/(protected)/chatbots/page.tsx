import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import {
  CHAT_CHANNELS,
  CHANNEL_LABEL,
  CHANNEL_ICON,
  CHANNEL_COLOR,
  type ChatChannel,
} from "@/lib/chatbot/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  open: "отворен",
  qualified: "квалифициран",
  converted: "клиент",
  abandoned: "изоставен",
  closed: "затворен",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  qualified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  converted: "bg-emerald-500/25 text-emerald-200 border-emerald-500/50",
  abandoned: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  closed: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export default async function ChatbotsPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; status?: string }>;
}) {
  const params = await searchParams;
  const channelFilter = (params.channel ?? "all") as ChatChannel | "all";
  const statusFilter = params.status ?? "all";

  const supabase = createServiceClient();
  const [convRes, knowRes, msgCountRes] = await Promise.all([
    supabase
      .from("chatbot_conversations")
      .select("id, scope, channel, status, qualification_score, visitor_name, visitor_email, visitor_phone, source_url, started_at, last_message_at, contact_id")
      .order("last_message_at", { ascending: false })
      .limit(200),
    supabase.from("chatbot_knowledge").select("id, scope, enabled"),
    supabase.from("chatbot_messages").select("id", { count: "exact", head: true }),
  ]);

  const all = (convRes.data ?? []) as Array<{
    id: string;
    scope: string;
    channel: ChatChannel;
    status: string;
    qualification_score: number | null;
    visitor_name: string | null;
    visitor_email: string | null;
    visitor_phone: string | null;
    source_url: string | null;
    started_at: string;
    last_message_at: string;
    contact_id: string | null;
  }>;

  // Apply filters in-memory (small dataset; no need for separate queries).
  const conversations = all.filter((c) => {
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const knowledge = (knowRes.data ?? []) as Array<{ id: string; scope: string; enabled: boolean }>;
  const totalMessages = msgCountRes.count ?? 0;

  // Channel + status counters (computed once over the full set).
  const channelCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  for (const c of all) {
    channelCounts.set(c.channel, (channelCounts.get(c.channel) ?? 0) + 1);
    statusCounts.set(c.status, (statusCounts.get(c.status) ?? 0) + 1);
  }

  const qualified = all.filter((c) => c.status === "qualified" || c.status === "converted").length;
  const converted = all.filter((c) => c.status === "converted").length;
  const open = all.filter((c) => c.status === "open").length;
  const conversionRate = all.length > 0 ? Math.round((converted / all.length) * 100) : 0;

  return (
    <div className="space-y-6 p-6 md:p-10">
      {/* Header */}
      <header className="cc-panel cc-panel-accent overflow-hidden flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <p className="hud text-[var(--color-accent-cyan)]">AI чатботове · всички канали</p>
          <h1 className="cc-title mt-2 font-display text-3xl font-bold">Чатботове</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Виж кой пише, откъде, кога и какво е казал. AI отговаря, ти одобряваш.
          </p>
        </div>
        <Link href="/admin/chatbots#knowledge" className="cc-btn cc-btn-primary">
          + Управление на знания · {knowledge.length}
        </Link>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Активни разговори" value={open} color="#06b6d4" />
        <Stat label="Квалифицирани" value={qualified} color="#22c55e" />
        <Stat label="Превърнати в клиенти" value={converted} color="#facc15" hint={`${conversionRate}% conversion`} />
        <Stat label="Общо съобщения" value={totalMessages} color="#a78bfa" />
      </section>

      {/* Channel filter chips */}
      <section>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          Филтър по канал
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip href="/admin/chatbots" active={channelFilter === "all"} label="Всички" count={all.length} color="#06b6d4" icon="📊" />
          {CHAT_CHANNELS.map((ch) => (
            <FilterChip
              key={ch}
              href={`/admin/chatbots?channel=${ch}${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`}
              active={channelFilter === ch}
              label={CHANNEL_LABEL[ch]}
              count={channelCounts.get(ch) ?? 0}
              color={CHANNEL_COLOR[ch]}
              icon={CHANNEL_ICON[ch]}
            />
          ))}
        </div>
      </section>

      {/* Status filter chips */}
      <section>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          Филтър по статус
        </p>
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "qualified", "converted", "abandoned", "closed"] as const).map((s) => (
            <Link
              key={s}
              href={`/admin/chatbots?${channelFilter !== "all" ? `channel=${channelFilter}&` : ""}status=${s}`}
              className={`rounded-full border px-3 py-1 text-[11px] transition ${
                statusFilter === s
                  ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                  : "border-white/10 bg-black/20 text-[var(--color-text-tertiary)] hover:border-cyan-500/30"
              }`}
            >
              {s === "all" ? "Всички" : STATUS_LABEL[s] ?? s} · {s === "all" ? all.length : statusCounts.get(s) ?? 0}
            </Link>
          ))}
        </div>
      </section>

      {/* Conversations list */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          Разговори · {conversations.length}
          {channelFilter !== "all" && ` · ${CHANNEL_LABEL[channelFilter as ChatChannel]}`}
        </h2>
        {conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/20 p-12 text-center">
            <span className="text-4xl">💬</span>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              {channelFilter === "all"
                ? "Все още няма разговори. Когато сайт чатботът или Instagram/WhatsApp интеграциите заработят, ще видиш всичко тук."
                : `Няма разговори в ${CHANNEL_LABEL[channelFilter as ChatChannel]} канала засега.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/admin/chatbots/${c.id}`}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-3 transition hover:border-[var(--color-accent-cyan)]/40"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                  style={{ background: `${CHANNEL_COLOR[c.channel]}25`, color: CHANNEL_COLOR[c.channel] }}
                  title={CHANNEL_LABEL[c.channel]}
                >
                  {CHANNEL_ICON[c.channel]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {c.visitor_name ?? c.visitor_email ?? "Анонимен посетител"}
                    </p>
                    {c.qualification_score != null && c.qualification_score > 0 && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-mono"
                        style={{
                          background: c.qualification_score >= 60 ? "#22c55e20" : "#facc1520",
                          color: c.qualification_score >= 60 ? "#22c55e" : "#facc15",
                        }}
                      >
                        {c.qualification_score}/100
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-[var(--color-text-tertiary)]">
                    {CHANNEL_LABEL[c.channel]} ·{" "}
                    {c.visitor_email ? c.visitor_email : c.visitor_phone ? c.visitor_phone : "няма контакт"}
                  </p>
                </div>
                {c.contact_id && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                    в CRM
                  </span>
                )}
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  {new Date(c.last_message_at).toLocaleString("bg-BG", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${STATUS_TONE[c.status] ?? STATUS_TONE.open}`}
                >
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Knowledge base preview */}
      <section id="knowledge" className="cc-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">🧠 База знания на чатбота</h2>
          <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
            {knowledge.filter((k) => k.enabled).length} активни от {knowledge.length}
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Тук AI чете преди да отговори. Когато добавиш нов въпрос/отговор, го виждаш в разговорите.
          Управление чрез AI co-pilot (долен десен ъгъл): „добави FAQ: ..."
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, color, hint }: { label: string; value: number; color: string; hint?: string }) {
  return (
    <div className="cc-kpi p-4">
      <p className="hud">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      {hint && <p className="text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
  color,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  color: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-white/30 bg-white/[0.06] text-[var(--color-text-primary)]"
          : "border-white/10 bg-black/20 text-[var(--color-text-secondary)] hover:border-white/20"
      }`}
      style={active ? { boxShadow: `0 0 0 1px ${color}40, 0 0 16px ${color}20` } : undefined}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span className="font-mono text-[10px]" style={{ color: active ? color : "var(--color-text-tertiary)" }}>
        {count}
      </span>
    </Link>
  );
}
