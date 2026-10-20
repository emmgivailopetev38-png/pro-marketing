import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeEmailReply, scriptHeartbeat } from "@/lib/crm/gmail-script-auth";
import { recordInboundReplies, watchlistEmails } from "@/lib/crm/email-replies";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/crm/email-reply — адресите, от които Gmail скриптът да търси
 * отговори (всеки, получил автоматично писмо в последните 60 дни).
 */
export async function GET(request: Request) {
  const auth = await authorizeEmailReply(request);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const emails = await watchlistEmails();
  if (auth.viaScript) await scriptHeartbeat(`Gmail скриптът провери ${emails.length} адреса`);
  return NextResponse.json({ ok: true, count: emails.length, emails });
}

const messageSchema = z.object({
  gmail_id: z.string().trim().min(6).max(64),
  thread_id: z.string().trim().max(64).nullish(),
  from: z.string().trim().min(3).max(320),
  subject: z.string().max(500).nullish(),
  date: z.string().trim().min(8).max(40),
  text: z.string().max(5000).nullish(),
});
const bodySchema = z.object({ messages: z.array(messageSchema).max(200) });

/**
 * POST /api/crm/email-reply — писмата от тези адреси, намерени в Gmail.
 * Нов отговор → „📨 Получен имейл“ в картона + чут (поредицата спира) + Telegram.
 */
export async function POST(request: Request) {
  const auth = await authorizeEmailReply(request);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await recordInboundReplies(parsed.data.messages);
  return NextResponse.json({ ok: true, ...result });
}
