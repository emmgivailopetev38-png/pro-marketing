import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { creditsLeft, dailyMax, readSwitch, runAutoCalls, writeSwitch } from "@/lib/voice/auto-call";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * /api/voice/outbound — ръчното управление на „Ели звъни сама“.
 *
 *   GET                       → състояние + кого би набрала сега (без набиране)
 *   POST {action:"run"}       → една обиколка сега (в работните часове)
 *   POST {action:"call", contact_id} → само този човек, ако правилата го пускат;
 *                               `force:true` пренебрегва часовете (проба)
 *   POST {action:"pause"|"resume"} → ключът без деплой
 *
 * Bearer: HERMES_API_TOKEN или INTERNAL_SEND_TOKEN (checkHermesAuth).
 * Правилата кой да се набере НЕ се заобикалят оттук — само часовете с `force`.
 */

export async function GET(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [sw, credits, preview] = await Promise.all([readSwitch(), creditsLeft(), runAutoCalls({ dryRun: true })]);
  return NextResponse.json({
    on: sw.on,
    switched_at: sw.at,
    switched_by: sw.by,
    cap: dailyMax(),
    today: preview.today,
    credits,
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

const schema = z.object({
  action: z.enum(["run", "call", "pause", "resume"]),
  contact_id: z.string().uuid().optional(),
  force: z.boolean().optional(),
  by: z.string().trim().max(60).optional(),
});

export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", detail: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }
  const { action, contact_id, force, by } = parsed.data;

  if (action === "pause" || action === "resume") {
    await writeSwitch(action === "resume", by ?? "api");
    return NextResponse.json({ ok: true, on: action === "resume" });
  }
  if (action === "call" && !contact_id) return NextResponse.json({ error: "contact_id" }, { status: 400 });

  const result = await runAutoCalls({ force: Boolean(force), onlyContactId: action === "call" ? contact_id : undefined });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
