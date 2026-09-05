import { NextResponse, after } from "next/server";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { sendTelegram } from "@/lib/notifications/telegram";
import {
  contactEmail,
  contactName,
  contactPhone,
  describeCall,
  parsePostCall,
  verifyElevenLabsSignature,
  type PostCallEvent,
} from "@/lib/voice/postcall";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/elevenlabs — ElevenLabs ни казва какво е било казано.
 *
 * Когато разговор с гласовия агент приключи — по телефона на +1 475 426 9084
 * или от бутона на сайта — ElevenLabs праща транскрипта, резюмето и кой е бил
 * насреща. Оттук той влиза в картона на човека като активност `voice_call`:
 * резюмето първо, транскриптът дума по дума отдолу. Дотогава разговорите
 * оставаха само в ElevenLabs и Ивайло научаваше за тях чак ако човекът си
 * запише час.
 *
 * Кой е човекът: имейлът и телефонът от формата (динамичните променливи),
 * а при телефонно обаждане — номерът на линията. Непознат номер прави нов
 * картон с източник `voice_phone`. Един разговор = една активност:
 * `dedupe_key` е идентификаторът на разговора, ElevenLabs праща и повторно.
 *
 * Разговорът с агента НЕ е разговор с Ивайло: `last_heard_from_at` не се
 * пипа, студената поредица не спира, топлият кръг не тръгва от него.
 *
 * Подписът се проверява със `ELEVENLABS_WEBHOOK_SECRET` (виж `postcall.ts`).
 * Без секрет маршрутът отговаря 503 — по-добре шумна грешка в логовете от
 * тихо приемане на всичко, което някой реши да ни прати.
 */
export async function POST(request: Request) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET ?? "";
  if (!secret) {
    console.error("[webhooks/elevenlabs] ELEVENLABS_WEBHOOK_SECRET липсва");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  const sig = verifyElevenLabsSignature(raw, request.headers.get("elevenlabs-signature"), secret);
  if (!sig.ok) {
    console.warn("[webhooks/elevenlabs] отхвърлен подпис:", sig.reason);
    return NextResponse.json({ error: "bad_signature", reason: sig.reason }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const ev = parsePostCall(payload);
  // Аудио, неуспешно набиране и всичко друго — приемаме и не правим нищо.
  if (!ev) return NextResponse.json({ ok: true, ignored: true });

  const email = contactEmail(ev);
  const phone = contactPhone(ev);
  if (!email && !phone) {
    // Скрит номер и без форма — няма към кого да го вържем. Остава в лога.
    console.warn("[webhooks/elevenlabs] разговор без имейл и телефон", ev.conversationId);
    return NextResponse.json({ ok: true, skipped: "no_identity" });
  }

  const { title, body, minutes } = describeCall(ev);
  const name = contactName(ev);

  let contactId: string | null = null;
  try {
    const res = await upsertContactAndLog({
      full_name: name,
      email,
      phone,
      company: ev.dynamic.deynost || null,
      source: ev.channel === "telefon" ? "voice_phone" : "voice_web",
      source_ref: ev.channel === "telefon" ? "telefon" : null,
      initial_stage: "lead",
      activity: {
        type: "voice_call",
        title,
        body,
        occurred_at: ev.startedAt.toISOString(),
        created_by: "elevenlabs",
        dedupe_key: ev.conversationId,
        metadata: {
          conversation_id: ev.conversationId,
          agent_id: ev.agentId,
          duration_secs: ev.durationSecs,
          minutes,
          call_successful: ev.callSuccessful,
          booked: ev.booked,
          channel: ev.channel,
          caller_number: ev.callerNumber,
          summary: ev.summary,
        },
      },
    });
    contactId = res.contact_id;
    if (res.error) console.error("[webhooks/elevenlabs] crm", res.error);
    // Вече записан разговор (повторно доставяне) — без второ известие.
    if (res.activity_id && !res.error && (await isDuplicateDelivery(res.activity_id, ev))) {
      return NextResponse.json({ ok: true, contact_id: contactId, duplicate: true });
    }
  } catch (err) {
    console.error("[webhooks/elevenlabs] crm хвърли", err);
  }

  // Известието към Ивайло тръгва СЛЕД отговора — ElevenLabs чака 200, не Resend.
  after(async () => {
    await notifyOwner(ev, { name, email, phone, contactId, title, minutes }).catch((e) =>
      console.error("[webhooks/elevenlabs] notify", e)
    );
  });

  return NextResponse.json({ ok: true, contact_id: contactId, booked: ev.booked });
}

/**
 * `upsertContactAndLog` връща id на СЪЩЕСТВУВАЩАТА активност при повторение,
 * без да казва, че е било повторение. Различаваме ги по времето на запис:
 * прясно вкараната е на секунди от сега.
 */
async function isDuplicateDelivery(activityId: string, ev: PostCallEvent): Promise<boolean> {
  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const sb = createServiceClient();
    const { data } = await sb.from("contact_activities").select("created_at").eq("id", activityId).maybeSingle();
    if (!data?.created_at) return false;
    const age = Date.now() - new Date(data.created_at).getTime();
    if (age > 60_000) {
      console.log("[webhooks/elevenlabs] повторно доставяне", ev.conversationId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function notifyOwner(
  ev: PostCallEvent,
  c: { name: string | null; email: string | null; phone: string | null; contactId: string | null; title: string; minutes: number }
): Promise<void> {
  const to = process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
  const who = c.name ?? c.phone ?? c.email ?? "непознат";
  const crm = c.contactId ? `https://promarketing.pw/admin/clients/${c.contactId}` : "https://promarketing.pw/admin";
  const where = ev.channel === "telefon" ? "по телефона" : "от сайта";
  const excerpt = ev.transcript.slice(0, 14);
  const rows = excerpt
    .map(
      (l) =>
        `<p style="margin:0 0 6px"><span style="color:${l.role === "agent" ? "#6b7772" : "#0b6b4a"};font-weight:600">${l.role === "agent" ? "Агент" : "Клиент"}:</span> ${escapeHtml(l.message)}</p>`
    )
    .join("");

  const subject = `🎙️ ${ev.booked ? "Записа си час · " : ""}Разговор с агента ${where} · ${who} · ${c.minutes} мин`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2320;max-width:620px">
<p style="margin:0 0 12px"><strong>${escapeHtml(c.title)}</strong></p>
<table style="border-collapse:collapse;margin:0 0 14px">
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Кой:</td><td><strong>${escapeHtml(who)}</strong></td></tr>
${c.phone ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Телефон:</td><td>${escapeHtml(c.phone)}</td></tr>` : ""}
${c.email ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Имейл:</td><td>${escapeHtml(c.email)}</td></tr>` : ""}
${ev.dynamic.deynost ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Дейност:</td><td>${escapeHtml(ev.dynamic.deynost)}</td></tr>` : ""}
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Час записан:</td><td>${ev.booked ? "✅ да" : "не"}</td></tr>
</table>
<div style="background:#f2f7f4;border-left:3px solid #0b6b4a;padding:12px 16px;border-radius:0 6px 6px 0;margin:0 0 16px">
<strong>Резюме</strong><br>${escapeHtml(ev.summary ?? "ElevenLabs не върна резюме.")}
</div>
${rows ? `<p style="margin:0 0 6px;color:#6b7772;font-size:13px;text-transform:uppercase;letter-spacing:.06em">Транскрипт${ev.transcript.length > excerpt.length ? " (началото)" : ""}</p>${rows}` : ""}
<p style="margin:18px 0 0">📊 <a href="${crm}" style="color:#0b6b4a">Целият разговор е в картона →</a></p>
</div>`;
  const text = `${c.title}

Кой: ${who}${c.phone ? `\nТелефон: ${c.phone}` : ""}${c.email ? `\nИмейл: ${c.email}` : ""}${ev.dynamic.deynost ? `\nДейност: ${ev.dynamic.deynost}` : ""}
Час записан: ${ev.booked ? "да" : "не"}

РЕЗЮМЕ
${ev.summary ?? "ElevenLabs не върна резюме."}

${excerpt.map((l) => `${l.role === "agent" ? "Агент" : "Клиент"}: ${l.message}`).join("\n")}

Картонът: ${crm}`;

  await Promise.all([
    sendEmail({ to, subject, html, text }),
    sendTelegram(
      `🎙️ <b>${esc(who)}</b> говори с агента ${where} · ${c.minutes} мин${ev.booked ? " · ✅ записа си час" : ""}\n${esc(ev.summary ?? "без резюме")}\n<a href="${crm}">Картонът</a>`
    ),
  ]);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
