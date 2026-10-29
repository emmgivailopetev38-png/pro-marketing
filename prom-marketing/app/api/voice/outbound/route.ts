import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { creditsLeft, dailyMax, readSwitch, runAutoCalls, writeSwitch } from "@/lib/voice/auto-call";
import { enqueueFollowups, followupDailyMax, pendingFollowups, runFollowupQueue, upsertAgent } from "@/lib/voice/followup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * /api/voice/outbound — ръчното управление на „Ели звъни сама“.
 *
 *   GET                       → състояние + кого би набрала сега (без набиране)
 *   POST {action:"run"}       → една обиколка сега (в работните часове)
 *   POST {action:"call", contact_id} → само този човек, ако правилата го пускат;
 *                               `force:true` пренебрегва часовете (проба)
 *   POST {action:"pause"|"resume", until?} → ключът без деплой (`until` — пауза до час)
 *
 * Персоналният фолоуъп (lib/voice/followup.ts):
 *   POST {action:"queue", items:[…]}        → списъкът влиза в опашката (идемпотентно)
 *   POST {action:"followup_run", force?, max?} → обиколка по опашката сега
 *   POST {action:"agent_upsert", key, name, prompt, first_message} → агентът за фолоуъпа
 *
 * Bearer: HERMES_API_TOKEN или INTERNAL_SEND_TOKEN (checkHermesAuth).
 * Правилата кой да се набере НЕ се заобикалят оттук — само часовете с `force`.
 */

export async function GET(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [sw, credits, preview, queue] = await Promise.all([readSwitch(), creditsLeft(), runAutoCalls({ dryRun: true }), pendingFollowups()]);
  return NextResponse.json({
    on: sw.on,
    switched_at: sw.at,
    switched_by: sw.by,
    paused_until: sw.until ?? null,
    cap: dailyMax(),
    today: preview.today,
    credits,
    followup: {
      pending: queue.length,
      cap: followupDailyMax(),
      next: queue.slice(0, 5).map((q) => ({ contact_id: q.related_contact_id, ime: q.detail?.variables?.ime, povod: q.detail?.povod, prio: q.detail?.prio })),
    },
    would_call: (preview.preview ?? []).map((c) => ({
      contact_id: c.contactId,
      reason: c.reason,
      attempt: c.attempt,
      ime: c.variables.ime,
      zayavka: c.variables.zayavka,
      data_zayavka: c.variables.data_zayavka,
    })),
    skipped: preview.skipped ?? [],
  });
}

const item = z.object({
  contact_id: z.string().uuid(),
  to_number: z.string().trim().min(9).max(20),
  agent_id: z.string().trim().max(80).optional(),
  povod: z.string().trim().min(2).max(120),
  prio: z.number().int().min(0).max(100).optional(),
  variables: z.record(z.string(), z.string().max(2000)),
});

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("run") }),
  z.object({ action: z.literal("call"), contact_id: z.string().uuid(), force: z.boolean().optional() }),
  z.object({ action: z.literal("pause"), by: z.string().trim().max(60).optional(), until: z.string().datetime({ offset: true }).optional() }),
  z.object({ action: z.literal("resume"), by: z.string().trim().max(60).optional() }),
  z.object({ action: z.literal("queue"), by: z.string().trim().max(60).optional(), items: z.array(item).min(1).max(300) }),
  z.object({ action: z.literal("followup_run"), force: z.boolean().optional(), max: z.number().int().min(1).max(10).optional() }),
  z.object({
    action: z.literal("agent_upsert"),
    key: z.string().trim().regex(/^[a-z0-9_-]{2,40}$/),
    name: z.string().trim().min(2).max(120),
    prompt: z.string().min(50).max(60_000),
    first_message: z.string().min(5).max(1000),
    source_agent_id: z.string().trim().max(80).optional(),
  }),
]);

export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", detail: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ") }, { status: 400 });
  }
  const d = parsed.data;

  if (d.action === "pause" || d.action === "resume") {
    const until = d.action === "pause" ? d.until : undefined;
    await writeSwitch(d.action === "resume", d.by ?? "api", until ?? null);
    return NextResponse.json({ ok: true, on: d.action === "resume", until: until ?? null });
  }
  if (d.action === "queue") {
    const res = await enqueueFollowups(d.items, d.by ?? "api");
    return NextResponse.json({ ok: true, ...res });
  }
  if (d.action === "followup_run") {
    const res = await runFollowupQueue({ force: Boolean(d.force), max: d.max });
    return NextResponse.json(res, { status: res.ok ? 200 : 500 });
  }
  if (d.action === "agent_upsert") {
    const res = await upsertAgent({ key: d.key, name: d.name, prompt: d.prompt, firstMessage: d.first_message, sourceAgentId: d.source_agent_id });
    return NextResponse.json(res, { status: res.ok ? 200 : 502 });
  }

  const result = await runAutoCalls({ force: d.action === "call" ? Boolean(d.force) : false, onlyContactId: d.action === "call" ? d.contact_id : undefined });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
