"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ACTIVITY_ICON,
  ACTIVITY_LABEL,
  CONTACT_STAGES,
  STAGE_COLOR,
  STAGE_LABEL,
  type ActivityRow,
  type ContactRow,
  type ContactStage,
} from "@/lib/contacts/types";
import {
  addActivityAction,
  updateContactFieldsAction,
  updateStageAction,
} from "@/app/admin/(protected)/clients/[id]/actions";
import { FilesPanel } from "./FilesPanel";

const LOGGER_TYPES: Array<{ v: string; label: string }> = [
  { v: "note", label: "📝 Бележка" },
  { v: "call", label: "📞 Разговор" },
  { v: "email_sent", label: "✉️ Имейл изпратен" },
  { v: "email_received", label: "📨 Имейл получен" },
  { v: "meeting", label: "🤝 Среща" },
  { v: "offer_sent", label: "💎 Оферта" },
  { v: "contract_sent", label: "📜 Договор" },
  { v: "contract_signed", label: "✍️ Подписан" },
  { v: "payment_received", label: "💰 Плащане" },
  { v: "work_started", label: "🚀 Старт" },
  { v: "work_completed", label: "✅ Завършен" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function ContactDetail({
  contact,
  initialActivities,
}: {
  contact: ContactRow;
  initialActivities: ActivityRow[];
}) {
  const [stage, setStage] = useState<ContactStage>(contact.stage);
  const [activities, setActivities] = useState<ActivityRow[]>(initialActivities);
  const [filter, setFilter] = useState<string>("all");
  const [, startTransition] = useTransition();

  // Live activity stream
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`contact-${contact.id}-activities`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contact_activities",
          filter: `contact_id=eq.${contact.id}`,
        },
        (payload) => {
          const next = payload.new as ActivityRow;
          setActivities((prev) => [next, ...prev]);
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [contact.id]);

  const onStageChange = (s: ContactStage) => {
    setStage(s);
    const fd = new FormData();
    fd.set("contact_id", contact.id);
    fd.set("stage", s);
    startTransition(() => {
      void updateStageAction(fd);
    });
  };

  // Available filter types from current activities
  const filterTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of activities) counts.set(a.activity_type, (counts.get(a.activity_type) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [activities]);

  const visibleActivities = useMemo(() => {
    if (filter === "all") return activities;
    return activities.filter((a) => a.activity_type === filter);
  }, [activities, filter]);

  const lastActivity = activities[0];
  const firstActivity = activities[activities.length - 1];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      {/* LEFT — header + stats + timeline */}
      <div>
        {/* Header */}
        <header className="mb-2 flex flex-wrap items-baseline gap-3">
          <h1 className="font-[family-name:var(--font-editorial)] text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
            {contact.full_name || "Без име"}
          </h1>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: `${STAGE_COLOR[stage]}22`, color: STAGE_COLOR[stage] }}
          >
            {STAGE_LABEL[stage]}
          </span>
        </header>
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-text-secondary)]">
          {contact.email && (
            <a className="hover:text-[var(--color-text-primary)]" href={`mailto:${contact.email}`}>
              ✉️ {contact.email}
            </a>
          )}
          {contact.phone && (
            <a className="hover:text-[var(--color-text-primary)]" href={`tel:${contact.phone}`}>
              📞 {contact.phone}
            </a>
          )}
          {contact.company && <span>🏢 {contact.company}</span>}
        </div>

        {/* Stats strip */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Стойност"
            value={contact.deal_value_eur ? `${contact.deal_value_eur.toLocaleString("bg-BG")} €` : "—"}
            accent="cyan"
          />
          <Stat
            label="Дни откакто е тук"
            value={`${daysSince(contact.created_at)} дни`}
            accent="violet"
          />
          <Stat
            label="Общо събития"
            value={activities.length.toString()}
            accent="gold"
          />
          <Stat
            label="Follow-up"
            value={contact.next_followup_at ? fmtDate(contact.next_followup_at) : "няма"}
            accent={contact.next_followup_at && new Date(contact.next_followup_at) < new Date() ? "red" : "green"}
            small
          />
        </div>

        {/* Activity logger */}
        <ActivityLogger contactId={contact.id} />

        {/* Timeline header + filters */}
        <div className="mt-12 mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
            История · {activities.length} събития
          </h2>
          {lastActivity && (
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Последно: {fmtDate(lastActivity.occurred_at)}
            </p>
          )}
        </div>

        {/* Filter chips */}
        {filterTypes.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip active={filter === "all"} label={`Всички · ${activities.length}`} onClick={() => setFilter("all")} />
            {filterTypes.map(([type, count]) => (
              <FilterChip
                key={type}
                active={filter === type}
                label={`${ACTIVITY_ICON[type] ?? "•"} ${ACTIVITY_LABEL[type] ?? type} · ${count}`}
                onClick={() => setFilter(type)}
              />
            ))}
          </div>
        )}

        {/* Timeline grouped by day */}
        <Timeline activities={visibleActivities} />

        {firstActivity && (
          <p className="mt-6 text-center text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Първи контакт: {fmtDate(firstActivity.occurred_at)}
          </p>
        )}
      </div>

      {/* RIGHT — stage + meta + notes */}
      <aside className="space-y-6">
        <Card title="Статус">
          <div className="grid grid-cols-2 gap-2">
            {CONTACT_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStageChange(s)}
                className="rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors"
                style={{
                  borderColor: stage === s ? STAGE_COLOR[s] : "var(--color-border-default)",
                  background: stage === s ? `${STAGE_COLOR[s]}1a` : "transparent",
                  color: stage === s ? STAGE_COLOR[s] : "var(--color-text-secondary)",
                }}
              >
                {STAGE_LABEL[s]}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Детайли">
          <form action={updateContactFieldsAction} className="space-y-3">
            <input type="hidden" name="contact_id" value={contact.id} />
            <Field label="Име" name="full_name" defaultValue={contact.full_name ?? ""} placeholder="Иван Иванов" />
            <Field label="Фирма" name="company" defaultValue={contact.company ?? ""} placeholder="Acme Ltd." />
            <Field
              label="Стойност (€)"
              name="deal_value_eur"
              type="number"
              defaultValue={contact.deal_value_eur?.toString() ?? ""}
              placeholder="2000"
            />
            <Field
              label="Follow-up"
              name="next_followup_at"
              type="datetime-local"
              defaultValue={
                contact.next_followup_at
                  ? new Date(contact.next_followup_at).toISOString().slice(0, 16)
                  : ""
              }
            />
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Бележки
              </span>
              <textarea
                name="notes"
                defaultValue={contact.notes ?? ""}
                rows={6}
                className="w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
                placeholder="Какво е важно да помниш…"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-bold text-[var(--color-bg-void)] transition-opacity hover:opacity-90"
            >
              Запази
            </button>
          </form>
        </Card>

        <Card title="Източник">
          <dl className="space-y-1 text-xs text-[var(--color-text-secondary)]">
            <Row label="Източник" value={contact.source} />
            {contact.source_ref && <Row label="Reference" value={contact.source_ref} mono />}
            <Row label="Създаден" value={fmtDate(contact.created_at)} />
            <Row label="Обновен" value={fmtDate(contact.updated_at)} />
          </dl>
        </Card>

        <FilesPanel contactId={contact.id} />
      </aside>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent: "cyan" | "violet" | "gold" | "green" | "red";
  small?: boolean;
}) {
  const colors = {
    cyan: "var(--color-accent-cyan)",
    violet: "var(--color-accent-violet)",
    gold: "#FFB800",
    green: "#22c55e",
    red: "#ef4444",
  };
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(13,18,33,0.4)",
      }}
    >
      <p className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p
        className={small ? "mt-1 text-xs font-bold leading-tight" : "mt-1 text-lg font-bold"}
        style={{ color: colors[accent] }}
      >
        {value}
      </p>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={{
        borderColor: active ? "var(--color-accent-cyan)" : "var(--color-border-default)",
        background: active ? "rgba(0,212,255,0.10)" : "transparent",
        color: active ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
      }}
    >
      {label}
    </button>
  );
}

function Timeline({ activities }: { activities: ActivityRow[] }) {
  if (activities.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--color-border-default)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">
        Няма събития за този филтър.
      </p>
    );
  }

  // Group by day
  const groups = new Map<string, ActivityRow[]>();
  for (const a of activities) {
    const day = new Date(a.occurred_at).toLocaleDateString("bg-BG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(a);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([day, items]) => (
        <div key={day}>
          <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
            {day}
          </p>
          <ol className="space-y-2">
            {items.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function ActivityCard({ activity: a }: { activity: ActivityRow }) {
  const meta = a.metadata as Record<string, unknown> | null;
  const time = new Date(a.occurred_at).toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li
      className="flex gap-3 rounded-md border border-[var(--color-border-default)] p-4 transition-colors hover:border-[var(--color-border-bright)]"
      style={{ background: "rgba(13,18,33,0.4)" }}
    >
      <span className="text-2xl flex-shrink-0" aria-hidden>
        {ACTIVITY_ICON[a.activity_type] ?? "•"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium text-[var(--color-text-primary)]">{a.title}</p>
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {time}
          </span>
        </div>
        {a.body && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
            {a.body}
          </p>
        )}

        {/* Metadata expansion */}
        {meta && Object.keys(meta).length > 0 && (
          <details className="mt-2 group">
            <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]">
              <span className="group-open:hidden">▸ Покажи метаданни ({Object.keys(meta).length})</span>
              <span className="hidden group-open:inline">▼ Скрий метаданните</span>
            </summary>
            <dl className="mt-2 space-y-1 rounded border border-[var(--color-border-default)] bg-black/30 p-2 text-[10px]">
              {Object.entries(meta).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="min-w-[100px] flex-shrink-0 font-mono text-[var(--color-text-tertiary)]">
                    {k}
                  </dt>
                  <dd className="break-all font-mono text-[var(--color-text-secondary)]">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {ACTIVITY_LABEL[a.activity_type] ?? a.activity_type}
          {a.created_by ? ` · ${a.created_by}` : ""}
        </p>
      </div>
    </li>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-lg border border-[var(--color-border-default)] p-5"
      style={{ background: "rgba(13,18,33,0.4)" }}
    >
      <h3 className="mb-4 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
      />
    </label>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </dt>
      <dd
        className={mono ? "font-mono text-[11px] break-all" : "text-xs"}
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}

function ActivityLogger({ contactId }: { contactId: string }) {
  const [type, setType] = useState("note");
  return (
    <form
      action={addActivityAction}
      className="rounded-lg border border-[var(--color-border-default)] p-4"
      style={{ background: "rgba(0,212,255,0.04)" }}
    >
      <input type="hidden" name="contact_id" value={contactId} />
      <div className="mb-3 flex flex-wrap gap-2">
        {LOGGER_TYPES.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setType(o.v)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={{
              borderColor:
                type === o.v ? "var(--color-accent-cyan)" : "var(--color-border-default)",
              background: type === o.v ? "rgba(0,212,255,0.1)" : "transparent",
              color: type === o.v ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="activity_type" value={type} />
      <input
        type="text"
        name="title"
        required
        maxLength={200}
        placeholder="Кратко описание…"
        className="mb-2 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
      />
      <textarea
        name="body"
        rows={2}
        placeholder="Детайли (по избор)…"
        className="mb-3 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
      />
      <button
        type="submit"
        className="rounded-md bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-bold text-[var(--color-bg-void)] transition-opacity hover:opacity-90"
      >
        Добави в timeline
      </button>
    </form>
  );
}
