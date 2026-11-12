import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { chunks } from "@/lib/array";
import { ASSIGN_TYPE } from "@/lib/team/queue-rules";
import { isManualGive, isSplitToIvailo } from "@/lib/team/ivailo-rules";
import { ELI_TYPES, summarizeEli, type EliRow } from "@/lib/team/eli-rules";
import { SPLIT_FROM } from "@/lib/team/split-rules";
import { GROUPS, classifyLead, type ActRow, type BookingLite, type MoiNoviGroup } from "@/lib/team/moi-novi-rules";

export const dynamic = "force-dynamic";

/**
 * „🆕 Моите нови“ — само новите лийдове на Ивайло от 50/50 (lib/team/split-rules.ts),
 * подредени по това какво трябва да направи той. Георги тази страница не я вижда
 * (той няма /admin) и тези хора не излизат в неговия /ekip.
 */

interface Lead {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  business: string | null;
  source: string | null;
  stage: string | null;
  created_at: string;
  next_followup_at: string | null;
}

const COLORS: Record<MoiNoviGroup, string> = {
  eli_talked: "#f97316",
  eli_no_answer: "#e5c069",
  not_called: "#22d3ee",
  meeting: "#4ade80",
  done: "#879cba",
};

const FMT = new Intl.DateTimeFormat("bg-BG", {
  timeZone: "Europe/Sofia",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const fmt = (iso: string) => FMT.format(new Date(iso));

function ago(iso: string, now: Date): string {
  const h = Math.round((now.getTime() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "току-що";
  if (h < 24) return `преди ${h} ч`;
  const d = Math.round(h / 24);
  return d === 1 ? "вчера" : `преди ${d} дни`;
}

const SOURCE: Record<string, string> = {
  meta_lead: "Meta реклама",
  website_form: "формата на сайта",
  cal_booking: "календара на сайта",
  voice_agent: "Ели",
  voice_phone: "обаждане",
};

export default async function MoiNoviPage() {
  const sb = createServiceClient();
  const now = new Date();

  // 1) Кои са негови: следата „👤 Води: Ивайло“ (split) и после НЕ е дал човека на екипа.
  const { data: marks } = await sb
    .from("contact_activities")
    .select("contact_id, occurred_at, metadata")
    .eq("activity_type", ASSIGN_TYPE)
    .eq("metadata->>split", "true")
    .gte("occurred_at", SPLIT_FROM)
    .order("occurred_at", { ascending: false })
    .limit(1000);
  const markAt = new Map<string, string>();
  for (const m of (marks ?? []) as Array<{ contact_id: string; occurred_at: string; metadata: Record<string, unknown> | null }>) {
    if (!isSplitToIvailo({ activity_type: ASSIGN_TYPE, metadata: m.metadata })) continue;
    if (!markAt.has(m.contact_id)) markAt.set(m.contact_id, m.occurred_at);
  }
  let ids = [...markAt.keys()];

  const assigns: ActRow[] = [];
  const eliRows: ActRow[] = [];
  const calls: ActRow[] = [];
  const leads: Lead[] = [];
  for (const part of chunks(ids, 100)) {
    const [a, e, c, l] = await Promise.all([
      sb.from("contact_activities").select("contact_id, activity_type, occurred_at, metadata").in("contact_id", part).eq("activity_type", ASSIGN_TYPE).limit(1000),
      sb
        .from("contact_activities")
        .select("contact_id, activity_type, occurred_at, metadata")
        .in("contact_id", part)
        .in("activity_type", [...ELI_TYPES])
        .order("occurred_at", { ascending: false })
        .limit(1000),
      sb
        .from("contact_activities")
        .select("contact_id, activity_type, title, occurred_at, created_by, metadata")
        .in("contact_id", part)
        .eq("activity_type", "call")
        .order("occurred_at", { ascending: false })
        .limit(1000),
      sb
        .from("contacts")
        .select("id, full_name, phone, email, company, business, source, stage, created_at, next_followup_at")
        .in("id", part),
    ]);
    assigns.push(...((a.data ?? []) as ActRow[]));
    eliRows.push(...((e.data ?? []) as ActRow[]));
    calls.push(...((c.data ?? []) as ActRow[]));
    leads.push(...((l.data ?? []) as Lead[]));
  }

  // Даден после на екипа с „🤝 Дай на екипа“ → вече не е тук.
  const givenBack = new Set(
    assigns.filter((r) => isManualGive(r) && r.occurred_at > (markAt.get(r.contact_id) ?? "")).map((r) => r.contact_id)
  );
  ids = ids.filter((id) => !givenBack.has(id));

  const { data: bookingRows } = await sb
    .from("bookings")
    .select("id, status, scheduled_at, attendee_email, attendee_phone")
    .gte("scheduled_at", "2026-11-01T00:00:00Z")
    .order("scheduled_at", { ascending: true })
    .limit(1000);
  const bookings = (bookingRows ?? []) as BookingLite[];

  const eliInfo = summarizeEli(eliRows as EliRow[]);
  const eliBy = new Map<string, ActRow[]>();
  for (const r of eliRows) eliBy.set(r.contact_id, [...(eliBy.get(r.contact_id) ?? []), r]);
  const lastCall = new Map<string, ActRow>();
  for (const r of calls) if (r.created_by !== "voice_reception" && !lastCall.has(r.contact_id)) lastCall.set(r.contact_id, r);

  const byId = new Map(leads.map((l) => [l.id, l]));
  const grouped = new Map<MoiNoviGroup, Array<{ lead: Lead; meetingAt: string | null }>>();
  for (const id of ids) {
    const lead = byId.get(id);
    if (!lead) continue;
    const { group, meetingAt } = classifyLead(lead, eliBy.get(id) ?? [], bookings, now);
    grouped.set(group, [...(grouped.get(group) ?? []), { lead, meetingAt }]);
  }
  for (const [g, list] of grouped) {
    list.sort((a, b) =>
      g === "meeting" ? (a.meetingAt ?? "").localeCompare(b.meetingAt ?? "") : b.lead.created_at.localeCompare(a.lead.created_at)
    );
  }

  const open = ids.length - (grouped.get("done")?.length ?? 0);
  const toCall = (grouped.get("eli_talked")?.length ?? 0) + (grouped.get("eli_no_answer")?.length ?? 0);

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent flex flex-wrap items-center justify-between gap-4 overflow-hidden p-6">
          <div>
            <p className="hud text-[var(--color-accent-cyan)]">Само твоите · 50/50 от рекламата</p>
            <h1 className="cc-title mt-2 font-display text-4xl font-bold">🆕 Моите нови</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
              Всеки втори нов лийд е твой. Георги не ги вижда. Срещите им влизат в твоя календар — пон–чт 12–18.
            </p>
          </div>
          <div className="flex gap-3">
            <Stat label="Звънни ти" value={toCall} color="#f97316" />
            <Stat label="Отворени" value={open} color="#22d3ee" />
          </div>
        </header>

        {ids.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-12 text-center text-sm text-[var(--color-text-tertiary)]">
            Още няма твои нови. Разделянето тръгна на 12.11.2026 — всеки втори нов лийд от рекламата идва тук.
          </p>
        )}

        {GROUPS.map((g) => {
          const list = grouped.get(g.key) ?? [];
          if (list.length === 0) return null;
          const color = COLORS[g.key];
          const body = (
            <div className="grid gap-3 md:grid-cols-2">
              {list.map(({ lead, meetingAt }) => {
                const eli = eliInfo.get(lead.id);
                const call = lastCall.get(lead.id);
                const digits = (lead.phone ?? "").replace(/[^\d+]/g, "");
                return (
                  <div
                    key={lead.id}
                    className="rounded-lg border-2 p-4"
                    style={{ borderColor: `${color}40`, background: `${color}08` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--color-text-primary)]">{lead.full_name || lead.email || "—"}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                          {[lead.business || lead.company, SOURCE[lead.source ?? ""] ?? lead.source, ago(lead.created_at, now)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      {digits && (
                        <a
                          href={`tel:${digits}`}
                          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-[#030308]"
                          style={{ background: color }}
                        >
                          📞 {lead.phone}
                        </a>
                      )}
                    </div>
                    {meetingAt && (
                      <p className="mt-2 text-sm font-semibold" style={{ color }}>
                        📅 {g.key === "meeting" ? "Среща" : "Беше"}: {fmt(meetingAt)}
                      </p>
                    )}
                    {eli && <p className="mt-2 text-sm text-[#c4b5fd]">{eli.line}</p>}
                    {eli?.summary && (
                      <p className="mt-1 rounded bg-black/20 p-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                        💬 {eli.summary}
                      </p>
                    )}
                    {call && (
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                        ☎️ Ти: {call.title ?? "обаждане"} · {fmt(call.occurred_at)}
                      </p>
                    )}
                    {lead.next_followup_at && g.key !== "meeting" && g.key !== "done" && (
                      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">⏰ Да го чуеш: {fmt(lead.next_followup_at)}</p>
                    )}
                    <Link href={`/admin/clients/${lead.id}`} className="mt-3 inline-block text-xs font-semibold" style={{ color }}>
                      Отвори картона →
                    </Link>
                  </div>
                );
              })}
            </div>
          );
          return (
            <section key={g.key}>
              {g.key === "done" ? (
                <details>
                  <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.25em]" style={{ color }}>
                    {g.title} · {list.length}
                  </summary>
                  <div className="mt-4">{body}</div>
                </details>
              ) : (
                <>
                  <h2 className="flex flex-wrap items-baseline gap-3 font-display text-lg font-bold" style={{ color }}>
                    {g.title}
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: `${color}22` }}>
                      {list.length}
                    </span>
                  </h2>
                  <p className="mb-3 mt-1 text-xs text-[var(--color-text-tertiary)]">{g.hint}</p>
                  {body}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border px-4 py-3 text-center" style={{ borderColor: `${color}55`, background: `${color}0d` }}>
      <p className="text-[10px] uppercase tracking-wider" style={{ color }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
