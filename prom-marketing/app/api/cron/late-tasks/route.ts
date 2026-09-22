import { NextResponse } from "next/server";
import { listActiveMembers } from "@/lib/team/repository";
import { loadTasksFor, openTaskCounts } from "@/lib/team/tasks";
import { MAX_DUE_DAYS, dueLabel } from "@/lib/team/tasks-rules";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { sendTelegram } from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");

/**
 * Vercel Cron: GET /api/cron/late-tasks — следобед (11:00 UTC = 14:00 София, делник).
 *
 * Правило на Ивайло (22.09.2026): задачата има срок и напомня на човека, че
 * закъснява. Сутрешното писмо (team-reminders) вече показва просрочените; това
 * е второто напомняне същия ден — само за закъснели (червено) и за днешните
 * (оранжево). Ивайло получава един ред в Telegram за всеки човек.
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
  const lines: string[] = [];
  const out: Array<{ name: string; late: number; today: number; sent: boolean }> = [];

  for (const m of members) {
    const actor = { kind: "member" as const, name: m.full_name, slug: m.slug, member: m };
    const { board } = await loadTasksFor(actor);
    const late = board.overdue;
    const today = board.today;
    if (late.length + today.length === 0) continue;

    const li = (t: { title: string; status: string; due_date: string | null }) =>
      `<li>${escapeHtml(t.title)} <span style="color:#777;">· ${escapeHtml(dueLabel(t))}</span></li>`;
    const first = m.full_name.split(/\s+/)[0];
    const res = await sendEmail({
      to: m.email,
      subject: late.length
        ? `🔴 ${first}, закъсняваш с ${late.length} ${late.length === 1 ? "задача" : "задачи"}`
        : `🟠 ${first}, ${today.length} ${today.length === 1 ? "задача е" : "задачи са"} за днес`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p>Здравей, ${escapeHtml(first)}. Следобедна проверка на задачите ти.</p>
${late.length ? `<p><strong style="color:#b91c1c;">🔴 Закъснели · ${late.length}</strong></p><ul>${late.map(li).join("")}</ul>` : ""}
${today.length ? `<p><strong style="color:#b45309;">🟠 За днес · ${today.length}</strong></p><ul>${today.map(li).join("")}</ul>` : ""}
<p>Всяка задача е за най-много ${MAX_DUE_DAYS} дни. Отвори ги, свърши каквото можеш днес и отбележи готовото — ако нещо те спира, напиши го в бележките към задачата.</p>
<p style="margin-top:18px;"><a href="${SITE}/ekip/zadachi" style="display:inline-block;background:#0891b2;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Отвори задачите си</a></p>
</div>`,
      text: `Здравей, ${first}.\nЗакъснели: ${late.length}\n${late.map((t) => `- ${t.title} · ${dueLabel(t)}`).join("\n")}\nЗа днес: ${today.length}\n${today.map((t) => `- ${t.title}`).join("\n")}\n${SITE}/ekip/zadachi`,
    }).catch(() => ({ id: null, error: "send failed" }));

    lines.push(
      `${late.length ? "🔴" : "🟠"} ${escapeHtml(m.full_name)}: ${late.length} закъснели${late.length ? ` (${escapeHtml(late.slice(0, 3).map((t) => t.title).join("; "))}${late.length > 3 ? "…" : ""})` : ""}, ${today.length} за днес`
    );
    out.push({ name: m.full_name, late: late.length, today: today.length, sent: !res.error });
  }

  const counts = await openTaskCounts().catch(() => new Map<string, { open: number; overdue: number }>());
  const ownerLate = counts.get("owner")?.overdue ?? 0;
  if (lines.length || ownerLate) {
    await sendTelegram(
      `⏰ <b>Задачи · следобедна проверка</b>\n${lines.join("\n") || "Екипът е в срок."}${ownerLate ? `\n🔴 Твои закъснели: ${ownerLate}` : ""}`,
      { buttons: [{ text: "Задачите на екипа", url: `${SITE}/admin/zadachi` }] }
    ).catch(() => false);
  }
  return NextResponse.json({ ok: true, members: out, ownerLate });
}
