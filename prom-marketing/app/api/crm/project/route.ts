import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { projectInputSchema, PROJECT_STATUSES, PROJECT_TASK_STATUSES } from "@/lib/crm/types";
import { upsertProject, setProjectStatus, setProjectTaskStatus } from "@/lib/crm/repository";
import { clampLimit, parseOffset, parseCsv, listProjects, listProjectTasks } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/** POST /api/crm/project — идемпотентен upsert на проект (+ начални задачи). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = projectInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await upsertProject(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created, contact_id: result.contact_id });
}

/**
 * GET /api/crm/project — списък проекти.
 * ?status=in_progress&contact_id=…&q=…&limit=…&offset=…
 * GET /api/crm/project?id=<uuid> — проектът + задачите му.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;

  const id = p.get("id");
  if (id) {
    const all = await listProjects({ limit: 200, offset: 0 });
    const project = all.items.find((x) => x.id === id) ?? null;
    if (!project) {
      return NextResponse.json({ ok: false, error: "project not found" }, { status: 404 });
    }
    const tasks = await listProjectTasks(id);
    return NextResponse.json({ ok: true, project, tasks: tasks.items });
  }

  const status = parseCsv(p.get("status"), PROJECT_STATUSES);
  if (status?.length === 0) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listProjects({
    status: status ?? undefined,
    contact_id: p.get("contact_id") ?? undefined,
    q: p.get("q") ?? undefined,
    limit,
    offset,
  });
  if (r.error) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}

const patchSchema = z
  .object({
    project_id: z.string().uuid().optional(),
    task_id: z.string().uuid().optional(),
    status: z.string(),
  })
  .refine((v) => v.project_id || v.task_id, { message: "project_id or task_id required" });

/**
 * PATCH /api/crm/project — статус на проект ({project_id, status}) или на
 * задача ({task_id, status: todo|doing|done}).
 */
export async function PATCH(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { project_id, task_id, status } = parsed.data;

  if (task_id) {
    if (!(PROJECT_TASK_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: "Invalid task status" }, { status: 400 });
    }
    const r = await setProjectTaskStatus({ id: task_id, status: status as (typeof PROJECT_TASK_STATUSES)[number] });
    if (r.error === "task not found") return NextResponse.json({ ok: false, error: r.error }, { status: 404 });
    if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
    return NextResponse.json({ ok: true, task_id, status });
  }

  if (!(PROJECT_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
  }
  const r = await setProjectStatus({ id: project_id as string, status: status as (typeof PROJECT_STATUSES)[number] });
  if (r.error === "project not found") return NextResponse.json({ ok: false, error: r.error }, { status: 404 });
  if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  return NextResponse.json({ ok: true, project_id, status });
}
