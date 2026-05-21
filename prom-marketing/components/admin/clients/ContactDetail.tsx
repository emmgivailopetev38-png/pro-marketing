"use client";
import { useEffect, useState, useTransition } from "react";
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

export function ContactDetail({
  contact,
  initialActivities,
}: {
  contact: ContactRow;
  initialActivities: ActivityRow[];
}) {
  const [stage, setStage] = useState<ContactStage>(contact.stage);
  const [activities, setActivities] = useState<ActivityRow[]>(initialActivities);
  const [, startTransition] = useTransition();

  // Live activity stream for this contact
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

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
      {/* LEFT — timeline + activity logger */}
      <div>
        <header className="mb-2 flex items-baseline gap-3">
          <h1 className="font-[family-name:var(--font-editorial)] text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
            {contact.full_name || "Без име"}
          </h1>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: `${STAGE_COLOR[stage]}22`,
              color: STAGE_COLOR[stage],
            }}
          >
            {STAGE_LABEL[stage]}
          </span>
        </header>
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--color-text-secondary)]">
          {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
          {contact.company && <span>{contact.company}</span>}
        </div>

        <ActivityLogger contactId={contact.id} />

        <h2 className="mt-12 mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
          История · {activities.length} събития
        </h2>
        <ol className="space-y-3">
          {activities.map((a) => (
            <li
              key={a.id}
              className="flex gap-4 rounded-md border border-[var(--color-border-default)] p-4"
              style={{ background: "rgba(13,18,33,0.4)" }}
            >
              <span className="text-2xl" aria-hidden>
                {ACTIVITY_ICON[a.activity_type] ?? "•"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium text-[var(--color-text-primary)]">{a.title}</p>
                  <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    {new Date(a.occurred_at).toLocaleString("bg-BG", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {a.body && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
                    {a.body}
                  </p>
                )}
                <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {ACTIVITY_LABEL[a.activity_type] ?? a.activity_type}
                  {a.created_by ? ` · ${a.created_by}` : ""}
                </p>
              </div>
            </li>
          ))}
          {activities.length === 0 && (
            <li className="rounded-md border border-dashed border-[var(--color-border-default)] p-6 text-center text-sm text-[var(--color-text-tertiary)]">
              Все още няма записани събития.
            </li>
          )}
        </ol>
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
            <Field
              label="Име"
              name="full_name"
              defaultValue={contact.full_name ?? ""}
              placeholder="Иван Иванов"
            />
            <Field
              label="Фирма"
              name="company"
              defaultValue={contact.company ?? ""}
              placeholder="Acme Ltd."
            />
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
                rows={5}
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
            <Row label="Създаден" value={new Date(contact.created_at).toLocaleString("bg-BG")} />
            <Row label="Обновен" value={new Date(contact.updated_at).toLocaleString("bg-BG")} />
          </dl>
        </Card>
      </aside>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--color-border-default)] p-5" style={{ background: "rgba(13,18,33,0.4)" }}>
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
      <dt className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</dt>
      <dd className={mono ? "font-mono text-[11px] break-all" : "text-xs"} style={{ color: "var(--color-text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}

function ActivityLogger({ contactId }: { contactId: string }) {
  const [type, setType] = useState("note");
  return (
    <form action={addActivityAction} className="rounded-lg border border-[var(--color-border-default)] p-4" style={{ background: "rgba(0,212,255,0.04)" }}>
      <input type="hidden" name="contact_id" value={contactId} />
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { v: "note", label: "📝 Бележка" },
          { v: "call", label: "📞 Разговор" },
          { v: "email_sent", label: "✉️ Имейл" },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setType(o.v)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={{
              borderColor: type === o.v ? "var(--color-accent-cyan)" : "var(--color-border-default)",
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
