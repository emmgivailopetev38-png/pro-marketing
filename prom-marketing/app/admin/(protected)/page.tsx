import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import {
  CONTACT_STAGES,
  STAGE_COLOR,
  STAGE_LABEL,
  type ContactRow,
  type ContactStage,
} from "@/lib/contacts/types";

export const dynamic = "force-dynamic";

interface ContactWithActivity extends ContactRow {
  last_activity_at?: string | null;
  last_activity_title?: string | null;
  total_activities?: number;
  total_files?: number;
}

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  // Fetch all non-lost contacts + their last activity + file count
  const { data: contactsRaw } = await supabase
    .from("contacts")
    .select("*")
    .neq("stage", "lost")
    .order("updated_at", { ascending: false });

  const contacts = (contactsRaw ?? []) as ContactRow[];
  const ids = contacts.map((c) => c.id);

  // Fetch last activity per contact + file counts in parallel
  const [activitiesRes, filesRes] = await Promise.all([
    ids.length > 0
      ? supabase
          .from("contact_activities")
          .select("contact_id, title, occurred_at, activity_type")
          .in("contact_id", ids)
          .order("occurred_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    ids.length > 0
      ? supabase
          .from("contact_files")
          .select("contact_id")
          .in("contact_id", ids)
      : Promise.resolve({ data: [] }),
  ]);

  const lastActivityByContact = new Map<string, { title: string; occurred_at: string; type: string }>();
  const activityCountByContact = new Map<string, number>();
  for (const a of (activitiesRes.data ?? []) as Array<{
    contact_id: string;
    title: string;
    occurred_at: string;
    activity_type: string;
  }>) {
    activityCountByContact.set(a.contact_id, (activityCountByContact.get(a.contact_id) ?? 0) + 1);
    if (!lastActivityByContact.has(a.contact_id)) {
      lastActivityByContact.set(a.contact_id, {
        title: a.title,
        occurred_at: a.occurred_at,
        type: a.activity_type,
      });
    }
  }

  const fileCountByContact = new Map<string, number>();
  for (const f of (filesRes.data ?? []) as Array<{ contact_id: string }>) {
    fileCountByContact.set(f.contact_id, (fileCountByContact.get(f.contact_id) ?? 0) + 1);
  }

  const enriched: ContactWithActivity[] = contacts.map((c) => {
    const la = lastActivityByContact.get(c.id);
    return {
      ...c,
      last_activity_at: la?.occurred_at ?? null,
      last_activity_title: la?.title ?? null,
      total_activities: activityCountByContact.get(c.id) ?? 0,
      total_files: fileCountByContact.get(c.id) ?? 0,
    };
  });

  // Group by stage
  const byStage = new Map<ContactStage, ContactWithActivity[]>();
  for (const s of CONTACT_STAGES) byStage.set(s, []);
  for (const c of enriched) {
    if (c.stage !== "lost") byStage.get(c.stage)?.push(c);
  }

  // Quick stats
  const now = Date.now();
  const upcomingFollowups = enriched
    .filter((c) => c.next_followup_at && new Date(c.next_followup_at).getTime() > now - 24 * 3600 * 1000)
    .sort((a, b) => new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime());

  const overdueFollowups = enriched.filter(
    (c) => c.next_followup_at && new Date(c.next_followup_at).getTime() < now - 24 * 3600 * 1000
  );

  // Приоритет: най-близо до сделка отляво → леад отдясно
  const stagesToShow: ContactStage[] = [
    "won",
    "negotiating",
    "offer_sent",
    "presentation_sent",
    "discovery",
    "contacted",
    "lead",
  ];

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold">Преглед на CRM</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Всички активни клиенти и до какъв етап са стигнали — бърз поглед за 30 секунди
        </p>
      </header>

      {/* Top stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Активни клиенти"
          value={enriched.length}
          hint={`от ${contacts.length} общо`}
          color="#06b6d4"
        />
        <StatCard
          label="Оферти + презентации"
          value={(byStage.get("offer_sent")?.length ?? 0) + (byStage.get("presentation_sent")?.length ?? 0) + (byStage.get("negotiating")?.length ?? 0)}
          hint={`${byStage.get("offer_sent")?.length ?? 0} оферти + ${byStage.get("presentation_sent")?.length ?? 0} презентации`}
          color="#FFB800"
        />
        <StatCard
          label="Предстоящи срещи"
          value={upcomingFollowups.length}
          hint="следващите дни"
          color="#22c55e"
        />
        <StatCard
          label="Просрочени follow-up"
          value={overdueFollowups.length}
          hint="спешно действие"
          color={overdueFollowups.length > 0 ? "#ef4444" : "#7da8cc"}
        />
      </div>

      {/* Upcoming follow-ups alert */}
      {upcomingFollowups.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
            🔔 Предстоящи срещи / разговори
          </h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {upcomingFollowups.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/admin/clients/${c.id}`}
                className="rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/5 p-3 transition-colors hover:border-[#22c55e]"
              >
                <p className="text-xs font-mono uppercase tracking-wider text-[#22c55e]">
                  {formatFollowup(c.next_followup_at!)}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                  {c.full_name || c.email || "—"}
                </p>
                {c.company && (
                  <p className="text-xs text-[var(--color-text-tertiary)]">{c.company}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Overdue alert */}
      {overdueFollowups.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[#ef4444]">
            ⚠️ Просрочени · нужно действие
          </h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {overdueFollowups.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/admin/clients/${c.id}`}
                className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/5 p-3 transition-colors hover:border-[#ef4444]"
              >
                <p className="text-xs font-mono uppercase tracking-wider text-[#ef4444]">
                  {formatFollowup(c.next_followup_at!)}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                  {c.full_name || c.email || "—"}
                </p>
                {c.company && (
                  <p className="text-xs text-[var(--color-text-tertiary)]">{c.company}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Pipeline columns */}
      <section>
        <h2 className="mb-4 font-display text-xl font-bold">
          🚀 Pipeline · {enriched.length} активни клиенти
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          {stagesToShow.map((s) => {
            const items = byStage.get(s) ?? [];
            return (
              <div
                key={s}
                className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: STAGE_COLOR[s] }}
                  >
                    {STAGE_LABEL[s]}
                  </h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-mono"
                    style={{
                      background: `${STAGE_COLOR[s]}1a`,
                      color: STAGE_COLOR[s],
                    }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <ClientCard key={c.id} contact={c} />
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-md border border-dashed border-[var(--color-border-default)] p-3 text-center text-[10px] text-[var(--color-text-tertiary)]">
                      Празно
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/clients"
          className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-5 transition-colors hover:border-[var(--color-accent-cyan)]"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Преглед
          </p>
          <p className="mt-1 text-lg font-bold">📋 Всички клиенти</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Пълен списък с филтри и търсене
          </p>
        </Link>
        <Link
          href="/admin/leads"
          className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-5 transition-colors hover:border-[var(--color-accent-cyan)]"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Източници
          </p>
          <p className="mt-1 text-lg font-bold">📥 Meta лидове</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Внасяне на лидове от Facebook кампании
          </p>
        </Link>
        <Link
          href="/admin/email"
          className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-5 transition-colors hover:border-[var(--color-accent-cyan)]"
        >
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Изпращане
          </p>
          <p className="mt-1 text-lg font-bold">✉️ Имейли</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Прати персонален имейл към клиент
          </p>
        </Link>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: number;
  hint: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(13,18,33,0.4)",
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{hint}</p>
    </div>
  );
}

function ClientCard({ contact: c }: { contact: ContactWithActivity }) {
  return (
    <Link
      href={`/admin/clients/${c.id}`}
      className="block rounded-md border border-[var(--color-border-default)] bg-black/30 p-3 transition-colors hover:border-[var(--color-accent-cyan)]"
    >
      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
        {c.full_name || c.email || "—"}
      </p>
      {c.company && (
        <p className="truncate text-[10px] text-[var(--color-text-tertiary)]">{c.company}</p>
      )}
      {c.last_activity_title && (
        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[var(--color-text-secondary)]">
          {c.last_activity_title}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-text-tertiary)]">
        {(c.total_files ?? 0) > 0 && (
          <span title={`${c.total_files} файла в архива`}>📎 {c.total_files}</span>
        )}
        {(c.total_activities ?? 0) > 0 && (
          <span title={`${c.total_activities} активности`}>📊 {c.total_activities}</span>
        )}
        {c.last_activity_at && (
          <span className="ml-auto truncate">
            {formatRelative(c.last_activity_at)}
          </span>
        )}
      </div>
    </Link>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours === 0) return "току що";
    return `${hours}ч`;
  }
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дни`;
  if (days < 30) return `${Math.floor(days / 7)} седм.`;
  return `${Math.floor(days / 30)} мес.`;
}

function formatFollowup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const time = d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Днес ${time}`;
  if (diff === 1) return `Утре ${time}`;
  if (diff === -1) return `Вчера ${time}`;
  if (diff < 0) return `Преди ${Math.abs(diff)} дни`;
  return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "short" }) + " " + time;
}
