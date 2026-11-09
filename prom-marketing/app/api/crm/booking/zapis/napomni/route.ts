import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { remindRecordings } from "@/lib/team/zapisi";

export const dynamic = "force-dynamic";

/**
 * POST /api/crm/booking/zapis/napomni {member} — на всеки 30 мин от асистента на продавача:
 * задача в /ekip за всяка минала среща без запис + текст за Telegram, ако е дошло време да се напомни
 * (10 мин след края, после на 3 часа, 9–21 ч.). Празен `text` = нищо не се праща.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({ member: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "member (uuid) е задължителен" }, { status: 400 });
  const r = await remindRecordings(parsed.data.member);
  return NextResponse.json({
    ok: true,
    text: r.text,
    bez_zapis: r.missing.length,
    napomneni: r.due.map((m) => ({ id: m.id, ime: m.name, koga: m.when })),
    novi_zadachi: r.tasks_created,
  });
}
