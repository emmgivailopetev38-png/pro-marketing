import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";

export const dynamic = "force-dynamic";

/**
 * POST /api/igra/sabitie
 *
 * Известие от играта „ЛОСТ" (тренажорът за наемане): нов кандидат се е
 * регистрирал или кандидат е завършил мисия. Играта и CRM-ът делят един
 * Supabase проект, затова тук няма секрет — защитата е:
 *   1. ref-ът трябва да сочи реален ред в базата (sg_profiles /
 *      sg_game_sessions) и профилът да е кандидат;
 *   2. идемпотентност през sg_event_log (kind, ref са unique заедно) —
 *      повторно повикване със същия ref не праща втори имейл.
 *
 * Грешките не връщат 500 с подробности — логват се и връщат ok:false.
 */

const NOTIFY_TO = "emmgivailopetev38@gmail.com";
const ADMIN_BASE = "https://promarketing.pw";

const schema = z.object({
  kind: z.enum(["signup", "mission"]),
  ref: z.string().min(1).max(200),
});

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  motivation: string | null;
  is_candidate: boolean | null;
  source: string | null;
  profession: string | null;
};

type SessionRow = {
  id: string;
  user_id: string;
  mission_id: string | null;
  status: string | null;
  score: number | null;
  xp_earned: number | null;
  outcome: string | null;
  turn_count: number | null;
  duration_seconds: number | null;
  completed_at: string | null;
};

const OUTCOME_LABEL: Record<string, string> = {
  won: "спечелена сделка",
  lost: "загубена сделка",
  stalled: "застой",
};

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} мин ${s} сек` : `${s} сек`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { kind, ref } = parsed.data;

  try {
    const sb = createServiceClient();

    let subject: string;
    let html: string;
    let text: string;

    if (kind === "signup") {
      const { data: profile, error } = await sb
        .from("sg_profiles")
        .select("id, display_name, email, phone, motivation, is_candidate, source, profession")
        .eq("id", ref)
        .maybeSingle();
      if (error) {
        console.error("[igra/sabitie] signup profile lookup failed:", error.message);
        return NextResponse.json({ ok: false });
      }
      // Непознат ref или обикновен играч (не кандидат) — тихо пропускаме.
      if (!profile || !(profile as ProfileRow).is_candidate) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const p = profile as ProfileRow;
      const name = p.display_name || "Без име";

      subject = `🎮 Нов кандидат в играта: ${name}`;
      const lines = [
        `Име: ${name}`,
        `Имейл: ${p.email || "—"}`,
        `Телефон: ${p.phone || "—"}`,
        ...(p.profession ? [`Професия: ${p.profession}`] : []),
        ...(p.source ? [`Откъде: ${p.source}`] : []),
        ...(p.motivation ? [`Мотивация: ${p.motivation}`] : []),
      ];
      text = [`Нов кандидат в играта.`, ``, ...lines, ``, `Профил: ${ADMIN_BASE}/admin/igra/${p.id}`].join("\n");
      html = `
        <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111">
          <h2 style="margin:0 0 12px">🎮 Нов кандидат в играта</h2>
          <p style="margin:0 0 4px"><strong>${escapeHtml(name)}</strong></p>
          <p style="margin:0 0 4px">Имейл: ${escapeHtml(p.email) || "—"}</p>
          <p style="margin:0 0 4px">Телефон: ${escapeHtml(p.phone) || "—"}</p>
          ${p.profession ? `<p style="margin:0 0 4px">Професия: ${escapeHtml(p.profession)}</p>` : ""}
          ${p.source ? `<p style="margin:0 0 4px">Откъде: ${escapeHtml(p.source)}</p>` : ""}
          ${p.motivation ? `<p style="margin:12px 0 4px"><em>„${escapeHtml(p.motivation)}“</em></p>` : ""}
          <p style="margin:16px 0 0"><a href="${ADMIN_BASE}/admin/igra/${p.id}">Виж профила в CRM-а →</a></p>
        </div>`;
    } else {
      // kind === "mission"
      const { data: session, error } = await sb
        .from("sg_game_sessions")
        .select("id, user_id, mission_id, status, score, xp_earned, outcome, turn_count, duration_seconds, completed_at")
        .eq("id", ref)
        .maybeSingle();
      if (error) {
        console.error("[igra/sabitie] session lookup failed:", error.message);
        return NextResponse.json({ ok: false });
      }
      const s = session as SessionRow | null;
      if (!s || s.status !== "completed") {
        return NextResponse.json({ ok: true, skipped: true });
      }

      const [{ data: profile }, { data: mission }, { data: scores }] = await Promise.all([
        sb
          .from("sg_profiles")
          .select("id, display_name, email, phone, motivation, is_candidate, source, profession")
          .eq("id", s.user_id)
          .maybeSingle(),
        s.mission_id
          ? sb.from("sg_missions").select("id, title, kind").eq("id", s.mission_id).maybeSingle()
          : Promise.resolve({ data: null }),
        sb
          .from("sg_scores")
          .select("discovery, pain_depth, value, objection_handling, closing, total")
          .eq("session_id", s.id)
          .maybeSingle(),
      ]);

      if (!profile || !(profile as ProfileRow).is_candidate) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const p = profile as ProfileRow;
      const name = p.display_name || "Кандидат";
      const missionTitle = (mission as { title?: string } | null)?.title || "мисия";
      const isBoss = (mission as { kind?: string } | null)?.kind === "boss";
      const score = s.score ?? (scores as { total?: number } | null)?.total ?? null;
      const outcome = s.outcome ? OUTCOME_LABEL[s.outcome] ?? s.outcome : "—";

      subject = `🎯 ${name} завърши ${isBoss ? "бос мисия" : "мисия"} „${missionTitle}“: ${score ?? "?"}/100`;
      const sc = scores as {
        discovery: number | null;
        pain_depth: number | null;
        value: number | null;
        objection_handling: number | null;
        closing: number | null;
      } | null;
      const skillLines = sc
        ? [
            `Откриване: ${sc.discovery ?? "—"} · Болка: ${sc.pain_depth ?? "—"} · Стойност: ${sc.value ?? "—"}`,
            `Възражения: ${sc.objection_handling ?? "—"} · Затваряне: ${sc.closing ?? "—"}`,
          ]
        : [];
      text = [
        `${name} завърши ${isBoss ? "бос мисия" : "мисия"} „${missionTitle}“.`,
        ``,
        `Резултат: ${score ?? "—"}/100`,
        `Изход: ${outcome}`,
        `XP: ${s.xp_earned ?? "—"}`,
        `Продължителност: ${formatDuration(s.duration_seconds)} · ${s.turn_count ?? "—"} хода`,
        ...skillLines,
        ``,
        `Детайли: ${ADMIN_BASE}/admin/igra/${s.user_id}`,
      ].join("\n");
      html = `
        <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111">
          <h2 style="margin:0 0 12px">🎯 ${escapeHtml(name)} завърши ${isBoss ? "бос мисия" : "мисия"} „${escapeHtml(missionTitle)}“</h2>
          <p style="margin:0 0 4px">Резултат: <strong>${score ?? "—"}/100</strong> · изход: <strong>${escapeHtml(outcome)}</strong></p>
          <p style="margin:0 0 4px">XP: ${s.xp_earned ?? "—"} · продължителност: ${formatDuration(s.duration_seconds)} · ${s.turn_count ?? "—"} хода</p>
          ${skillLines.length ? `<p style="margin:8px 0 4px;color:#444">${skillLines.map((l) => escapeHtml(l)).join("<br/>")}</p>` : ""}
          <p style="margin:16px 0 0"><a href="${ADMIN_BASE}/admin/igra/${s.user_id}">Всички сесии на кандидата →</a></p>
        </div>`;
    }

    // Идемпотентност: първо резервираме събитието. Уникалният индекс върху
    // (kind, ref) гарантира, че само едно повикване стига до имейла.
    const { error: logError } = await sb.from("sg_event_log").insert({ kind, ref });
    if (logError) {
      // 23505 = unique_violation → вече е пратено.
      if (logError.code === "23505" || /duplicate|already exists/i.test(logError.message)) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      console.error("[igra/sabitie] event log insert failed:", logError.message);
      return NextResponse.json({ ok: false });
    }

    const result = await sendEmail({ to: NOTIFY_TO, subject, html, text });
    if (result.error) {
      console.error("[igra/sabitie] email send failed:", result.error);
      // Освобождаваме резервацията, за да може повторен опит да мине.
      await sb.from("sg_event_log").delete().eq("kind", kind).eq("ref", ref);
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (e) {
    console.error("[igra/sabitie] unexpected error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false });
  }
}
