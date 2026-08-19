import { NextResponse } from "next/server";
import { z } from "zod";
import { checkVoiceAuth } from "@/lib/voice/auth";
import { createManualReviewItem } from "@/lib/crm/repository";
import { sendTelegram } from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/tools/request-approval
 *
 * Тук отива всичко необратимо, което гласът НЕ изпълнява сам: имейл до клиент,
 * пускане/спиране на реклама, триене, пращане на оферта. Записва се като заявка
 * в manual_review_items (type=voice_approval) и чака одобрение от /admin.
 *
 * Причина да не се изпълнява веднага: гласовата сесия се доверява на този, който
 * говори. За четене и бележки това е приемливо — за пари и за писма до клиенти не е.
 *
 * Агентът получава обратно изречение, което да каже на глас — потвърждава какво
 * е записал, за да не остане Ивайло с усещането, че нещо е тръгнало.
 */

const ACTIONS = ["send_email", "send_offer", "ads_change", "delete", "payment", "other"] as const;

const schema = z.object({
  action: z.enum(ACTIONS),
  /** Какво иска Ивайло, с неговите думи — това се чете в /admin. */
  summary: z.string().trim().min(3).max(500),
  /** Кого засяга: свободен текст (име/фирма), както е казано на глас. */
  target: z.string().trim().max(200).optional(),
  contact_id: z.string().uuid().optional(),
  /** Пълните аргументи, ако агентът ги е събрал (получател, текст, сума…). */
  details: z.record(z.string(), z.unknown()).optional(),
});

const SEVERITY: Record<(typeof ACTIONS)[number], "low" | "medium" | "high"> = {
  send_email: "medium",
  send_offer: "medium",
  ads_change: "high", // харчи пари
  delete: "high", // необратимо
  payment: "high", // пари
  other: "low",
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.promarketing.pw";

/** Telegram чете HTML — име на клиент с < или & би счупило съобщението. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const LABEL: Record<(typeof ACTIONS)[number], string> = {
  send_email: "имейл",
  send_offer: "оферта",
  ads_change: "промяна по реклами",
  delete: "изтриване",
  payment: "плащане",
  other: "действие",
};

export async function POST(request: Request) {
  const auth = checkVoiceAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, spoken: "Не разбрах заявката." }, { status: 200 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, spoken: "Липсва ми информация, за да го запиша. Кажи какво точно да направя и за кого." },
      { status: 200 }
    );
  }

  const { action, summary, target, contact_id, details } = parsed.data;
  const label = LABEL[action];
  const title = target ? `Глас: ${label} — ${target}` : `Глас: ${label}`;

  try {
    const result = await createManualReviewItem({
      type: "voice_approval",
      title,
      description: summary,
      related_contact_id: contact_id,
      severity: SEVERITY[action],
      // Всяка гласова заявка е отделна — иначе дедупликацията би слепила
      // две различни писма до един и същ човек в едно.
      dedupe_key: `voice:${action}:${Date.now()}:${(target ?? "").slice(0, 40)}`,
      payload: { action, summary, target: target ?? null, details: details ?? {}, source: "voice" },
    });

    if (result.error) {
      console.error("[voice/request-approval]", result.error);
      return NextResponse.json(
        { ok: false, spoken: "Не успях да запиша заявката. Пробвай пак след малко." },
        { status: 200 }
      );
    }

    // Гласът се ползва в движение — известието трябва да стигне до телефона,
    // а не да чака Ивайло да отвори CRM-а. repository праща Telegram само при
    // severity=high; за гласовите заявки го правим винаги, защото те са по
    // определение неща, които човекът е поискал току-що и чака отговор.
    if (SEVERITY[action] !== "high") {
      void sendTelegram(
        `🎙 По телефона поиска: <b>${escapeHtml(label)}</b>${target ? ` — ${escapeHtml(target)}` : ""}\n${escapeHtml(summary)}\n\nНищо не е тръгнало.`,
        { buttons: [{ text: "Одобри или откажи", url: `${SITE}/admin/manual-review` }] }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result.id,
      spoken: `Записах ${label}${target ? ` за ${target}` : ""} и го сложих за одобрение. Нищо не е тръгнало — чака те в CRM-а.`,
    });
  } catch (err) {
    console.error("[voice/request-approval]", err);
    return NextResponse.json(
      { ok: false, spoken: "Нещо се обърка при записа. Не съм направил нищо." },
      { status: 200 }
    );
  }
}
