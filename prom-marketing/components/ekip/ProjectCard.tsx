"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addTaskAction,
  noteAction,
  setProjectStatusAction,
  setTaskStatusAction,
  takeProjectAction,
} from "@/app/ekip/proekti/actions";
import { PROJECT_STATUS_COLOR, PROJECT_STATUS_LABEL, formatMoney } from "@/lib/crm/labels";
import { PROJECT_STATUSES } from "@/lib/crm/types";
import type { BoardProject } from "@/lib/team/projects";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Един проект — както се вижда на телефон. Отгоре кой е клиентът и докъде е
 * стигнало, отдолу задачите за чеклване, най-отдолу бележка. Картата никога не
 * изчезва след действие: човекът сам вижда какво е станало и решава нататък
 * (урокът от първия ден на опашката за звънене).
 */

const PANEL = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";

function dateBg(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short", timeZone: "Europe/Sofia" });
}

function ago(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `преди ${Math.max(1, Math.round(diff / 60))} мин`;
  if (diff < 86400) return `преди ${Math.round(diff / 3600)} ч`;
  return `преди ${Math.round(diff / 86400)} дни`;
}

function Submit({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "go" | "done" }) {
  const { pending } = useFormStatus();
  const cls =
    tone === "go"
      ? "border-[var(--color-accent-cyan)]/50 text-[var(--color-accent-cyan)]"
      : tone === "done"
        ? "border-emerald-400/50 text-emerald-300"
        : "border-white/15 text-[var(--color-text-secondary)]";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${cls}`}
    >
      {pending ? "…" : children}
    </button>
  );
}

function Result({ res }: { res: EkipActionResult | null }) {
  if (!res) return null;
  return (
    <p className={`mt-2 text-xs ${res.ok ? "text-emerald-300" : "text-red-300"}`}>{res.message ?? res.error}</p>
  );
}

export function ProjectCard({ project, mode }: { project: BoardProject; mode: "mine" | "free" | "other" | "done" }) {
  const [openNote, setOpenNote] = useState(false);
  const [takeRes, take] = useActionState(takeProjectAction, null);
  const [taskRes, task] = useActionState(setTaskStatusAction, null);
  const [addRes, add] = useActionState(addTaskAction, null);
  const [noteRes, note] = useActionState(noteAction, null);
  const [statusRes, status] = useActionState(setProjectStatusAction, null);

  const today = new Date().toISOString().slice(0, 10);
  const late = project.due_date != null && project.due_date < today && project.status !== "done";
  const open = project.tasks.filter((t) => t.status !== "done");
  const color = PROJECT_STATUS_COLOR[project.status] ?? "#7da8cc";

  return (
    <article className={PANEL} style={{ borderColor: mode === "mine" ? `${color}44` : undefined }}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug text-[var(--color-text-primary)]">{project.title}</h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            {project.client_name ?? "без клиент в картона"}
            {project.amount_gross != null ? ` · ${formatMoney(project.amount_gross, project.currency)}` : ""}
            {project.due_date ? ` · срок ${dateBg(project.due_date)}` : " · без срок"}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}
        >
          {PROJECT_STATUS_LABEL[project.status] ?? project.status}
        </span>
      </header>

      {late && (
        <p className="mt-2 rounded-lg border border-red-400/30 bg-red-400/5 px-2.5 py-1.5 text-xs text-red-300">
          ⏰ Срокът мина на {dateBg(project.due_date)}. Ако се мести, кажи го на клиента днес — бележката отдолу влиза
          в картона му.
        </p>
      )}

      {mode === "other" && project.owner_name && (
        <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">👤 Движи го {project.owner_name}</p>
      )}

      {project.description && (
        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">
          {project.description}
        </p>
      )}

      {project.tasks.length > 0 && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-emerald-500/70 transition-all"
              style={{ width: `${Math.round((project.done_tasks / project.tasks.length) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
            задачи {project.done_tasks}/{project.tasks.length}
          </p>
        </div>
      )}

      {mode !== "other" && open.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {open.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <form action={task} className="flex min-w-0 flex-1 items-center gap-2">
                <input type="hidden" name="task_id" value={t.id} />
                <input type="hidden" name="project_id" value={project.id} />
                <input type="hidden" name="status" value="done" />
                <Submit tone="done">✓</Submit>
                <span className="min-w-0 flex-1 truncate text-xs text-[var(--color-text-secondary)]">
                  {t.title}
                  {t.due_date ? ` · ${dateBg(t.due_date)}` : ""}
                </span>
              </form>
            </li>
          ))}
        </ul>
      )}
      <Result res={taskRes} />

      {mode === "free" && (
        <form action={take} className="mt-3">
          <input type="hidden" name="project_id" value={project.id} />
          <Submit tone="go">🙋 Вземам го</Submit>
        </form>
      )}
      <Result res={takeRes} />

      {mode === "mine" && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <form action={status} className="flex items-center gap-2">
              <input type="hidden" name="project_id" value={project.id} />
              <select
                name="status"
                defaultValue={project.status}
                className="rounded-xl border border-white/15 bg-black/30 px-2.5 py-2 text-xs text-[var(--color-text-secondary)] outline-none"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABEL[s] ?? s}
                  </option>
                ))}
              </select>
              <Submit>Запази</Submit>
            </form>
            <button
              type="button"
              onClick={() => setOpenNote((v) => !v)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]"
            >
              📝 Бележка
            </button>
          </div>
          <Result res={statusRes} />

          {openNote && (
            <form action={note} className="mt-3 space-y-2">
              <input type="hidden" name="project_id" value={project.id} />
              <textarea
                name="note"
                rows={3}
                placeholder="Какво стана днес по проекта — влиза в картона на клиента с твоето име."
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
              />
              <Submit tone="go">Запиши</Submit>
            </form>
          )}
          <Result res={noteRes} />

          <form action={add} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="project_id" value={project.id} />
            <input
              name="title"
              placeholder="+ нова задача"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
            />
            <input
              type="date"
              name="due_date"
              className="rounded-xl border border-white/10 bg-black/30 px-2 py-2 text-xs text-[var(--color-text-secondary)] outline-none"
            />
            <Submit>Добави</Submit>
          </form>
          <Result res={addRes} />
        </>
      )}

      {project.last_touch && (
        <p className="mt-3 border-t border-white/5 pt-2 text-[11px] text-[var(--color-text-tertiary)]">
          {project.last_touch.by ?? "—"} · {project.last_touch.title} · {ago(project.last_touch.at)}
        </p>
      )}
    </article>
  );
}
