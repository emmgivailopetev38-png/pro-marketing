import { NextResponse } from "next/server";
import { z } from "zod";
import { loadPortal, portalApprove, portalCall, portalMessage, portalRequest } from "@/lib/portal/repository";
import { isValidToken } from "@/lib/portal/rules";
import { notifyPortalEvent } from "@/lib/team/notify";

export const dynamic = "force-dynamic";

/**
 * POST /api/klient/<token> — действията на клиента от портала му.
 * Защитата е токенът: без валиден и включен портал нищо не се пише.
 * Всяко действие известява Ивайло (Telegram + имейл) и отговорника.
 */
const schema = z.object({
  action: z.enum(["message", "approve", "request", "call"]),
  text: z.string().max(4000).optional().default(""),
  task_id: z.string().uuid().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidToken(token)) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  const raw = await request.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Невалидни данни" }, { status: 400 });
  const data = await loadPortal(token);
  if (!data) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const { action, text, task_id } = parsed.data;
  const contactName = data.contact.full_name ?? data.contact.company ?? "Клиент";
  const notify = (kind: "message" | "approve" | "request" | "call", t: string) =>
    notifyPortalEvent({ contactId: data.contact.id, contactName, ownerKey: data.contact.owner_id, kind, text: t }).catch(() => {});

  if (action === "message") {
    const r = await portalMessage(data, text);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
    await notify("message", text);
    return NextResponse.json({ ok: true, message: "Изпратено. Ще Ви отговорим в същия ден." });
  }
  if (action === "approve") {
    if (!task_id) return NextResponse.json({ ok: false, error: "Липсва стъпка" }, { status: 400 });
    const r = await portalApprove(data, task_id, text);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
    await notify("approve", r.title ?? "");
    return NextResponse.json({ ok: true, message: "Благодарим — отбелязано. Продължаваме." });
  }
  if (action === "request") {
    const r = await portalRequest(data, text);
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
    await notify("request", text);
    return NextResponse.json({ ok: true, message: "Заявката е при нас. Ще Ви пишем, когато е готова." });
  }
  const r = await portalCall(data, text);
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
  await notify("call", text || "без тема");
  return NextResponse.json({ ok: true, message: "Записано. Ще Ви позвъним на следващия работен ден до 10:00 или по-рано." });
}
