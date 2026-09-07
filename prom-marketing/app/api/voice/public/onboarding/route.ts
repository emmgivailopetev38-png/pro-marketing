import { NextResponse, after } from "next/server";
import { z } from "zod";
import { checkPublicVoiceAuth } from "@/lib/voice/public-auth";
import { identityForSessionKey, normalizeEmail, phoneKey } from "@/lib/voice/quota";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { sendTelegram } from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/public/onboarding — „предавам на техническия отдел".
 *
 * След като споразумението е финализирано, агентът задава няколко кратки
 * въпроса за бизнеса (какви обаждания влизат, какво трябва да казва агентът,
 * на кой номер, в какво работно време, с кои системи) и ги записва тук.
 * Оттук те влизат в картона като инструкции и стигат до Ивайло по имейл и
 * Telegram — това е „техническият отдел". Никакви обещания за срокове извън
 * тези в промпта; никакви данни за карти или пароли.
 */

const schema = z.object({
  ime: z.string().trim().min(2).max(120),
  imeil: z.string().trim().max(160).optional(),
  telefon: z.string().trim().max(40).optional(),
  produkt: z.string().trim().max(60).optional(),
  /** Какви обаждания/запитвания влизат и колко. */
  obazhdaniya: z.string().trim().max(600).optional(),
  /** Какво трябва да казва и прави агентът — с думите на човека. */
  kakvo_kazva: z.string().trim().max(800).optional(),
  /** Кой номер — сегашният му или нов. */
  nomer: z.string().trim().max(200).optional(),
  rabotno_vreme: z.string().trim().max(200).optional(),
  /** Календар, CRM, магазин, таблица — с какво да се свърже. */
  sistemi: z.string().trim().max(400).optional(),
  drugo: z.string().trim().max(800).optional(),
  obrashtenie: z.enum(["ti", "vie"]).optional(),
  sesia: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const auth = checkPublicVoiceAuth(request);
  if (!auth.ok) {
    console.error("[voice/public/onboarding] отказан достъп:", auth.reason);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, spoken: "Кажи ми поне името и какви обаждания влизат, и записвам." }, { status: 200 });
  }
  const d = parsed.data;
  const ti = d.obrashtenie === "ti";

  let email = normalizeEmail(d.imeil);
  let telefon = d.telefon ?? null;
  const bound = await identityForSessionKey(d.sesia);
  if (bound?.email && bound.email !== email) email = bound.email;
  if (bound?.phone && phoneKey(bound.phone) !== phoneKey(telefon)) telefon = bound.phone;

  const rows: Array<[string, string | undefined]> = [
    ["Какви обаждания влизат", d.obazhdaniya],
    ["Какво да казва и прави агентът", d.kakvo_kazva],
    ["Номер", d.nomer],
    ["Работно време", d.rabotno_vreme],
    ["Системи за свързване", d.sistemi],
    ["Друго", d.drugo],
  ];
  const filled = rows.filter((r): r is [string, string] => Boolean(r[1]));
  if (filled.length === 0) {
    return NextResponse.json(
      { ok: false, spoken: ti ? "Още нищо не съм записал — кажи ми първо какви обаждания влизат при теб." : "Още нищо не съм записал — кажете ми първо какви обаждания влизат при вас." },
      { status: 200 }
    );
  }
  const text = filled.map(([k, v]) => `${k}: ${v}`).join("\n");

  let contactId: string | null = null;
  try {
    const res = await upsertContactAndLog({
      full_name: d.ime,
      email,
      phone: telefon,
      source: bound ? "voice_web" : "voice_phone",
      source_ref: bound ? null : "telefon",
      initial_stage: "lead",
      activity: {
        type: "onboarding_notes",
        title: `🛠️ Инструкции за техническия отдел${d.produkt ? ` · ${d.produkt}` : ""}`,
        body: text,
        created_by: "elevenlabs",
        metadata: { product: d.produkt ?? null, fields: Object.fromEntries(filled), obrashtenie: d.obrashtenie ?? "vie" },
      },
    });
    contactId = res.contact_id;
    if (res.error) console.error("[voice/public/onboarding] crm", res.error);
  } catch (err) {
    console.error("[voice/public/onboarding] crm хвърли", err);
  }

  after(async () => {
    const to = process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
    const crm = contactId ? `https://promarketing.pw/admin/clients/${contactId}` : "https://promarketing.pw/admin";
    const head = `🛠️ Инструкции от ${d.ime}${d.produkt ? ` · ${d.produkt}` : ""} — за техническия отдел`;
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2320;max-width:620px">
<p style="margin:0 0 12px"><strong>${escapeHtml(head)}</strong></p>
<table style="border-collapse:collapse">
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Кой:</td><td><strong>${escapeHtml(d.ime)}</strong>${email ? ` · ${escapeHtml(email)}` : ""}${telefon ? ` · ${escapeHtml(telefon)}` : ""}</td></tr>
${filled.map(([k, v]) => `<tr><td style="padding:3px 12px 3px 0;color:#6b7772;vertical-align:top">${escapeHtml(k)}:</td><td>${escapeHtml(v)}</td></tr>`).join("")}
</table>
<p style="margin:18px 0 0">📊 <a href="${crm}" style="color:#0b6b4a">Картонът →</a></p>
</div>`;
    await Promise.all([
      sendEmail({ to, subject: head, html, text: `${head}\n${text}\n\n${crm}` }),
      sendTelegram(`${esc(head)}\n${esc(text)}\n<a href="${crm}">Картонът</a>`),
    ]).catch((e) => console.error("[voice/public/onboarding] notify", e));
  });

  return NextResponse.json(
    {
      ok: true,
      spoken: ti
        ? "Записах всичко и го предадох на техническия отдел. Ивайло ще ти пише още днес с първите стъпки — и агентът ти тръгва до седем работни дни."
        : "Записах всичко и го предадох на техническия отдел. Ивайло ще ви пише още днес с първите стъпки — и агентът ви тръгва до седем работни дни.",
    },
    { status: 200 }
  );
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
