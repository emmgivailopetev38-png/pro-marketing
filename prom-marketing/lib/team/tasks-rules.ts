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
