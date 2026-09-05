import { NextResponse, after } from "next/server";
import { z } from "zod";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { escapeHtml } from "@/lib/email/escape";
import { sendEmail } from "@/lib/email/resend";
import { isCapiConfigured, sendCapiEvent } from "@/lib/meta/conversions-api";
import { sendTelegram } from "@/lib/notifications/telegram";
import { checkVoiceBudget, isPublicVoiceEnabled, VOICE_WEB_ACTIVITY } from "@/lib/voice/public-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/public/session — отваря разговор с рецепцията от сайта.
 *
 * Реда на нещата тук е нарочен: първо се пише лийдът, чак после се отваря
 * линията. Ако човекът затвори след трийсет секунди, ние вече имаме името,
 * телефона и повода — а гласовият разговор, който никой не е чул докрай, е
 * най-скъпият начин да загубиш контакт.
 *
 * Формата е и предпазителят пред 275-те минути: без нея всеки минувач по
 * страницата отваря линия. С нея — човек, който си е написал телефона.
 *
 * Данните се подават на агента като динамични променливи, за да НЕ се
 * диктува имейл на глас. Продиктуваният имейл е най-честата счупена среща:
 * „ай ви ей ел о" става „ivailo", „ivaylo" или „и вайло" през ден.
 */

const DEFAULT_AGENT_ID = "agent_4401m0fym8eqfeebgfqx4jnwqreg";

const schema = z.object({
  name: z.string().trim().min(2, "име").max(120),
  email: z.string().trim().email("имейл").max(160),
  phone: z.string().trim().min(6, "телефон").max(40),
  /** С какво се занимава — агентът стъпва на това в първия си въпрос. */
  business: z.string().trim().max(200).optional(),
  /**
   * Откъде идва човекът. Началната страница не го подава („sait"); лендингът
   * на рекламата подава „reklama", за да се вижда в CRM-а кой лийд е платен
   * и колко струва. Стига до агента като {{kanal}}.
   */
  channel: z.string().trim().regex(/^[a-z0-9_-]{1,40}$/i).optional(),
  /** Пътят на страницата — влиза в event_source_url към Meta. */
  page: z.string().trim().max(120).optional(),
  /**
   * Идентификатор на събитието, генериран в браузъра. Пикселът го праща със
   * същото id; Meta слепва двете и брои един лийд, не два.
   */
  event_id: z.string().trim().max(80).optional(),
});

async function notifyOwner(d: z.infer<typeof schema>, channel: string, contactId: string | null): Promise<void> {
  const to = process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
  const from = channel === "reklama" ? "от рекламата" : "от сайта";
  const crm = contactId ? `https://promarketing.pw/admin/clients/${contactId}` : "https://promarketing.pw/admin";
  const subject = `🎙️ Гласов лийд ${from} · ${d.name}`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2320;max-width:620px">
<p style="margin:0 0 12px"><strong>Човек отвори гласовия агент ${from}</strong> и остави данните си. Разговорът ще влезе в картона му, когато приключи.</p>
<table style="border-collapse:collapse">
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Име:</td><td><strong>${escapeHtml(d.name)}</strong></td></tr>
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Телефон:</td><td>${escapeHtml(d.phone)}</td></tr>
<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Имейл:</td><td>${escapeHtml(d.email)}</td></tr>
${d.business ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Дейност:</td><td>${escapeHtml(d.business)}</td></tr>` : ""}
${d.page ? `<tr><td style="padding:3px 12px 3px 0;color:#6b7772">Страница:</td><td>${escapeHtml(d.page)}</td></tr>` : ""}
</table>
<p style="margin:18px 0 0">📊 <a href="${crm}" style="color:#0b6b4a">Виж в CRM-а →</a></p>
</div>`;
  const text = `Гласов лийд ${from}\nИме: ${d.name}\nТелефон: ${d.phone}\nИмейл: ${d.email}${d.business ? `\nДейност: ${d.business}` : ""}${d.page ? `\nСтраница: ${d.page}` : ""}\n\nCRM: ${crm}`;
  const tg = `🎙️ <b>${d.name.replace(/</g, "&lt;")}</b> отвори гласовия агент ${from}\n☎️ ${d.phone}${d.business ? `\n🏢 ${d.business.replace(/</g, "&lt;")}` : ""}\n<a href="${crm}">Картонът</a>`;
  await Promise.all([sendEmail({ to, subject, html, text }), sendTelegram(tg)]);
}

/** `_fbp`/`_fbc` са бисквитки на пиксела на същия домейн — четат се от заявката. */
function cookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function POST(request: Request) {
  if (!isPublicVoiceEnabled()) {
    return NextResponse.json({ error: "disabled", spoken: "Гласовото демо е спряно в момента." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", detail: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const channel = d.channel ?? "sait";

  // Лийдът влиза пръв — виж коментара най-горе. Но CRM-ът никога не е
  // причина да откажем клиент: и грешката, и хвърленото изключение само се
  // журналират. `createServiceClient()` хвърля при липсващи ключове.
  let contactId: string | null = null;
  try {
    const lead = await upsertContactAndLog({
      full_name: d.name,
      email: d.email,
      phone: d.phone,
      company: d.business || null,
      source: "voice_web",
      // Каналът стои в source_ref, а не в source: справките броят „voice_web"
      // като едно и не бива да се разцепват на две колони заради рекламата.
      source_ref: channel === "sait" ? null : channel,
      initial_stage: "lead",
      activity: {
        type: VOICE_WEB_ACTIVITY,
        title: channel === "reklama" ? "Отвори гласовия агент от рекламата" : "Отвори гласовия агент от сайта",
        body: d.business ? `Дейност: ${d.business}` : null,
        created_by: "website",
        metadata: {
          name: d.name,
          email: d.email,
          phone: d.phone,
          business: d.business ?? null,
          channel,
          page: d.page ?? null,
        },
      },
    });
    contactId = lead.contact_id;
    if (lead.error) console.error("[voice/public/session] lead", lead.error);
  } catch (err) {
    console.error("[voice/public/session] lead хвърли", err);
  }

  /**
   * Известие до Ивайло — като „🔥 Нов Meta lead", но за гласовите лийдове,
   * които дотук влизаха в CRM-а безшумно. Тръгва СЛЕД отговора (`after`),
   * защото човекът чака линията да се отвори, а не Resend да отговори; и
   * НЕ е fire-and-forget без `await` — така изчезнаха известията за лийдовете
   * от сайта през август.
   */
  after(async () => {
    await notifyOwner(d, channel, contactId).catch((e) => console.error("[voice/public/session] notify", e));
  });

  /**
   * Лийдът се връща и към Meta през Conversions API — с имейл и телефон,
   * за да има с какво да го съпостави. Пикселът в браузъра праща същото
   * събитие със същото event_id; без сървърната половина Meta вижда само
   * „някой подаде форма" и оптимизира рекламата по сляп сигнал.
   * `void`: отговорът към човека не чака Meta.
   */
  if (isCapiConfigured()) {
    const origin = new URL(request.url).origin;
    void sendCapiEvent({
      event_name: "Lead",
      event_id: d.event_id,
      event_source_url: `${origin}${d.page ?? "/"}`,
      action_source: "website",
      user_data: {
        email: d.email,
        phone: d.phone,
        firstName: d.name.split(/\s+/)[0] ?? null,
        lastName: d.name.split(/\s+/).slice(1).join(" ") || null,
        country: "bg",
        external_id: contactId,
        client_ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        client_user_agent: request.headers.get("user-agent"),
        fbp: cookie(request, "_fbp"),
        fbc: cookie(request, "_fbc"),
      },
      custom_data: { content_name: channel === "reklama" ? "glas_reklama" : "voice_web", content_category: "voice_agent" },
    }).then((r) => {
      if (!r.ok) console.error("[voice/public/session] capi", r.error);
    });
  }

  // Таванът се проверява СЛЕД записа: човек над лимита е пак истински лийд
  // и остава в CRM-а, само че вместо линия получава линк към календара.
  const budget = await checkVoiceBudget();
  if (!budget.ok) {
    return NextResponse.json({ error: "budget", spoken: budget.spoken }, { status: 429 });
  }

  const agentId = process.env.ELEVENLABS_PUBLIC_AGENT_ID ?? DEFAULT_AGENT_ID;

  /**
   * Връща се ИДЕНТИФИКАТОРЪТ на агента, не подписан адрес — и това е
   * съзнателна размяна, направена на 03.09.2026.
   *
   * Подписаният адрес се вади с `ELEVENLABS_API_KEY`, а той връщаше 401:
   * ключът във Vercel е остарял и бутонът просто не отваряше разговор.
   * Агентът обаче е публичен (`enable_auth: false`) и вече носи собствената
   * си ограда — allowlist за promarketing.pw със задължителна заглавка
   * `Origin`. Тоест идентификаторът, видим в кода на страницата, е безполезен
   * от чужд домейн, а разговорът тръгва без нито един ключ по веригата.
   *
   * Ако някой ден authentication бъде включена от страната на ElevenLabs,
   * тук отново трябва подписан адрес — и жив API ключ.
   */
  return NextResponse.json({
    ok: true,
    agent_id: agentId,
    // Имената съвпадат с плейсхолдърите в промпта на агента. Смениш ли ги
    // тук, агентът започва да казва „{{ime}}" на глас.
    variables: {
      ime: d.name,
      imeil: d.email,
      telefon: d.phone,
      deynost: d.business ?? "",
      // За агента рекламният лендинг е пак „сайтът": полетата са попълнени
      // по същия начин и промптът разпознава само „sait". Каналът за
      // отчетите живее в CRM-а (source_ref), не тук.
      kanal: "sait",
    },
  });
}
