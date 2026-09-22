import { describe, expect, it } from "vitest";
import { assigneeOf, boardCounts, bucketOf, buildBoard, byPriorityThenDue, type TaskLite } from "./tasks-rules";

// Вторник 22.09.2026, 10:00 София (07:00 UTC)
const NOW = new Date("2026-09-22T07:00:00Z");

function task(p: Partial<TaskLite> & { id: string }): TaskLite {
  return {
    title: p.id,
    status: "todo",
    due_date: null,
    priority: "normal",
    assignee_id: null,
    project_id: null,
    contact_id: null,
    done_at: null,
    ...p,
  };
}

describe("tasks-rules: къде стои задачата", () => {
  it("по срок спрямо днешния ден в София", () => {
    expect(bucketOf(task({ id: "a", due_date: "2026-09-21" }), NOW)).toBe("overdue");
    expect(bucketOf(task({ id: "b", due_date: "2026-09-22" }), NOW)).toBe("today");
    expect(bucketOf(task({ id: "c", due_date: "2026-09-27" }), NOW)).toBe("week");
    expect(bucketOf(task({ id: "d", due_date: "2026-10-15" }), NOW)).toBe("later");
    expect(bucketOf(task({ id: "e" }), NOW)).toBe("nodate");
    expect(bucketOf(task({ id: "f", status: "done", due_date: "2026-09-01" }), NOW)).toBe("done");
  });

  it("късно вечерта в София е още същият ден, макар в UTC да е утре", () => {
    // 22.09 23:30 София = 22.09 20:30 UTC → задача за 22.09 е „днес“, не просрочена
    const late = new Date("2026-09-22T20:30:00Z");
    expect(bucketOf(task({ id: "a", due_date: "2026-09-22" }), late)).toBe("today");
  });

  it("спешните са първи, после по срок, задачите без срок — накрая", () => {
    const list = [
      task({ id: "n1", priority: "normal", due_date: "2026-09-25" }),
      task({ id: "u", priority: "urgent" }),
      task({ id: "n0", priority: "normal", due_date: "2026-09-23" }),
      task({ id: "h", priority: "high", due_date: "2026-09-30" }),
    ].sort(byPriorityThenDue);
    expect(list.map((t) => t.id)).toEqual(["u", "h", "n0", "n1"]);
  });

  it("готовите излизат само от последните 7 дни", () => {
    const board = buildBoard(
      [
        task({ id: "old", status: "done", done_at: "2026-09-01T10:00:00Z" }),
        task({ id: "new", status: "done", done_at: "2026-09-21T10:00:00Z" }),
        task({ id: "open", due_date: "2026-09-22" }),
      ],
      NOW
    );
    expect(board.done.map((t) => t.id)).toEqual(["new"]);
    expect(boardCounts(board)).toEqual({ open: 1, overdue: 0, today: 1, done: 1 });
  });

  it("изпълнителят наследява отговорника на проекта", () => {
    const owners = new Map<string, string | null>([["p1", "ivan"]]);
    expect(assigneeOf(task({ id: "a", project_id: "p1" }), owners)).toBe("ivan");
    expect(assigneeOf(task({ id: "b", project_id: "p1", assignee_id: "dimitar" }), owners)).toBe("dimitar");
    expect(assigneeOf(task({ id: "c" }), owners)).toBeNull();
  });
});

describe("tasks-rules: срокът е задължителен и най-много 3 дни", () => {
  it("по подразбиране е след 3 дни", async () => {
    const { defaultDueDate, dayPlus } = await import("./tasks-rules");
    expect(defaultDueDate(NOW)).toBe("2026-09-25");
    expect(dayPlus(NOW, 0)).toBe("2026-09-22");
  });

  it("човек от екипа не може да си сложи срок извън днес…+3 дни", async () => {
    const { clampDueForMember } = await import("./tasks-rules");
    expect(clampDueForMember("", NOW)).toBe("2026-09-25");
    expect(clampDueForMember("2026-10-10", NOW)).toBe("2026-09-25");
    expect(clampDueForMember("2026-09-01", NOW)).toBe("2026-09-22");
    expect(clampDueForMember("2026-09-23", NOW)).toBe("2026-09-23");
    expect(clampDueForMember("nope", NOW)).toBe("2026-09-25");
  });

  it("цветът: зелено → оранжево → червено", async () => {
    const { dueTone, dueLabel } = await import("./tasks-rules");
    expect(dueTone(task({ id: "a", due_date: "2026-09-25" }), NOW)).toBe("green");
    expect(dueLabel(task({ id: "a", due_date: "2026-09-25" }), NOW)).toBe("след 3 дни");
    expect(dueTone(task({ id: "b", due_date: "2026-09-23" }), NOW)).toBe("orange");
    expect(dueLabel(task({ id: "b", due_date: "2026-09-23" }), NOW)).toBe("утре");
    expect(dueTone(task({ id: "c", due_date: "2026-09-22" }), NOW)).toBe("orange");
    expect(dueLabel(task({ id: "c", due_date: "2026-09-22" }), NOW)).toBe("днес");
    expect(dueTone(task({ id: "d", due_date: "2026-09-20" }), NOW)).toBe("red");
    expect(dueLabel(task({ id: "d", due_date: "2026-09-20" }), NOW)).toBe("закъснява с 2 дни");
    expect(dueLabel(task({ id: "e", due_date: "2026-09-21" }), NOW)).toBe("закъснява с 1 ден");
    expect(dueTone(task({ id: "f", due_date: "2026-09-20", status: "done" }), NOW)).toBe("done");
    expect(dueTone(task({ id: "g" }), NOW)).toBe("none");
  });
});
