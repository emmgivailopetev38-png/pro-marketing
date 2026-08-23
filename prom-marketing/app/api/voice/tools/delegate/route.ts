import { NextResponse } from "next/server";
import { z } from "zod";
import { guardVoice } from "@/lib/voice/guard";
import { queueAgentTask } from "@/lib/crm/agent-tasks";
import { sendTelegram } from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/tools/delegate — тежката работа отива при Хермес.
 *
 * Разделението на труда, върху което стъпва целият гласов агент:
 *
 *   • каквото се отговаря за секунда (кой се обажда, кой не е платил, премести
 *     етап, запиши среща) → инструментите тук, направо в CRM-а;
 *   • каквото иска мислене и минути (анализ на реклами, писане на оферта,
 *     преглед на двеста лийда) → ТУК, в опашката, и Хермес го върши после.
 *
 * Защо не се чака Хермес на живо: той мисли по минута и повече. Гласовият
 * инструмент, който не отговори за няколко секунди, оставя разговора глух —
 * човекът отсреща чува тишина и затваря. По-добре „предадох го, ще ти пише".
 *
 * ⚠️ Тук НЕ се изпълнява нищо. Записва се желание. Необратимите неща и през
 * Хермес минават през същата опашка за одобрение — правилото е в промпта на
 * работника на VPS-а, не само тук.
 */

const schema = z.object({
  caller_id: z.string().optional(),
  pin: z.string().optional(),
  /** Задачата с думите на Ивайло, както я е казал. */
  task: z.string().trim().min(5).max(2000),
  /** За кого се отнася, ако е за конкретен човек или фирма. */
  about: z.string().trim().max(160).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const guard = guardVoice(request, body);
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, spoken: "Кажи ми по-конкретно какво да предам на Хермес." },
      { status: 200 }
    );
  }
  const { task, about } = parsed.data;

  try {
    const r = await queueAgentTask({
      task: about ? `${task}\n\nОтнася се за: ${about}` : task,
      source: "voice",
      context: { about: about ?? null, via: guard.via },
      requested_by: guard.caller ? `voice:${guard.caller}` : "voice:web",
    });

    if (r.error || !r.id) {
      console.error("[voice/delegate]", r.error);
      return NextResponse.json(
        { ok: false, spoken: "Не успях да я запиша. Кажи ми я пак след малко." },
        { status: 200 }
      );
    }

    // Известието е потвърждение НА ЗАПИСА, не на изпълнението. Формулировката
    // е нарочно такава: иначе Ивайло чете „Хермес прави X" и смята, че е готово.
    void sendTelegram(
      `🎙 По телефона: <b>предадено на Хермес</b>\n${escapeHtml(task)}${about ? `\n(за ${escapeHtml(about)})` : ""}\n\nЧака го на опашката.`
    );

    return NextResponse.json({
      ok: true,
      id: r.id,
      spoken: "Предадох го на Хермес. Ще ти пише в Telegram, като го свърши — не чакай на телефона.",
    });
  } catch (err) {
    console.error("[voice/delegate]", err);
    return NextResponse.json({ ok: false, spoken: "Нещо се обърка. Задачата не е записана." }, { status: 200 });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
