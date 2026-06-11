"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProjectRow, ProjectTaskRow } from "@/lib/crm/types";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, formatMoney, formatDate } from "@/lib/crm/labels";
import {
  createProjectAction,
  setProjectStatusAction,
  setTaskStatusAction,
  addTaskAction,
} from "@/app/admin/(protected)/projects/actions";
import type { ContactLite } from "@/components/admin/OffersManager";

const STATUS_OPTIONS = Object.keys(PROJECT_STATUS_LABEL);
const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function ProjectsManager({
  projects,
  tasks,
  contacts,
}: {
  projects: ProjectRow[];
  tasks: ProjectTaskRow[];
  contacts: ContactLite[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const contactsById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
  const tasksByProject = useMemo(() => {
    const m = new Map<string, ProjectTaskRow[]>();
    for (const t of tasks) {
      const list = m.get(t.project_id) ?? [];
      list.push(t);
      m.set(t.project_id, list);
    }
    return m;
  }, [tasks]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {showCreate ? "✕ Затвори" : "+ Нов проект"}
        </button>
      </div>

      {showCreate && (
        <form action={createProjectAction} className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
          <h3 className="mb-3 font-display text-base font-semibold">Нов проект</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Заглавие *">
              <input name="title" required className={inputCls} />
            </Field>
            <Field label="Имейл на клиента">
              <input name="client_email" type="email" list="project-contact-emails" className={inputCls} />
            </Field>
            <Field label="Сума (бруто)">
              <input name="amount_gross" type="number" step="0.01" className={inputCls} />
            </Field>
            <Field label="Валута">
              <input name="currency" defaultValue="EUR" className={inputCls} />
            </Field>
            <Field label="Старт">
              <input name="started_at" type="date" className={inputCls} />
            </Field>
            <Field label="Краен срок">
              <input name="due_date" type="date" className={inputCls} />
            </Field>
          </div>
          <Field label="Задачи (по една на ред)">
            <textarea name="tasks" rows={4} placeholder={"Дизайн\nБилд\nДеплой"} className={inputCls} />
          </Field>
          <datalist id="project-contact-emails">
            {contacts.filter((c) => c.email).map((c) => (
              <option key={c.id} value={c.email!}>
                {c.full_name ?? c.company ?? c.email}
              </option>
            ))}
          </datalist>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
              Запази проект
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
              Отказ
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {projects.map((p) => {
          const c = p.contact_id ? contactsById.get(p.contact_id) : undefined;
          const pt = tasksByProject.get(p.id) ?? [];
          const doneCount = pt.filter((t) => t.status === "done").length;
          return (
            <section key={p.id} className="cc-panel p-5" style={{ ["--cc" as string]: PROJECT_STATUS_COLOR[p.status] }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold text-[var(--color-text-primary)]">{p.title}</h3>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                    {c ? (
                      <Link href={`/admin/clients/${c.id}`} className="hover:text-[var(--color-accent-cyan)]">
                        {c.full_name ?? c.company ?? c.email}
                      </Link>
                    ) : (
                      "— без контакт"
                    )}
                    {p.amount_gross != null ? ` · ${formatMoney(p.amount_gross, p.currency)}` : ""}
                    {p.due_date ? ` · срок ${formatDate(p.due_date)}` : ""}
                    {pt.length > 0 ? ` · задачи ${doneCount}/${pt.length}` : ""}
                  </p>
                </div>
                <form action={setProjectStatusAction} className="inline">
                  <input type="hidden" name="project_id" value={p.id} />
                  <select
                    name="status"
                    defaultValue={p.status}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="rounded-md border px-2 py-1 text-[11px] outline-none"
                    style={{
                      background: `${PROJECT_STATUS_COLOR[p.status]}1a`,
                      color: PROJECT_STATUS_COLOR[p.status],
                      borderColor: `${PROJECT_STATUS_COLOR[p.status]}55`,
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {PROJECT_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </form>
              </div>

              {pt.length > 0 && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-emerald-500/70 transition-all"
                    style={{ width: `${pt.length ? Math.round((doneCount / pt.length) * 100) : 0}%` }}
                  />
                </div>
              )}

              <ul className="mt-3 space-y-1.5">
                {pt.map((t) => (
                  <li key={t.id} className="flex items-center gap-2.5">
                    <form action={setTaskStatusAction} className="flex items-center">
                      <input type="hidden" name="task_id" value={t.id} />
                      <input type="hidden" name="status" value={t.status === "done" ? "todo" : "done"} />
                      <button
                        type="submit"
                        aria-label={t.status === "done" ? "Върни задачата" : "Маркирай готова"}
                        className={
                          t.status === "done"
                            ? "flex h-4.5 w-4.5 items-center justify-center rounded border border-emerald-500/60 bg-emerald-500/20 text-[10px] text-emerald-300"
                            : "h-4.5 w-4.5 rounded border border-white/20 bg-black/30 transition hover:border-emerald-500/60"
                        }
                      >
                        {t.status === "done" ? "✓" : ""}
                      </button>
                    </form>
                    <span
                      className={
                        t.status === "done"
                          ? "text-sm text-[var(--color-text-tertiary)] line-through"
                          : "text-sm text-[var(--color-text-secondary)]"
                      }
                    >
                      {t.title}
                    </span>
                    {t.due_date && (
                      <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{formatDate(t.due_date)}</span>
                    )}
                  </li>
                ))}
              </ul>

              <form action={addTaskAction} className="mt-3 flex items-center gap-2">
                <input type="hidden" name="project_id" value={p.id} />
                <input
                  name="title"
                  placeholder="+ нова задача и Enter"
                  className="w-full max-w-xs rounded-md border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60"
                />
              </form>
            </section>
          );
        })}
        {projects.length === 0 && (
          <div className="cc-panel px-4 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
            {'Няма проекти още. Приеми оферта (статус „Приета") или добави с „+ Нов проект".'}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}
