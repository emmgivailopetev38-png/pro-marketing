import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { STAGE_COLOR, STAGE_LABEL, type ContactRow } from "@/lib/contacts/types";

export const dynamic = "force-dynamic";

interface ContactWithMeta extends ContactRow {
  total_activities?: number;
}

export default async function NewLeadsPage() {
  const supabase = createServiceClient();
  const nowMs = new Date().getTime();

  // Всички лидове създадени в последните 7 дни
  const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("contacts")
    .select("*")
    .gte("created_at", sevenDaysAgo)
    .neq("stage", "lost")
    .order("created_at", { ascending: false });

  const leads = (rows ?? []) as ContactRow[];
  const ids = leads.map((c) => c.id);

  // Activity counts
  const { data: actsRaw } = ids.length
    ? await supabase
        .from("contact_activities")
        .select("contact_id")
        .in("contact_id", ids)
    : { data: [] };

  const counts = new Map<string, number>();
  for (const a of (actsRaw ?? []) as Array<{ contact_id: string }>) {
    counts.set(a.contact_id, (counts.get(a.contact_id) ?? 0) + 1);
  }

  const enriched: ContactWithMeta[] = leads.map((c) => ({
    ...c,
    total_activities: counts.get(c.id) ?? 0,
  }));

  // Категории по време
  const now = nowMs;
  const dayMs = 24 * 60 * 60 * 1000;
  const today = enriched.filter((c) => now - new Date(c.created_at).getTime() < dayMs);
  const last3days = enriched.filter((c) => {
    const age = now - new Date(c.created_at).getTime();
    return age >= dayMs && age < 3 * dayMs;
  });
  const last7days = enriched.filter((c) => {
    const age = now - new Date(c.created_at).getTime();
    return age >= 3 * dayMs && age < 7 * dayMs;
  });

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[#facc15]">
            Нови контакти · последните 7 дни
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">🆕 Нови лидове</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Прясно влезли контакти, които още не са обработени или са в начален stage
          </p>
        </div>
        <div className="rounded-lg border border-[#facc15]/30 bg-[#facc15]/5 px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#facc15]">Общо за 7 дни</p>
          <p className="text-2xl font-bold text-[#facc15]">{enriched.length}</p>
        </div>
      </header>

      {today.length > 0 && (
        <Section title="🔥 Днес" count={today.length} color="#facc15" leads={today} />
      )}
      {last3days.length > 0 && (
        <Section title="📅 Последни 3 дни" count={last3days.length} color="#a78bfa" leads={last3days} />
      )}
      {last7days.length > 0 && (
        <Section title="📆 Тази седмица" count={last7days.length} color="#7da8cc" leads={last7days} />
      )}
      {enriched.length === 0 && (
        <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-12 text-center text-sm text-[var(--color-text-tertiary)]">
          Няма нови лидове за последните 7 дни.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  color,
  leads,
}: {
  title: string;
  count: number;
  color: string;
  leads: ContactWithMeta[];
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.3em]" style={{ color }}>
        {title}
        <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${color}22`, color }}>
          {count}
        </span>
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {leads.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${c.id}`}
            className="block rounded-lg border-2 p-4 transition-colors"
            style={{
              borderColor: `${color}30`,
              background: `${color}05`,
            }}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[var(--color-text-primary)]">
                    {c.full_name || c.email || "—"}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      background: `${STAGE_COLOR[c.stage]}22`,
                      color: STAGE_COLOR[c.stage],
                    }}
                  >
                    {STAGE_LABEL[c.stage]}
                  </span>
                </div>
                {c.company && (
                  <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{c.company}</p>
                )}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ color }}>
                {formatRelative(c.created_at)}
              </span>
            </div>

            <div className="mb-2 flex flex-wrap gap-3 text-[11px]">
              {c.email && (
                <span className="font-mono text-[var(--color-text-secondary)]">📧 {c.email}</span>
              )}
              {c.phone && (
                <span className="font-mono text-[var(--color-text-secondary)]">📞 {c.phone}</span>
              )}
            </div>

            {c.notes && (
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {c.notes}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--color-text-tertiary)]">
              <span className="font-mono uppercase tracking-wider">
                {sourceLabel(c.source)} · 📊 {c.total_activities ?? 0}
              </span>
              {c.next_followup_at && (
                <span className="font-mono text-[#22c55e]">
                  ⏰ {formatFollowup(c.next_followup_at)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 60) return `преди ${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `преди ${hours} ч`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  if (days < 7) return `преди ${days} дни`;
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short" });
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

function sourceLabel(s: string): string {
  const map: Record<string, string> = {
    meta_lead: "📥 Meta",
    website_form: "🌐 Уебсайт",
    cal_booking: "📅 Cal.com",
    email: "✉️ Имейл",
    manual: "✋ Ръчно",
  };
  return map[s] ?? s;
}
