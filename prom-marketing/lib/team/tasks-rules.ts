/**
 * Задачите — чистите правила. Една задача може да е по проект, по картон или
 * обща; има изпълнител (човек от екипа или Ивайло = null), срок и приоритет.
 * Тук е отговорът на „къде стои задачата днес“: просрочена, за днес, тази
 * седмица, по-късно, без срок, готова.
 */
import { TZ, dayKey } from "@/lib/contacts/followup";

export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "ниска",
  normal: "нормална",
  high: "висока",
  urgent: "спешна",
};

export const TASK_PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "#64748b",
  normal: "#7da8cc",
  high: "#fb923c",
  urgent: "#ef4444",
};

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export interface TaskLite {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  priority: string;
  assignee_id: string | null;
  project_id: string | null;
  contact_id: string | null;
  done_at: string | null;
  updated_at?: string;
  created_at?: string;
}

export type TaskBucket = "overdue" | "today" | "week" | "later" | "nodate" | "done";

export const TASK_BUCKET_LABEL: Record<TaskBucket, string> = {
  overdue: "⏰ Просрочени",
  today: "📌 За днес",
  week: "📆 Тази седмица",
  later: "🗓 По-нататък",
  nodate: "📋 Без срок",
  done: "✅ Готови",
};

/** В коя купчина е задачата спрямо днешния ден в София. */
export function bucketOf(task: Pick<TaskLite, "status" | "due_date">, now: Date = new Date(), tz: string = TZ): TaskBucket {
  if (task.status === "done") return "done";
  if (!task.due_date) return "nodate";
  const today = dayKey(now, tz);
  const due = task.due_date.slice(0, 10);
  if (due < today) return "overdue";
  if (due === today) return "today";
  const weekEnd = dayKey(new Date(now.getTime() + 7 * 86_400_000), tz);
  if (due <= weekEnd) return "week";
  return "later";
}

/** Спешните най-отгоре, после по срок, после по заглавие. */
export function byPriorityThenDue<T extends Pick<TaskLite, "priority" | "due_date" | "title">>(a: T, b: T): number {
  const pa = PRIORITY_RANK[a.priority] ?? 2;
  const pb = PRIORITY_RANK[b.priority] ?? 2;
  if (pa !== pb) return pa - pb;
  if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
  if (a.due_date && !b.due_date) return -1;
  if (!a.due_date && b.due_date) return 1;
  return a.title.localeCompare(b.title, "bg");
}

export type TaskBoard = Record<TaskBucket, TaskLite[]>;

/**
 * Разпределя задачите по купчини. Готовите — само от последните `doneDays`
 * дни, най-новите първи, за да се вижда какво е свършено, без да се трупа.
 */
export function buildBoard(tasks: TaskLite[], now: Date = new Date(), doneDays = 7): TaskBoard {
  const board: TaskBoard = { overdue: [], today: [], week: [], later: [], nodate: [], done: [] };
  const doneSince = new Date(now.getTime() - doneDays * 86_400_000).toISOString();
  for (const t of tasks) {
    const b = bucketOf(t, now);
    if (b === "done") {
      if ((t.done_at ?? t.updated_at ?? "") >= doneSince) board.done.push(t);
      continue;
    }
    board[b].push(t);
  }
  for (const k of ["overdue", "today", "week", "later", "nodate"] as const) board[k].sort(byPriorityThenDue);
  board.done.sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
  return board;
}

export function boardCounts(board: TaskBoard) {
  const open = board.overdue.length + board.today.length + board.week.length + board.later.length + board.nodate.length;
  return { open, overdue: board.overdue.length, today: board.today.length, done: board.done.length };
}

/** „Кой е изпълнител“: изрично зададен, иначе отговорникът на проекта, иначе Ивайло. */
export function assigneeOf(
  task: Pick<TaskLite, "assignee_id" | "project_id">,
  projectOwner: Map<string, string | null>
): string | null {
  if (task.assignee_id) return task.assignee_id;
  if (task.project_id) return projectOwner.get(task.project_id) ?? null;
  return null;
}

export function isPriority(v: unknown): v is TaskPriority {
  return typeof v === "string" && (TASK_PRIORITIES as readonly string[]).includes(v);
}

// ── Срокът: всяка задача има срок, най-много 3 дни ─────────────────────────
//
// Правило на Ивайло (22.09.2026): „ако работник има таск, трябва да си има и
// срок; всичко трябва да се изпълнява в максимум 3 дни; първо зелено, после
// оранжево, накрая червено, че закъснява“. Собственикът може да даде по-дълъг
// срок, човекът от екипа — не.

export const DEFAULT_DUE_DAYS = 3;
export const MAX_DUE_DAYS = 3;

/** Днес + n дни като YYYY-MM-DD в София. */
export function dayPlus(now: Date, days: number, tz: string = TZ): string {
  return dayKey(new Date(now.getTime() + days * 86_400_000), tz);
}

export function defaultDueDate(now: Date = new Date(), tz: string = TZ): string {
  return dayPlus(now, DEFAULT_DUE_DAYS, tz);
}

/** Срокът на човек от екипа: между днес и днес + 3 дни; празно или невалидно → 3 дни. */
export function clampDueForMember(due: string | null | undefined, now: Date = new Date(), tz: string = TZ): string {
  const min = dayKey(now, tz);
  const max = dayPlus(now, MAX_DUE_DAYS, tz);
  const d = (due ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return max;
  if (d < min) return min;
  if (d > max) return max;
  return d;
}

export type DueTone = "green" | "orange" | "red" | "done" | "none";

export const DUE_TONE_COLOR: Record<DueTone, string> = {
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ef4444",
  done: "#64748b",
  none: "#94a3b8",
};

export const DUE_TONE_LABEL: Record<DueTone, string> = {
  green: "има време",
  orange: "днес / утре",
  red: "закъснява",
  done: "готова",
  none: "без срок",
};

/** Дни между две дати YYYY-MM-DD (b − a). */
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.slice(0, 10).split("-").map(Number);
  const [y2, m2, d2] = b.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Зелено = поне два дни; оранжево = днес или утре; червено = срокът е минал. */
export function dueTone(task: Pick<TaskLite, "status" | "due_date">, now: Date = new Date(), tz: string = TZ): DueTone {
  if (task.status === "done") return "done";
  if (!task.due_date) return "none";
  const diff = daysBetween(dayKey(now, tz), task.due_date);
  if (diff < 0) return "red";
  if (diff <= 1) return "orange";
  return "green";
}

/** „днес“, „утре“, „след 3 дни“, „закъснява с 2 дни“ — за етикета на задачата. */
export function dueLabel(task: Pick<TaskLite, "status" | "due_date">, now: Date = new Date(), tz: string = TZ): string {
  if (task.status === "done") return "готова";
  if (!task.due_date) return "без срок";
  const diff = daysBetween(dayKey(now, tz), task.due_date);
  if (diff < 0) return `закъснява с ${-diff} ${-diff === 1 ? "ден" : "дни"}`;
  if (diff === 0) return "днес";
  if (diff === 1) return "утре";
  return `след ${diff} дни`;
}
