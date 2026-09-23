"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { taskAction } from "@/app/ekip/zadachi/actions";
import {
  DUE_TONE_COLOR,
  MAX_DUE_DAYS,
  TASK_BUCKET_LABEL,
  TASK_PRIORITIES,
  TASK_PRIORITY_COLOR,
  TASK_PRIORITY_LABEL,
  dayPlus,
  defaultDueDate,
  dueLabel,
  dueTone,
  type TaskBoard as Board,
  type TaskBucket,
} from "@/lib/team/tasks-rules";
import type { TaskRow } from "@/lib/team/tasks";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Таблото със задачи — едно и също за човек от екипа (/ekip/zadachi) и за
 * Ивайло (/admin/zadachi). Разликата: собственикът избира изпълнител и вижда
 * всички; човекът вижда своите. Готовите стоят една седмица — да се вижда
 * какво е свършено.
 */

export interface AssigneeOption {
  id: string;
  name: string;
}

const FIELD =
  "rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]";

function Submit({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "go" | "done" }) {
  const { pending } = useFormStatus();
  const cls = tone === "go" ? "border-[var(--color-accent-cyan)]/50 text-[var(--color-accent-cyan)]" : tone === "done" ? "border-emerald-400/50 text-emerald-300" : "border-white/15 text-[var(--color-text-secondary)]";
  return (
    <button type="submit" disabled={pending} className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${cls}`}>
      {pending ? "…" : children}
    </button>
  );
}

function dateBg(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "2-digit", month: "short" });
}

function TaskLine({ t, isOwner, assignees, showAssignee, threadHref }: { t: TaskRow; isOwner: boolean; assignees: AssigneeOption[]; showAssignee: boolean; threadHref: string }) {
  const [res, act] = useActionState(taskAction, null);
  const [edit, setEdit] = useState(false);
  const done = t.status === "done";
  const color = TASK_PRIORITY_COLOR[t.priority as keyof typeof TASK_PRIORITY_COLOR] ?? "#7da8cc";
  const tone = dueTone(t);
  const toneColor = DUE_TONE_COLOR[tone];
  const today = dayPlus(new Date(), 0);
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3" style={{ borderLeft: `4px solid ${toneColor}` }}>
      <div className="flex items-start gap-2">
        <form action={act} className="shrink-0 pt-0.5">
          <input type="hidden" name="task_id" value={t.id} />
          <input type="hidden" name="action" value={done ? "reopen" : "done"} />
          <button
            type="submit"
            aria-label={done ? "Върни задачата" : "Маркирай готова"}
            className={
              done
                ? "flex h-6 w-6 items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/20 text-xs text-emerald-300"
                : "h-6 w-6 rounded-md border border-white/25 bg-black/30 transition hover:border-emerald-500/60"
            }
          >
            {done ? "✓" : ""}
          </button>
        </form>
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${done ? "text-[var(--color-text-tertiary)] line-through" : "text-[var(--color-text-primary)]"}`}>
            {t.kind === "client_request" ? "📩 " : ""}
            {t.title}
          </p>
          <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-[var(--color-text-tertiary)]">
            {t.priority !== "normal" && <span style={{ color }}>● {TASK_PRIORITY_LABEL[t.priority as keyof typeof TASK_PRIORITY_LABEL]}</span>}
            <span
              className="rounded-full border px-1.5 py-0.5 font-semibold"
              style={{ color: toneColor, borderColor: `${toneColor}66`, background: `${toneColor}14` }}
              title="Зелено: има време · оранжево: днес или утре · червено: закъснява"
            >
              📅 {t.due_date ? dateBg(t.due_date) : "—"} · {dueLabel(t)}
            </span>
            {t.project_title && <span>🛠 {t.project_title}</span>}
            {t.contact_name && (
              <span>
                👤 {isOwner && t.contact_id ? <Link href={`/admin/clients/${t.contact_id}`} className="underline-offset-2 hover:underline">{t.contact_name}</Link> : t.contact_name}
              </span>
            )}
            {showAssignee && <span>→ {t.assignee_name ?? "Ивайло"}</span>}
            {t.client_visible && <span title="Клиентът я вижда в портала си">👁 клиентът</span>}
            {t.client_done_at && <span className="text-emerald-300">✓ клиентът отметна</span>}
            {t.created_by && <span>от {t.created_by}</span>}
          </p>
          {t.description && <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{t.description}</p>}
          {res && <p className={`mt-1 text-[11px] ${res.ok ? "text-emerald-300" : "text-red-300"}`}>{res.message ?? res.error}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <Link href={threadHref} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-[var(--color-text-tertiary)]" title="Коментари по задачата">
            💬
          </Link>
          {!done && (
            <button type="button" onClick={() => setEdit((v) => !v)} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-[var(--color-text-tertiary)]" title="Срок, приоритет, изпълнител">
              ✎
            </button>
          )}
        </div>
      </div>
      {edit && !done && (
        <form action={act} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="task_id" value={t.id} />
          <input type="hidden" name="action" value="update" />
          <input type="hidden" name="title" value={t.title} />
          <input
            type="date"
            name="due_date"
            defaultValue={t.due_date ?? defaultDueDate()}
            min={today}
            max={isOwner ? undefined : dayPlus(new Date(), MAX_DUE_DAYS)}
            title={isOwner ? "Срок" : `Срок — най-много ${MAX_DUE_DAYS} дни напред`}
            className={FIELD}
          />
          <select name="priority" defaultValue={t.priority} className={FIELD}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
          {isOwner && (
            <select name="assignee_id" defaultValue={t.assignee_id ?? ""} className={FIELD}>
              <option value="">Ивайло</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
            <input type="hidden" name="client_visible" value="0" />
            <input type="checkbox" name="client_visible" value="1" defaultChecked={t.client_visible} /> клиентът я вижда
          </label>
          <Submit tone="go">Запиши</Submit>
          {isOwner && (
            <button
              type="submit"
              formAction={(fd) => {
                fd.set("action", "delete");
                return act(fd);
              }}
              className="rounded-xl border border-rose-400/30 px-3 py-2 text-xs text-rose-300"
            >
              изтрий
            </button>
          )}
        </form>
      )}
    </li>
  );
}

export function TaskBoard({
  board,
  isOwner,
  assignees = [],
  showAssignee = false,
  threadBase = "/ekip/saobshtenia",
  defaultAssignee = "",
  contactId,
  projectId,
  compact = false,
}: {
  board: Board;
  isOwner: boolean;
  assignees?: AssigneeOption[];
  showAssignee?: boolean;
  threadBase?: string;
  defaultAssignee?: string;
  /** ако е зададен — новите задачи са по този картон */
  contactId?: string;
  projectId?: string;
  compact?: boolean;
}) {
  const [res, act] = useActionState(taskAction, null);
  const [open, setOpen] = useState(!compact);
  const order: TaskBucket[] = ["overdue", "today", "week", "later", "nodate", "done"];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--color-accent-cyan)]/25 bg-[var(--color-accent-cyan)]/5 p-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-[var(--color-accent-cyan)]">
          + Нова задача
        </button>
        {open && (
          <form action={act} className="mt-2 space-y-2">
            <input type="hidden" name="action" value="create" />
            {contactId && <input type="hidden" name="contact_id" value={contactId} />}
            {projectId && <input type="hidden" name="project_id" value={projectId} />}
            <input name="title" required placeholder="какво трябва да се свърши" className={`${FIELD} w-full`} />
            <textarea name="description" rows={2} placeholder="подробности (по желание)" className={`${FIELD} w-full`} />
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                срок
                <input
                  type="date"
                  name="due_date"
                  defaultValue={defaultDueDate()}
                  min={dayPlus(new Date(), 0)}
                  max={isOwner ? undefined : dayPlus(new Date(), MAX_DUE_DAYS)}
                  className={FIELD}
                />
                {!isOwner && <span className="text-[10px] text-[var(--color-text-tertiary)]">до {MAX_DUE_DAYS} дни</span>}
              </label>
              <select name="priority" defaultValue="normal" className={FIELD}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
              {isOwner && (
                <select name="assignee_id" defaultValue={defaultAssignee} className={FIELD}>
                  <option value="">за мен (Ивайло)</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      за {a.name}
                    </option>
                  ))}
                </select>
              )}
              {(contactId || projectId) && (
                <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                  <input type="checkbox" name="client_visible" value="1" /> клиентът я вижда
                </label>
              )}
              <Submit tone="go">Добави</Submit>
            </div>
            {res && <p className={`text-xs ${res.ok ? "text-emerald-300" : "text-red-300"}`}>{res.message ?? res.error}</p>}
          </form>
        )}
      </div>

      <p className="text-[11px] text-[var(--color-text-tertiary)]">
        Всяка задача има срок (най-много {MAX_DUE_DAYS} дни).{" "}
        <span style={{ color: DUE_TONE_COLOR.green }}>● има време</span> ·{" "}
        <span style={{ color: DUE_TONE_COLOR.orange }}>● днес или утре</span> ·{" "}
        <span style={{ color: DUE_TONE_COLOR.red }}>● закъснява</span> — закъснелите получават напомняне сутрин и следобед.
      </p>

      {order.map((b) => {
        const list = board[b];
        if (list.length === 0 && b !== "today") return null;
        return (
          <section key={b} className="space-y-2">
            <h3 className={`text-xs font-semibold uppercase tracking-[0.15em] ${b === "overdue" ? "text-rose-300" : b === "today" ? "text-amber-300" : b === "done" ? "text-emerald-300" : "text-[var(--color-text-tertiary)]"}`}>
              {TASK_BUCKET_LABEL[b]} · {list.length}
            </h3>
            {list.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)]">Нищо за днес. Вземи нещо от „тази седмица“.</p>
            ) : (
              <ul className="space-y-2">
                {list.map((t) => (
                  <TaskLine key={t.id} t={t as TaskRow} isOwner={isOwner} assignees={assignees} showAssignee={showAssignee} threadHref={`${threadBase}?t=task:${t.id}`} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
