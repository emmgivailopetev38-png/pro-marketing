import { describe, expect, it } from "vitest";
import { boardCounts, bucketFor, byDueDate, type BoardProject, type DeliveryBoard } from "./projects";

const ME = "11111111-1111-1111-1111-111111111111";
const DRUG = "22222222-2222-2222-2222-222222222222";
const SINCE = "2026-09-01T00:00:00.000Z";

function proj(patch: Partial<BoardProject> = {}): BoardProject {
  return {
    id: patch.id ?? "p1",
    title: patch.title ?? "Проект",
    description: null,
    status: patch.status ?? "in_progress",
    amount_gross: null,
    currency: "EUR",
    due_date: patch.due_date ?? null,
    notes: null,
    owner_id: patch.owner_id ?? null,
    owner_name: null,
    contact_id: null,
    client_name: null,
    client_phone: null,
    tasks: patch.tasks ?? [],
    done_tasks: patch.done_tasks ?? 0,
    last_touch: null,
  };
}

describe("bucketFor", () => {
  it("живият проект на мое име е мой", () => {
    expect(bucketFor({ status: "in_progress", owner_id: ME, done_at: null, updated_at: SINCE }, ME, SINCE)).toBe("mine");
  });

  it("жив проект без отговорник е свободен, а не чужд", () => {
    expect(bucketFor({ status: "planned", owner_id: null, done_at: null, updated_at: SINCE }, ME, SINCE)).toBe("free");
  });

  it("живият проект на друг човек не е свободен", () => {
    expect(bucketFor({ status: "waiting_client", owner_id: DRUG, done_at: null, updated_at: SINCE }, ME, SINCE)).toBe(
      "others"
    );
  });

  it("моят завършен наскоро влиза в „завършени“", () => {
    const b = bucketFor(
      { status: "done", owner_id: ME, done_at: "2026-09-10T08:00:00.000Z", updated_at: SINCE },
      ME,
      SINCE
    );
    expect(b).toBe("recentlyDone");
  });

  it("моят завършен отдавна не се показва", () => {
    const b = bucketFor(
      { status: "done", owner_id: ME, done_at: "2026-07-01T08:00:00.000Z", updated_at: "2026-07-01T08:00:00.000Z" },
      ME,
      SINCE
    );
    expect(b).toBeNull();
  });

  it("чужд завършен и отказаният не се показват", () => {
    expect(bucketFor({ status: "done", owner_id: DRUG, done_at: SINCE, updated_at: SINCE }, ME, SINCE)).toBeNull();
    expect(bucketFor({ status: "cancelled", owner_id: ME, done_at: null, updated_at: SINCE }, ME, SINCE)).toBeNull();
  });

  it("без вписан човек (собственикът) нищо не е „мое“, свободните си остават свободни", () => {
    expect(bucketFor({ status: "in_progress", owner_id: ME, done_at: null, updated_at: SINCE }, null, SINCE)).toBe(
      "others"
    );
    expect(bucketFor({ status: "in_progress", owner_id: null, done_at: null, updated_at: SINCE }, null, SINCE)).toBe(
      "free"
    );
  });
});

describe("byDueDate", () => {
  it("по-близкият срок е пръв, а без срок отива най-отзад", () => {
    const sorted = [
      proj({ id: "a", due_date: null, title: "Б без срок" }),
      proj({ id: "b", due_date: "2026-10-01" }),
      proj({ id: "c", due_date: "2026-09-20" }),
    ].sort(byDueDate);
    expect(sorted.map((p) => p.id)).toEqual(["c", "b", "a"]);
  });
});

describe("boardCounts", () => {
  it("брои отворените задачи и просрочените само по моите проекти", () => {
    const board: DeliveryBoard = {
      mine: [
        proj({
          id: "m1",
          due_date: "2020-01-01",
          tasks: [
            { id: "t1", title: "едно", status: "todo", due_date: null, sort_order: 1 },
            { id: "t2", title: "две", status: "done", due_date: null, sort_order: 2 },
          ],
        }),
        proj({ id: "m2", due_date: "2999-01-01" }),
      ],
      free: [proj({ id: "f1" })],
      others: [proj({ id: "o1", tasks: [{ id: "t3", title: "чужда", status: "todo", due_date: null, sort_order: 1 }] })],
      recentlyDone: [],
    };
    expect(boardCounts(board)).toEqual({ mine: 2, free: 1, openTasks: 1, overdue: 1, done: 0 });
  });
});
