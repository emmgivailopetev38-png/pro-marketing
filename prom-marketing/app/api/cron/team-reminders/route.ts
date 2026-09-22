import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { listActiveMembers } from "@/lib/team/repository";
import { loadTasksFor } from "@/lib/team/tasks";
import { unreadTotal } from "@/lib/team/messages";
import { sendMorningDigest } from "@/lib/team/notify";
import { homeFor } from "@/lib/team/roles";
import { dayKey } from "@/lib/contacts/followup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron: GET /api/cron/team-reminders — всяка сутрин (04:00 UTC = 07:00 София).
 *
 * На всеки активен човек от екипа — едно писмо: просрочени и днешни задачи,
 * обещани чувания (за продавача) и непрочетени съобщения. Ако няма нищо —
 * нищо не се праща. Ивайло получава своя сутрешен отчет от другите кронове.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const internalToken = process.env.INTERNAL_SEND_TOKEN;
  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isManual = internalToken && authHeader === `Bearer ${internalToken}`;
  if (cronSecret && !isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await listActiveMembers();
  const sb = createServiceClient();
  const today = dayKey(new Date());
  const out: Array<{ name: string; sent: boolean; overdue: number; today: number; unread: number; followups: number }> = [];

  for (const m of members) {
    const actor = { kind: "member" as const, name: m.full_name, slug: m.slug, member: m };
    const [{ board }, unread, { count }] = await Promise.all([
      loadTasksFor(actor),
      unreadTotal(m.id),
      sb
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", m.id)
        .not("next_followup_at", "is", null)
        .lte("next_followup_at", `${today}T23:59:59Z`)
        .not("stage", "in", "(won,lost)"),
    ]);
    const overdue = board.overdue.map((t) => ({ title: t.title, due: t.due_date }));
    const todayList = board.today.map((t) => ({ title: t.title, due: t.due_date }));
    const followups = count ?? 0;
    const res = await sendMorningDigest({ to: m.email, name: m.full_name.split(/\s+/)[0], overdue, today: todayList, unread, followups, home: homeFor(m) });
    out.push({ name: m.full_name, sent: res.sent, overdue: overdue.length, today: todayList.length, unread, followups });
  }
  return NextResponse.json({ ok: true, members: out });
}
