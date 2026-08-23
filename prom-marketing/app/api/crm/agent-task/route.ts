import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import {
  claimNextAgentTask,
  finishAgentTask,
  listAgentTasks,
  queueAgentTask,
  requeueStaleAgentTasks,
} from "@/lib/crm/agent-tasks";
import { sendTelegram } from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/agent-task
 *   ?claim=1  → взима следващата задача и я маркира „в ход" (за работника на VPS-а)
 *   ?status=  → само поглед към опашката, без да я пипа
 *
 * Това е другият край на моста, който започва при /api/voice/tools/delegate.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;

  if (p.get("claim") === "1") {
    // Първо върни в опашката всичко, останало „в ход" от убит процес.
    const requeued = await requeueStaleAgentTasks();
    const task = await claimNextAgentTask();
    return NextResponse.json({ ok: true, requeued, task: task ?? null });
  }

  const items = await listAgentTasks({
    status: p.get("status") ?? undefined,
    limit: Number(p.get("limit") ?? 20),
  });
  return NextResponse.json({ ok: true, count: items.length, items });
}

const create = z.object({
  task: z.string().trim().min(3).max(4000),
  source: z.enum(["voice", "admin", "automation"]).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  requested_by: z.string().trim().max(120).optional(),
});

/** POST — задача от таблото или от друга автоматизация (гласът си има свой рут). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = create.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const r = await queueAgentTask(parsed.data);
  if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  return NextResponse.json({ ok: true, id: r.id });
}

const finish = z.object({
  id: z.string().uuid(),
  status: z.enum(["done", "failed"]),
  result: z.string().max(8000).optional(),
  error: z.string().max(2000).optional(),
  /** Работникът вече е писал в Telegram — не пращай второ съобщение. */
  notified: z.boolean().optional(),
});

/** PATCH — Хермес докладва какво е свършил; отговорът стига до Ивайло в Telegram. */
export async function PATCH(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = finish.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const { id, status, result, error, notified } = parsed.data;
  const r = await finishAgentTask({ id, status, result, error });
  if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });

  if (!notified) {
    const head = status === "done" ? "✅ Хермес свърши задачата от телефона" : "⚠️ Хермес не успя със задачата от телефона";
    void sendTelegram(`${head}\n\n${escapeHtml((result ?? error ?? "").slice(0, 3000))}`);
  }
  return NextResponse.json({ ok: true, id, status });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
